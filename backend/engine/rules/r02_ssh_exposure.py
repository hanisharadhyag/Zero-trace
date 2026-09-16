def check_ssh_exposure(config):
    """
    R02: Check whether SSH is exposed to an unrestricted source.
    """

    management = config.get("management", {})

    ssh_enabled = management.get("ssh_enabled", False)
    allowed_sources = management.get("allowed_management_sources", [])

    if ssh_enabled and "ANY" in allowed_sources:
        return {
    "rule_id": "R02",
    "title": "SSH Exposed to Untrusted Network",
    "category": "Management Security",
    "severity": "HIGH",
    "status": "FAIL",
    "description": "SSH is accessible from unrestricted management sources.",
    "recommendation": "Restrict SSH access to trusted management subnets using ACLs.",
    "details": {"service": "SSH", "port": 22}
}

    return {
    "rule_id": "R02",
    "title": "SSH Exposed to Untrusted Network",
    "category": "Management Security",
    "severity": "HIGH",
    "status": "PASS",
    "description": "SSH is restricted to approved management sources.",
    "recommendation": "No action required.",
    "details": {}
}
