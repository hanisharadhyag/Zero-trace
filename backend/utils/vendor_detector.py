def detect_vendor(config: str) -> str:
    config = config.lower()

    if "hostname" in config and "interface" in config:
        return "cisco"

    if "config system interface" in config:
        return "fortinet"

    if "<config>" in config or "<entry" in config:
        return "paloalto"

    return "unknown"
