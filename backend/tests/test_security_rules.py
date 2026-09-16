from backend.engine.rules.r01_telnet import check_telnet
from backend.engine.rules.r02_ssh_exposure import check_ssh_exposure
from backend.engine.rules.r03_any_to_any import check_any_to_any
from backend.engine.rules.r04_broad_access import check_broad_access
from backend.engine.rules.r05_firewall_logging import check_firewall_logging
from backend.engine.rules.r06_insecure_management import check_insecure_management
from backend.engine.rules.r07_weak_ssh import check_weak_ssh
from backend.engine.rules.r08_default_credentials import check_default_credentials
from backend.engine.rules.r09_unencrypted_management import check_unencrypted_management
from backend.engine.rules.r10_missing_logging import check_missing_logging
from backend.engine.rules.r11_weak_encryption import check_weak_encryption
from backend.engine.rules.r12_admin_access import check_admin_access
from backend.engine.rules.r13_audit_logging import check_audit_logging
from backend.engine.rules.r14_rule_conflict import check_rule_conflicts
from backend.engine.rules.r15_baseline import check_security_baseline

# ---------------- R01 ----------------

def test_telnet_enabled():
    config = {
        "management": {
            "telnet_enabled": True
        }
    }

    result = check_telnet(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "CRITICAL"


def test_telnet_disabled():
    config = {
        "management": {
            "telnet_enabled": False
        }
    }

    result = check_telnet(config)

    assert result["status"] == "PASS"

# ---------------- R02 ----------------

def test_ssh_exposed_to_any():
    config = {
        "management": {
            "ssh_enabled": True,
            "allowed_management_sources": ["ANY"]
        }
    }

    result = check_ssh_exposure(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"


def test_ssh_restricted():
    config = {
        "management": {
            "ssh_enabled": True,
            "allowed_management_sources": ["ADMIN_NETWORK"]
        }
    }

    result = check_ssh_exposure(config)

    assert result["status"] == "PASS"

# ---------------- R03 ----------------

def test_any_to_any_allow():
    config = {
        "firewall_rules": [
            {
                "source": ["ANY"],
                "destination": ["ANY"],
                "ports": ["ANY"],
                "action": "ALLOW"
            }
        ]
    }

    result = check_any_to_any(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "CRITICAL"


def test_restricted_allow_rule():
    config = {
        "firewall_rules": [
            {
                "source": ["INTERNAL_NETWORK"],
                "destination": ["WEB_SERVER"],
                "ports": [443],
                "action": "ALLOW"
            }
        ]
    }

    result = check_any_to_any(config)

    assert result["status"] == "PASS"
    
# ---------------- R04 ----------------

def test_database_exposed_to_any():
    config = {
        "firewall_rules": [
            {
                "source": ["ANY"],
                "destination": ["DATABASE"],
                "ports": [5432],
                "action": "ALLOW"
            }
        ]
    }

    result = check_broad_access(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"


def test_database_restricted_to_app_server():
    config = {
        "firewall_rules": [
            {
                "source": ["APP_SERVER"],
                "destination": ["DATABASE"],
                "ports": [5432],
                "action": "ALLOW"
            }
        ]
    }

    result = check_broad_access(config)

    assert result["status"] == "PASS"
    
# ---------------- R05 ----------------

def test_firewall_logging_disabled():
    config = {
        "logging": {
            "firewall_logging_enabled": False,
            "firewall_logging_required": True
        }
    }

    result = check_firewall_logging(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "MEDIUM"


def test_firewall_logging_enabled():
    config = {
        "logging": {
            "firewall_logging_enabled": True,
            "firewall_logging_required": True
        }
    }

    result = check_firewall_logging(config)

    assert result["status"] == "PASS"

# ---------------- R06 ----------------

def test_http_without_https():
    config = {
        "management": {
            "http_management_enabled": True,
            "https_management_enabled": False
        }
    }

    result = check_insecure_management(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"


def test_https_management():
    config = {
        "management": {
            "http_management_enabled": False,
            "https_management_enabled": True
        }
    }

    result = check_insecure_management(config)

    assert result["status"] == "PASS"

# ---------------- R07 ----------------

def test_weak_ssh_password_authentication():
    config = {
        "ssh": {
            "password_authentication": True,
            "key_authentication_required": True
        }
    }

    result = check_weak_ssh(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"


def test_secure_ssh_key_authentication():
    config = {
        "ssh": {
            "password_authentication": False,
            "key_authentication_required": True
        }
    }

    result = check_weak_ssh(config)

    assert result["status"] == "PASS"
    
# ---------------- R08 ----------------

def test_default_credentials_enabled():
    config = {
        "credentials": {
            "default_credentials_enabled": True
        }
    }

    result = check_default_credentials(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "CRITICAL"


def test_default_credentials_disabled():
    config = {
        "credentials": {
            "default_credentials_enabled": False
        }
    }

    result = check_default_credentials(config)

    assert result["status"] == "PASS"

# ---------------- R09 ----------------

def test_unencrypted_management_protocols():
    config = {
        "management": {
            "telnet_enabled": True,
            "http_management_enabled": False,
            "ftp_management_enabled": False
        }
    }

    result = check_unencrypted_management(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"
    assert "Telnet" in result["message"]


def test_secure_management():
    config = {
        "management": {
            "telnet_enabled": False,
            "http_management_enabled": False,
            "ftp_management_enabled": False
        }
    }

    result = check_unencrypted_management(config)

    assert result["status"] == "PASS"

# ---------------- R10 ----------------

def test_central_logging_missing():
    config = {
        "logging": {
            "central_logging_required": True,
            "central_logging_enabled": False
        }
    }

    result = check_missing_logging(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "MEDIUM"


def test_central_logging_enabled():
    config = {
        "logging": {
            "central_logging_required": True,
            "central_logging_enabled": True
        }
    }

    result = check_missing_logging(config)

    assert result["status"] == "PASS"

# ---------------- R11 ----------------

def test_weak_encryption_detected():
    config = {
        "encryption": {
            "enabled_algorithms": ["AES-256", "3DES"]
        }
    }

    result = check_weak_encryption(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"
    assert "3DES" in result["message"]


def test_strong_encryption():
    config = {
        "encryption": {
            "enabled_algorithms": ["AES-256", "AES-128"]
        }
    }

    result = check_weak_encryption(config)

    assert result["status"] == "PASS"

# ---------------- R12 ----------------

def test_unrestricted_admin_access():
    config = {
        "admin_access": {
            "allowed_sources": ["ANY"]
        }
    }

    result = check_admin_access(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "CRITICAL"


def test_restricted_admin_access():
    config = {
        "admin_access": {
            "allowed_sources": ["10.0.0.0/24"]
        }
    }

    result = check_admin_access(config)

    assert result["status"] == "PASS"

# ---------------- R13 ----------------

def test_missing_audit_logging():
    config = {
        "logging": {
            "authentication_logging": True,
            "configuration_change_logging": False,
            "security_event_logging": True
        }
    }

    result = check_audit_logging(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"
    assert "configuration_changes" in result["message"]


def test_complete_audit_logging():
    config = {
        "logging": {
            "authentication_logging": True,
            "configuration_change_logging": True,
            "security_event_logging": True
        }
    }

    result = check_audit_logging(config)

    assert result["status"] == "PASS"

# ---------------- R14 ----------------

def test_firewall_rule_conflict():
    config = {
        "firewall_rules": [
            {
                "id": "R1",
                "action": "DENY",
                "source": "INTERNET",
                "destination": "SERVER"
            },
            {
                "id": "R2",
                "action": "ALLOW",
                "source": "ANY",
                "destination": "ANY"
            }
        ]
    }

    result = check_rule_conflicts(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "CRITICAL"
    assert len(result["conflicts"]) == 1


def test_no_firewall_rule_conflict():
    config = {
        "firewall_rules": [
            {
                "id": "R1",
                "action": "DENY",
                "source": "INTERNET",
                "destination": "SERVER"
            },
            {
                "id": "R2",
                "action": "ALLOW",
                "source": "TRUSTED_NETWORK",
                "destination": "SERVER"
            }
        ]
    }

    result = check_rule_conflicts(config)

    assert result["status"] == "PASS"

# ---------------- R15 ----------------

def test_baseline_deviation():

    config = {
        "management": {
            "telnet_enabled": True,
            "ssh_enabled": True,
        },
        "logging": {
            "central_logging_enabled": False,
        },
        "encryption": {
            "enabled_algorithms": ["DES"],
        },
    }

    result = check_security_baseline(config)

    assert result["status"] == "FAIL"
    assert result["severity"] == "HIGH"
    assert result["compliance_percentage"] == 25.0
    assert len(result["details"]) == 3


def test_baseline_compliant():

    config = {
        "management": {
            "telnet_enabled": False,
            "ssh_enabled": True,
        },
        "logging": {
            "central_logging_enabled": True,
        },
        "encryption": {
            "enabled_algorithms": ["AES-256"],
        },
    }

    result = check_security_baseline(config)

    assert result["status"] == "PASS"
    assert result["severity"] == "HIGH"
    assert result["compliance_percentage"] == 100.0
    assert result["details"] == []
