from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, select

from app.api.schemas import LocationRead, LocationUpdate, Page
from app.core.security import User, get_current_user
from app.db.models import AuditLog, Location
from app.db.session import get_session

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=Page[LocationRead])
def list_locations(
    q: str | None = None,
    page: int = 1,
    limit: int = 10,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    query = select(Location)
    if user.customer_id:
        query = query.where(Location.customer_id == user.customer_id)
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
    user: User = Depends(get_current_user),
):
    upserts_query = select(Location).where(
        Location.updated_at >= since, Location.deleted_at.is_(None)
    )
    if user.customer_id:
        upserts_query = upserts_query.where(Location.customer_id == user.customer_id)
    upserts = session.exec(upserts_query).all()
    tombstones_query = select(Location.id).where(
        Location.deleted_at.is_not(None), Location.deleted_at >= since
    )
    if user.customer_id:
        tombstones_query = tombstones_query.where(Location.customer_id == user.customer_id)
    tombstones = session.exec(tombstones_query).all()
    upserts_data = [LocationRead.model_validate(r, from_attributes=True) for r in upserts]
    tombstones_data = [{"id": t} for t in tombstones]
    return {"upserts": upserts_data, "tombstones": tombstones_data}


@router.patch("/{location_id}", response_model=LocationRead)
def update_location(
    location_id: int,
    payload: LocationUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    location = session.get(Location, location_id)
    if not location or (user.customer_id and location.customer_id != user.customer_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(location, key, value)
    location.revision = (location.revision or 0) + 1
    session.add(location)
    session.commit()
    session.refresh(location)

    log = AuditLog(
        action="update",
        entity="location",
        entity_id=location.id,
        user=user.email,
        payload=data,
    )
    session.add(log)
    session.commit()
    return LocationRead.model_validate(location, from_attributes=True)
