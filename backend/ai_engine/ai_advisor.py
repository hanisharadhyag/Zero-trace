"""
Zero-Trace AI Advisor
Offline conversational copilot for the latest scanned configuration.
"""

from typing import Dict, List, Any


class AIAdvisor:

    def __init__(self):
        pass

    def ask(
        self,
        question: str,
        device: Dict[str, Any],
        findings: List[Dict[str, Any]],
        risk: Dict[str, Any],
    ) -> Dict[str, str]:

        q = question.lower().strip()

        hostname = device.get("hostname", "Device")
        vendor = device.get("vendor", "Unknown")

        critical = [f for f in findings if f.get("severity") == "CRITICAL"]
        high = [f for f in findings if f.get("severity") == "HIGH"]

        # --------------------------------------------------
        # Telnet
        # --------------------------------------------------
        if "telnet" in q:

            enabled = device.get("telnet_enabled", False)

            if enabled:
                return {
                    "title": "Why Telnet is Critical",
                    "answer": (
                        f"{hostname} has Telnet enabled. Telnet sends usernames "
                        "and passwords in plain text, allowing attackers on the "
                        "network to capture administrator credentials.\n\n"
                        "Recommendation:\n"
                        "• Disable Telnet\n"
                        "• Enable SSH Version 2 only\n"
                        "• Restrict management access using ACLs"
                    ),
                }

            return {
                "title": "Telnet Status",
                "answer": (
                    f"Good news. Telnet is disabled on {hostname}. "
                    "SSH is the recommended secure management protocol."
                ),
            }

        # --------------------------------------------------
        # SSH
        # --------------------------------------------------
        if "ssh" in q:

            ssh = device.get("ssh_enabled", False)

            if ssh:
                return {
                    "title": "SSH Analysis",
                    "answer": (
                        "SSH is enabled, which is the secure remote management "
                        "protocol. Ensure only Version 2 is used and restrict "
                        "administrator access to trusted IP addresses."
                    ),
                }

            return {
                "title": "SSH Analysis",
                "answer": (
                    "SSH is not enabled. Enable SSH Version 2 and disable "
                    "Telnet for secure administration."
                ),
            }

        # --------------------------------------------------
        # Logging
        # --------------------------------------------------
        if "logging" in q or "syslog" in q:

            if device.get("logging_enabled"):
                return {
                    "title": "Audit Logging",
                    "answer": (
                        "Central logging is configured. Continue forwarding logs "
                        "to a SIEM or Syslog server for incident investigation."
                    ),
                }

            return {
                "title": "Audit Logging",
                "answer": (
                    "Security logging is disabled. Without logs, intrusion "
                    "detection and forensic analysis become extremely difficult.\n\n"
                    "Cisco CLI:\n"
                    "logging host 10.10.10.5\n"
                    "logging trap informational"
                ),
            }

        # --------------------------------------------------
        # SNMP
        # --------------------------------------------------
        if "snmp" in q:

            if device.get("snmp_enabled"):
                return {
                    "title": "SNMP Security",
                    "answer": (
                        "SNMP is enabled. If using SNMPv2 with public/private "
                        "community strings, upgrade to SNMPv3 with authentication "
                        "and encryption."
                    ),
                }

            return {
                "title": "SNMP Security",
                "answer": "SNMP is disabled. No immediate exposure detected.",
            }

        # --------------------------------------------------
        # Critical Findings
        # --------------------------------------------------
        if "critical" in q:

            if not critical:
                return {
                    "title": "Critical Findings",
                    "answer": (
                        "Excellent. No critical vulnerabilities were detected "
                        "during this scan."
                    ),
                }

            text = "Critical vulnerabilities detected:\n\n"

            for item in critical:
                text += (
                    f"• {item['rule_id']} — {item['title']}\n"
                    f"  {item['recommendation']}\n\n"
                )

            return {
                "title": "Critical Findings",
                "answer": text.strip(),
            }

        # --------------------------------------------------
        # High Findings
        # --------------------------------------------------
        if "high" in q:

            if not high:
                return {
                    "title": "High Severity Findings",
                    "answer": "No HIGH severity findings are present.",
                }

            text = "High severity issues:\n\n"

            for item in high:
                text += (
                    f"• {item['rule_id']} — {item['title']}\n"
                    f"  {item['recommendation']}\n\n"
                )

            return {
                "title": "High Severity Findings",
                "answer": text.strip(),
            }

        # --------------------------------------------------
        # Score
        # --------------------------------------------------
        if "score" in q or "grade" in q:

            return {
                "title": "Security Score",
                "answer": (
                    f"Current Security Score: {risk.get('score', 0)}/100\n"
                    f"Grade: {risk.get('grade', 'N/A')}\n\n"
                    f"Critical: {risk.get('critical', 0)}\n"
                    f"High: {risk.get('high', 0)}\n"
                    f"Medium: {risk.get('medium', 0)}\n"
                    f"Low: {risk.get('low', 0)}"
                ),
            }

        # --------------------------------------------------
        # Interfaces
        # --------------------------------------------------
        if "interface" in q or "network" in q:

            interfaces = device.get("interfaces", [])

            if not interfaces:
                return {
                    "title": "Network Interfaces",
                    "answer": "No interfaces were parsed from the configuration.",
                }

            lines = []

            for i in interfaces:
                vlan = i.get("vlan") or "-"
                ip = i.get("ip_address") or "N/A"
                lines.append(
                    f"{i['name']} | {ip} | VLAN {vlan} | {i['status']}"
                )

            return {
                "title": "Network Interfaces",
                "answer": "\n".join(lines),
            }

        # --------------------------------------------------
        # Summary
        # --------------------------------------------------
        if "summary" in q or "overview" in q:

            return {
                "title": "Executive Summary",
                "answer": (
                    f"Device: {hostname}\n"
                    f"Vendor: {vendor}\n\n"
                    f"Security Score: {risk.get('score', 0)} ({risk.get('grade')})\n"
                    f"Total Findings: {len(findings)}\n\n"
                    "Highest priority should always be CRITICAL findings "
                    "before HIGH and MEDIUM vulnerabilities."
                ),
            }

        # --------------------------------------------------
        # Default
        # --------------------------------------------------
        return {
            "title": "Zero-Trace AI",
            "answer": (
                "I analyzed the latest scanned configuration.\n\n"
                "You can ask:\n"
                "• Why is Telnet critical?\n"
                "• Show critical findings\n"
                "• Explain logging\n"
                "• Explain SNMP\n"
                "• Show network interfaces\n"
                "• What's my security score?"
            ),
        }
