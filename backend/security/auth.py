import hashlib
import time
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from database import DatabaseManager, UserModel

security_scheme = HTTPBearer(auto_error=False)

SALT = "salt_zerotrace_2026_"

def hash_password(password: str) -> str:
    """Hash password securely using SHA-256 and salt."""
    return hashlib.sha256(f"{SALT}{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored hash."""
    return hash_password(plain_password) == hashed_password

def create_access_token(data: Dict[str, Any], expires_delta_minutes: Optional[int] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire_minutes = expires_delta_minutes or JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    expire_timestamp = int(time.time()) + (expire_minutes * 60)
    to_encode.update({"exp": expire_timestamp})
    
    token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    authorization: Optional[str] = Header(None)
) -> UserModel:
    """
    FastAPI dependency to extract and validate the authenticated user from Bearer Token.
    Returns 401 Unauthorized if missing or invalid.
    """
    token = None
    if auth and auth.credentials:
        token = auth.credentials
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
        else:
            token = authorization

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    db_mgr = DatabaseManager()
    user = db_mgr.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
