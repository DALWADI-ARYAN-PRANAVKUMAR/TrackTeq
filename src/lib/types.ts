export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type Role = "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst";
export type VehicleType = "Van" | "Truck" | "Semi" | "Pickup" | "Refrigerated";

export interface Vehicle {
  id: string;
  reg: string;
  name: string;
  type: VehicleType;
  capacityKg: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  documents?: { name: string; expires?: string }[];
}

export interface Driver {
  id: string;
  name: string;
  license: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date
  phone: string;
  safetyScore: number; // 0-100
  status: DriverStatus;
  region?: string; // Indian state (e.g. "Maharashtra")
}

export interface Trip {
  id: string;
  code: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoKg: number;
  plannedKm: number;
  actualKm?: number;
  fuelLiters?: number;
  revenue?: number;
  status: TripStatus;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  notes: string;
  cost: number;
  openedAt: string;
  closedAt?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  vehicleId?: string;
  tripId?: string;
  category: "Toll" | "Parking" | "Fine" | "Other";
  amount: number;
  date: string;
  notes?: string;
}

export interface Session {
  role: Role;
  name: string;
  email: string;
}
