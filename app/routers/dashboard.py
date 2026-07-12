from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vehicle import Vehicle, VehicleStatus, VehicleType
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.auth.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def get_kpis(
    type_filter: Optional[VehicleType] = None,
    status_filter: Optional[VehicleStatus] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    vehicle_query = db.query(Vehicle)
    if type_filter:
        vehicle_query = vehicle_query.filter(Vehicle.type == type_filter)
    if status_filter:
        vehicle_query = vehicle_query.filter(Vehicle.status == status_filter)
    if region:
        vehicle_query = vehicle_query.filter(Vehicle.region == region)

    total_vehicles = vehicle_query.count()
    active_vehicles = vehicle_query.filter(Vehicle.status != VehicleStatus.RETIRED).count()
    available_vehicles = vehicle_query.filter(Vehicle.status == VehicleStatus.AVAILABLE).count()
    in_maintenance = vehicle_query.filter(Vehicle.status == VehicleStatus.IN_SHOP).count()
    on_trip_vehicles = vehicle_query.filter(Vehicle.status == VehicleStatus.ON_TRIP).count()

    active_trips = db.query(Trip).filter(Trip.status == TripStatus.DISPATCHED).count()
    pending_trips = db.query(Trip).filter(Trip.status == TripStatus.DRAFT).count()

    drivers_on_duty = db.query(Driver).filter(Driver.status == DriverStatus.ON_TRIP).count()

    # Fleet Utilization (%) = vehicles On Trip / total active (non-retired) vehicles
    fleet_utilization = round((on_trip_vehicles / active_vehicles) * 100, 2) if active_vehicles else 0.0

    return {
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": in_maintenance,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization_percent": fleet_utilization,
    }
