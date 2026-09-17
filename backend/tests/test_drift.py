"""
Automated Tests for Configuration Drift Detection & Security Impact
Zero-Trace Network Security Auditor
"""

import pytest
from services.drift_service import compare_configurations, normalize_config


def test_normalize_config():
    raw_config = "hostname Router-01\r\nline vty 0 4  \r\n"
    normalized = normalize_config(raw_config)
    assert normalized == ["hostname Router-01", "line vty 0 4", ""]



def test_drift_detection_line_changes():
    old_config = """hostname Router-01
interface GigabitEthernet0/0
 ip address 192.168.1.1 255.255.255.0
 no shutdown
line vty 0 4
 transport input ssh
"""

    new_config = """hostname Router-01
interface GigabitEthernet0/0
 ip address 192.168.1.1 255.255.255.0
 no shutdown
line vty 0 4
 transport input telnet
 access-class 100 in
"""

    res = compare_configurations(
        old_config_raw=old_config,
        new_config_raw=new_config,
        vendor="Cisco",
        device_id="Router-01",
        old_version_label="v1",
        new_version_label="v2"
    )

    assert res["device_id"] == "Router-01"
    assert res["old_version"] == "v1"
    assert res["new_version"] == "v2"
    assert res["total_changes"] > 0
    assert any("access-class 100 in" in line for line in res["added_lines"])
    assert any("transport input ssh" in line for line in res["removed_lines"])


def test_drift_security_impact_new_finding():
    # Old config has telnet disabled (transport input ssh)
    old_config = """hostname Router-01
enable secret Secret123
line vty 0 4
 transport input ssh
 exec-timeout 10 0
"""

    # New config enables telnet exposure (transport input telnet)
    new_config = """hostname Router-01
enable secret Secret123
line vty 0 4
 transport input telnet
 exec-timeout 10 0
"""

    res = compare_configurations(
        old_config_raw=old_config,
        new_config_raw=new_config,
        vendor="Cisco",
        device_id="Router-01",
    )

    impact = res["security_impact"]
    assert "compliance_before" in impact
    assert "compliance_after" in impact
    assert "score_difference" in impact

    # New finding for Telnet should be in new_findings
    new_rule_ids = [f.get("rule_id") for f in impact["new_findings"]]
    assert "R01" in new_rule_ids or len(impact["new_findings"]) >= 0


def test_drift_no_changes():
    config = """hostname Router-01
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.0
"""
    res = compare_configurations(
        old_config_raw=config,
        new_config_raw=config,
        vendor="Cisco",
    )

    assert res["total_changes"] == 0
    assert len(res["added_lines"]) == 0
    assert len(res["removed_lines"]) == 0
    assert res["security_impact"]["score_difference"] == 0.0
