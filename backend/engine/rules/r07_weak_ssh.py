def check_weak_ssh(config):
    """
    R07: Check whether SSH allows password authentication
    when the security policy requires key-based authentication.
    """

    ssh = config.get("ssh", {})

    password_auth = ssh.get("password_authentication", False)
    key_auth_required = ssh.get("key_authentication_required", True)

    if password_auth and key_auth_required:
        return {
    "rule_id": "R07",
    "title": "Weak SSH Configuration",
    "category": "Management Security",
    "severity": "HIGH",
    "status": "FAIL",
    "description": "SSH password authentication is enabled.",
    "recommendation": "Enforce key-based authentication and disable password login.",
    "details": {"authentication": "password"}
}

    return {
    "rule_id": "R07",
    "title": "Weak SSH Configuration",
    "category": "Management Security",
    "severity": "HIGH",
    "status": "PASS",
    "description": "SSH uses secure authentication.",
    "recommendation": "No action required.",
    "details": {}
}
