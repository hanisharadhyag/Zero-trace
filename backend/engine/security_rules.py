# backend/engine/security_rules.py

from typing import List, Dict, Any

# -------------------------------------------------
# Import all 15 security rules
# -------------------------------------------------

try:
    from engine.rules.r01_telnet import check_telnet
    from engine.rules.r02_ssh_exposure import check_ssh_exposure
    from engine.rules.r03_any_to_any import check_any_to_any
    from engine.rules.r04_broad_access import check_broad_access
    from engine.rules.r05_firewall_logging import check_firewall_logging
    from engine.rules.r06_insecure_management import check_insecure_management
    from engine.rules.r07_weak_ssh import check_weak_ssh
    from engine.rules.r08_default_credentials import check_default_credentials
    from engine.rules.r09_unencrypted_management import check_unencrypted_management
    from engine.rules.r10_missing_logging import check_missing_logging
    from engine.rules.r11_weak_encryption import check_weak_encryption
    from engine.rules.r12_admin_access import check_admin_access
    from engine.rules.r13_audit_logging import check_audit_logging
    from engine.rules.r14_rule_conflict import check_rule_conflicts
    from engine.rules.r15_baseline import check_security_baseline
except ImportError:
    from rules.r01_telnet import check_telnet
    from rules.r02_ssh_exposure import check_ssh_exposure
    from rules.r03_any_to_any import check_any_to_any
    from rules.r04_broad_access import check_broad_access
    from rules.r05_firewall_logging import check_firewall_logging
    from rules.r06_insecure_management import check_insecure_management
    from rules.r07_weak_ssh import check_weak_ssh
    from rules.r08_default_credentials import check_default_credentials
    from rules.r09_unencrypted_management import check_unencrypted_management
    from rules.r10_missing_logging import check_missing_logging
    from rules.r11_weak_encryption import check_weak_encryption
    from rules.r12_admin_access import check_admin_access
    from rules.r13_audit_logging import check_audit_logging
    from rules.r14_rule_conflict import check_rule_conflicts
    from rules.r15_baseline import check_security_baseline

# -------------------------------------------------
# Models
# -------------------------------------------------

from schemas.finding_schema import Finding
from models.device import Device


# -------------------------------------------------
# Execute all rules
# -------------------------------------------------

def run_all_rules(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [
        check_telnet(config),
        check_ssh_exposure(config),
        check_any_to_any(config),
        check_broad_access(config),
        check_firewall_logging(config),
        check_insecure_management(config),
        check_weak_ssh(config),
        check_default_credentials(config),
        check_unencrypted_management(config),
        check_missing_logging(config),
        check_weak_encryption(config),
        check_admin_access(config),
        check_audit_logging(config),
        check_rule_conflicts(config),
        check_security_baseline(config),
    ]


# -------------------------------------------------
# Security Engine
# -------------------------------------------------

class SecurityEngine:

    def analyze(self, device: Device) -> List[Finding]:

        config = {
            "hostname": device.hostname,
            "vendor": device.vendor,

            "management": {
                "ssh_enabled": device.ssh_enabled,
                "telnet_enabled": device.telnet_enabled,
                "http_management_enabled": device.http_enabled,
                "allowed_management_sources": ["10.0.0.0/8"],
            },

            "logging": {
                "firewall_logging_enabled": device.logging_enabled,
                "central_logging_enabled": device.logging_enabled,
                "audit_logging_enabled": device.logging_enabled,
            },

            "credentials": {
                "default_credentials_in_use": False,
            },

            "encryption": {
                "enabled_algorithms": ["AES-256"],
            },

            "firewall_rules": [
                {
                    "id": acl.rule_id,
                    "action": acl.action,
                    "source": acl.source,
                    "destination": acl.destination,
                    "protocol": acl.protocol,
                    "logging": acl.logging_enabled,
                }
                for acl in device.acl_rules
            ],
        }

        results = run_all_rules(config)
        findings: List[Finding] = []

        for rule in results:

            if rule.get("status") != "FAIL":
                continue

            evidence = rule.get("details", "")

            if isinstance(evidence, dict):
                evidence = ", ".join(
                    f"{k}: {v}" for k, v in evidence.items()
                )

            findings.append(
                Finding(
                    rule_id=rule.get("rule_id", "UNKNOWN"),
                    title=rule.get("title", "Security Finding"),
                    severity=rule.get("severity", "LOW"),
                    category=rule.get("category", "Network Security"),
                    description=rule.get(
                        "description",
                        "Security policy violation detected."
                    ),
                    evidence=str(evidence),
                    recommendation=rule.get(
                        "recommendation",
                        "Review the configuration and remediate."
                    ),
                    cve=rule.get("cve"),
                    cvss=rule.get("cvss"),
                )
            )

        return findings
