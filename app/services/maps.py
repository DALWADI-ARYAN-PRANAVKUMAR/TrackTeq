from typing import Optional, Tuple

import httpx

Coordinate = Tuple[float, float]

USER_AGENT = "TransitOps/1.0 (OpenStreetMap Nominatim)"


def get_coordinates(address: str) -> Optional[Coordinate]:
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "jsonv2",
        "limit": 1,
        "countrycodes": "in",
    }
    headers = {"User-Agent": USER_AGENT}

    try:
        response = httpx.get(url, params=params, headers=headers, timeout=8.0)
        response.raise_for_status()
        data = response.json()

        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"OpenStreetMap geocoding error for {address}: {e}")

    return None


def get_driving_distance_km(origin: str, destination: str) -> Optional[float]:
    origin_coords = get_coordinates(origin)
    destination_coords = get_coordinates(destination)
    if not origin_coords or not destination_coords:
        return None

    route = _get_osrm_route(origin_coords, destination_coords, include_distance=True)
    if route and isinstance(route, tuple):
        return route[1]

    return None


def get_route_details(origin: str, destination: str) -> Optional[dict]:
    origin_coords = get_coordinates(origin)
    destination_coords = get_coordinates(destination)
    if not origin_coords or not destination_coords:
        return None

    route = _get_osrm_route(origin_coords, destination_coords, include_distance=True)
    if route and isinstance(route, tuple):
        path, distance_km = route
    else:
        path = [origin_coords, destination_coords]
        distance_km = None

    return {
        "source": _to_dict(origin_coords),
        "destination": _to_dict(destination_coords),
        "path": [_to_dict(point) for point in path],
        "distance_km": distance_km,
    }


def _get_osrm_route(
    origin_coords: Coordinate,
    destination_coords: Coordinate,
    include_distance: bool = False,
) -> Optional[list[Coordinate] | tuple[list[Coordinate], float]]:
    origin_lat, origin_lng = origin_coords
    destination_lat, destination_lng = destination_coords
    coordinates = f"{origin_lng},{origin_lat};{destination_lng},{destination_lat}"
    url = f"https://router.project-osrm.org/route/v1/driving/{coordinates}"
    params = {"overview": "full", "geometries": "geojson"}

    try:
        response = httpx.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        routes = data.get("routes") or []
        if not routes:
            return None

        route = routes[0]
        path = [(lat, lng) for lng, lat in route["geometry"]["coordinates"]]
        if include_distance:
            return path, round(route["distance"] / 1000.0, 1)
        return path
    except Exception as e:
        print(f"OpenStreetMap route error ({origin_coords} -> {destination_coords}): {e}")

    return None


def _to_dict(point: Coordinate) -> dict:
    lat, lng = point
    return {"lat": lat, "lng": lng}
