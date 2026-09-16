# backend/schemas/__init__.py

from .device_schema import DeviceSchema
from .finding_schema import Finding
from .risk_schema import RiskSchema

__all__ = [
    "DeviceSchema",
    "Finding",
    "RiskSchema",
]
