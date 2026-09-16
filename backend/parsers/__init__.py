from .cisco_parser import CiscoParser
from .fortinet_parser import FortinetParser
from .paloalto_parser import PaloAltoParser


def parse_config(file_path: str, vendor: str):
    vendor = vendor.lower().strip()

    if vendor == "cisco":
        return CiscoParser().parse(file_path)

    elif vendor == "fortinet":
        return FortinetParser().parse(file_path)

    elif vendor in ["paloalto", "palo_alto", "palo alto"]:
        return PaloAltoParser().parse(file_path)

    else:
        raise ValueError(f"Unsupported vendor: {vendor}")
