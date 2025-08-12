from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
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
def offline_delta():
    return JSONResponse({"status": "not_implemented"}, status_code=status.HTTP_501_NOT_IMPLEMENTED)
