from fastapi import APIRouter
from .upload import get_current_scan

router = APIRouter()

@router.get("/risk-score")
async def get_risk_score():
    """
    Return the calculated security risk score from the latest scan.
    """

    scan = get_current_scan()

    if scan["device"] is None:
        return {
            "success": False,
            "message": "No configuration has been scanned yet.",
            "risk_score": {
                "score": 0,
                "grade": "N/A",
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            }
        }

    # Already calculated by RiskScoreEngine in upload.py
    risk = scan["risk_score"]

    return {
        "success": True,
        "risk_score": risk
    }
