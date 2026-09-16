class RiskScoreEngine:
    """
    Enterprise Cyber Risk Scoring Engine
    """

    WEIGHTS = {
        "CRITICAL": 25,
        "HIGH": 15,
        "MEDIUM": 8,
        "LOW": 3,
    }

    def calculate(self, findings):
        total_rules = len(findings)
        
        # Check if findings contain status field (e.g. PASS/FAIL rule results)
        has_status = any("status" in f for f in findings) if findings else False
        
        if has_status:
            passed = sum(1 for f in findings if f.get("status") == "PASS")
            failed_items = [f for f in findings if f.get("status") == "FAIL"]
            failed = len(failed_items)
        else:
            passed = 0
            failed_items = findings
            failed = len(findings)

        critical = sum(1 for f in failed_items if str(f.get("severity", "")).upper() == "CRITICAL")
        high = sum(1 for f in failed_items if str(f.get("severity", "")).upper() == "HIGH")
        medium = sum(1 for f in failed_items if str(f.get("severity", "")).upper() == "MEDIUM")
        low = sum(1 for f in failed_items if str(f.get("severity", "")).upper() == "LOW")

        penalty = (
            critical * self.WEIGHTS["CRITICAL"] +
            high * self.WEIGHTS["HIGH"] +
            medium * self.WEIGHTS["MEDIUM"] +
            low * self.WEIGHTS["LOW"]
        )

        score = float(max(0, min(100, 100 - penalty)))

        # Executive grades
        if score >= 90:
            grade = "A"
        elif score >= 75:
            grade = "B"
        elif score >= 60:
            grade = "C"
        elif score >= 50:
            grade = "D"
        else:
            grade = "F"

        # Risk level
        if score >= 85:
            risk_level = "LOW"
        elif score >= 70:
            risk_level = "MEDIUM"
        elif score >= 50:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        confidence = max(
            60,
            min(99, 95 - (critical * 2) - (high * 1))
        )

        return {
            "score": score,
            "grade": grade,
            "risk_level": risk_level,
            "confidence": confidence,
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
            "passed": passed,
            "failed": failed,
            "total_rules": total_rules,
            "total_findings": failed,
        }


def calculate_security_score(findings):
    """
    Wrapper used by audit.py and tests
    """
    return RiskScoreEngine().calculate(findings)
