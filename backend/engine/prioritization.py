from typing import List, Dict, Any

# Higher number = higher priority
SEVERITY_WEIGHT = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1,
}

# Risk score contribution
RISK_POINTS = {
    "CRITICAL": 25,
    "HIGH": 15,
    "MEDIUM": 8,
    "LOW": 3,
}


def prioritize_risks(findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Rank failed security findings by severity and assign priority.

    Input:
        List of rule results from security_rules.py

    Output:
        Sorted list with priority and risk points added.
    """

    prioritized = []

    for finding in findings:

        # Ignore passed rules
        if finding.get("status") != "FAIL":
            continue

        severity = finding.get("severity", "LOW").upper()

        item = dict(finding)

        item["priority"] = SEVERITY_WEIGHT.get(severity, 1)
        item["risk_points"] = RISK_POINTS.get(severity, 3)

        prioritized.append(item)

    prioritized.sort(
        key=lambda x: (
            x["priority"],
            x["risk_points"]
        ),
        reverse=True
    )

    return prioritized


class RiskPrioritizationEngine:
    """
    Wrapper class used by the audit engine.
    """

    def prioritize(self, findings: List[Dict[str, Any]]):
        return prioritize_risks(findings)
