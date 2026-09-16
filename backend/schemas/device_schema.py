from pydantic import BaseModel, Field
from typing import List, Optional


class InterfaceSchema(BaseModel):
    name: str
    ip_address: Optional[str] = None
    subnet_mask: Optional[str] = None
    vlan: Optional[int] = None
    status: str
    description: Optional[str] = None
    zone: Optional[str] = None


class DeviceSchema(BaseModel):
    hostname: str
    vendor: str
    device_type: str

    model: Optional[str] = None
    os_version: Optional[str] = None
    management_ip: Optional[str] = None

    ssh_enabled: bool = False
    telnet_enabled: bool = False
    logging_enabled: bool = False

    interfaces: List[InterfaceSchema] = []


class UploadResponseSchema(BaseModel):
    status: str = "success"

    hostname: str
    vendor: str

    interfaces: int
    findings: int

    scan_id: str
    message: str
