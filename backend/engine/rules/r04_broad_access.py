def check_broad_access(config):
    """
    R04: Detect overly broad access to sensitive resources.
    """

    firewall_rules = config.get("firewall_rules", [])

    for rule in firewall_rules:
        source = rule.get("source", [])
        destination = rule.get("destination", [])
        action = rule.get("action", "").upper()

        sensitive_resources = ["DATABASE", "ADMIN_SERVER", "INTERNAL_SERVER"]

        if (
            action == "ALLOW"
            and "ANY" in source
            and any(resource in destination for resource in sensitive_resources)
        ):
            return {
    "rule_id": "R04",
    "title": "Overly Broad Network Access",
    "category": "Firewall Security",
    "severity": "HIGH",
    "status": "FAIL",
    "description": "Sensitive resources are reachable from unrestricted sources.",
    "recommendation": "Limit access using network segmentation and source ACLs.",
    "details": rule
}

    
    return {
    "rule_id": "R04",
    "title": "Overly Broad Network Access",
    "category": "Firewall Security",
    "severity": "HIGH",
    "status": "PASS",
    "description": "Sensitive resources are properly protected.",
    "recommendation": "No action required.",
    "details": {}
}
