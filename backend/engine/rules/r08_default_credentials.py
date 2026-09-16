def check_default_credentials(config):
    """
    R08: Check whether default credentials are still enabled.
    """

    credentials = config.get("credentials", {})

    default_credentials = credentials.get(
        "default_credentials_enabled", False
    )

    if default_credentials:
        return {
    "rule_id": "R08",
    "title": "Default Credentials Enabled",
    "category": "Identity & Access",
    "severity": "CRITICAL",
    "status": "FAIL",
    "description": "Default administrative credentials are still active.",
    "recommendation": "Immediately rotate credentials and enforce MFA.",
    "details": {"credential_state": "default"}
}

    return {
    "rule_id": "R08",
    "title": "Default Credentials Enabled",
    "category": "Identity & Access",
    "severity": "CRITICAL",
    "status": "PASS",
    "description": "Default credentials are not present.",
    "recommendation": "No action required.",
    "details": {}
}
