import time
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext

from .config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, password_hash: str) -> bool:
    if password_hash.startswith("$2b$") or password_hash.startswith("$2a$"):
        try:
            return pwd_context.verify(plain_password, password_hash)
        except Exception:
            return False
    # Fallback: allow plain text comparison for dev convenience
    return secrets_compare(plain_password, password_hash)


def secrets_compare(a: str, b: str) -> bool:
    """Constant-time compare to avoid timing attacks."""
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a.encode(), b.encode()):
        result |= x ^ y
    return result == 0


def create_access_token(subject: str, expires_in_minutes: int) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_in_minutes)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return {
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": int((exp - now).total_seconds()),
    }


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
