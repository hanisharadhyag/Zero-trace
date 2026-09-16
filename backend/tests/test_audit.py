from engine.audit import run_security_audit

def test_run_security_audit():
    config = {
        "device": {"hostname": "TEST-GW", "vendor": "Cisco"},
        "management": {"telnet_enabled": False, "ssh_enabled": True},
        "telnet_enabled": False,
        "ssh_enabled": True,
        "logging_enabled": True,
        "strong_encryption": True
    }

    audit = run_security_audit(config)

    assert "results" in audit
    assert "summary" in audit
    assert "prioritized_risks" in audit
    assert "remediations" in audit
    assert "ai_analysis" in audit

    assert len(audit["results"]) == 15
    assert audit["summary"]["total_rules"] == 15
    assert isinstance(audit["summary"]["score"], float)
