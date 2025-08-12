from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.security import User, create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(req: LoginRequest):
    if req.email.lower() != settings.admin_email.lower() or not verify_password(
        req.password, settings.admin_password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Invalid credentials"},
        )
    token = create_access_token(req.email, settings.access_token_expires_minutes)
    return token


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"email": user.email}
