from rules.config_normalizer import normalize_config


def test_normalize_empty_config():
    result = normalize_config({})
    assert isinstance(result, dict)
    assert result.get("firewall_rules") == []


def test_normalize_flat_telnet_and_ssh():
    config = {
        "telnet_enabled": True,
        "ssh_enabled": False,
        "ssh_exposed_to": "10.0.0.1"
    }
    norm = normalize_config(config)
    assert norm["management"]["telnet_enabled"] is True
    assert norm["management"]["ssh_enabled"] is False
    assert norm["management"]["allowed_management_sources"] == ["10.0.0.1"]


def test_normalize_nested_to_flat():
    config = {
        "management": {
            "telnet_enabled": False,
            "ssh_enabled": True
        }
    }
    norm = normalize_config(config)
    assert norm["telnet_enabled"] is False
    assert norm["ssh_enabled"] is True
