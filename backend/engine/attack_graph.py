"""
NetworkX-powered Attack Graph Engine for SIH6155 Security Compliance Auditor.

Analyzes network topology, access control lists (ACLs), exposed services, and security findings
to compute reachable assets, exploit attack paths, critical risk paths, and React Flow graph payloads.

"""

from typing import Dict, List, Any, Optional
import networkx as nx

try:
    from backend.models.device import Device
    from backend.models.finding import Finding
except ImportError:
    from models.device import Device
    from models.finding import Finding


class AttackGraphEngine:

    def __init__(self):
        self.graph = nx.DiGraph()

    # ----------------------------------------------------
    # BUILD REACT TOPOLOGY
    # ----------------------------------------------------

    def build(self, device: Optional[Device]) -> Dict[str, Any]:

        if device is None:
            return {"nodes": [], "edges": []}

        nodes = []
        edges = []

        # INTERNET
        nodes.append({
            "id": "internet",
            "position": {"x": 60, "y": 120},
            "data": {
                "label": "Internet",
                "type": "External",
                "risk": "Low"
            }
        })

        # FIREWALL
        nodes.append({
            "id": "firewall",
            "position": {"x": 200, "y": 120},
            "data": {
                "label": "Firewall",
                "type": "Firewall",
                "risk": "Critical"
            }
        })

        # ROUTER
        router_risk = "Medium"
        if getattr(device, "telnet_enabled", False):
            router_risk = "High"

        nodes.append({
            "id": "router",
            "position": {"x": 340, "y": 120},
            "data": {
                "label": device.hostname,
                "type": device.device_type,
                "risk": router_risk,
                "vendor": device.vendor,
                "os": device.os_version
            }
        })

        # INTERNAL NETWORK
        nodes.append({
            "id": "lan",
            "position": {"x": 500, "y": 120},
            "data": {
                "label": "Internal LAN",
                "type": "Network",
                "risk": "Low"
            }
        })

        # INTERFACES
        interfaces = getattr(device, "interfaces", [])

        for i, iface in enumerate(interfaces):

            iface_id = f"iface_{i}"

            nodes.append({
                "id": iface_id,
                "position": {
                    "x": 340,
                    "y": 230 + (i * 80)
                },
                "data": {
                    "label": iface.name,
                    "type": "Interface",
                    "risk": "Low",
                    "ip": iface.ip_address,
                    "status": iface.status
                }
            })

            edges.append({
                "id": f"router-{iface_id}",
                "source": "router",
                "target": iface_id
            })

        # SERVICES
        services = getattr(device, "services", [])

        for i, svc in enumerate(services):

            if not svc.enabled:
                continue

            service_risk = "Low"

            if svc.name == "Telnet":
                service_risk = "Critical"

            elif svc.name == "HTTP":
                service_risk = "Medium"

            service_id = f"svc_{i}"

            nodes.append({
                "id": service_id,
                "position": {
                    "x": 640,
                    "y": 60 + (i * 70)
                },
                "data": {
                    "label": svc.name,
                    "type": "Service",
                    "risk": service_risk,
                    "port": svc.port
                }
            })

            edges.append({
                "id": f"service-{i}",
                "source": "router",
                "target": service_id
            })

        # MAIN ATTACK EDGES
        edges.extend([
            {
                "id": "e1",
                "source": "internet",
                "target": "firewall"
            },
            {
                "id": "e2",
                "source": "firewall",
                "target": "router"
            },
            {
                "id": "e3",
                "source": "router",
                "target": "lan"
            }
        ])

        return {
            "nodes": nodes,
            "edges": edges
        }

    # ----------------------------------------------------
    # ATTACK PATH
    # ----------------------------------------------------

    def attack_path(self, findings: List[Any]) -> List[Dict[str, Any]]:

        if not findings:
            return []

        severity_order = {
            "Critical": 0,
            "High": 1,
            "Medium": 2,
            "Low": 3
        }

        ordered = sorted(
            findings,
            key=lambda f: severity_order.get(
                getattr(f, "severity", "Low"),
                3
            )
        )

        steps = []

        for i, finding in enumerate(ordered, start=1):

            steps.append({
                "step": i,
                "rule_id": getattr(finding, "id", f"VULN-{i}"),
                "title": finding.title,
                "severity": finding.severity,
                "device": getattr(
                    finding,
                    "affected_device",
                    "Router"
                ),
                "description": finding.description,
                "risk_weight": getattr(
                    finding,
                    "risk_points",
                    10
                )
            })

        return steps

    # ----------------------------------------------------
    # NETWORKX ANALYSIS
    # ----------------------------------------------------

    def analyze_full_attack_graph(
        self,
        device: Optional[Device],
        findings: List[Any]
    ) -> Dict[str, Any]:

        g = nx.DiGraph()

        g.add_node("Internet", type="Threat")
        g.add_node("Firewall", type="Security")

        device_name = device.hostname if device else "Router"

        g.add_node(device_name, type="Router")
        g.add_node("LAN", type="Internal")

        g.add_edge("Internet", "Firewall", weight=10)
        g.add_edge("Firewall", device_name, weight=8)
        g.add_edge(device_name, "LAN", weight=3)

        reachable_assets = ["Firewall", device_name, "LAN"]

        total_risk = 0

        critical_steps = []

        for idx, finding in enumerate(findings):

            sev = finding.severity

            if sev == "Critical":
                weight = 25
            elif sev == "High":
                weight = 15
            elif sev == "Medium":
                weight = 8
            else:
                weight = 3

            total_risk += weight

            critical_steps.append({
                "step": idx + 1,
                "title": finding.title,
                "severity": sev,
                "risk_weight": weight
            })

        try:
            critical_path = nx.shortest_path(
                g,
                "Internet",
                "LAN"
            )
        except Exception:
            critical_path = []

        return {
            "topology": self.build(device),
            "reachable_assets": reachable_assets,
            "critical_path": critical_path,
            "steps": self.attack_path(findings),
            "nodes_count": g.number_of_nodes(),
            "edges_count": g.number_of_edges(),
            "total_risk_weight": total_risk
        }
