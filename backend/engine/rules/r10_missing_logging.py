def check_missing_logging(config):
    """
    R10: Check whether centralized security logging is configured.
    """

    logging = config.get("logging", {})

    central_logging_required = logging.get(
        "central_logging_required", True
    )

    central_logging_enabled = logging.get(
        "central_logging_enabled", False
    )

    if central_logging_required and not central_logging_enabled:
        return {
    "rule_id": "R10",
    "title": "Missing Centralized Logging",
    "category": "Logging & Monitoring",
    "severity": "MEDIUM",
    "status": "FAIL",
    "description": "Security logs are not forwarded to a centralized logging server.",
    "recommendation": "Configure Syslog or SIEM integration.",
    "details": {"central_logging": False}
}

    return {
    "rule_id": "R10",
    "title": "Missing Centralized Logging",
    "category": "Logging & Monitoring",
    "severity": "MEDIUM",
    "status": "PASS",
    "description": "Centralized logging is configured.",
    "recommendation": "No action required.",
    "details": {}
}
