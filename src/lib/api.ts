/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Session } from "./types";

const API_BASE = "http://localhost:8000";

let authToken =
  typeof window !== "undefined" ? window.localStorage.getItem("transitops_auth_token") : null;

export function setToken(token: string) {
  authToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("transitops_auth_token", token);
  }
}

export function clearToken() {
  authToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("transitops_auth_token");
  }
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

// --- Mappers ---

export function mapVehicleFromBackend(b: any): Vehicle {
  return {
    id: b.id,
    reg: b.registration_number,
    name: b.name_model,
    type:
      b.type === "Trailer"
        ? "Semi"
        : b.type === "Mini Truck"
          ? "Pickup"
          : b.type === "Other"
            ? "Truck"
            : b.type,
    capacityKg: b.max_load_capacity,
    odometer: b.odometer,
    acquisitionCost: b.acquisition_cost,
    status: b.status,
    region: b.region || "",
  };
}

export function mapVehicleToBackend(f: Partial<Vehicle>): any {
  const payload: any = {};
  if (f.reg !== undefined) payload.registration_number = f.reg;
  if (f.name !== undefined) payload.name_model = f.name;
  if (f.type !== undefined) {
    payload.type =
      f.type === "Semi"
        ? "Trailer"
        : f.type === "Pickup"
          ? "Mini Truck"
          : f.type === "Refrigerated"
            ? "Truck"
            : f.type;
  }
  if (f.capacityKg !== undefined) payload.max_load_capacity = f.capacityKg;
  if (f.odometer !== undefined) payload.odometer = f.odometer;
  if (f.acquisitionCost !== undefined) payload.acquisition_cost = f.acquisitionCost;
  if (f.status !== undefined) payload.status = f.status;
  if (f.region !== undefined) payload.region = f.region;
  return payload;
}

export function mapDriverFromBackend(b: any): Driver {
  return {
    id: b.id,
    name: b.name,
    license: b.license_number,
    licenseCategory: b.license_category,
    licenseExpiry: b.license_expiry_date,
    phone: b.contact_number || "",
    safetyScore: b.safety_score,
    status: b.status,
    region: "Maharashtra",
  };
}

export function mapDriverToBackend(f: Partial<Driver>): any {
  const payload: any = {};
  if (f.name !== undefined) payload.name = f.name;
  if (f.license !== undefined) payload.license_number = f.license;
  if (f.licenseCategory !== undefined) payload.license_category = f.licenseCategory;
  if (f.licenseExpiry !== undefined) payload.license_expiry_date = f.licenseExpiry;
  if (f.phone !== undefined) payload.contact_number = f.phone;
  if (f.safetyScore !== undefined) payload.safety_score = f.safetyScore;
  if (f.status !== undefined) payload.status = f.status;
  return payload;
}

export function mapTripFromBackend(b: any): Trip {
  return {
    id: b.id,
    code: "TRP-" + b.id.slice(0, 4).toUpperCase(),
    source: b.source,
    destination: b.destination,
    vehicleId: b.vehicle_id,
    driverId: b.driver_id,
    cargoKg: b.cargo_weight,
    plannedKm: b.planned_distance,
    actualKm: b.actual_distance || undefined,
    fuelLiters: b.fuel_consumed || undefined,
    revenue: b.revenue || 0,
    status: b.status,
    createdAt: b.created_at,
    dispatchedAt: b.dispatched_at || undefined,
    completedAt: b.completed_at || undefined,
  };
}

export function mapTripToBackend(f: Partial<Trip>): any {
  const payload: any = {};
  if (f.source !== undefined) payload.source = f.source;
  if (f.destination !== undefined) payload.destination = f.destination;
  if (f.vehicleId !== undefined) payload.vehicle_id = f.vehicleId;
  if (f.driverId !== undefined) payload.driver_id = f.driverId;
  if (f.cargoKg !== undefined) payload.cargo_weight = f.cargoKg;
  if (f.plannedKm !== undefined) payload.planned_distance = f.plannedKm;
  if (f.revenue !== undefined) payload.revenue = f.revenue;
  return payload;
}

export function mapMaintenanceFromBackend(b: any): MaintenanceLog {
  const parts = b.description.split(": ");
  const type = parts[0] || "Maintenance";
  const notes = parts.slice(1).join(": ") || "";
  return {
    id: b.id,
    vehicleId: b.vehicle_id,
    type,
    notes,
    cost: b.cost,
    openedAt: b.opened_at,
    closedAt: b.closed_at || undefined,
  };
}

export function mapFuelFromBackend(b: any): FuelLog {
  return {
    id: b.id,
    vehicleId: b.vehicle_id,
    tripId: b.trip_id || undefined,
    liters: b.liters,
    cost: b.cost,
    date: b.log_date,
  };
}

export function mapExpenseFromBackend(b: any): Expense {
  const categoryMap: Record<string, "Toll" | "Parking" | "Fine" | "Other"> = {
    Toll: "Toll",
    Parking: "Parking",
    Fine: "Fine",
    Other: "Other",
  };
  return {
    id: b.id,
    vehicleId: b.vehicle_id,
    tripId: undefined,
    category: categoryMap[b.expense_type] || "Other",
    amount: b.amount,
    date: b.expense_date,
    notes: b.description || "",
  };
}

// --- API Methods ---

