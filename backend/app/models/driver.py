import enum
import uuid
from datetime import datetime, date

from sqlalchemy import Column, String, Float, Date, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String, nullable=False)  # e.g. LMV, HMV, etc.
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String, nullable=True)
    safety_score = Column(Float, default=100.0)  # 0-100
    status = Column(SAEnum(DriverStatus), nullable=False, default=DriverStatus.AVAILABLE)

    # Optional link to a user account (if drivers log in themselves)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="driver_profile")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = relationship("Trip", back_populates="driver")

    @property
    def license_expired(self) -> bool:
        return self.license_expiry_date < date.today()
