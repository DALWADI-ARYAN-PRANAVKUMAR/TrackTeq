from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.maintenance import MaintenanceStatus


class MaintenanceCreate(BaseModel):
    vehicle_id: str
    description: str
    cost: float = Field(ge=0, default=0.0)


class MaintenanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vehicle_id: str
    description: str
    cost: float
    status: MaintenanceStatus
    opened_at: datetime
    closed_at: Optional[datetime]
