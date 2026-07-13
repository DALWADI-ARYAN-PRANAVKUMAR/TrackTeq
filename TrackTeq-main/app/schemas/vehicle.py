from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.vehicle import VehicleStatus, VehicleType


class VehicleCreate(BaseModel):
    registration_number: str
    name_model: str
    type: VehicleType = VehicleType.TRUCK
    max_load_capacity: float = Field(gt=0)
    odometer: float = 0.0
    acquisition_cost: float = Field(ge=0, default=0.0)
    region: Optional[str] = None


class VehicleUpdate(BaseModel):
    name_model: Optional[str] = None
    type: Optional[VehicleType] = None
    max_load_capacity: Optional[float] = Field(default=None, gt=0)
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    region: Optional[str] = None
    status: Optional[VehicleStatus] = None


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    registration_number: str
    name_model: str
    type: VehicleType
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: VehicleStatus
    region: Optional[str]
    created_at: datetime
    updated_at: datetime
