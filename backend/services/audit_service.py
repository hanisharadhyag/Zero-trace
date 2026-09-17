"""
Audit Logging Service
Zero-Trace Network Security Auditor
"""

from typing import Optional, List, Dict, Any
from database import DatabaseManager

def log_audit_event(
    user_id: int,
    username: str,
    project_id: int,
    action: str,
    result: str,
    reason: str,
    file_id: Optional[int] = None,
):
    """
    Record structured audit log event.
    Never logs raw passwords, secrets, or raw configurations.
    """
    db_mgr = DatabaseManager()
    db_mgr.save_audit_log(
        user_id=user_id,
        username=username,
        project_id=project_id,
        file_id=file_id,
        action=action,
        result=result,
        reason=reason,
    )

def get_project_audit_logs(project_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve audit logs for a project."""
    db_mgr = DatabaseManager()
    return db_mgr.get_audit_logs(project_id, limit)
