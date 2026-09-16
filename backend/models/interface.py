from pydantic import BaseModel
from typing import Optional

class Interface(BaseModel):
    name: str

    ip_address: Optional[str] = None
    subnet_mask: Optional[str] = None

    vlan: Optional[int] = None

    status: str = "down"

    description: Optional[str] = None

    bandwidth: Optional[int] = None

    zone: Optional[str] = None
