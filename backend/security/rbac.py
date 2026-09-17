"""
Role-Based Access Control (RBAC) & Project Isolation Layer
Zero-Trace Network Security Auditor
"""

from typing import Tuple
from database import UserModel, ConfigFileModel

# Permitted actions per role
ROLE_PERMISSIONS = {
    "Admin": {
        "upload", "view", "analyze", "compare", "download", "delete", "audit", "view_raw", "view_history"
    },
    "Security Analyst": {
        "upload", "view", "analyze", "compare", "view_history"
    },
    "Viewer": {
        "view", "audit" # Reports and posture overview only
    },
    "Guest": set() # No access to actions
}


def has_permission(user: UserModel, action: str) -> bool:
    """Check if the user's role grants permission for the given action."""
    if not user or not user.role:
        return False
    user_perms = ROLE_PERMISSIONS.get(user.role, set())
    return action in user_perms


def can_access_file(user: UserModel, file: ConfigFileModel, action: str) -> Tuple[bool, int, str]:
    """
    Zero Trust access verification for configuration files.
    Returns: (allowed: bool, http_status_code: int, reason: str)
    
    Checks:
    1. Authenticated user (user is not None)
    2. Valid session / user role permission
    3. Project isolation (user.project_id == file.project_id)
    4. File existence
    """
    if not user:
        return False, 401, "Unauthenticated user"

    if not file:
        return False, 404, "File not found"

    # Enforce Project Isolation FIRST
    if user.project_id != file.project_id:
        # Return 404 to avoid leaking existence of files in other projects
        return False, 404, "File not found or access denied"

    # Enforce RBAC Role Permission
    if not has_permission(user, action):
        return False, 403, f"Role '{user.role}' is not authorized to perform action '{action}'"

    return True, 200, "Access granted"
