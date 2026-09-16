"""
Configuration Normalizer for SIH6155 Network Security Compliance Auditor.

Ensures incoming configuration objects comply with the expected normalized
schema while maintaining full backward compatibility with flat or legacy
vendor structures.
"""

from typing import Dict, Any, Optional


def normalize_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes a configuration dictionary to ensure all required nested
    structures and fallback top-level baseline flags exist.

    Args:
        config: Raw or parsed network device configuration dictionary.

    Returns:
        A shallow/deep copy normalized configuration dictionary.
    """
    if not isinstance(config, dict):
        return {}

    norm = dict(config)

    # Management section normalization
    mgmt = dict(norm.get("management", {})) if isinstance(norm.get("management"), dict) else {}
    
    # Check top-level telnet_enabled vs management.telnet_enabled
    if "telnet_enabled" in norm and "telnet_enabled" not in mgmt:
        mgmt["telnet_enabled"] = bool(norm["telnet_enabled"])
    elif "telnet_enabled" in mgmt and "telnet_enabled" not in norm:
        norm["telnet_enabled"] = bool(mgmt["telnet_enabled"])

    # Check top-level ssh_enabled vs management.ssh_enabled
    if "ssh_enabled" in norm and "ssh_enabled" not in mgmt:
        mgmt["ssh_enabled"] = bool(norm["ssh_enabled"])
    elif "ssh_enabled" in mgmt and "ssh_enabled" not in norm:
        norm["ssh_enabled"] = bool(mgmt["ssh_enabled"])

    # Fallbacks for SSH exposed sources
    if "ssh_exposed_to" in norm and "allowed_management_sources" not in mgmt:
        exposed = norm["ssh_exposed_to"]
        mgmt["allowed_management_sources"] = [exposed] if isinstance(exposed, str) else list(exposed)

    # Fallbacks for management protocol
    if "management_protocol" in norm:
        proto = str(norm["management_protocol"]).lower()
        if proto == "telnet":
            mgmt["telnet_enabled"] = True
            norm["telnet_enabled"] = True
        elif proto == "http":
            mgmt["http_management_enabled"] = True
        elif proto == "ftp":
            mgmt["ftp_management_enabled"] = True

    norm["management"] = mgmt

    # Logging section normalization
    logging_cfg = dict(norm.get("logging", {})) if isinstance(norm.get("logging"), dict) else {}
    if "logging_enabled" in norm:
        logging_enabled = bool(norm["logging_enabled"])
        if "firewall_logging_enabled" not in logging_cfg:
            logging_cfg["firewall_logging_enabled"] = logging_enabled
        if "central_logging_enabled" not in logging_cfg:
            logging_cfg["central_logging_enabled"] = logging_enabled
    elif "firewall_logging_enabled" in logging_cfg or "central_logging_enabled" in logging_cfg:
        norm["logging_enabled"] = bool(logging_cfg.get("firewall_logging_enabled", False) or logging_cfg.get("central_logging_enabled", False))

    norm["logging"] = logging_cfg

    # Encryption section normalization
    enc_cfg = dict(norm.get("encryption", {})) if isinstance(norm.get("encryption"), dict) else {}
    if "strong_encryption" in norm and "enabled_algorithms" not in enc_cfg:
        if norm["strong_encryption"]:
            enc_cfg["enabled_algorithms"] = ["AES-256-GCM", "TLSv1.3"]
        else:
            enc_cfg["enabled_algorithms"] = ["DES", "3DES", "RC4"]
    elif "enabled_algorithms" in enc_cfg and "strong_encryption" not in norm:
        weak_set = {"DES", "3DES", "RC4", "MD5"}
        has_weak = any(str(alg).upper() in weak_set for alg in enc_cfg.get("enabled_algorithms", []))
        norm["strong_encryption"] = not has_weak

    norm["encryption"] = enc_cfg

    # SSH section normalization
    ssh_cfg = dict(norm.get("ssh", {})) if isinstance(norm.get("ssh"), dict) else {}
    norm["ssh"] = ssh_cfg

    # Credentials section normalization
    cred_cfg = dict(norm.get("credentials", {})) if isinstance(norm.get("credentials"), dict) else {}
    norm["credentials"] = cred_cfg

    # Admin access section normalization
    admin_cfg = dict(norm.get("admin_access", {})) if isinstance(norm.get("admin_access"), dict) else {}
    norm["admin_access"] = admin_cfg

    # Firewall rules normalization
    fw_rules = norm.get("firewall_rules", [])
    if isinstance(fw_rules, list):
        norm["firewall_rules"] = fw_rules
    else:
        norm["firewall_rules"] = []

    return norm



class ConfigNormalizer:
    """
    High-level configuration normalizer and multi-vendor parser dispatcher.
    Supports auto-detecting vendor, parsing raw configurations into unified Device models,
    or normalizing structured dictionaries.
    """

    def __init__(self):
        try:
            from backend.parsers.cisco_parser import CiscoParser
            from backend.parsers.fortinet_parser import FortinetParser
            from backend.parsers.paloalto_parser import PaloAltoParser
            from backend.models.device import Device
        except ImportError:
            from parsers.cisco_parser import CiscoParser
            from parsers.fortinet_parser import FortinetParser
            from parsers.paloalto_parser import PaloAltoParser
            from models.device import Device

        self.cisco_parser = CiscoParser()
        self.fortinet_parser = FortinetParser()
        self.paloalto_parser = PaloAltoParser()
        self.DeviceClass = Device

    def detect_vendor(self, config_text: str) -> str:
        """
        Auto-detect configuration vendor from syntax signatures.
        """
        text = config_text.strip()
        if text.startswith("<") or "<devices>" in text or "<config" in text:
            return "PaloAlto"
        if "config system" in text or "config firewall" in text or "set hostname" in text:
            return "Fortinet"
        if "hostname" in text or "version " in text or "interface " in text:
            return "Cisco"
        return "Cisco"

    def normalize(self, config_input: Any, vendor: Optional[str] = None) -> Any:
        """
        Normalize input: parses configuration string into unified Device model,
        or normalizes a dictionary.
        """
        if isinstance(config_input, dict):
            return normalize_config(config_input)

        config_str = str(config_input)
        target_vendor = vendor if vendor and vendor.lower() not in ["auto", "detect", ""] else self.detect_vendor(config_str)
        target_vendor_lower = target_vendor.lower()

        if "cisco" in target_vendor_lower:
            return self.cisco_parser.parse(config_str)
        elif "fortinet" in target_vendor_lower or "fortigate" in target_vendor_lower:
            return self.fortinet_parser.parse(config_str)
        elif "palo" in target_vendor_lower or "pan" in target_vendor_lower:
            return self.paloalto_parser.parse(config_str)
        else:
            # Fallback to Cisco parser
            return self.cisco_parser.parse(config_str)

