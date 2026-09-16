from pydantic import BaseModel
from typing import Optional

class Finding(BaseModel):
    id: str

    title: str

    severity: str

    category: str

    description: str

    remediation: str

    affected_device: str

    affected_interface: Optional[str] = None

    evidence: Optional[str] = None

    cve: Optional[str] = None

    cvss_score: Optional[float] = None

    risk_points: int = 0

    status: str = "Open"
