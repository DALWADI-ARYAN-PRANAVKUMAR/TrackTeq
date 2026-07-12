from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.driver import DriverStatus


class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: Optional[str] = None
    safety_score: float = Field(default=100.0, ge=0, le=100)


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: Optional[DriverStatus] = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: Optional[str]
    safety_score: float
    status: DriverStatus
    license_expired: bool
    created_at: datetime
    updated_at: datetime
