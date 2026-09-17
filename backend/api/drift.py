"""
Configuration Drift Detection Router
Zero-Trace Network Security Auditor
"""

from typing import Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from database import DatabaseManager
from security.auth import get_current_user
from security.rbac import can_access_file, has_permission
from services.integrity_service import verify_file_integrity
from services.audit_service import log_audit_event
from services.drift_service import compare_configurations

router = APIRouter(prefix="/drift", tags=["Configuration Drift"])

class CompareRequest(BaseModel):
    old_file_id: Optional[int] = None
    new_file_id: Optional[int] = None
    old_config: Optional[str] = None
    new_config: Optional[str] = None
    vendor: str = "Cisco"
    device_id: str = "Router-01"
    old_version_label: str = "v1"
    new_version_label: str = "v2"

@router.post("/compare")
def compare_drift(
    request: CompareRequest,
    current_user=Depends(get_current_user)
):
    """
    Zero Trust-Protected Configuration Drift Comparison API.
    Verifies authentication, RBAC compare permission, project isolation, and SHA-256 integrity.
    """
    db_mgr = DatabaseManager()

    # Check baseline compare permission
    if not has_permission(current_user, "compare"):
        log_audit_event(
            user_id=current_user.id,
            username=current_user.username,
            project_id=current_user.project_id,
            action="drift_compare",
            result="DENIED",
            reason=f"Role '{current_user.role}' lacks 'compare' permission",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{current_user.role}' is not authorized to compare configurations.",
        )

    old_text = request.old_config
    new_text = request.new_config
    vendor = request.vendor
    device_id = request.device_id
    old_ver = request.old_version_label
    new_ver = request.new_version_label

    # If file IDs are provided, run full Zero Trust checks on stored files
    if request.old_file_id and request.new_file_id:
        old_file = db_mgr.get_config_file(request.old_file_id)
        new_file = db_mgr.get_config_file(request.new_file_id)

        # 1. Zero Trust File Access Check - Old File
        allowed, status_code, reason = can_access_file(current_user, old_file, "compare")
        if not allowed:
            log_audit_event(
                user_id=current_user.id,
                username=current_user.username,
                project_id=current_user.project_id,
                file_id=request.old_file_id,
                action="drift_compare",
                result="DENIED",
                reason=f"Old file check failed: {reason}",
            )
            raise HTTPException(status_code=status_code, detail=reason)

        # 2. Zero Trust File Access Check - New File
        allowed, status_code, reason = can_access_file(current_user, new_file, "compare")
        if not allowed:
            log_audit_event(
                user_id=current_user.id,
                username=current_user.username,
                project_id=current_user.project_id,
                file_id=request.new_file_id,
                action="drift_compare",
                result="DENIED",
                reason=f"New file check failed: {reason}",
            )
            raise HTTPException(status_code=status_code, detail=reason)

        # 3. File Integrity Verification (SHA-256)
        valid_old, _, err_old = verify_file_integrity(old_file)
        if not valid_old:
            log_audit_event(
                user_id=current_user.id,
                username=current_user.username,
                project_id=current_user.project_id,
                file_id=old_file.id,
                action="integrity_check",
                result="ERROR",
                reason=err_old,
            )
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"File integrity mismatch on old version: {err_old}")

        valid_new, _, err_new = verify_file_integrity(new_file)
        if not valid_new:
            log_audit_event(
                user_id=current_user.id,
                username=current_user.username,
                project_id=current_user.project_id,
                file_id=new_file.id,
                action="integrity_check",
                result="ERROR",
                reason=err_new,
            )
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"File integrity mismatch on new version: {err_new}")

        # Read configuration contents from private storage
        old_text = Path(old_file.file_path).read_text(encoding="utf-8", errors="ignore")
        new_text = Path(new_file.file_path).read_text(encoding="utf-8", errors="ignore")
        vendor = new_file.vendor
        device_id = new_file.device_hostname
        old_ver = old_file.version_label
        new_ver = new_file.version_label

    if not old_text or not new_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both old and new configurations must be provided for drift comparison.",
        )

    # 4. Perform Drift Comparison
    result = compare_configurations(
        old_config_raw=old_text,
        new_config_raw=new_text,
        vendor=vendor,
        device_id=device_id,
        old_version_label=old_ver,
        new_version_label=new_ver,
    )

    # 5. Audit Log Event
    log_audit_event(
        user_id=current_user.id,
        username=current_user.username,
        project_id=current_user.project_id,
        action="drift_compare",
        result="ALLOWED",
        reason=f"Compared drift for device {device_id} ({old_ver} -> {new_ver}). Found {result['total_changes']} line changes.",
    )

    return result


@router.get("/versions/{hostname}")
def get_device_versions(
    hostname: str,
    current_user=Depends(get_current_user)
):
    """List all stored configuration versions for a specific device in current project."""
    db_mgr = DatabaseManager()
    files = db_mgr.get_config_files_by_hostname(current_user.project_id, hostname)
    
    return [
        {
            "id": f.id,
            "device_hostname": f.device_hostname,
            "version_label": f.version_label,
            "vendor": f.vendor,
            "uploaded_by": f.uploaded_by_username,
            "created_at": f.created_at.isoformat(),
        }
        for f in files
    ]
