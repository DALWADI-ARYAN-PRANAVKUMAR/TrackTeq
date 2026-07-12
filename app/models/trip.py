import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class TripStatus(str, enum.Enum):
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=gen_uuid)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)

    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(String, ForeignKey("drivers.id"), nullable=False)

    cargo_weight = Column(Float, nullable=False)  # kg
    planned_distance = Column(Float, nullable=False)  # km
    actual_distance = Column(Float, nullable=True)  # filled at completion
    fuel_consumed = Column(Float, nullable=True)  # liters, filled at completion
    revenue = Column(Float, nullable=True, default=0.0)  # for ROI calc

    status = Column(SAEnum(TripStatus), nullable=False, default=TripStatus.DRAFT)

    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
