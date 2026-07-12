import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class MaintenanceStatus(str, enum.Enum):
    OPEN = "Open"        # active -> vehicle is "In Shop"
    CLOSED = "Closed"    # done -> vehicle restored to Available (unless retired)


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)

    description = Column(String, nullable=False)  # e.g. "Oil Change"
    cost = Column(Float, nullable=False, default=0.0)
    status = Column(SAEnum(MaintenanceStatus), nullable=False, default=MaintenanceStatus.OPEN)

    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
