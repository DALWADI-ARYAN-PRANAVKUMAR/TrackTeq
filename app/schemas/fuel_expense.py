from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class FuelLogCreate(BaseModel):
    vehicle_id: str
    trip_id: Optional[str] = None
    liters: float = Field(gt=0)
    cost: float = Field(ge=0)
    log_date: Optional[date] = None


class FuelLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vehicle_id: str
    trip_id: Optional[str]
    liters: float
    cost: float
    log_date: date
    created_at: datetime


class ExpenseCreate(BaseModel):
    vehicle_id: str
    expense_type: str = "Other"
    amount: float = Field(gt=0)
    description: Optional[str] = None
    expense_date: Optional[date] = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vehicle_id: str
    expense_type: str
    amount: float
    description: Optional[str]
    expense_date: date
    created_at: datetime
