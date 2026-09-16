def check_audit_logging(config):
    """
    R13: Check whether important security audit events are logged.
    """

    logging = config.get("logging", {})

    required_events = {
        "authentication": logging.get(
            "authentication_logging", False
        ),
        "configuration_changes": logging.get(
            "configuration_change_logging", False
        ),
        "security_events": logging.get(
            "security_event_logging", False
        )
    }

    missing_events = [
        event
        for event, enabled in required_events.items()
        if not enabled
    ]

    if missing_events:
        return {
            "rule_id": "R13",
            "title": "Insufficient Audit Logging",
            "category": "Logging & Monitoring",
            "severity": "HIGH",
            "status": "FAIL",
            "description": "Important security audit events are not being logged.",
            "message": f"Missing security audit logging for: {', '.join(missing_events)}",
            "recommendation": "Enable authentication, configuration, and security event logging.",
            "details": {"missing_events": missing_events},
        }

    return {
        "rule_id": "R13",
        "title": "Insufficient Audit Logging",
        "category": "Logging & Monitoring",
        "severity": "HIGH",
        "status": "PASS",
        "description": "Required audit events are being logged.",
        "message": "Required audit events are being logged.",
        "recommendation": "No action required.",
        "details": {},
    }
