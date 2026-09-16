from typing import List, Dict


class ZeroTraceCopilot:
    """
    Offline AI Security Copilot
    Generates explainable remediation from findings.
    """

    def chat(self, question: str, findings: List[Dict], device: Dict) -> Dict:
        q = question.lower()

        # Score questions
        if "score" in q or "grade" in q:
            return self._explain_score(findings)

        # Telnet
        if "telnet" in q:
            return self._telnet()

        # SSH
        if "ssh" in q:
            return self._ssh()

        # Logging
        if "logging" in q or "syslog" in q:
            return self._logging()

        # SNMP
        if "snmp" in q:
            return self._snmp()

        # Executive summary
        if "summary" in q or "overall" in q:
            return self._summary(findings, device)

        # Default response
        return {
            "answer": (
                "I can explain findings, generate Cisco CLI remediation, "
                "calculate the security posture, and provide best-practice guidance."
            ),
            "suggested_commands": [],
            "references": ["CIS Controls", "NIST CSF"]
        }

    # ----------------------------------------------------
    # SCORE
    # ----------------------------------------------------

    def _explain_score(self, findings):
        critical = sum(f["severity"] == "CRITICAL" for f in findings)
        high = sum(f["severity"] == "HIGH" for f in findings)
        medium = sum(f["severity"] == "MEDIUM" for f in findings)

        return {
            "answer": (
                f"Your configuration contains {critical} Critical, "
                f"{high} High and {medium} Medium vulnerabilities. "
                "Critical findings reduce the score the most because they can "
                "lead to immediate compromise of the network."
            ),
            "suggested_commands": [],
            "references": ["CIS Control 4", "NIST PR.IP"]
        }

    # ----------------------------------------------------
    # TELNET
    # ----------------------------------------------------

    def _telnet(self):
        return {
            "answer": (
                "Telnet sends usernames and passwords in plaintext. "
                "Attackers monitoring the network can steal credentials. "
                "Replace Telnet with SSHv2."
            ),
            "suggested_commands": [
                "line vty 0 4",
                "transport input ssh",
                "no transport input telnet",
                "ip ssh version 2",
                "crypto key generate rsa modulus 2048"
            ],
            "references": [
                "CIS Cisco Benchmark",
                "NIST AC-17"
            ]
        }

    # ----------------------------------------------------
    # SSH
    # ----------------------------------------------------

    def _ssh(self):
        return {
            "answer": (
                "SSHv2 encrypts administrative traffic and protects credentials "
                "from interception. It is the recommended management protocol."
            ),
            "suggested_commands": [
                "ip ssh version 2",
                "username admin privilege 15 secret StrongPassword",
                "line vty 0 4",
                "transport input ssh"
            ],
            "references": ["CIS 4.1"]
        }

    # ----------------------------------------------------
    # LOGGING
    # ----------------------------------------------------

    def _logging(self):
        return {
            "answer": (
                "Centralized logging allows incident investigation, compliance "
                "reporting, and real-time SIEM monitoring."
            ),
            "suggested_commands": [
                "logging host 10.10.10.5",
                "logging trap informational",
                "service timestamps log datetime msec"
            ],
            "references": ["NIST AU-6", "CIS 8"]
        }

    # ----------------------------------------------------
    # SNMP
    # ----------------------------------------------------

    def _snmp(self):
        return {
            "answer": (
                "Using the default SNMP community 'public' is insecure. "
                "Use SNMPv3 with authentication and encryption."
            ),
            "suggested_commands": [
                "no snmp-server community public",
                "snmp-server group SECURE v3 priv",
                "snmp-server user admin SECURE v3 auth sha Password123 priv aes 256 Key123"
            ],
            "references": ["CIS 4.7"]
        }

    # ----------------------------------------------------
    # EXECUTIVE SUMMARY
    # ----------------------------------------------------

    def _summary(self, findings, device):
        total = len(findings)

        return {
            "answer": (
                f"{device.get('hostname','Device')} has {total} security findings. "
                "The highest priority is eliminating critical remote-management "
                "vulnerabilities before addressing monitoring and compliance issues."
            ),
            "suggested_commands": [],
            "references": ["Zero-Trace Assessment"]
        }


copilot = ZeroTraceCopilot()
