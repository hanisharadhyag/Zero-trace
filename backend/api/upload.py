import uuid
from pathlib import Path
from typing import Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File, Form, Depends, Header, HTTPException

from parsers.cisco_parser import CiscoParser
from parsers.fortinet_parser import FortinetParser
from parsers.paloalto_parser import PaloAltoParser

from engine.security_rules import SecurityEngine
from engine.risk_score import RiskScoreEngine

from config import PROTECTED_STORAGE_DIR
from database import DatabaseManager
from security.auth import decode_access_token
from security.rbac import has_permission
from security.sanitizer import sanitize_config
from services.integrity_service import compute_sha256
from services.audit_service import log_audit_event

# AI Copilot Context
from api.copilot import update_context

router = APIRouter()

# =====================================================
# Runtime Scan Storage
# =====================================================

CURRENT_DEVICE = None
CURRENT_FINDINGS = []
CURRENT_RISK = None
CURRENT_FILE_METADATA = None


def get_current_device():
    return CURRENT_DEVICE


def get_current_findings():
    return CURRENT_FINDINGS


def get_current_risk():
    return CURRENT_RISK


def get_current_scan():
    return {
        "device": CURRENT_DEVICE,
        "findings": CURRENT_FINDINGS,
        "risk_score": CURRENT_RISK,
        "file_metadata": CURRENT_FILE_METADATA,
    }


# =====================================================
# Upload & Scan
# =====================================================

