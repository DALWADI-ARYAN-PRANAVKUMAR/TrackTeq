from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.trip import TripStatus


class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: str
    driver_id: str
    cargo_weight: float = Field(gt=0)
    planned_distance: float = Field(gt=0)
    revenue: Optional[float] = 0.0


class TripCompleteRequest(BaseModel):
    actual_distance: float = Field(gt=0)
    fuel_consumed: float = Field(gt=0)


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source: str
    destination: str
    vehicle_id: str
    driver_id: str
    cargo_weight: float
    planned_distance: float
    actual_distance: Optional[float]
    fuel_consumed: Optional[float]
    revenue: Optional[float]
    status: TripStatus
    dispatched_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
