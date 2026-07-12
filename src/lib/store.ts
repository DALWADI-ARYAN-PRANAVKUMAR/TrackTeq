/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  Session,
  TripStatus,
} from "./types";
import {
  seedVehicles,
  seedDrivers,
  seedTrips,
  seedMaintenance,
  seedFuel,
  seedExpenses,
} from "./seed";
import { api, clearToken } from "./api";

interface State {
  session: Session | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuel: FuelLog[];
  expenses: Expense[];
  theme: "dark" | "light";
  reducedMotion: boolean;
  login: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setTheme: (t: "dark" | "light") => void;
  setReducedMotion: (v: boolean) => void;
  addVehicle: (v: Omit<Vehicle, "id">) => Promise<{ ok: boolean; error?: string }>;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Promise<{ ok: boolean; error?: string }>;
  removeVehicle: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addDriver: (d: Omit<Driver, "id">) => Promise<{ ok: boolean; error?: string }>;
  updateDriver: (id: string, patch: Partial<Driver>) => Promise<{ ok: boolean; error?: string }>;
  removeDriver: (id: string) => Promise<{ ok: boolean; error?: string }>;
  createTrip: (
    t: Omit<Trip, "id" | "code" | "status" | "createdAt">,
  ) => Promise<{ ok: boolean; error?: string; id?: string }>;
  setTripStatus: (
    id: string,
    status: TripStatus,
    extra?: { actualKm?: number; fuelLiters?: number; revenue?: number },
  ) => Promise<{ ok: boolean; error?: string }>;
  openMaintenance: (
    m: Omit<MaintenanceLog, "id" | "openedAt">,
  ) => Promise<{ ok: boolean; error?: string }>;
  closeMaintenance: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addFuel: (f: Omit<FuelLog, "id">) => Promise<{ ok: boolean; error?: string }>;
  addExpense: (e: Omit<Expense, "id">) => Promise<{ ok: boolean; error?: string }>;
  sync: () => Promise<void>;
  resetDemo: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      session: null,
      vehicles: seedVehicles,
      drivers: seedDrivers,
      trips: seedTrips,
      maintenance: seedMaintenance,
      fuel: seedFuel,
      expenses: seedExpenses,
      theme: "dark",
      reducedMotion: false,

      login: async (email, pass) => {
        const roleMap: Record<string, any> = {
          "fleet@transitops.com": "Fleet Manager",
          "driver@transitops.com": "Driver",
          "safety@transitops.com": "Safety Officer",
          "finance@transitops.com": "Financial Analyst",
        };
        const user = {
          email,
          name: email.split("@")[0].toUpperCase(),
          role: roleMap[email] || "Fleet Manager",
        };
        set({ session: user });
        return { ok: true };
      },
      logout: () => {
        clearToken();
        set({
          session: null,
          vehicles: seedVehicles,
          drivers: seedDrivers,
          trips: seedTrips,
          maintenance: seedMaintenance,
          fuel: seedFuel,
          expenses: seedExpenses,
        });
      },
      setTheme: (t) => set({ theme: t }),
      setReducedMotion: (v) => set({ reducedMotion: v }),

      sync: async () => {
        // Local mode: do nothing. Persisted state handles everything.
      },

      addVehicle: async (v) => {
        const newV = { ...v, id: Math.random().toString(36).slice(2) } as Vehicle;
        set((s) => ({ vehicles: [newV, ...s.vehicles] }));
        return { ok: true };
      },
      updateVehicle: async (id, patch) => {
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
        return { ok: true };
      },
      removeVehicle: async (id) => {
        set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
        return { ok: true };
      },

      addDriver: async (d) => {
        const newD = { ...d, id: Math.random().toString(36).slice(2) } as Driver;
        set((s) => ({ drivers: [newD, ...s.drivers] }));
        return { ok: true };
      },
      updateDriver: async (id, patch) => {
        set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
        return { ok: true };
      },
      removeDriver: async (id) => {
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) }));
        return { ok: true };
      },

      createTrip: async (t) => {
        const id = Math.random().toString(36).slice(2);
        const newT: Trip = {
          ...t,
          id,
          code: "TRP-" + id.slice(0, 4).toUpperCase(),
          status: "Draft",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ trips: [newT, ...s.trips] }));
        return { ok: true, id };
      },
      setTripStatus: async (id, status, extra) => {
        set((s) => ({
          trips: s.trips.map((t) => {
            if (t.id === id) {
              const base = { ...t, status };
              if (status === "Dispatched") base.dispatchedAt = new Date().toISOString();
              if (status === "Completed") base.completedAt = new Date().toISOString();
              if (extra) Object.assign(base, extra);
              return base;
            }
            return t;
          }),
        }));
        return { ok: true };
      },

      openMaintenance: async (m) => {
        const newM: MaintenanceLog = {
          ...m,
          id: Math.random().toString(36).slice(2),
          openedAt: new Date().toISOString(),
        };
        set((s) => ({ maintenance: [newM, ...s.maintenance] }));
        return { ok: true };
      },
      closeMaintenance: async (id) => {
        set((s) => ({
          maintenance: s.maintenance.map((m) =>
            m.id === id ? { ...m, closedAt: new Date().toISOString() } : m
          ),
        }));
        return { ok: true };
      },

      addFuel: async (f) => {
        const newF: FuelLog = { ...f, id: Math.random().toString(36).slice(2) };
        set((s) => ({ fuel: [newF, ...s.fuel] }));
        return { ok: true };
      },
      addExpense: async (e) => {
        const newE: Expense = { ...e, id: Math.random().toString(36).slice(2) };
        set((s) => ({ expenses: [newE, ...s.expenses] }));
        return { ok: true };
      },

      resetDemo: () => {
        get().sync();
      },
    }),
    { name: "transitops-v2-in" },
  ),
);
