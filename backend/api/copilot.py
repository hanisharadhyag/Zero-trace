from fastapi import APIRouter
from schemas.copilot import CopilotRequest, CopilotResponse
from ai_engine.copilot import copilot

router = APIRouter(prefix="/api", tags=["AI Copilot"])

# Temporary in-memory storage
LATEST_FINDINGS = []
LATEST_DEVICE = {}


def update_context(findings, device):
    """
    Called after every successful scan.
    Stores the latest scan for the AI Copilot.
    """
    global LATEST_FINDINGS, LATEST_DEVICE
    LATEST_FINDINGS = findings
    LATEST_DEVICE = device


@router.post("/copilot", response_model=CopilotResponse)
async def chat(request: CopilotRequest):
    response = copilot.chat(
        question=request.question,
        findings=LATEST_FINDINGS,
        device=LATEST_DEVICE,
    )

    return CopilotResponse(
        answer=response["answer"],
        suggested_commands=response.get("suggested_commands", []),
        references=response.get("references", []),
    )
