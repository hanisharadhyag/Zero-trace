"""
Sensitive Data Masking Sanitizer
Zero-Trace Network Security Auditor
"""

import re

# Regex patterns for sensitive network configuration items
SENSITIVE_PATTERNS = [
    # Password lines (e.g. password 7 0822455D0A16, password Secret123)
    (re.compile(r"(password\s+)(\S+)", re.IGNORECASE), r"\1********"),
    # Secret lines (e.g. secret 5 $1$mERr$K.2, secret mySecret)
    (re.compile(r"(secret\s+)(\S+)", re.IGNORECASE), r"\1********"),
    # Enable secret / enable password
    (re.compile(r"(enable\s+(?:secret|password)\s+)(\S+)", re.IGNORECASE), r"\1********"),
    # SNMP community strings (e.g. snmp-server community public RO)
    (re.compile(r"(snmp-server\s+community\s+)(\S+)", re.IGNORECASE), r"\1********"),
    (re.compile(r"(snmp-server\s+host\s+\S+\s+version\s+\S+\s+)(\S+)", re.IGNORECASE), r"\1********"),
    # API tokens or private keys
    (re.compile(r"(bearer\s+token\s+)(\S+)", re.IGNORECASE), r"\1********"),
    (re.compile(r"(api[-_]?key\s+)(\S+)", re.IGNORECASE), r"\1********"),
    (re.compile(r"(pre-shared-key\s+)(\S+)", re.IGNORECASE), r"\1********"),
]

def sanitize_config(config_text: str) -> str:
    """
    Mask sensitive secrets (passwords, enable secrets, SNMP strings, tokens)
    in configuration text for safe UI display and audit preview.
    Does NOT mutate original raw file stored in storage.
    """
    if not config_text:
        return ""
    
    sanitized = config_text
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = pattern.sub(replacement, sanitized)
    
    return sanitized
