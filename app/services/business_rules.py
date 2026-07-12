"""
Centralized business rules for TrackTeq.

Every status transition and cross-entity validation described in Section 4
of the spec lives here, so no router can accidentally bypass a rule.
"""
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle, VehicleStatus
from app.models.driver import Driver, DriverStatus
from app.models.trip import Trip, TripStatus
from app.models.maintenance import MaintenanceLog, MaintenanceStatus


def _bad_request(msg: str):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


def _not_found(msg: str):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=msg)


# ---------------------------------------------------------------------------
# Vehicle registration
# ---------------------------------------------------------------------------

def assert_unique_registration_number(db: Session, registration_number: str):
    exists = db.query(Vehicle).filter(
        Vehicle.registration_number == registration_number
    ).first()
    if exists:
        _bad_request(f"Vehicle registration number '{registration_number}' already exists.")


# ---------------------------------------------------------------------------
# Trip creation validations
# ---------------------------------------------------------------------------

def validate_trip_creation(db: Session, vehicle_id: str, driver_id: str, cargo_weight: float):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        _not_found("Vehicle not found.")

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        _not_found("Driver not found.")

    # Retired or In Shop vehicles must never appear in dispatch selection
    if vehicle.status in (VehicleStatus.RETIRED, VehicleStatus.IN_SHOP):
        _bad_request(f"Vehicle '{vehicle.registration_number}' is {vehicle.status.value} and cannot be dispatched.")

    # A vehicle already On Trip cannot be assigned to another trip
    if vehicle.status == VehicleStatus.ON_TRIP:
        _bad_request(f"Vehicle '{vehicle.registration_number}' is already on a trip.")

    # Drivers with expired licenses or Suspended status cannot be assigned
    if driver.status == DriverStatus.SUSPENDED:
        _bad_request(f"Driver '{driver.name}' is suspended and cannot be assigned to trips.")

    if driver.license_expiry_date < date.today():
        _bad_request(f"Driver '{driver.name}' has an expired license and cannot be assigned to trips.")

    # A driver already On Trip cannot be assigned to another trip
    if driver.status == DriverStatus.ON_TRIP:
        _bad_request(f"Driver '{driver.name}' is already on a trip.")

    # Cargo Weight must not exceed vehicle's maximum load capacity
    if cargo_weight > vehicle.max_load_capacity:
        _bad_request(
            f"Cargo weight ({cargo_weight}kg) exceeds vehicle max load capacity "
            f"({vehicle.max_load_capacity}kg)."
        )

    return vehicle, driver


# ---------------------------------------------------------------------------
# Trip lifecycle transitions
# ---------------------------------------------------------------------------

def dispatch_trip(db: Session, trip: Trip) -> Trip:
    if trip.status != TripStatus.DRAFT:
        _bad_request(f"Only Draft trips can be dispatched. Current status: {trip.status.value}")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    # Re-validate at dispatch time in case state changed since trip creation
    validate_trip_creation(db, trip.vehicle_id, trip.driver_id, trip.cargo_weight)

    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP
    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.utcnow()

    db.add_all([vehicle, driver, trip])
    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(db: Session, trip: Trip, actual_distance: float, fuel_consumed: float) -> Trip:
    if trip.status != TripStatus.DISPATCHED:
        _bad_request(f"Only Dispatched trips can be completed. Current status: {trip.status.value}")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    trip.actual_distance = actual_distance
    trip.fuel_consumed = fuel_consumed
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.utcnow()

    vehicle.odometer = (vehicle.odometer or 0) + actual_distance
    vehicle.status = VehicleStatus.AVAILABLE
    driver.status = DriverStatus.AVAILABLE

    db.add_all([vehicle, driver, trip])
    db.commit()
    db.refresh(trip)
    return trip


def cancel_trip(db: Session, trip: Trip) -> Trip:
    if trip.status not in (TripStatus.DRAFT, TripStatus.DISPATCHED):
        _bad_request(f"Cannot cancel a trip with status: {trip.status.value}")

    was_dispatched = trip.status == TripStatus.DISPATCHED

    trip.status = TripStatus.CANCELLED
    trip.cancelled_at = datetime.utcnow()

    if was_dispatched:
        # Cancelling a dispatched trip restores vehicle and driver to Available
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        vehicle.status = VehicleStatus.AVAILABLE
        driver.status = DriverStatus.AVAILABLE
        db.add_all([vehicle, driver])

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


# ---------------------------------------------------------------------------
# Maintenance lifecycle transitions
# ---------------------------------------------------------------------------

def open_maintenance(db: Session, vehicle_id: str, description: str, cost: float) -> MaintenanceLog:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        _not_found("Vehicle not found.")

    if vehicle.status == VehicleStatus.ON_TRIP:
        _bad_request("Cannot open maintenance for a vehicle that is currently On Trip.")

    if vehicle.status == VehicleStatus.RETIRED:
        _bad_request("Cannot open maintenance for a Retired vehicle.")

    log = MaintenanceLog(
        vehicle_id=vehicle_id,
        description=description,
        cost=cost,
        status=MaintenanceStatus.OPEN,
    )
    # Creating an active maintenance record automatically changes vehicle status to In Shop
    vehicle.status = VehicleStatus.IN_SHOP

    db.add_all([log, vehicle])
    db.commit()
    db.refresh(log)
    return log


def close_maintenance(db: Session, log: MaintenanceLog) -> MaintenanceLog:
    if log.status != MaintenanceStatus.OPEN:
        _bad_request("Maintenance log is already closed.")

    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()

    log.status = MaintenanceStatus.CLOSED
    log.closed_at = datetime.utcnow()

    # Closing maintenance restores vehicle to Available (unless retired)
    if vehicle.status != VehicleStatus.RETIRED:
        vehicle.status = VehicleStatus.AVAILABLE

    db.add_all([log, vehicle])
    db.commit()
    db.refresh(log)
    return log
