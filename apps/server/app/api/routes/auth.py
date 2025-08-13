import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import (
    User,
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)
from app.db.models import Invitation
from app.db.models import User as UserModel
from app.db.session import get_session
from app.services.mail import send_mail

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, session: Session = Depends(get_session)):
    email = req.email.lower()
    existing = session.exec(select(UserModel).where(UserModel.email == email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = UserModel(email=email, password_hash=hash_password(req.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"id": user.id, "email": user.email}


@router.post("/login")
@limiter.limit("5/minute")
def login(
    req: LoginRequest, request: Request, session: Session = Depends(get_session)
):
    email = req.email.lower()
    user = session.exec(select(UserModel).where(UserModel.email == email)).first()
    if user is None or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Invalid credentials"},
        )
    token = create_access_token(user.email, settings.access_token_expires_minutes)
    return token


class InviteRequest(BaseModel):
    email: EmailStr


class InviteAcceptRequest(BaseModel):
    token: str
    password: str


@router.post("/invite", status_code=status.HTTP_201_CREATED)
def invite_user(
    req: InviteRequest,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("ADMIN")),
):
    email = req.email.lower()
    token = secrets.token_urlsafe(32)
    invitation = Invitation(email=email, token=token)
    session.add(invitation)
    session.commit()
    send_mail(email, "You're invited", f"Use this link: https://example.com/invite/{token}")
    return {"id": invitation.id, "email": invitation.email}


@router.post("/accept")
def accept_invite(req: InviteAcceptRequest, session: Session = Depends(get_session)):
    invitation = session.exec(
        select(Invitation).where(Invitation.token == req.token)
    ).first()
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid token")
    email = invitation.email.lower()
    user = session.exec(select(UserModel).where(UserModel.email == email)).first()
    if user:
        user.password_hash = hash_password(req.password)
    else:
        user = UserModel(email=email, password_hash=hash_password(req.password))
        session.add(user)
    session.delete(invitation)
    session.commit()
    token = create_access_token(user.email, settings.access_token_expires_minutes)
    return token


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"email": user.email}
