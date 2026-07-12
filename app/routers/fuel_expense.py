from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fuel_expense import FuelLog, Expense
from app.models.vehicle import Vehicle
from app.models.user import RoleName
from app.schemas.fuel_expense import FuelLogCreate, FuelLogOut, ExpenseCreate, ExpenseOut
from app.auth.deps import get_current_user, require_roles

router = APIRouter(tags=["Fuel & Expenses"])

WRITE_ROLES = require_roles(RoleName.FLEET_MANAGER, RoleName.DRIVER)


def _assert_vehicle_exists(db: Session, vehicle_id: str):
    if not db.query(Vehicle).filter(Vehicle.id == vehicle_id).first():
        raise HTTPException(status_code=404, detail="Vehicle not found.")


# ---- Fuel Logs ----

@router.get("/fuel-logs", response_model=List[FuelLogOut])
def list_fuel_logs(
    vehicle_id: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)
):
    query = db.query(FuelLog)
    if vehicle_id:
        query = query.filter(FuelLog.vehicle_id == vehicle_id)
    return query.order_by(FuelLog.log_date.desc()).all()


@router.post("/fuel-logs", response_model=FuelLogOut, status_code=201)
def create_fuel_log(payload: FuelLogCreate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    _assert_vehicle_exists(db, payload.vehicle_id)
    data = payload.model_dump()
    if not data.get("log_date"):
        from datetime import date
        data["log_date"] = date.today()
    log = FuelLog(**data)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ---- Expenses ----

@router.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(
    vehicle_id: Optional[str] = None, db: Session = Depends(get_db), _=Depends(get_current_user)
):
    query = db.query(Expense)
    if vehicle_id:
        query = query.filter(Expense.vehicle_id == vehicle_id)
    return query.order_by(Expense.expense_date.desc()).all()


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db), _=Depends(WRITE_ROLES)):
    _assert_vehicle_exists(db, payload.vehicle_id)
    data = payload.model_dump()
    if not data.get("expense_date"):
        from datetime import date
        data["expense_date"] = date.today()
    expense = Expense(**data)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
