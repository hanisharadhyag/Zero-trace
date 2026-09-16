def check_security_baseline(config):
    """
    R15: Validate configuration against the enterprise security baseline.
    """

    management = config.get("management", {})
    logging = config.get("logging", {})
    encryption = config.get("encryption", {})

    deviations = []

    # Telnet must be disabled
    if management.get("telnet_enabled", False):
        deviations.append({
            "setting": "Telnet",
            "required": "Disabled",
            "actual": "Enabled"
        })

    # SSH must be enabled
    if not management.get("ssh_enabled", False):
        deviations.append({
            "setting": "SSH",
            "required": "Enabled",
            "actual": "Disabled"
        })

    # Central logging must exist
    if not logging.get("central_logging_enabled", False):
        deviations.append({
            "setting": "Central Logging",
            "required": "Enabled",
            "actual": "Disabled"
        })

    # Strong encryption only
    weak_algorithms = {"DES", "3DES", "RC4", "MD5"}

    enabled_algorithms = {
        alg.upper()
        for alg in encryption.get("enabled_algorithms", [])
    }

    detected_weak = list(enabled_algorithms.intersection(weak_algorithms))

    if detected_weak:
        deviations.append({
            "setting": "Encryption",
            "required": "Strong algorithms only",
            "actual": ", ".join(detected_weak)
        })

    total_checks = 4
    passed_checks = total_checks - len(deviations)

    compliance = round((passed_checks / total_checks) * 100, 1)

    if deviations:
        return {
            "rule_id": "R15",
            "title": "Security Baseline Compliance",
            "category": "Compliance",
            "severity": "HIGH",
            "status": "FAIL",
            "description": "Configuration deviates from the enterprise security baseline.",
            "recommendation": "Remediate all baseline deviations before deployment.",
            "details": deviations,
            "compliance_percentage": compliance
        }

    return {
        "rule_id": "R15",
        "title": "Security Baseline Compliance",
        "category": "Compliance",
        "severity": "HIGH",
        "status": "PASS",
        "description": "Configuration fully complies with the enterprise security baseline.",
        "recommendation": "No action required.",
        "details": [],
        "compliance_percentage": 100.0
    }
