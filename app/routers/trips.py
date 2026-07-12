from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trip import Trip, TripStatus
from app.models.user import RoleName, User
from app.schemas.trip import TripCreate, TripOut, TripCompleteRequest
from app.auth.deps import get_current_user, require_roles
from app.services.business_rules import (
    validate_trip_creation,
    dispatch_trip,
    complete_trip,
    cancel_trip,
)

router = APIRouter(prefix="/trips", tags=["Trips"])

WRITE_ROLES = require_roles(RoleName.FLEET_MANAGER, RoleName.DRIVER)


def _get_trip_or_404(db: Session, trip_id: str) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return trip


@router.get("", response_model=List[TripOut])
def list_trips(
    status_filter: Optional[TripStatus] = None,
    vehicle_id: Optional[str] = None,
    driver_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Trip)
    if status_filter:
        query = query.filter(Trip.status == status_filter)
    if vehicle_id:
        query = query.filter(Trip.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(Trip.driver_id == driver_id)
    return query.order_by(Trip.created_at.desc()).all()


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _get_trip_or_404(db, trip_id)


@router.post("", response_model=TripOut, status_code=201)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(WRITE_ROLES),
):
    # Validate as a Draft — full re-validation happens again at dispatch time
    validate_trip_creation(db, payload.vehicle_id, payload.driver_id, payload.cargo_weight)

    trip = Trip(
        source=payload.source,
        destination=payload.destination,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        cargo_weight=payload.cargo_weight,
        planned_distance=payload.planned_distance,
        revenue=payload.revenue or 0.0,
        status=TripStatus.DRAFT,
        created_by=current_user.id,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def dispatch(trip_id: str, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    trip = _get_trip_or_404(db, trip_id)
    return dispatch_trip(db, trip)


@router.post("/{trip_id}/complete", response_model=TripOut)
def complete(
    trip_id: str,
    payload: TripCompleteRequest,
    db: Session = Depends(get_db),
    _=Depends(WRITE_ROLES),
):
    trip = _get_trip_or_404(db, trip_id)
    return complete_trip(db, trip, payload.actual_distance, payload.fuel_consumed)


@router.post("/{trip_id}/cancel", response_model=TripOut)
def cancel(trip_id: str, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    trip = _get_trip_or_404(db, trip_id)
    return cancel_trip(db, trip)
