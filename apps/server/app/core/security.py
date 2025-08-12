from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.db.models import User as UserModel
from app.db.session import get_session

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
    for x, y in zip(a.encode(), b.encode(), strict=False):
        result |= x ^ y
    return result == 0


def create_access_token(subject: str, expires_in_minutes: int) -> dict[str, Any]:
    now = datetime.now(UTC)
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from None


class User:
    def __init__(self, email: str, role: str, customer_id: str | None = None):
        self.email = email
        self.role = role
        self.customer_id = customer_id


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    data = decode_token(credentials.credentials)
    sub = data.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    if sub == settings.admin_email:
        role = "ADMIN"
        user = session.exec(select(UserModel).where(UserModel.email == sub)).first()
        customer_id = getattr(user, "customer_id", None) if user else None
    else:
        user = session.exec(select(UserModel).where(UserModel.email == sub)).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        role = user.role.value if hasattr(user.role, "value") else str(user.role)
        customer_id = getattr(user, "customer_id", None)
    return User(email=str(sub), role=role, customer_id=customer_id)


def require_role(*roles: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden",
            )
        return user

    return dependency
