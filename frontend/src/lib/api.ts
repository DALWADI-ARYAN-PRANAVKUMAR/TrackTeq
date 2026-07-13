import { Session } from "./types";

const API_URL = import.meta.env?.VITE_API_URL || (import.meta.env?.PROD ? "/api" : "http://localhost:8000");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("transitops-token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.detail || response.statusText || "An error occurred");
  }

  return data as T;
}

export const api = {
  login: async (email: string, password: string):Promise<{access_token: string; user: any}> => {
    return await request<{access_token: string; user: any}>("/auth/login-json", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (full_name: string, email: string, password: string, role: string):Promise<any> => {
    const roleMap: Record<string, string> = {
      "Fleet Manager": "fleet_manager",
      "Driver": "driver",
      "Safety Officer": "safety_officer",
      "Financial Analyst": "financial_analyst",
      "Admin": "admin"
    };
    return await request<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name, email, password, role: roleMap[role] || role }),
    });
  },
  logout: async (): Promise<void> => {
    return await request<void>("/auth/logout", {
      method: "POST"
    });
  },
  getAuditLogs: async (): Promise<{ stats: any, logs: any[] }> => {
    return await request<{ stats: any, logs: any[] }>("/audit/logs");
  },
  
  getVehicles: async () => {
    const data = await request<any[]>("/vehicles");
    return data.map(v => ({
      id: v.id,
      reg: v.registration_number,
      name: v.name_model,
      type: v.type,
      capacityKg: v.max_load_capacity,
      odometer: v.odometer,
      acquisitionCost: v.acquisition_cost,
      status: v.status,
      region: v.region || "Maharashtra",
    }));
  },
  createVehicle: async (data: any) => {
    return await request<any>("/vehicles", { 
      method: "POST", 
      body: JSON.stringify({
        registration_number: data.reg,
        name_model: data.name,
        type: data.type,
        max_load_capacity: data.capacityKg,
        odometer: data.odometer,
        acquisition_cost: data.acquisitionCost,
        region: data.region
      }) 
    });
  },
  deleteVehicle: (id: string) => request<any>(`/vehicles/${id}`, { method: "DELETE" }),
  
  getDrivers: async () => {
    const data = await request<any[]>("/drivers");
    return data.map(d => ({
      id: d.id,
      name: d.name,
      license: d.license_number,
      licenseCategory: d.license_category,
      licenseExpiry: d.license_expiry_date,
      phone: d.contact_number || "",
      safetyScore: d.safety_score,
      status: d.status,
      region: "Maharashtra", // default since it's missing in backend schema
    }));
  },
  createDriver: async (data: any) => {
    return await request<any>("/drivers", { 
      method: "POST", 
      body: JSON.stringify({
        name: data.name,
        license_number: data.license,
        license_category: data.licenseCategory,
        license_expiry_date: data.licenseExpiry,
        contact_number: data.phone,
        safety_score: data.safetyScore
      }) 
    });
  },
  updateDriver: (id: string, data: any) => request<any>(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  
  getTrips: async () => {
    const data = await request<any[]>("/trips");
    return data.map(t => ({
      id: t.id,
      code: `TRP-${t.id.substring(0, 4).toUpperCase()}`, // Backend doesn't have `code`, we generate a short one
      source: t.source,
      destination: t.destination,
      vehicleId: t.vehicle_id,
      driverId: t.driver_id,
      cargoKg: t.cargo_weight,
      plannedKm: t.planned_distance,
      actualKm: t.actual_distance,
      fuelLiters: t.fuel_consumed,
      revenue: t.revenue,
      status: t.status,
      createdAt: t.created_at,
      dispatchedAt: t.dispatched_at,
      completedAt: t.completed_at,
    }));
  },
  createTrip: async (data: any) => {
    return await request<any>("/trips", { 
      method: "POST", 
      body: JSON.stringify({
        source: data.source,
        destination: data.destination,
        vehicle_id: data.vehicleId,
        driver_id: data.driverId,
        cargo_weight: data.cargoKg,
        planned_distance: data.plannedKm,
        revenue: data.revenue || 0
      }) 
    });
  },
  dispatchTrip: (id: string) => request<any>(`/trips/${id}/dispatch`, { method: "POST" }),
  completeTrip: (id: string, data: any) => request<any>(`/trips/${id}/complete`, { 
    method: "POST", 
    body: JSON.stringify({
      actual_distance: data.actualKm,
      fuel_consumed: data.fuelLiters
    }) 
  }),
  cancelTrip: (id: string) => request<any>(`/trips/${id}/cancel`, { method: "POST" }),
  
  getMaintenanceLogs: async () => {
    const data = await request<any[]>("/maintenance");
    return data.map(m => ({
      id: m.id,
      vehicleId: m.vehicle_id,
      type: m.description, // using description as type
      notes: m.description,
      cost: m.cost,
      openedAt: m.opened_at,
      closedAt: m.closed_at
    }));
  },
  openMaintenance: async (data: any) => {
    return await request<any>("/maintenance", { 
      method: "POST", 
      body: JSON.stringify({
        vehicle_id: data.vehicleId,
        description: `${data.type} - ${data.notes}`,
        cost: data.cost
      }) 
    });
  },
  closeMaintenance: (id: string) => request<any>(`/maintenance/${id}/close`, { method: "POST" }),
  
  getFuelLogs: async () => {
    const data = await request<any[]>("/fuel-logs");
    return data.map(f => ({
      id: f.id,
      vehicleId: f.vehicle_id,
      tripId: f.trip_id,
      liters: f.liters,
      cost: f.cost,
      date: f.date
    }));
  },
  createFuelLog: async (data: any) => {
    return await request<any>("/fuel-logs", { 
      method: "POST", 
      body: JSON.stringify({
        vehicle_id: data.vehicleId,
        trip_id: data.tripId,
        liters: data.liters,
        cost: data.cost,
        date: data.date
      }) 
    });
  },
  
  getExpenses: async () => {
    const data = await request<any[]>("/expenses");
    return data.map(e => ({
      id: e.id,
      vehicleId: e.vehicle_id,
      tripId: e.trip_id,
      category: e.category,
      amount: e.amount,
      date: e.date,
      notes: e.notes
    }));
  },
  createExpense: async (data: any) => {
    return await request<any>("/expenses", { 
      method: "POST", 
      body: JSON.stringify({
        vehicle_id: data.vehicleId,
        trip_id: data.tripId,
        category: data.category,
        amount: data.amount,
        date: data.date,
        notes: data.notes
      }) 
    });
  },
};
