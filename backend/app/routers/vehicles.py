from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle, VehicleStatus, VehicleType
from app.models.user import RoleName
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.auth.deps import get_current_user, require_roles
from app.services.business_rules import assert_unique_registration_number

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

WRITE_ROLES = require_roles(RoleName.FLEET_MANAGER)


@router.get("", response_model=List[VehicleOut])
def list_vehicles(
    status_filter: Optional[VehicleStatus] = None,
    type_filter: Optional[VehicleType] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Vehicle)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    if type_filter:
        query = query.filter(Vehicle.type == type_filter)
    if region:
        query = query.filter(Vehicle.region == region)
    return query.order_by(Vehicle.created_at.desc()).all()


@router.get("/available", response_model=List[VehicleOut])
def list_available_vehicles(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Vehicles eligible for dispatch selection (never Retired or In Shop)."""
    return db.query(Vehicle).filter(Vehicle.status == VehicleStatus.AVAILABLE).all()


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return vehicle


@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    assert_unique_registration_number(db, payload.registration_number)
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: str, payload: VehicleUpdate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    db.delete(vehicle)
    db.commit()
    return None
