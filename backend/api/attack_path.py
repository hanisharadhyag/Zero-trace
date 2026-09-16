from fastapi import APIRouter

from engine.attack_graph import AttackGraphEngine
from .upload import (
    get_current_device,
    get_current_findings,
)

router = APIRouter()

graph = AttackGraphEngine()


@router.get("/attack-path")
def attack_path():
    """
    Return the current network topology and calculated attack path.
    """

    device = get_current_device()
    findings = get_current_findings()

    if device is None:
        return {
            "success": False,
            "message": "No configuration has been scanned yet.",
            "topology": {
                "nodes": [],
                "edges": []
            },
            "attack_path": []
        }

    return {
        "success": True,
        "topology": graph.build(device),
        "attack_path": graph.attack_path(findings)
    }
