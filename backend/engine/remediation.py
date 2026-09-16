"""
Structured Remediation Module for SIH6155 Network Security Compliance Auditor.

Provides non-destructive actionable recommendations and vendor-specific remediation guidance.
"""

from typing import List, Dict, Any

REMEDIATION_CATALOG = {
    "R01": {
        "issue": "Telnet Protocol Enabled",
        "explanation": "Telnet transmits credentials and data in cleartext, enabling eavesdropping and man-in-the-middle attacks.",
        "recommended_action": "Disable Telnet and enforce SSHv2 for remote management.",
        "vendor_commands": {
            "Cisco": "line vty 0 15\n transport input ssh\n no exec-timeout",
            "Palo Alto": "set deviceconfig system service disable-telnet yes",
            "Fortinet": "config system interface\n edit mgmt\n unset allowaccess telnet\n end"
        }
    },
    "R02": {
        "issue": "SSH Exposed to Untrusted Network",
        "explanation": "Permitting SSH from ANY source exposes administrative interfaces to internet-wide brute-force attacks.",
        "recommended_action": "Restrict SSH access to trusted management IP subnets or jump hosts.",
        "vendor_commands": {
            "Cisco": "ip access-list standard MGMT_ACL\n permit 10.100.0.0 0.0.0.255\n line vty 0 15\n access-class MGMT_ACL in",
            "Palo Alto": "set deviceconfig system open-ports ssh restricted-to [ 10.100.0.0/24 ]",
            "Fortinet": "config system admin\n edit admin\n set trusthost1 10.100.0.0 255.255.255.0\n end"
        }
    },
    "R03": {
        "issue": "Unrestricted Any-to-Any Allow Firewall Rule",
        "explanation": "Allowing ANY traffic between ANY source and ANY destination violates the principle of least privilege.",
        "recommended_action": "Replace ANY-to-ANY allow rules with explicit micro-segmented rules specifying explicit hosts, ports, and protocols.",
        "vendor_commands": {
            "Cisco": "no access-list OUTSIDE_IN permit ip any any",
            "Palo Alto": "delete security rules allow-all-any",
            "Fortinet": "config firewall policy\n delete <policy_id>\n end"
        }
    },
    "R04": {
        "issue": "Overly Broad Network Access to Sensitive Resources",
        "explanation": "Sensitive destinations (Databases, Admin servers) are accessible from unrestricted sources.",
        "recommended_action": "Restrict source definitions for rules granting access to sensitive internal servers.",
        "vendor_commands": {
            "Cisco": "ip access-list extended DB_ACCESS\n permit tcp 10.1.0.0 0.0.0.255 host 10.0.0.5 eq 3306",
            "Palo Alto": "set security rules db-rule source [ 10.1.0.0/24 ] destination [ DB-Server ]",
            "Fortinet": "config firewall policy\n edit <id>\n set srcaddr Internal_Subnet\n end"
        }
    },
    "R05": {
        "issue": "Firewall Rule Logging Disabled",
        "explanation": "Disabling logging on firewall rules prevents security monitoring and incident forensics.",
        "recommended_action": "Enable session log generation on all active firewall rules.",
        "vendor_commands": {
            "Cisco": "access-list OUTSIDE_IN permit ip any host 10.0.0.1 log",
            "Palo Alto": "set security rules <rule> log-end yes",
            "Fortinet": "config firewall policy\n edit <id>\n set logtraffic all\n end"
        }
    },
    "R06": {
        "issue": "Insecure HTTP Management Protocol Enabled",
        "explanation": "HTTP management exposes administrative web sessions to credential theft and packet capture.",
        "recommended_action": "Disable HTTP management and enforce HTTPS with modern TLS versions.",
        "vendor_commands": {
            "Cisco": "no ip http server\n ip http secure-server",
            "Palo Alto": "set deviceconfig system service disable-http yes",
            "Fortinet": "config system interface\n edit mgmt\n unset allowaccess http\n set allowaccess https\n end"
        }
    },
    "R07": {
        "issue": "Weak SSH Configuration (Password Auth Enabled)",
        "explanation": "Password authentication over SSH increases vulnerability to credential stuffing and brute force.",
        "recommended_action": "Enforce public-key authentication and disable password-based SSH logins.",
        "vendor_commands": {
            "Cisco": "ip ssh pubkey-chain",
            "Palo Alto": "set deviceconfig system ssh-key-only yes",
            "Fortinet": "config system admin\n edit admin\n set ssh-public-key1 \"ssh-rsa ...\"\n end"
        }
    },
    "R08": {
        "issue": "Default Vendor Credentials Enabled",
        "explanation": "Unchanged factory default usernames/passwords allow immediate unauthorized system compromise.",
        "recommended_action": "Change default passwords immediately and enforce complex password policies.",
        "vendor_commands": {
            "Cisco": "username admin secret <strong_password>",
            "Palo Alto": "set mgt-config users admin password",
            "Fortinet": "config system admin\n edit admin\n set password <strong_password>\n end"
        }
    },
    "R09": {
        "issue": "Unencrypted Management Traffic Detected",
        "explanation": "Unencrypted protocols (Telnet, HTTP, FTP) expose management credentials in plain text.",
        "recommended_action": "Disable unencrypted management protocols and utilize encrypted protocols (SSH, HTTPS, SFTP).",
        "vendor_commands": {
            "Cisco": "no ip http server\n no service telnet",
            "Palo Alto": "set deviceconfig system service disable-telnet yes disable-http yes",
            "Fortinet": "config system interface\n edit mgmt\n set allowaccess https ssh\n end"
        }
    },
    "R10": {
        "issue": "Missing Centralized Logging Configuration",
        "explanation": "Without centralized Syslog/SIEM forwarding, local log tampering or erasure cannot be detected.",
        "recommended_action": "Configure remote centralized syslog forwarding to a secure log collector.",
        "vendor_commands": {
            "Cisco": "logging host 10.100.0.250\n logging trap informational",
            "Palo Alto": "set deviceconfig system syslog <server-name> server 10.100.0.250",
            "Fortinet": "config log syslogd setting\n set status enable\n set server 10.100.0.250\n end"
        }
    },
    "R11": {
        "issue": "Weak or Obsolete Encryption Ciphers Enabled",
        "explanation": "Legacy ciphers (DES, 3DES, RC4, MD5) are vulnerable to cryptographic attack and compromise.",
        "recommended_action": "Disable legacy algorithms and configure AES-GCM and TLS 1.2+ ciphers.",
        "vendor_commands": {
            "Cisco": "ip ssh algorithm cipher aes256-gcm",
            "Palo Alto": "set deviceconfig system ssl-tls-service-profile profile-1 min-version tls1-2",
            "Fortinet": "config system global\n set strong-crypto enable\n end"
        }
    },
    "R12": {
        "issue": "Unrestricted Administrative Access",
        "explanation": "Administrative access without IP restriction allows unauthorized connection attempts from any network.",
        "recommended_action": "Configure restrictive management ACLs allowing administrative sessions only from trusted subnets.",
        "vendor_commands": {
            "Cisco": "line vty 0 4\n access-class ADMIN_ACL in",
            "Palo Alto": "set deviceconfig system permitted-ip [ 10.100.0.5/32 ]",
            "Fortinet": "config system admin edit admin\n set trusthost1 10.100.0.5 255.255.255.255\n end"
        }
    },
    "R13": {
        "issue": "Insufficient Security Audit Event Logging",
        "explanation": "Missing audit logs for authentication or configuration changes hinders incident response.",
        "recommended_action": "Enable audit logging for user login events, configuration alterations, and security alarms.",
        "vendor_commands": {
            "Cisco": "archive\n log config\n logging enable",
            "Palo Alto": "set deviceconfig setting audit log-config-changes yes",
            "Fortinet": "config log setting\n set log-invalid-packet enable\n end"
        }
    },
    "R14": {
        "issue": "Potential Firewall Rule Shadowing Conflict",
        "explanation": "A broad ALLOW rule placed below a DENY rule can unintentionally permit blocked traffic if ordering is flawed.",
        "recommended_action": "Reorder firewall rules so explicit granular DENY rules execute prior to general ALLOW rules.",
        "vendor_commands": {
            "Cisco": "reorder access-list OUTSIDE_IN",
            "Palo Alto": "move security rules <deny_rule> before <allow_rule>",
            "Fortinet": "config firewall policy\n move <deny_id> before <allow_id>\n end"
        }
    },
    "R15": {
        "issue": "Security Baseline Compliance Deviation",
        "explanation": "Device configuration violates the organizational minimum baseline requirements.",
        "recommended_action": "Remediate baseline deviations to align device configuration with enterprise security standards.",
        "vendor_commands": {
            "Cisco": "apply security-baseline template",
            "Palo Alto": "load config from baseline.xml",
            "Fortinet": "execute restore config baseline"
        }
    }
}


