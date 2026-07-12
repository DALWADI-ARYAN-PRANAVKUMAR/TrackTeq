from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

from app.models.user import RoleName


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: RoleName = RoleName.DRIVER


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    role: RoleName
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
