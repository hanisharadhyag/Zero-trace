import re
from models.device import Device, Interface, Service


class CiscoParser:

    def parse(self, config: str) -> Device:

        hostname = "Unknown"
        interfaces = []
        services = []
        acl_rules = []

        ssh = False
        telnet = False
        snmp = False
        ntp = False
        logging = False
        http = False
        https = False

        # --------------------------------------------------
        # HOSTNAME
        # --------------------------------------------------
        host = re.search(r"hostname\s+([^\n]+)", config)
        if host:
            hostname = host.group(1).strip()

        # --------------------------------------------------
        # INTERFACES
        # --------------------------------------------------
        blocks = re.findall(
            r"interface\s+([^\n]+)(.*?)(?=\ninterface|\Z)",
            config,
            re.S,
        )

        for name, body in blocks:

            ip = None
            subnet = None
            vlan = None
            description = None

            # Default state
            status = "UP"

            # IP address
            ip_match = re.search(
                r"ip address\s+(\S+)\s+(\S+)",
                body,
            )
            if ip_match:
                ip = ip_match.group(1)
                subnet = ip_match.group(2)

            # Description
            desc_match = re.search(
                r"description\s+(.+)",
                body,
            )
            if desc_match:
                description = desc_match.group(1).strip()

            # VLAN
            vlan_match = re.search(
                r"switchport access vlan\s+(\d+)",
                body,
            )
            if vlan_match:
                vlan = int(vlan_match.group(1))

            # IMPORTANT FIX:
            # Match ONLY standalone "shutdown"
            # "no shutdown" remains UP
            if re.search(
                r"^\s*shutdown\s*$",
                body,
                re.MULTILINE,
            ):
                status = "DOWN"

            interfaces.append(
                Interface(
                    name=name.strip(),
                    ip_address=ip,
                    subnet_mask=subnet,
                    vlan=vlan,
                    status=status,
                    description=description,
                )
            )

        # --------------------------------------------------
        # SERVICES
        # --------------------------------------------------
        ssh = "transport input ssh" in config
        telnet = "transport input telnet" in config
        snmp = "snmp-server" in config
        ntp = "ntp server" in config
        logging = bool(re.search(r"logging\s+host", config))
        http = "ip http server" in config
        https = "ip http secure-server" in config

        services.extend([
            Service(
                name="SSH",
                port=22,
                enabled=ssh,
                secure=True,
                protocol="TCP",
            ),
            Service(
                name="Telnet",
                port=23,
                enabled=telnet,
                secure=False,
                protocol="TCP",
            ),
            Service(
                name="HTTP",
                port=80,
                enabled=http,
                secure=False,
                protocol="TCP",
            ),
            Service(
                name="HTTPS",
                port=443,
                enabled=https,
                secure=True,
                protocol="TCP",
            ),
            Service(
                name="SNMP",
                port=161,
                enabled=snmp,
                secure=False,
                protocol="UDP",
            ),
        ])

        # --------------------------------------------------
        # ACL RULES
        # --------------------------------------------------
        acl_rules = re.findall(
            r"access-list\s+(.+)",
            config,
        )

        # --------------------------------------------------
        # RETURN DEVICE
        # --------------------------------------------------
        return Device(
            hostname=hostname,
            vendor="Cisco",
            device_type="Router",
            interfaces=interfaces,
            services=services,
            acl_rules=acl_rules,
            routing_enabled=(
                "router ospf" in config or
                "router rip" in config
            ),
            ssh_enabled=ssh,
            telnet_enabled=telnet,
            snmp_enabled=snmp,
            ntp_enabled=ntp,
            logging_enabled=logging,
            http_enabled=http,
            https_enabled=https,
            raw_config=config,
        )
