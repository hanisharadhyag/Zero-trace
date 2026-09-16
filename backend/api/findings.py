from fastapi import APIRouter
from .upload import get_current_scan

router = APIRouter()

@router.get("/findings")
async def get_findings():
    """
    Return all security findings from the latest scan.
    """

    scan = get_current_scan()

    if scan["device"] is None:
        return {
            "success": False,
            "message": "No configuration has been scanned yet.",
            "total": 0,
            "findings": []
        }

    findings = [f.model_dump() for f in scan["findings"]]

    return {
        "success": True,
        "total": len(findings),
        "findings": findings
    }
