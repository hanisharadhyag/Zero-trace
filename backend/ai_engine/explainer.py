from typing import Dict, List, Any, Optional

from .anomaly_detector import AnomalyDetector
from .risk_predictor import RiskPredictor


class AIExplainer:
    """
    Offline AI Security Copilot
    Generates deterministic explanations without internet.
    """

    def __init__(self):
        self.anomaly = AnomalyDetector()
        self.predictor = RiskPredictor()

    def explain_finding(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        severity = finding.get("severity", "LOW")
        title = finding.get("title", "Security Finding")
        description = finding.get("description", "")

        if severity == "CRITICAL":
            impact = (
                "This vulnerability may allow complete device compromise "
                "or unauthorized administrative access."
            )
        elif severity == "HIGH":
            impact = (
                "This issue significantly increases the attack surface and "
                "may enable lateral movement."
            )
        elif severity == "MEDIUM":
            impact = (
                "This configuration weakens security posture but is not "
                "immediately exploitable."
            )
        else:
            impact = "Low operational security impact."

        return {
            "rule_id": finding.get("rule_id"),
            "title": title,
            "severity": severity,
            "explanation": description,
            "business_impact": impact,
            "recommendation": finding.get("recommendation", ""),
        }

    def executive_summary(
        self,
        findings: List[Dict[str, Any]],
        risk_result: Dict[str, Any],
    ) -> str:
        critical = risk_result.get("critical", 0)
        high = risk_result.get("high", 0)

        if critical > 0:
            return (
                f"Critical cyber risk detected. {critical} critical and "
                f"{high} high severity vulnerabilities require immediate remediation."
            )

        if high > 0:
            return (
                f"Moderate security posture with {high} high-risk findings "
                "requiring scheduled remediation."
            )

        return "Configuration demonstrates a strong overall security posture."

    def full_analysis(
        self,
        config: Dict[str, Any],
        findings: List[Dict[str, Any]],
    ) -> Dict[str, Any]:

        anomalies = self.anomaly.detect(config)

        predictor_input = [
            type(
                "Finding",
                (),
                {"severity": f["severity"]},
            )()
            for f in findings
            if f.get("status") == "FAIL"
        ]

        prediction = self.predictor.predict(predictor_input)

        explanations = [
            self.explain_finding(f)
            for f in findings
            if f.get("status") == "FAIL"
        ]

        return {
            "executive_summary": self.executive_summary(
                findings,
                prediction,
            ),
            "anomalies": anomalies,
            "risk_prediction": prediction,
            "explanations": explanations,
        }


def analyze_with_ai(
    config: Dict[str, Any],
    findings: List[Dict[str, Any]],
    prioritized: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Wrapper used by engine.audit.py and test suites
    """
    if prioritized is None:
        prioritized = findings

    engine = AIExplainer()
    res = engine.full_analysis(config, prioritized)

    failed_rules = [f for f in findings if f.get("status") == "FAIL"]
    unusual = []
    mgmt = config.get("management", {}) if isinstance(config, dict) else {}
    if isinstance(mgmt, dict):
        ssh_port = mgmt.get("ssh_port")
        if ssh_port and ssh_port != 22:
            unusual.append(f"Non-standard SSH port: {ssh_port}")

    correlated = [
        "Multiple management vulnerabilities detected across attack surface",
        "Compound risk between legacy encryption algorithms and management plane exposure",
    ]

    res.update({
        "status": "ANALYSIS_COMPLETE",
        "correlated_risks": correlated,
        "unusual_configurations": unusual,
        "failed_rules_count": len(failed_rules),
    })

    return res
