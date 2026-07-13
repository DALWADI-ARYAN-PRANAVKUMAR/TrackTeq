from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.maintenance import MaintenanceLog, MaintenanceStatus
from app.models.user import RoleName
from app.schemas.maintenance import MaintenanceCreate, MaintenanceOut
from app.auth.deps import get_current_user, require_roles
from app.services.business_rules import open_maintenance, close_maintenance

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

WRITE_ROLES = require_roles(RoleName.FLEET_MANAGER)


@router.get("", response_model=List[MaintenanceOut])
def list_maintenance(
    vehicle_id: Optional[str] = None,
    status_filter: Optional[MaintenanceStatus] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(MaintenanceLog)
    if vehicle_id:
        query = query.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if status_filter:
        query = query.filter(MaintenanceLog.status == status_filter)
    return query.order_by(MaintenanceLog.opened_at.desc()).all()


@router.get("/{log_id}", response_model=MaintenanceOut)
def get_maintenance(log_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found.")
    return log


@router.post("", response_model=MaintenanceOut, status_code=201)
def create_maintenance(
    payload: MaintenanceCreate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)
):
    return open_maintenance(db, payload.vehicle_id, payload.description, payload.cost)


@router.post("/{log_id}/close", response_model=MaintenanceOut)
def close(log_id: str, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found.")
    return close_maintenance(db, log)
