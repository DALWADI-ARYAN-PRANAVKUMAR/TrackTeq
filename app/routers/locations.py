from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.maps import get_coordinates, get_route_details

router = APIRouter(prefix="/locations", tags=["Locations"])


class CoordinatesOut(BaseModel):
    lat: float
    lng: float


class RouteOut(BaseModel):
    source: CoordinatesOut
    destination: CoordinatesOut
    path: list[CoordinatesOut]
    distance_km: float | None = None


@router.get("/geocode", response_model=CoordinatesOut)
def geocode_address(address: str):
    coords = get_coordinates(address)
    if not coords:
        raise HTTPException(status_code=404, detail="Could not geocode address")
    return {"lat": coords[0], "lng": coords[1]}


@router.get("/route", response_model=RouteOut)
def route_between_locations(source: str, destination: str):
    route = get_route_details(source, destination)
    if not route:
        raise HTTPException(status_code=404, detail="Could not route between locations")
    return route
