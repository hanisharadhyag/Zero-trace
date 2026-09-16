from rules.ai_advisor import analyze_with_ai


def test_analyze_with_ai_compound_risks():
    config = {
        "management": {"ssh_port": 2222},
        "encryption": {"enabled_algorithms": ["DES"]}
    }
    rule_results = [
        {"rule_id": "R01", "status": "FAIL", "severity": "CRITICAL"},
        {"rule_id": "R02", "status": "FAIL", "severity": "HIGH"},
        {"rule_id": "R08", "status": "FAIL", "severity": "CRITICAL"}
    ]

    analysis = analyze_with_ai(config, rule_results)

    assert analysis["status"] == "ANALYSIS_COMPLETE"
    assert len(analysis["correlated_risks"]) >= 2
    assert any("2222" in un for un in analysis["unusual_configurations"])
    assert analysis["failed_rules_count"] == 3