export const api = {
  // Auth
  async login(email: string, pass: string): Promise<{ token: string; user: Session }> {
    const data = await request("/auth/login-json", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });

    setToken(data.access_token);

    const roleMap: Record<string, any> = {
      admin: "Fleet Manager",
      fleet_manager: "Fleet Manager",
      driver: "Driver",
      safety_officer: "Safety Officer",
      financial_analyst: "Financial Analyst",
    };

    return {
      token: data.access_token,
      user: {
        email: data.user.email,
        name: data.user.full_name,
        role: roleMap[data.user.role] || "Driver",
      },
    };
  },

  async register(
    email: string,
    pass: string,
    fullName: string,
    role: "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst",
  ): Promise<{ token: string; user: Session }> {
    const roleMap: Record<string, string> = {
      "Fleet Manager": "fleet_manager",
      "Driver": "driver",
      "Safety Officer": "safety_officer",
      "Financial Analyst": "financial_analyst",
    };

    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: pass,
        full_name: fullName,
        role: roleMap[role] || "driver",
      }),
    });

    return this.login(email, pass);
  },

  async getMe(): Promise<Session> {
    const data = await request("/auth/me");
    const roleMap: Record<string, any> = {
      admin: "Fleet Manager",
      fleet_manager: "Fleet Manager",
      driver: "Driver",
      safety_officer: "Safety Officer",
      financial_analyst: "Financial Analyst",
    };
    return {
      email: data.email,
      name: data.full_name,
      role: roleMap[data.role] || "Driver",
    };
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    const data = await request("/vehicles");
    return data.map(mapVehicleFromBackend);
  },

  async createVehicle(v: any): Promise<Vehicle> {
    const data = await request("/vehicles", {
      method: "POST",
      body: JSON.stringify(mapVehicleToBackend(v)),
    });
    return mapVehicleFromBackend(data);
  },

  async updateVehicle(id: string, patch: any): Promise<Vehicle> {
    const data = await request(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(mapVehicleToBackend(patch)),
    });
    return mapVehicleFromBackend(data);
  },

  async deleteVehicle(id: string): Promise<void> {
    await request(`/vehicles/${id}`, {
      method: "DELETE",
    });
  },

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    const data = await request("/drivers");
    return data.map(mapDriverFromBackend);
  },

  async createDriver(d: any): Promise<Driver> {
    const data = await request("/drivers", {
      method: "POST",
      body: JSON.stringify(mapDriverToBackend(d)),
    });
    return mapDriverFromBackend(data);
  },

  async updateDriver(id: string, patch: any): Promise<Driver> {
    const data = await request(`/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(mapDriverToBackend(patch)),
    });
    return mapDriverFromBackend(data);
  },

  async deleteDriver(id: string): Promise<void> {
    await request(`/drivers/${id}`, {
      method: "DELETE",
    });
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    const data = await request("/trips");
    return data.map(mapTripFromBackend);
  },

  async createTrip(t: any): Promise<Trip> {
    const payload = {
      source: t.source,
      destination: t.destination,
      vehicle_id: t.vehicleId,
      driver_id: t.driverId,
      cargo_weight: t.cargoKg,
      planned_distance: t.plannedKm,
      revenue: t.revenue || 0,
    };
    const data = await request("/trips", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapTripFromBackend(data);
  },

  async dispatchTrip(id: string): Promise<Trip> {
    const data = await request(`/trips/${id}/dispatch`, {
      method: "POST",
    });
    return mapTripFromBackend(data);
  },

  async completeTrip(id: string, actualKm: number, fuelLiters: number): Promise<Trip> {
    const data = await request(`/trips/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({
        actual_distance: actualKm,
        fuel_consumed: fuelLiters,
      }),
    });
    return mapTripFromBackend(data);
  },

  async cancelTrip(id: string): Promise<Trip> {
    const data = await request(`/trips/${id}/cancel`, {
      method: "POST",
    });
    return mapTripFromBackend(data);
  },

  // Maintenance
  async getMaintenance(): Promise<MaintenanceLog[]> {
    const data = await request("/maintenance");
    return data.map(mapMaintenanceFromBackend);
  },

  async openMaintenance(
    vehicleId: string,
    description: string,
    cost: number,
  ): Promise<MaintenanceLog> {
    const data = await request("/maintenance", {
      method: "POST",
      body: JSON.stringify({
        vehicle_id: vehicleId,
        description,
        cost,
      }),
    });
    return mapMaintenanceFromBackend(data);
  },

  async closeMaintenance(id: string): Promise<MaintenanceLog> {
    const data = await request(`/maintenance/${id}/close`, {
      method: "POST",
    });
    return mapMaintenanceFromBackend(data);
  },

  // Fuel Logs
  async getFuelLogs(): Promise<FuelLog[]> {
    const data = await request("/fuel-logs");
    return data.map(mapFuelFromBackend);
  },

  async createFuelLog(f: any): Promise<FuelLog> {
    const payload = {
      vehicle_id: f.vehicleId,
      trip_id: f.tripId || null,
      liters: f.liters,
      cost: f.cost,
      log_date: f.date || null,
    };
    const data = await request("/fuel-logs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapFuelFromBackend(data);
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    const data = await request("/expenses");
    return data.map(mapExpenseFromBackend);
  },

  async createExpense(e: any): Promise<Expense> {
    const payload = {
      vehicle_id: e.vehicleId,
      expense_type: e.category,
      amount: e.amount,
      description: e.notes || null,
      expense_date: e.date || null,
    };
    const data = await request("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapExpenseFromBackend(data);
  },
};
