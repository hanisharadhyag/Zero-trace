import xml.etree.ElementTree as ET

try:
    from models import Device, Interface, Service, ACLRule
except ImportError:
    from backend.models import Device, Interface, Service, ACLRule


class PaloAltoParser:

    def parse(self, xml_text: str):

        try:
            root = ET.fromstring(xml_text)
        except Exception:
            root = ET.fromstring(f"<root>{xml_text}</root>")

        return Device(
            hostname=self._hostname(root),
            vendor="PaloAlto",
            device_type="Firewall",

            interfaces=self._interfaces(root),
            services=self._services(root),
            acl_rules=self._policies(root),

            ssh_enabled=self._ssh_enabled(root),
            http_enabled=self._http_enabled(root),
            https_enabled=self._https_enabled(root),
            logging_enabled=self._logging_enabled(root),

            raw_config=xml_text
        )

    def _hostname(self, root):
        node = root.find(".//hostname")
        return node.text if node is not None else "PA-Firewall"

    def _ssh_enabled(self, root):
        return root.find(".//ssh") is not None

    def _http_enabled(self, root):
        return root.find(".//http") is not None

    def _https_enabled(self, root):
        return root.find(".//https") is not None

    def _logging_enabled(self, root):
        return root.find(".//log-settings") is not None

    def _interfaces(self, root):

        interfaces = []

        for iface in root.findall(".//interface"):

            interfaces.append(
                Interface(
                    name=iface.get("name"),
                    status="up"
                )
            )

        return interfaces

    def _services(self, root):

        return [
            Service(name="SSH", port=22, enabled=self._ssh_enabled(root), secure=True),
            Service(name="HTTP", port=80, enabled=self._http_enabled(root), secure=False),
            Service(name="HTTPS", port=443, enabled=self._https_enabled(root), secure=True),
        ]

    def _policies(self, root):

        rules = []

        for idx, rule in enumerate(root.findall(".//security/rules/entry")):

            rules.append(
                ACLRule(
                    rule_id=str(idx + 1),
                    action=rule.findtext("action", default="allow"),
                    protocol="any",
                    source="any",
                    destination="any"
                )
            )

        return rules