@router.post("/upload")
async def upload_config(
    vendor: str = Form("Cisco"),
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):

    global CURRENT_DEVICE, CURRENT_FINDINGS, CURRENT_RISK, CURRENT_FILE_METADATA

    # 1. Resolve User & Project Context via Bearer Token
    db_mgr = DatabaseManager()
    current_user = None

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            current_user = db_mgr.get_user_by_id(payload["sub"])

    # Fallback to Analyst user for legacy compatibility if unauthenticated
    if not current_user:
        current_user = db_mgr.get_user_by_email("analyst@zerotrace.ai") or db_mgr.get_user_by_id(1)

    # 2. Check RBAC Upload Permission
    if not has_permission(current_user, "upload"):
        log_audit_event(
            user_id=current_user.id if current_user else 0,
            username=current_user.username if current_user else "anonymous",
            project_id=current_user.project_id if current_user else 1,
            action="upload",
            result="DENIED",
            reason=f"Role '{current_user.role if current_user else 'None'}' lacks upload permission",
        )
        return {
            "success": False,
            "message": f"Unauthorized. Role '{current_user.role}' cannot upload configurations.",
        }

    # Check file extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".txt", ".conf", ".xml"):
        log_audit_event(
            user_id=current_user.id if current_user else 0,
            username=current_user.username if current_user else "anonymous",
            project_id=current_user.project_id if current_user else 1,
            action="upload",
            result="DENIED",
            reason=f"Invalid file extension: {ext}",
        )
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: .txt, .conf, .xml"
        )

    # 3. Read Raw Content & Calculate SHA-256 Hash
    raw_bytes = await file.read()
    sha256_hash = compute_sha256(raw_bytes)
    config_text = raw_bytes.decode("utf-8", errors="ignore")

    # 4. Select Parser & Parse Configuration
    if vendor == "Cisco":
        parser = CiscoParser()
    elif vendor == "Fortinet":
        parser = FortinetParser()
    elif vendor == "Palo Alto":
        parser = PaloAltoParser()
    else:
        return {
            "success": False,
            "message": "Unsupported vendor",
        }

    device = parser.parse(config_text)

    # Save to SQLite DeviceModel via DatabaseManager
    device.raw_config = config_text
    db_mgr.save_device(device)

    # 5. Protected File Storage
    project_id = current_user.project_id
    project_dir = PROTECTED_STORAGE_DIR / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)

    # Clean hostname for safe Windows filename (remove quotes, slashes, etc.)
    import re
    safe_hostname = re.sub(r'[^a-zA-Z0-9_\-]', '_', device.hostname or "Router-01")

    # Determine version label (v1, v2, etc.) for this device
    existing_files = db_mgr.get_config_files_by_hostname(project_id, device.hostname)
    version_num = len(existing_files) + 1
    version_label = f"v{version_num}"

    safe_filename = f"{safe_hostname}_{version_label}_{uuid.uuid4().hex[:6]}.conf"
    protected_file_path = project_dir / safe_filename
    protected_file_path.write_bytes(raw_bytes)


    # 6. Save Config File Record to Database
    file_record = db_mgr.save_config_file(
        device_hostname=device.hostname,
        vendor=vendor,
        version_label=version_label,
        file_path=str(protected_file_path),
        sha256_hash=sha256_hash,
        project_id=project_id,
        uploaded_by=current_user.id,
        uploaded_by_username=current_user.username,
    )

    # 7. Security Analysis & Risk Calculation
    findings = SecurityEngine().analyze(device)
    finding_dicts = [f.model_dump() for f in findings]
    risk = RiskScoreEngine().calculate(finding_dicts)

    # Store findings in DB
    db_mgr.save_findings(finding_dicts)
    db_mgr.save_security_score(device.hostname, risk)

    # Store Runtime Data
    CURRENT_DEVICE = device
    CURRENT_FINDINGS = findings
    CURRENT_RISK = risk
    CURRENT_FILE_METADATA = {
        "file_id": file_record.id,
        "device_hostname": file_record.device_hostname,
        "vendor": file_record.vendor,
        "version_label": file_record.version_label,
        "sha256_hash": file_record.sha256_hash,
        "uploaded_by": file_record.uploaded_by_username,
        "created_at": file_record.created_at.isoformat(),
    }

    # 8. Update AI Copilot Context (Sanitized output so raw secrets never hit AI)
    sanitized_device = device.model_dump()
    sanitized_device["raw_config"] = sanitize_config(config_text)
    update_context(
        findings=finding_dicts,
        device=sanitized_device
    )

    # 9. Audit Logging
    log_audit_event(
        user_id=current_user.id,
        username=current_user.username,
        project_id=project_id,
        file_id=file_record.id,
        action="upload",
        result="ALLOWED",
        reason=f"Successfully uploaded and analyzed {device.hostname} ({version_label}). SHA-256: {sha256_hash[:12]}...",
    )

    return {
        "success": True,
        "message": "Scan completed successfully",
        "device": device.model_dump(),
        "findings": finding_dicts,
        "risk_score": risk,
        "file_metadata": CURRENT_FILE_METADATA,
    }


# =====================================================
# Device
# =====================================================

@router.get("/device")
def device():
    if CURRENT_DEVICE is None:
        return {
            "hostname": "",
            "vendor": "",
            "device_type": "",
            "interfaces": [],
            "services": [],
        }

    return CURRENT_DEVICE.model_dump()


# =====================================================
# Findings
# =====================================================

@router.get("/findings")
def findings():
    return [f.model_dump() for f in CURRENT_FINDINGS]


# =====================================================
# Risk
# =====================================================

@router.get("/risk-score")
def risk_score():
    if CURRENT_RISK is None:
        return {
            "risk_score": {
                "score": 0,
                "grade": "N/A",
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "risk_level": "UNKNOWN",
                "total_findings": 0,
            }
        }

    return {
        "risk_score": CURRENT_RISK
    }


# =====================================================
# Reset
# =====================================================

@router.delete("/reset")
def reset():
    global CURRENT_DEVICE, CURRENT_FINDINGS, CURRENT_RISK, CURRENT_FILE_METADATA

    CURRENT_DEVICE = None
    CURRENT_FINDINGS = []
    CURRENT_RISK = None
    CURRENT_FILE_METADATA = None

    update_context([], {})

    return {
        "success": True,
        "message": "Session cleared",
    }
