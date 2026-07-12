import csv
import io
from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip, TripStatus
from app.models.fuel_expense import FuelLog, Expense
from app.models.maintenance import MaintenanceLog
from app.auth.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


def _vehicle_metrics(db: Session, vehicle: Vehicle) -> dict:
    total_distance = (
        db.query(func.coalesce(func.sum(Trip.actual_distance), 0.0))
        .filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.COMPLETED)
        .scalar()
    )
    total_fuel_liters = (
        db.query(func.coalesce(func.sum(FuelLog.liters), 0.0))
        .filter(FuelLog.vehicle_id == vehicle.id)
        .scalar()
    )
    total_fuel_cost = (
        db.query(func.coalesce(func.sum(FuelLog.cost), 0.0))
        .filter(FuelLog.vehicle_id == vehicle.id)
        .scalar()
    )
    total_maintenance_cost = (
        db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0.0))
        .filter(MaintenanceLog.vehicle_id == vehicle.id)
        .scalar()
    )
    total_other_expenses = (
        db.query(func.coalesce(func.sum(Expense.amount), 0.0))
        .filter(Expense.vehicle_id == vehicle.id)
        .scalar()
    )
    total_revenue = (
        db.query(func.coalesce(func.sum(Trip.revenue), 0.0))
        .filter(Trip.vehicle_id == vehicle.id, Trip.status == TripStatus.COMPLETED)
        .scalar()
    )

    operational_cost = total_fuel_cost + total_maintenance_cost + total_other_expenses
    fuel_efficiency = round(total_distance / total_fuel_liters, 2) if total_fuel_liters else 0.0

    # ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
    roi = None
    if vehicle.acquisition_cost:
        roi = round(
            (total_revenue - (total_maintenance_cost + total_fuel_cost)) / vehicle.acquisition_cost,
            4,
        )

    return {
        "vehicle_id": vehicle.id,
        "registration_number": vehicle.registration_number,
        "name_model": vehicle.name_model,
        "total_distance_km": total_distance,
        "total_fuel_liters": total_fuel_liters,
        "fuel_efficiency_km_per_l": fuel_efficiency,
        "total_fuel_cost": total_fuel_cost,
        "total_maintenance_cost": total_maintenance_cost,
        "total_other_expenses": total_other_expenses,
        "operational_cost": operational_cost,
        "total_revenue": total_revenue,
        "acquisition_cost": vehicle.acquisition_cost,
        "vehicle_roi": roi,
    }


@router.get("/vehicle-performance")
def vehicle_performance(db: Session = Depends(get_db), _=Depends(get_current_user)) -> List[dict]:
    vehicles = db.query(Vehicle).all()
    return [_vehicle_metrics(db, v) for v in vehicles]


@router.get("/vehicle-performance/{vehicle_id}")
def vehicle_performance_single(
    vehicle_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)
):
    from fastapi import HTTPException

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return _vehicle_metrics(db, vehicle)


@router.get("/vehicle-performance/export/csv")
def export_vehicle_performance_csv(db: Session = Depends(get_db), _=Depends(get_current_user)):
    vehicles = db.query(Vehicle).all()
    rows = [_vehicle_metrics(db, v) for v in vehicles]

    buffer = io.StringIO()
    if rows:
        writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicle_performance_report.csv"},
    )
