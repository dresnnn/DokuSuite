from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.schemas.user import UserRead, UserUpdate
from app.core.security import User, require_role
from app.db.models import User as UserModel
from app.db.session import get_session

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_role("ADMIN")),
):
    users = session.exec(select(UserModel)).all()
    return [UserRead.model_validate(u, from_attributes=True) for u in users]


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    data: UserUpdate,
    session: Session = Depends(get_session),
    _: User = Depends(require_role("ADMIN")),
):
    user_obj = session.get(UserModel, user_id)
    if not user_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if data.role is not None:
        user_obj.role = data.role
    session.add(user_obj)
    session.commit()
    session.refresh(user_obj)
    return UserRead.model_validate(user_obj, from_attributes=True)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    _: User = Depends(require_role("ADMIN")),
):
    user_obj = session.get(UserModel, user_id)
    if not user_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    session.delete(user_obj)
    session.commit()
    return None
