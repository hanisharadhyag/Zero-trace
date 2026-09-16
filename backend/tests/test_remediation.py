from rules.remediation import get_remediation_plan


def test_get_remediation_plan():
    results = [
        {"rule_id": "R01", "title": "Telnet Enabled", "severity": "CRITICAL", "status": "FAIL"},
        {"rule_id": "R02", "title": "SSH Exposed", "severity": "HIGH", "status": "PASS"},
    ]

    remediations = get_remediation_plan(results, vendor="Cisco")

    assert len(remediations) == 1
    assert remediations[0]["rule_id"] == "R01"
    assert "Disable Telnet" in remediations[0]["recommended_action"]
    assert "transport input ssh" in remediations[0]["vendor_command_example"]


def test_get_remediation_plan_no_failures():
    results = [
        {"rule_id": "R01", "title": "Telnet Enabled", "severity": "CRITICAL", "status": "PASS"}
    ]
    assert get_remediation_plan(results) == []
