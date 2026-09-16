def check_any_to_any(config):
    """
    R03: Detect unrestricted ANY-to-ANY firewall allow rules.
    """

    firewall_rules = config.get("firewall_rules", [])

    for rule in firewall_rules:
        source = rule.get("source", [])
        destination = rule.get("destination", [])
        ports = rule.get("ports", [])
        action = rule.get("action", "").upper()

        if (
            action == "ALLOW"
            and "ANY" in source
            and "ANY" in destination
            and "ANY" in ports
        ):
            return {
    "rule_id": "R03",
    "title": "Any-to-Any Firewall Rule",
    "category": "Firewall Security",
    "severity": "CRITICAL",
    "status": "FAIL",
    "description": "Firewall contains an unrestricted ANY-to-ANY allow rule.",
    "recommendation": "Replace ANY rules with least-privilege CIDR and service-specific policies.",
    "details": rule
}
    return {
    "rule_id": "R03",
    "title": "Any-to-Any Firewall Rule",
    "category": "Firewall Security",
    "severity": "CRITICAL",
    "status": "PASS",
    "description": "No unrestricted ANY-to-ANY rule detected.",
    "recommendation": "No action required.",
    "details": {}
}
