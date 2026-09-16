"""
Scan and Rescan API Router for SIH26155 Security Compliance Auditor.

Supports:
- POST /scan: upload configuration or raw text to perform complete compliance audit
- POST /rescan: re-execute compliance checks on existing device to track remediation progress
"""

from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.parsers.config_normalizer import ConfigNormalizer
from backend.engine.security_rules import SecurityEngine
from backend.engine.audit import run_security_audit
from backend.database import get_db, DatabaseManager, DeviceModel
from backend.api.upload import set_current_state, get_current_device, get_current_findings

router = APIRouter(tags=["Scan"])

normalizer = ConfigNormalizer()
security_engine = SecurityEngine()
db_manager = DatabaseManager()


@router.post("/scan")
@router.post("/api/scan")
async def scan_configuration(
    vendor: Optional[str] = Form("Cisco"),
    file: Optional[UploadFile] = File(None),
    raw_config: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Execute full cybersecurity compliance scan against uploaded or pasted network configuration.
    """
    config_text = ""
    if file:
        content = await file.read()
        config_text = content.decode("utf-8", errors="ignore")
    elif raw_config:
        config_text = raw_config.strip()
    else:
        raise HTTPException(status_code=400, detail="Either configuration file or raw_config must be provided.")

    if not config_text:
        raise HTTPException(status_code=400, detail="Configuration content cannot be empty.")

    # 1. Parse and normalize device configuration
    try:
        device = normalizer.normalize(config_text, vendor=vendor)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Parsing error: {str(e)}")

    # 2. Execute security rules and generate findings
    findings = security_engine.analyze(device)

    # 3. Execute comprehensive audit engine (R01-R15, scoring, prioritization, AI correlation)
    config_dict = {
        "device": {
            "hostname": device.hostname,
            "vendor": device.vendor,
            "device_type": device.device_type
        },
        "raw_config": config_text
    }
    audit_report = run_security_audit(config_dict)

    # 4. Save to database
    db_device = db_manager.save_device(device)
    db_manager.save_findings(findings, scan_id=str(db_device.id))
    report_id = db_manager.save_audit_report({
        "report_id": f"scan-{db_device.id}",
        "device": {"hostname": device.hostname, "vendor": device.vendor},
        "summary": audit_report.get("summary", {}),
        "results": audit_report.get("results", []),
        "prioritized_risks": audit_report.get("prioritized_risks", []),
        "remediations": audit_report.get("remediations", []),
        "ai_analysis": audit_report.get("ai_analysis", {})
    })
    db_manager.save_security_score(device.hostname, audit_report.get("summary", {}))

    # 5. Update global state for other endpoints
    set_current_state(device, findings, audit_report)

    return {
        "status": "success",
        "scan_id": db_device.id,
        "report_id": report_id,
        "hostname": device.hostname,
        "vendor": device.vendor,
        "device_type": device.device_type,
        "interfaces_count": len(device.interfaces),
        "services_count": len(device.services),
        "findings_count": len(findings),
        "summary": audit_report.get("summary", {}),
        "prioritized_risks": audit_report.get("prioritized_risks", []),
        "ai_analysis": audit_report.get("ai_analysis", {})
    }


@router.post("/rescan")
@router.post("/api/rescan")
async def rescan_configuration(
    device_id: Optional[int] = Form(None),
    raw_config: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Re-evaluate cybersecurity compliance for an existing device or updated config to measure risk reduction.
    """
    current_dev = get_current_device()
    config_text = ""
    vendor = "Cisco"

    if raw_config:
        config_text = raw_config
    elif device_id:
        db_dev = db.query(DeviceModel).filter(DeviceModel.id == device_id).first()
        if not db_dev or not db_dev.raw_config:
            raise HTTPException(status_code=404, detail=f"Device {device_id} not found or has no stored config.")
        config_text = db_dev.raw_config
        vendor = db_dev.vendor
    elif current_dev:
        config_text = getattr(current_dev, "raw_config", "")
        vendor = getattr(current_dev, "vendor", "Cisco")
    else:
        raise HTTPException(status_code=400, detail="No active device or config found to rescan.")

    if not config_text:
        raise HTTPException(status_code=400, detail="Configuration cannot be empty for rescan.")

    # Re-parse and audit
    device = normalizer.normalize(config_text, vendor=vendor)
    findings = security_engine.analyze(device)

    config_dict = {
        "device": {
            "hostname": device.hostname,
            "vendor": device.vendor,
            "device_type": device.device_type
        },
        "raw_config": config_text
    }
    audit_report = run_security_audit(config_dict)

    # Save rescan record
    db_device = db_manager.save_device(device)
    db_manager.save_findings(findings, scan_id=f"rescan-{db_device.id}")
    report_id = db_manager.save_audit_report({
        "report_id": f"rescan-{db_device.id}",
        "device": {"hostname": device.hostname, "vendor": device.vendor},
        "summary": audit_report.get("summary", {}),
        "results": audit_report.get("results", []),
        "prioritized_risks": audit_report.get("prioritized_risks", []),
        "remediations": audit_report.get("remediations", []),
        "ai_analysis": audit_report.get("ai_analysis", {})
    })
    db_manager.save_security_score(device.hostname, audit_report.get("summary", {}))

    set_current_state(device, findings, audit_report)

    return {
        "status": "success",
        "rescan_id": db_device.id,
        "report_id": report_id,
        "hostname": device.hostname,
        "findings_count": len(findings),
        "summary": audit_report.get("summary", {}),
        "message": "Rescan complete. Risk metrics refreshed."
    }
