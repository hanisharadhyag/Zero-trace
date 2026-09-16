from pydantic import BaseModel, Field
from typing import List, Optional, Union, Any
from .interface import Interface
from .service import Service
from .acl import ACLRule

class Device(BaseModel):
    hostname: str
    vendor: str
    device_type: str

    model: Optional[str] = None
    os_version: Optional[str] = None
    serial_number: Optional[str] = None

    management_ip: Optional[str] = None

    interfaces: List[Interface] = []
    services: List[Service] = []
    acl_rules: List[Union[ACLRule, str, dict, Any]] = []

    routing_enabled: bool = False
    ssh_enabled: bool = False
    telnet_enabled: bool = False

    snmp_enabled: bool = False
    ntp_enabled: bool = False
    logging_enabled: bool = False

    http_enabled: bool = False
    https_enabled: bool = False

    raw_config: Optional[str] = None