def get_remediation_plan(rule_results: List[Dict[str, Any]], vendor: str = "Generic") -> List[Dict[str, Any]]:
    """
    Generate structured remediation recommendations for all failed compliance rules.

    Args:
        rule_results: List of rule evaluation dictionaries.
        vendor: Optional device vendor name (e.g. Cisco, Palo Alto, Fortinet).

    Returns:
        List of structured remediation dictionaries for failed rules.
    """
    remediations = []

    for rule in rule_results:
        if rule.get("status") != "FAIL":
            continue

        rule_id = rule.get("rule_id")
        catalog_entry = REMEDIATION_CATALOG.get(rule_id, {})

        issue = catalog_entry.get("issue", rule.get("title", f"Rule {rule_id} Failure"))
        explanation = catalog_entry.get("explanation", rule.get("message", "Non-compliant setting detected."))
        recommended_action = catalog_entry.get("recommended_action", "Remediate non-compliant configuration.")
        vendor_cmd_map = catalog_entry.get("vendor_commands", {})
        vendor_cmd = vendor_cmd_map.get(vendor, vendor_cmd_map.get("Cisco", "Consult vendor documentation."))

        remediations.append({
            "rule_id": rule_id,
            "title": rule.get("title"),
            "severity": rule.get("severity"),
            "issue": issue,
            "explanation": explanation,
            "recommended_action": recommended_action,
            "vendor_command_example": vendor_cmd,
            "details": rule.get("details", rule.get("conflicts", rule.get("deviations", [])))
        })

    return remediations


class RemediationEngine:
    """
    Remediation Engine for generating vendor-specific corrective configuration fixes.
    """

    def generate(self, rule_results: List[Dict[str, Any]], vendor: str = "Cisco") -> List[Dict[str, Any]]:
        return get_remediation_plan(rule_results, vendor)

