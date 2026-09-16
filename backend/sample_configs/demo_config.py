"""
Demo Configuration for SIH6155 Security Auditor.
Provides a realistic multi-vendor network configuration containing intentional security flaws for testing.
"""

config = {
    "device": {
        "hostname": "EDGE-ROUTER-01",
        "vendor": "Cisco",
        "model": "ISR4451",
        "os_version": "17.3.4"
    },

    "management": {
        "telnet_enabled": True,  # R01 FAIL, R09 FAIL
        "ssh_enabled": True,
        "ssh_port": 22,
        "http_management_enabled": True,  # R06 FAIL, R09 FAIL
        "https_management_enabled": False, # R06 FAIL
        "ftp_management_enabled": False,
        "allowed_management_sources": ["ANY"]  # R02 FAIL
    },

    "ssh": {
        "password_authentication": True,  # R07 FAIL
        "key_authentication_required": True
    },

    "credentials": {
        "default_credentials_enabled": True  # R08 FAIL
    },

    "admin_access": {
        "allowed_sources": ["ANY"]  # R12 FAIL
    },

    "firewall_rules": [
        {
            "id": "RULE-01",
            "action": "DENY",
            "source": "INTERNET",
            "destination": "INTERNAL_SERVER",
            "protocol": ["TCP"],
            "ports": ["22"],
            "logging_enabled": False,
            "position": 1
        },
        {
            "id": "RULE-02",
            "action": "ALLOW",
            "source": "ANY",
            "destination": "ANY",
            "protocol": ["ANY"],
            "ports": ["ANY"],
            "logging_enabled": False,
            "position": 2
        }  # R03 FAIL (ANY-to-ANY), R04 FAIL (broad access to INTERNAL_SERVER), R14 FAIL (conflict with RULE-01)
    ],

    "logging": {
        "enabled": False,
        "firewall_logging_enabled": False,  # R05 FAIL
        "firewall_logging_required": True,
        "central_logging_enabled": False,   # R10 FAIL
        "central_logging_required": True,
        "log_server": "",
        "authentication_logging": False,    # R13 FAIL
        "configuration_change_logging": True,
        "security_event_logging": True
    },

    "encryption": {
        "tls_enabled": True,
        "tls_versions": ["TLSv1.0"],
        "enabled_algorithms": ["DES", "3DES", "AES-128-CBC"],  # R11 FAIL
        "weak_ciphers": ["DES", "3DES"]
    },

    # Top-level baseline flags for R15 baseline rule
    "telnet_enabled": True,     # R15 baseline deviation
    "ssh_enabled": True,
    "logging_enabled": False,   # R15 baseline deviation
    "strong_encryption": False  # R15 baseline deviation
}