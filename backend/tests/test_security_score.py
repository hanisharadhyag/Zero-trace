from engine.risk_score import calculate_security_score


def test_calculate_security_score():

    results = [
        {"status": "PASS", "severity": "CRITICAL"},
        {"status": "PASS", "severity": "HIGH"},
        {"status": "FAIL", "severity": "CRITICAL"},
        {"status": "FAIL", "severity": "HIGH"},
        {"status": "FAIL", "severity": "MEDIUM"},
    ]

    score = calculate_security_score(results)

    assert score["total_rules"] == 5
    assert score["passed"] == 2
    assert score["failed"] == 3

    # Severity counters
    assert score["critical"] == 1
    assert score["high"] == 1
    assert score["medium"] == 1
    assert score["low"] == 0

    # Score & Risk
    assert score["score"] == 52
    assert score["risk_level"] == "HIGH"
    assert score["grade"] == "D"


def test_calculate_security_score_empty():

    score = calculate_security_score([])

    assert score["total_rules"] == 0
    assert score["passed"] == 0
    assert score["failed"] == 0

    assert score["critical"] == 0
    assert score["high"] == 0
    assert score["medium"] == 0
    assert score["low"] == 0

    assert score["score"] == 100
    assert score["risk_level"] == "LOW"
    assert score["grade"] == "A"
