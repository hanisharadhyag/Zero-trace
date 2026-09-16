from fastapi import APIRouter, UploadFile, File, Form

from parsers.cisco_parser import CiscoParser
from parsers.fortinet_parser import FortinetParser
from parsers.paloalto_parser import PaloAltoParser

from engine.security_rules import SecurityEngine
from engine.risk_score import RiskScoreEngine

# AI Copilot Context
from api.copilot import update_context

router = APIRouter()

# =====================================================
# Runtime Scan Storage
# =====================================================

CURRENT_DEVICE = None
CURRENT_FINDINGS = []
CURRENT_RISK = None


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
    }


# =====================================================
# Upload & Scan
# =====================================================

@router.post("/upload")
async def upload_config(
    vendor: str = Form(...),
    file: UploadFile = File(...)
):
    global CURRENT_DEVICE, CURRENT_FINDINGS, CURRENT_RISK

    config_text = (await file.read()).decode(
        "utf-8",
        errors="ignore"
    )

    # -------------------------
    # Select Parser
    # -------------------------

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

    # -------------------------
    # Parse Configuration
    # -------------------------

    device = parser.parse(config_text)

    # =====================================================
    # DEBUG OUTPUT
    # =====================================================

    print("\n========== ZERO-TRACE DEBUG ==========")
    print("Hostname :", device.hostname)
    print("Vendor   :", device.vendor)
    print("Type     :", device.device_type)
    print("Telnet   :", device.telnet_enabled)
    print("SSH      :", device.ssh_enabled)
    print("HTTP     :", device.http_enabled)
    print("Interfaces :", len(device.interfaces))
    print("ACL Rules  :", len(device.acl_rules))
    print("=====================================")

    # -------------------------
    # Security Analysis
    # -------------------------

    findings = SecurityEngine().analyze(device)

    print(f"FINDINGS : {len(findings)}")

    for f in findings:
        print(f"- {f.rule_id} | {f.severity} | {f.title}")

    # -------------------------
    # Risk Score
    # -------------------------

    finding_dicts = [f.model_dump() for f in findings]

    risk = RiskScoreEngine().calculate(finding_dicts)

    print("RISK SCORE :", risk)
    print("=========== END DEBUG ===========\n")

    # -------------------------
    # Store Runtime Data
    # -------------------------

    CURRENT_DEVICE = device
    CURRENT_FINDINGS = findings
    CURRENT_RISK = risk

    # -------------------------
    # Update AI Copilot Context
    # -------------------------

    update_context(
        findings=finding_dicts,
        device=device.model_dump()
    )

    # -------------------------
    # Response
    # -------------------------

    return {
        "success": True,
        "message": "Scan completed successfully",
        "device": device.model_dump(),
        "findings": finding_dicts,
        "risk_score": risk,
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
    global CURRENT_DEVICE, CURRENT_FINDINGS, CURRENT_RISK

    CURRENT_DEVICE = None
    CURRENT_FINDINGS = []
    CURRENT_RISK = None

    update_context([], {})

    return {
        "success": True,
        "message": "Session cleared",
    }
