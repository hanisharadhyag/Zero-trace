from pydantic import BaseModel
from typing import Optional

class ACLRule(BaseModel):
    rule_id: str

    action: str

    protocol: str

    source: str

    destination: str

    port: Optional[str] = None

    description: Optional[str] = None

    logging_enabled: bool = False

    position: Optional[int] = None
