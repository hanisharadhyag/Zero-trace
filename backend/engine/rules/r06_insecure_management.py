def check_insecure_management(config):
    """
    R06: Check whether insecure HTTP management is enabled
    without secure HTTPS management.
    """

    management = config.get("management", {})

    http_enabled = management.get("http_management_enabled", False)
    https_enabled = management.get("https_management_enabled", False)

    if http_enabled and not https_enabled:
        return {
    "rule_id": "R06",
    "title": "HTTP Management Enabled",
    "category": "Management Security",
    "severity": "HIGH",
    "status": "FAIL",
    "description": "HTTP management is enabled without HTTPS.",
    "recommendation": "Disable HTTP and enforce HTTPS-only management.",
    "details": {"protocol": "HTTP"}
}

    return {
    "rule_id": "R06",
    "title": "HTTP Management Enabled",
    "category": "Management Security",
    "severity": "HIGH",
    "status": "PASS",
    "description": "Only secure management protocols are enabled.",
    "recommendation": "No action required.",
    "details": {}
}
