def check_admin_access(config):
    """
    R12: Check whether administrative access is unrestricted.
    """

    admin = config.get("admin_access", {})

    access_sources = admin.get("allowed_sources", [])

    if not access_sources:
        return {
            "rule_id": "R12",
            "title": "Unrestricted Administrative Access",
            "severity": "CRITICAL",
            "status": "FAIL",
            "message": "No source restriction is configured for administrative access."
        }

    if "ANY" in [source.upper() for source in access_sources]:
        return {
    "rule_id": "R12",
    "title": "Unrestricted Administrative Access",
    "category": "Management Security",
    "severity": "CRITICAL",
    "status": "FAIL",
    "description": "Administrative access is allowed from unrestricted sources.",
    "recommendation": "Restrict administrative access to trusted management IP ranges.",
    "details": {"allowed_sources": access_sources}
}

    return {
    "rule_id": "R12",
    "title": "Unrestricted Administrative Access",
    "category": "Management Security",
    "severity": "CRITICAL",
    "status": "PASS",
    "description": "Administrative access is properly restricted.",
    "recommendation": "No action required.",
    "details": {}
}
