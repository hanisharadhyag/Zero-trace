def check_unencrypted_management(config):
    """
    R09: Detect unencrypted management protocols.
    """

    management = config.get("management", {})

    telnet_enabled = management.get("telnet_enabled", False)
    http_enabled = management.get("http_management_enabled", False)
    ftp_enabled = management.get("ftp_management_enabled", False)

    insecure_protocols = []

    if telnet_enabled:
        insecure_protocols.append("Telnet")

    if http_enabled:
        insecure_protocols.append("HTTP")

    if ftp_enabled:
        insecure_protocols.append("FTP")

    if insecure_protocols:
        return {
            "rule_id": "R09",
            "title": "Unencrypted Management Traffic",
            "category": "Management Security",
            "severity": "HIGH",
            "status": "FAIL",
            "description": "Unencrypted management protocols were detected.",
            "message": f"Unencrypted management protocols detected: {', '.join(insecure_protocols)}",
            "recommendation": "Disable Telnet, FTP, and HTTP management.",
            "details": {"protocols": insecure_protocols},
        }

    return {
        "rule_id": "R09",
        "title": "Unencrypted Management Traffic",
        "category": "Management Security",
        "severity": "HIGH",
        "status": "PASS",
        "description": "No insecure management protocols detected.",
        "message": "No insecure management protocols detected.",
        "recommendation": "No action required.",
        "details": {},
    }
