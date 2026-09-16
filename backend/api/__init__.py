from .upload import router as upload_router
from .devices import router as device_router
from .findings import router as findings_router
from .risk import router as risk_router
from .attack_path import router as attack_router
from .copilot import router as copilot_router
from .report import router as report_router

__all__ = [
    "upload_router",
    "device_router",
    "findings_router",
    "risk_router",
    "attack_router",
    "copilot_router",
    "report_router",
]
