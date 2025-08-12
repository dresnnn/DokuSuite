import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.api.schemas import ShareCreate, ShareRead
from app.core.security import User, get_current_user
from app.db.models import AuditLog, Share
from app.db.session import get_session

router = APIRouter(
    prefix="/shares", tags=["shares"], dependencies=[Depends(get_current_user)]
)


@router.post("", response_model=ShareRead, status_code=status.HTTP_201_CREATED)
def create_share(
    payload: ShareCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    share = Share(
        order_id=payload.order_id,
        url=f"https://example.com/{secrets.token_urlsafe(16)}",
        expires_at=payload.expires_at,
        download_allowed=payload.download_allowed,
    )
    session.add(share)
    session.commit()
    session.refresh(share)

    log = AuditLog(
        action="create",
        entity="share",
        entity_id=share.id,
        user=user.email,
        payload=payload.model_dump(mode="json"),
    )
    session.add(log)
    session.commit()
    return ShareRead.model_validate(share, from_attributes=True)


@router.get("/{share_id}", response_model=ShareRead)
def get_share(share_id: int, session: Session = Depends(get_session)):
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return ShareRead.model_validate(share, from_attributes=True)


@router.post("/{share_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share(
    share_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    session.delete(share)
    session.commit()

    log = AuditLog(
        action="delete",
        entity="share",
        entity_id=share_id,
        user=user.email,
        payload=None,
    )
    session.add(log)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
