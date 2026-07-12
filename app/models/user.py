import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class RoleName(str, enum.Enum):
    FLEET_MANAGER = "fleet_manager"
    DRIVER = "driver"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"
    ADMIN = "admin"


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(RoleName), nullable=False, default=RoleName.DRIVER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # If this user account is itself a driver, link to driver profile (optional)
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
