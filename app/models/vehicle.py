import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class VehicleType(str, enum.Enum):
    TRUCK = "Truck"
    VAN = "Van"
    MINI_TRUCK = "Mini Truck"
    TRAILER = "Trailer"
    BIKE = "Bike"
    OTHER = "Other"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, default=gen_uuid)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    name_model = Column(String, nullable=False)
    type = Column(SAEnum(VehicleType), nullable=False, default=VehicleType.TRUCK)
    max_load_capacity = Column(Float, nullable=False)  # kg
    odometer = Column(Float, default=0.0)  # km
    acquisition_cost = Column(Float, nullable=False, default=0.0)
    status = Column(SAEnum(VehicleStatus), nullable=False, default=VehicleStatus.AVAILABLE)
    region = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
