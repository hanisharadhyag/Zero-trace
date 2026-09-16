import re
from models.device import Device, Interface, Service

class FortinetParser:

    def parse(self, config: str):

        hostname = "FortiGate"

        h = re.search(r'set hostname "([^"]+)"', config)
        if h:
            hostname = h.group(1)

        interfaces = []

        current = None

        for line in config.splitlines():

            line = line.strip()

            if line.startswith('edit "'):
                if current:
                    interfaces.append(current)

                name = line.split('"')[1]

                current = Interface(
                    name=name,
                    ip_address="",
                    subnet_mask="",
                    vlan=None,
                    status="UP"
                )

            elif current and line.startswith("set ip"):

                parts = line.split()

                current.ip_address = parts[2]
                current.subnet_mask = parts[3]

        if current:
            interfaces.append(current)

        services = [
            Service(
                name="SSH",
                port=22,
                enabled="allowaccess ssh" in config,
                secure=True,
                protocol="TCP"
            ),
            Service(
                name="HTTPS",
                port=443,
                enabled="allowaccess https" in config,
                secure=True,
                protocol="TCP"
            )
        ]

        return Device(
            hostname=hostname,
            vendor="Fortinet",
            device_type="Firewall",
            interfaces=interfaces,
            services=services,
            raw_config=config
        )
