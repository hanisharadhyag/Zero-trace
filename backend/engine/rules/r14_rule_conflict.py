def check_rule_conflicts(config):
    """
    R14: Detect potential firewall rule shadowing/conflicts.
    """

    firewall_rules = config.get("firewall_rules", [])

    conflicts = []

    for i, rule in enumerate(firewall_rules):
        if rule.get("action", "").upper() != "DENY":
            continue

        for later_rule in firewall_rules[i + 1:]:
            if (
                later_rule.get("action", "").upper() == "ALLOW"
                and later_rule.get("source", "").upper() == "ANY"
                and later_rule.get("destination", "").upper() == "ANY"
            ):
                conflicts.append({
                    "deny_rule": rule.get("id"),
                    "allow_rule": later_rule.get("id")
                })

    if conflicts:
        return {
            "rule_id": "R14",
            "title": "Firewall Rule Shadowing",
            "category": "Firewall Security",
            "severity": "CRITICAL",
            "status": "FAIL",
            "description": "A broad ALLOW rule may bypass an earlier DENY rule.",
            "message": f"Detected {len(conflicts)} firewall rule conflict(s).",
            "recommendation": "Reorder firewall rules and remove shadowed policies.",
            "conflicts": conflicts,
            "details": {"conflicts": conflicts},
        }

    return {
        "rule_id": "R14",
        "title": "Firewall Rule Shadowing",
        "category": "Firewall Security",
        "severity": "CRITICAL",
        "status": "PASS",
        "description": "No firewall rule conflicts detected.",
        "message": "No firewall rule conflicts detected.",
        "conflicts": [],
        "recommendation": "No action required.",
        "details": {},
    }
