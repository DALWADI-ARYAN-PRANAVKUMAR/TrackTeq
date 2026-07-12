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

app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(maintenance_router)
app.include_router(fuel_expense_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "TransitOps API"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
