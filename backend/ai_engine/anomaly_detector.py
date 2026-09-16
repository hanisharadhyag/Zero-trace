from typing import List, Any

try:
    from backend.models import Device, Finding
    from backend.utils import generate_id
except ImportError:
    from models import Device, Finding
    from utils import generate_id


def _get(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


class AnomalyDetector:
    """
    AI-inspired anomaly detector.
    Identifies unusual configurations.
    """

    def detect(self, device: Any) -> List[Finding]:
        if not device:
            return []

        anomalies = []
        anomalies.extend(self.detect_many_interfaces(device))
        anomalies.extend(self.detect_multiple_management(device))
        anomalies.extend(self.detect_empty_acl(device))

        return anomalies

    def detect_many_interfaces(self, device: Any):
        results = []
        interfaces = _get(device, "interfaces", []) or []
        hostname = _get(device, "hostname", "Device")

        if len(interfaces) > 48:
            results.append(
                Finding(
                    id=generate_id("AI"),
                    title="Unusually High Interface Count",
                    severity="Medium",
                    category="Anomaly",
                    description="Large number of active interfaces detected.",
                    remediation="Verify interface inventory.",
                    affected_device=hostname,
                    risk_points=8,
                )
            )

        return results

    def detect_multiple_management(self, device: Any):
        results = []
        services = _get(device, "services", []) or []
        hostname = _get(device, "hostname", "Device")

        count = 0
        for service in services:
            enabled = _get(service, "enabled", False)
            if enabled:
                count += 1

        if count >= 4:
            results.append(
                Finding(
                    id=generate_id("AI"),
                    title="Multiple Management Services",
                    severity="High",
                    category="Anomaly",
                    description="Several remote management services are enabled.",
                    remediation="Reduce exposed management protocols.",
                    affected_device=hostname,
                    risk_points=15,
                )
            )

        return results

    def detect_empty_acl(self, device: Any):
        results = []
        device_type = _get(device, "device_type", "Router")
        acl_rules = _get(device, "acl_rules", []) or []
        hostname = _get(device, "hostname", "Device")

        if device_type == "Firewall" and len(acl_rules) == 0:
            results.append(
                Finding(
                    id=generate_id("AI"),
                    title="Firewall Without Policies",
                    severity="Critical",
                    category="Anomaly",
                    description="Firewall contains no ACL or security policies.",
                    remediation="Create default deny security policies.",
                    affected_device=hostname,
                    risk_points=25,
                )
            )

        return results
