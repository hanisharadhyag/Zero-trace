from engine.prioritization import prioritize_risks


def test_prioritize_risks_ordering():

    findings = [
        {
            "rule_id": "R05",
            "title": "Firewall Logging Disabled",
            "severity": "MEDIUM",
            "status": "FAIL",
        },
        {
            "rule_id": "R01",
            "title": "Telnet Enabled",
            "severity": "CRITICAL",
            "status": "FAIL",
        },
        {
            "rule_id": "R02",
            "title": "SSH Exposed",
            "severity": "HIGH",
            "status": "FAIL",
        },
        {
            "rule_id": "R08",
            "title": "Default Credentials",
            "severity": "CRITICAL",
            "status": "FAIL",
        },
        {
            "rule_id": "R03",
            "title": "Any-to-Any Rule",
            "severity": "CRITICAL",
            "status": "PASS",
        },
    ]

    prioritized = prioritize_risks(findings)

    assert len(prioritized) == 4

    assert prioritized[0]["severity"] == "CRITICAL"
    assert prioritized[1]["severity"] == "CRITICAL"
    assert prioritized[2]["severity"] == "HIGH"
    assert prioritized[3]["severity"] == "MEDIUM"

    # New weighted priorities
    assert [r["priority"] for r in prioritized] == [4, 4, 3, 2]

    # Risk points
    assert prioritized[0]["risk_points"] == 25
    assert prioritized[2]["risk_points"] == 15
    assert prioritized[3]["risk_points"] == 8


def test_prioritize_risks_empty():

    assert prioritize_risks([]) == []


def test_passed_rules_are_ignored():

    findings = [
        {
            "rule_id": "R01",
            "severity": "CRITICAL",
            "status": "PASS",
        },
        {
            "rule_id": "R02",
            "severity": "HIGH",
            "status": "FAIL",
        },
    ]

    prioritized = prioritize_risks(findings)

    assert len(prioritized) == 1
    assert prioritized[0]["rule_id"] == "R02"
