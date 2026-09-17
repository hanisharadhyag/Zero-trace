"""
Zero Trust File Access & Audit Router
Zero-Trace Network Security Auditor
"""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response

from database import DatabaseManager
from security.auth import get_current_user
from security.rbac import can_access_file, has_permission
from security.sanitizer import sanitize_config
from services.integrity_service import verify_file_integrity
from services.audit_service import log_audit_event, get_project_audit_logs

router = APIRouter(prefix="/zero-trust", tags=["Zero Trust File Access"])

@router.get("/status")
def get_security_status(current_user=Depends(get_current_user)):
    """
    Dashboard Security Status Panel metadata.
    """
    return {
        "sensitivity": "Confidential",
        "access": "Protected (Zero Trust)",
        "integrity": "SHA-256 Verified",
        "secrets": "Masked (Sanitized)",
        "audit_logging": "Enabled & Persisted",
        "current_user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "project_id": current_user.project_id,
        }
    }

@router.get("/audit")
def get_audit_trail(
    limit: int = 50,
    current_user=Depends(get_current_user)
):
    """Retrieve audit log stream for the user's isolated project."""
    # Check if user has audit or view permission
    if not has_permission(current_user, "audit") and not has_permission(current_user, "view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role not authorized to view audit logs.",
        )

    logs = get_project_audit_logs(current_user.project_id, limit=limit)
    return logs

@router.get("/files")
def list_project_files(current_user=Depends(get_current_user)):
    """List all configuration files in current project."""
    if not has_permission(current_user, "view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role not authorized to list files.",
        )

    db_mgr = DatabaseManager()
    files = db_mgr.get_config_files_by_project(current_user.project_id)

    return [
        {
            "id": f.id,
            "device_hostname": f.device_hostname,
            "vendor": f.vendor,
            "version_label": f.version_label,
            "sha256_hash": f.sha256_hash[:12] + "...",
            "uploaded_by": f.uploaded_by_username,
            "created_at": f.created_at.isoformat(),
        }
        for f in files
    ]

@router.get("/files/{file_id}/view")
def view_sanitized_config(
    file_id: int,
    current_user=Depends(get_current_user)
):
    """
    Zero Trust View File Endpoint.
    Verifies auth, project isolation, role permission, and SHA-256 file integrity.
    Masks passwords and secrets before returning.
    """
    db_mgr = DatabaseManager()
    file_rec = db_mgr.get_config_file(file_id)

    # 1. Zero Trust Authorization Check
    allowed, status_code, reason = can_access_file(current_user, file_rec, "view")
    if not allowed:
        log_audit_event(
            user_id=current_user.id,
            username=current_user.username,
            project_id=current_user.project_id,
            file_id=file_id,
            action="view_file",
            result="DENIED",
            reason=reason,
        )
        raise HTTPException(status_code=status_code, detail=reason)

    # 2. File Integrity Check (SHA-256)
    valid, actual_hash, err_msg = verify_file_integrity(file_rec)
    if not valid:
        log_audit_event(
            user_id=current_user.id,
            username=current_user.username,
            project_id=current_user.project_id,
            file_id=file_rec.id,
            action="integrity_mismatch",
            result="ERROR",
            reason=err_msg,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"File integrity mismatch: {err_msg}",
        )

    # 3. Read & Sanitize Sensitive Data
    raw_text = Path(file_rec.file_path).read_text(encoding="utf-8", errors="ignore")
    sanitized_text = sanitize_config(raw_text)

    # 4. Log Audit Event
    log_audit_event(
        user_id=current_user.id,
        username=current_user.username,
        project_id=current_user.project_id,
        file_id=file_rec.id,
        action="view_file",
        result="ALLOWED",
        reason=f"Viewed sanitized config for {file_rec.device_hostname} ({file_rec.version_label})",
    )

    return {
        "file_id": file_rec.id,
        "device_hostname": file_rec.device_hostname,
        "vendor": file_rec.vendor,
        "version_label": file_rec.version_label,
        "sha256_hash": file_rec.sha256_hash,
        "sanitized_config": sanitized_text,
    }

@router.get("/files/{file_id}/download")
def download_raw_config(
    file_id: int,
    current_user=Depends(get_current_user)
):
    """
    Zero Trust Protected Download Endpoint.
    Requires Admin or Security Analyst role + project membership + verified integrity.
    """
    db_mgr = DatabaseManager()
    file_rec = db_mgr.get_config_file(file_id)

    # 1. Zero Trust Authorization Check
    allowed, status_code, reason = can_access_file(current_user, file_rec, "download")
    if not allowed:
        log_audit_event(
            user_id=current_user.id,
            username=current_user.username,
            project_id=current_user.project_id,
            file_id=file_id,
            action="download_file",
            result="DENIED",
            reason=reason,
        )
        raise HTTPException(status_code=status_code, detail=reason)

    # 2. Integrity Verification
    valid, _, err_msg = verify_file_integrity(file_rec)
    if not valid:
        log_audit_event(
            user_id=current_user.id,
            username=current_user.username,
            project_id=current_user.project_id,
            file_id=file_rec.id,
            action="integrity_mismatch",
            result="ERROR",
            reason=err_msg,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"File integrity mismatch: {err_msg}",
        )

    # 3. Log Audit Event
    log_audit_event(
        user_id=current_user.id,
        username=current_user.username,
        project_id=current_user.project_id,
        file_id=file_rec.id,
        action="download_file",
        result="ALLOWED",
        reason=f"Downloaded raw configuration file for {file_rec.device_hostname}",
    )

    file_path = Path(file_rec.file_path)
    filename = f"{file_rec.device_hostname}_{file_rec.version_label}.conf"

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )

@router.delete("/files/{file_id}")
def delete_config_file(
    file_id: int,
    current_user=Depends(get_current_user)
):
    """
    Zero Trust Delete Endpoint.
    Requires Admin role + project membership.
    """
    db_mgr = DatabaseManager()
    file_rec = db_mgr.get_config_file(file_id)

    allowed, status_code, reason = can_access_file(current_user, file_rec, "delete")
    if not allowed:
        log_audit_event(
            user_id=current_user.id,
            username=current_user.username,
            project_id=current_user.project_id,
            file_id=file_id,
            action="delete_file",
            result="DENIED",
            reason=reason,
        )
        raise HTTPException(status_code=status_code, detail=reason)

    # Delete disk file safely if exists
    try:
        p = Path(file_rec.file_path)
        if p.exists():
            p.unlink()
    except Exception as e:
        pass

    # Delete database record
    db_mgr.delete_config_file(file_id)

    log_audit_event(
        user_id=current_user.id,
        username=current_user.username,
        project_id=current_user.project_id,
        file_id=file_id,
        action="delete_file",
        result="ALLOWED",
        reason=f"Deleted file {file_rec.device_hostname} ({file_rec.version_label})",
    )

    return {"success": True, "message": f"File {file_id} deleted successfully"}
