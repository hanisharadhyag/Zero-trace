from typing import List

try:
    from models import Finding
except ImportError:
    from backend.models import Finding


class RiskPredictor:
    """
    Predict future organizational cyber risk using weighted findings.
    """

    def predict(self, findings: List[Finding]):

        critical = high = medium = low = 0
        score = 0

        for finding in findings:

            sev = finding.severity.upper()

            if sev == "CRITICAL":
                critical += 1
                score += 25

            elif sev == "HIGH":
                high += 1
                score += 15

            elif sev == "MEDIUM":
                medium += 1
                score += 8

            else:
                low += 1
                score += 3

        score = min(score, 100)

        if score >= 80:
            level = "Very High"
            trend = "Immediate likelihood of successful compromise"

        elif score >= 60:
            level = "High"
            trend = "High probability of lateral movement"

        elif score >= 35:
            level = "Medium"
            trend = "Moderate exposure requiring scheduled remediation"

        else:
            level = "Low"
            trend = "Stable security posture"

        return {
            "predicted_risk": level,
            "risk_score": score,
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "risk_trend": trend,
            "recommendation": self.recommend(level)
        }

    def recommend(self, level):

        recommendations = {
            "Very High":
                "Immediately disable insecure management protocols, remove any-to-any firewall rules, rotate credentials, and enable centralized logging.",

            "High":
                "Remediate all critical findings within 24 hours and restrict administrative access to trusted subnets.",

            "Medium":
                "Resolve medium-risk findings during the next maintenance window and verify compliance baselines.",

            "Low":
                "Continue continuous monitoring, periodic rescans, and maintain configuration hygiene."
        }

        return recommendations[level]
