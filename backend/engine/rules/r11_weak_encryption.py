def check_weak_encryption(config):
    """
    R11: Detect weak or obsolete encryption algorithms.
    """

    encryption = config.get("encryption", {})

    enabled_algorithms = encryption.get("enabled_algorithms", [])

    weak_algorithms = {
        "DES",
        "3DES",
        "RC4",
        "MD5"
    }

    detected_weak = [
        algorithm
        for algorithm in enabled_algorithms
        if algorithm.upper() in weak_algorithms
    ]

    if detected_weak:
        return {
            "rule_id": "R11",
            "title": "Weak Encryption Algorithms",
            "category": "Cryptography",
            "severity": "HIGH",
            "status": "FAIL",
            "description": "Obsolete encryption algorithms are enabled.",
            "message": f"Weak encryption algorithms detected: {', '.join(detected_weak)}",
            "recommendation": "Remove DES, 3DES, RC4, and MD5 from the configuration.",
            "details": {"algorithms": detected_weak},
        }

    return {
        "rule_id": "R11",
        "title": "Weak Encryption Algorithms",
        "category": "Cryptography",
        "severity": "HIGH",
        "status": "PASS",
        "description": "Only strong encryption algorithms are enabled.",
        "message": "Only strong encryption algorithms are enabled.",
        "recommendation": "No action required.",
        "details": {},
    }
