from typing import List, Dict, Any

class ChartGenerator:

    @staticmethod
    def severity_distribution(findings: List[Dict[str, Any]]):
        critical = sum(1 for f in findings if f["severity"] == "CRITICAL")
        high = sum(1 for f in findings if f["severity"] == "HIGH")
        medium = sum(1 for f in findings if f["severity"] == "MEDIUM")
        low = sum(1 for f in findings if f["severity"] == "LOW")

        return {
            "labels": ["Critical", "High", "Medium", "Low"],
            "values": [critical, high, medium, low],
        }

    @staticmethod
    def compliance_status(findings: List[Dict[str, Any]]):
        passed = sum(1 for f in findings if f["status"] == "PASS")
        failed = sum(1 for f in findings if f["status"] == "FAIL")

        return {
            "labels": ["Pass", "Fail"],
            "values": [passed, failed],
        }

    @staticmethod
    def attack_surface(device: Dict[str, Any]):
        interfaces = len(device.get("interfaces", []))
        services = len(
            [s for s in device.get("services", []) if s.get("enabled")]
        )
        vlans = len(
            {
                i.get("vlan")
                for i in device.get("interfaces", [])
                if i.get("vlan")
            }
        )

        return {
            "interfaces": interfaces,
            "services": services,
            "vlans": vlans,
        }

    @staticmethod
    def executive_metrics(device, findings, risk):
        return {
            "hostname": device.get("hostname"),
            "vendor": device.get("vendor"),
            "device_type": device.get("device_type"),
            "security_score": risk.get("score", 0),
            "grade": risk.get("grade", "N/A"),
            "critical": risk.get("critical", 0),
            "high": risk.get("high", 0),
            "medium": risk.get("medium", 0),
            "low": risk.get("low", 0),
            "total_findings": len(findings),
        }
