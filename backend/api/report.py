from fastapi import APIRouter
from utils.report_utils import current_timestamp, calculate_pass_rate
from api.upload import (
    get_current_device,
    get_current_findings,
    get_current_risk,
)

router = APIRouter(prefix="/api", tags=["Executive Report"])


@router.get("/report")
def generate_report():
    """
    Enterprise Executive Report API
    Returns complete report data as JSON.
    """

    device = get_current_device()
    findings = get_current_findings()
    risk = get_current_risk()

    if device is None:
        return {
            "success": False,
            "message": "No completed scan found."
        }

    device_dict = device.model_dump()
    finding_dicts = [f.model_dump() for f in findings]

    total_rules = 15
    failed_rules = len(finding_dicts)
    passed_rules = max(0, total_rules - failed_rules)

    # -----------------------------
    # Severity Distribution
    # -----------------------------
    severity = {
        "critical": risk.get("critical", 0),
        "high": risk.get("high", 0),
        "medium": risk.get("medium", 0),
        "low": risk.get("low", 0),
    }

    # -----------------------------
    # Compliance Chart
    # -----------------------------
    compliance = {
        "passed": passed_rules,
        "failed": failed_rules,
    }

    # -----------------------------
    # Attack Surface
    # -----------------------------
    attack_surface = {
        "interfaces": len(device_dict.get("interfaces", [])),
        "services": len(device_dict.get("services", [])),
        "acl_rules": len(device_dict.get("acl_rules", [])),
        "ssh": device_dict.get("ssh_enabled", False),
        "telnet": device_dict.get("telnet_enabled", False),
        "snmp": device_dict.get("snmp_enabled", False),
    }

    # -----------------------------
    # Executive Summary
    # -----------------------------
    summary = (
        f"Zero-Trace analyzed the uploaded {device_dict.get('vendor')} "
        f"{device_dict.get('device_type')} configuration. "
        f"The device scored {risk['score']}/100 with grade {risk['grade']}. "
        f"{failed_rules} security findings were detected, including "
        f"{severity['critical']} Critical and {severity['high']} High severity risks."
    )

    return {
        "success": True,
        "generated_at": current_timestamp(),

        "device": device_dict,

        "risk_score": risk,

        "executive_summary": summary,

        "statistics": {
            "total_rules": total_rules,
            "passed_rules": passed_rules,
            "failed_rules": failed_rules,
            "pass_rate": calculate_pass_rate(
                passed_rules,
                total_rules
            ),
        },

        "charts": {
            "severity": severity,
            "compliance": compliance,
            "attack_surface": attack_surface,
        },

        "findings": finding_dicts,
    }
