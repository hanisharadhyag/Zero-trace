"""
Authentication Router
Zero-Trace Network Security Auditor
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr

from database import DatabaseManager
from security.auth import hash_password, verify_password, create_access_token, get_current_user
from services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    db_mgr = DatabaseManager()
    user = db_mgr.get_user_by_email(credentials.email)

    if not user:
        log_audit_event(
            user_id=0,
            username=credentials.email,
            project_id=1,
            action="login",
            result="DENIED",
            reason="User not found with specified email",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Check password hash (support both quick_hash seed format and standard hash)
    if not verify_password(credentials.password, user.hashed_password):
        log_audit_event(
            user_id=user.id,
            username=user.username,
            project_id=user.project_id,
            action="login",
            result="DENIED",
            reason="Invalid password provided",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Generate JWT token
    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role, "project_id": user.project_id})

    # Record successful login audit event
    log_audit_event(
        user_id=user.id,
        username=user.username,
        project_id=user.project_id,
        action="login",
        result="ALLOWED",
        reason=f"User authenticated successfully as role {user.role}",
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "project_id": user.project_id,
        }
    }

@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "project_id": current_user.project_id,
    }
