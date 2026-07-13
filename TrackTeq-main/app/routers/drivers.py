from typing import Optional, List
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver, DriverStatus
from app.models.user import RoleName
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.auth.deps import get_current_user, require_roles

router = APIRouter(prefix="/drivers", tags=["Drivers"])

WRITE_ROLES = require_roles(RoleName.FLEET_MANAGER, RoleName.SAFETY_OFFICER)


def _license_number_taken(db: Session, license_number: str, exclude_id: Optional[str] = None) -> bool:
    q = db.query(Driver).filter(Driver.license_number == license_number)
    if exclude_id:
        q = q.filter(Driver.id != exclude_id)
    return q.first() is not None


@router.get("", response_model=List[DriverOut])
def list_drivers(
    status_filter: Optional[DriverStatus] = None,
    expired_only: bool = False,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Driver)
    if status_filter:
        query = query.filter(Driver.status == status_filter)
    if expired_only:
        query = query.filter(Driver.license_expiry_date < date.today())
    return query.order_by(Driver.created_at.desc()).all()


@router.get("/available", response_model=List[DriverOut])
def list_available_drivers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Drivers eligible for trip assignment: Available, not suspended, license valid."""
    return (
        db.query(Driver)
        .filter(
            Driver.status == DriverStatus.AVAILABLE,
            Driver.license_expiry_date >= date.today(),
        )
        .all()
    )


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")
    return driver


@router.post("", response_model=DriverOut, status_code=201)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    if _license_number_taken(db, payload.license_number):
        raise HTTPException(status_code=400, detail="License number already registered.")

    driver = Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(
    driver_id: str, payload: DriverUpdate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)

    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=204)
def delete_driver(driver_id: str, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")
    db.delete(driver)
    db.commit()
    return None
