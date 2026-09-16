from pydantic import BaseModel
from typing import Optional

class Service(BaseModel):
    name: str

    port: Optional[int] = None

    enabled: bool = False

    secure: bool = True

    version: Optional[str] = None

    protocol: str = "TCP"
