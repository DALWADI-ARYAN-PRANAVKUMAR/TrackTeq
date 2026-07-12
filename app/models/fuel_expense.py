import uuid
from datetime import date, datetime

from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(String, ForeignKey("trips.id"), nullable=True)

    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    log_date = Column(Date, default=date.today)

    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")


class ExpenseType:
    TOLL = "Toll"
    MAINTENANCE = "Maintenance"
    FINE = "Fine"
    OTHER = "Other"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=gen_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)

    expense_type = Column(String, nullable=False, default=ExpenseType.OTHER)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    expense_date = Column(Date, default=date.today)

    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="expenses")
