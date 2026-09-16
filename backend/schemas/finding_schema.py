from pydantic import BaseModel
from typing import Optional

class Finding(BaseModel):
    rule_id: str
    title: str
    severity: str
    category: str
    description: str
    evidence: str
    recommendation: str
    cve: Optional[str] = None
    cvss: Optional[float] = None
