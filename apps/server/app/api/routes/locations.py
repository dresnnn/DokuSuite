from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.schemas import LocationRead, Page
from app.core.security import get_current_user
from app.db.models import Location
from app.db.session import get_session

router = APIRouter(
    prefix="/locations", tags=["locations"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=Page[LocationRead])
def list_locations(
    q: str | None = None,
    page: int = 1,
    limit: int = 10,
    session: Session = Depends(get_session),
):
    query = select(Location)
    if q:
        query = query.where(Location.name.contains(q))

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    results = session.exec(query.offset((page - 1) * limit).limit(limit)).all()
    items = [LocationRead.model_validate(r, from_attributes=True) for r in results]
    return Page(items=items, total=total, page=page, limit=limit)


@router.get("/offline-delta")
def offline_delta(
    since: datetime,
    session: Session = Depends(get_session),
):
    # Include records updated exactly at `since` to avoid missing items when
    # the caller's timestamp matches the update time down to the microsecond.
    upserts_query = select(Location).where(
        Location.updated_at >= since, Location.deleted_at.is_(None)
    )
    upserts = session.exec(upserts_query).all()
    tombstones_query = select(Location.id).where(
        Location.deleted_at.is_not(None), Location.deleted_at >= since
    )
    tombstones = session.exec(tombstones_query).all()
    upserts_data = [LocationRead.model_validate(r, from_attributes=True) for r in upserts]
    tombstones_data = [{"id": t} for t in tombstones]
    return {"upserts": upserts_data, "tombstones": tombstones_data}
