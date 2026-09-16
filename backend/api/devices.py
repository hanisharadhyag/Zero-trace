from fastapi import APIRouter, HTTPException
from .upload import get_current_device

router = APIRouter()

# -----------------------------
# Current Device
# -----------------------------
@router.get("/device")
def get_device():
    device = get_current_device()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="No device has been scanned yet."
        )

    return device.model_dump()


# -----------------------------
# Interfaces
# -----------------------------
@router.get("/interfaces")
def get_interfaces():
    device = get_current_device()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="No interfaces available."
        )

    return [iface.model_dump() for iface in device.interfaces]


# -----------------------------
# Services
# -----------------------------
@router.get("/services")
def get_services():
    device = get_current_device()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="No services available."
        )

    return [svc.model_dump() for svc in device.services]


# -----------------------------
# ACL Rules
# -----------------------------
@router.get("/acls")
def get_acls():
    device = get_current_device()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="No ACL rules available."
        )

    return [acl.model_dump() for acl in device.acl_rules]
