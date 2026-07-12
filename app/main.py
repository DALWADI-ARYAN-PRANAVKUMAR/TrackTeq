from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

# Importing app.models ensures all model classes are registered on Base.metadata
import app.models  # noqa: F401

from app.auth.router import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.drivers import router as drivers_router
from app.routers.trips import router as trips_router
from app.routers.maintenance import router as maintenance_router
from app.routers.fuel_expense import router as fuel_expense_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router

# Create tables (hackathon-speed: no Alembic migration needed to get started)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TransitOps API",
    description="Smart Transport Operations Platform - Backend API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import APIRouter

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(vehicles_router)
api_router.include_router(drivers_router)
api_router.include_router(trips_router)
api_router.include_router(maintenance_router)
api_router.include_router(fuel_expense_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)

@api_router.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "TransitOps API"}

@api_router.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

app.include_router(api_router)
