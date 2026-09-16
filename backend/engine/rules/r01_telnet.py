def check_telnet(config):
    """
    R01: Check whether Telnet is enabled.

    Returns a finding if Telnet is enabled.
    """

    telnet_enabled = config.get("management", {}).get("telnet_enabled", False)

    if telnet_enabled:
        return {
    "rule_id": "R01",
    "title": "Telnet Enabled",
    "category": "Management Security",
    "severity": "CRITICAL",
    "status": "FAIL",
    "description": "Telnet is enabled and transmits credentials in plaintext.",
    "recommendation": "Disable Telnet and allow only SSHv2 for remote administration.",
    "details": {"protocol": "Telnet", "port": 23}
}

    return {
    "rule_id": "R01",
    "title": "Telnet Enabled",
    "category": "Management Security",
    "severity": "CRITICAL",
    "status": "PASS",
    "description": "Telnet is disabled.",
    "recommendation": "No action required.",
    "details": {}
}
