def check_firewall_logging(config):
    """
    R05: Check whether firewall logging is enabled
    when required by security policy.
    """

    logging = config.get("logging", {})

    logging_enabled = logging.get("firewall_logging_enabled", False)
    logging_required = logging.get("firewall_logging_required", True)

    if logging_required and not logging_enabled:
        return {
    "rule_id": "R05",
    "title": "Firewall Logging Disabled",
    "category": "Logging & Monitoring",
    "severity": "MEDIUM",
    "status": "FAIL",
    "description": "Firewall logging is disabled despite policy requirements.",
    "recommendation": "Enable firewall logging and forward events to SIEM.",
    "details": {"logging": False}
}

    return {
    "rule_id": "R05",
    "title": "Firewall Logging Disabled",
    "category": "Logging & Monitoring",
    "severity": "MEDIUM",
    "status": "PASS",
    "description": "Firewall logging is enabled.",
    "recommendation": "No action required.",
    "details": {}
}
