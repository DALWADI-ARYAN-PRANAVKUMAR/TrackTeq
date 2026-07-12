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
  register: (
    email: string,
    pass: string,
    fullName: string,
    role: "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst",
  ) => Promise<{ ok: boolean; error?: string }>;
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
      vehicles: [],
      drivers: [],
      trips: [],
      maintenance: [],
      fuel: [],
      expenses: [],
      theme: "dark",
      reducedMotion: false,

      login: async (email, pass) => {
        try {
          const { user } = await api.login(email, pass);
          set({ session: user });
          await get().sync();
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to log in" };
        }
      },
      register: async (email, pass, fullName, role) => {
        try {
          const { user } = await api.register(email, pass, fullName, role);
          set({ session: user });
          await get().sync();
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to create account" };
        }
      },
      logout: () => {
        clearToken();
        set({
          session: null,
          vehicles: [],
          drivers: [],
          trips: [],
          maintenance: [],
          fuel: [],
          expenses: [],
        });
      },
      setTheme: (t) => set({ theme: t }),
      setReducedMotion: (v) => set({ reducedMotion: v }),

      sync: async () => {
        try {
          const [vehicles, drivers, trips, maintenance, fuel, expenses] = await Promise.all([
            api.getVehicles(),
            api.getDrivers(),
            api.getTrips(),
            api.getMaintenance(),
            api.getFuelLogs(),
            api.getExpenses(),
          ]);
          set({ vehicles, drivers, trips, maintenance, fuel, expenses });
        } catch (e) {
          console.error("Sync failed:", e);
        }
      },

      addVehicle: async (v) => {
        try {
          const newV = await api.createVehicle(v);
          set((s) => ({ vehicles: [newV, ...s.vehicles] }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to register vehicle" };
        }
      },
      updateVehicle: async (id, patch) => {
        try {
          const updatedV = await api.updateVehicle(id, patch);
          set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? updatedV : v)) }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to update vehicle" };
        }
      },
      removeVehicle: async (id) => {
        try {
          await api.deleteVehicle(id);
          set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to delete vehicle" };
        }
      },

      addDriver: async (d) => {
        try {
          const newD = await api.createDriver(d);
          set((s) => ({ drivers: [newD, ...s.drivers] }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to add driver" };
        }
      },
      updateDriver: async (id, patch) => {
        try {
          const updatedD = await api.updateDriver(id, patch);
          set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? updatedD : d)) }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to update driver" };
        }
      },
      removeDriver: async (id) => {
        try {
          await api.deleteDriver(id);
          set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to delete driver" };
        }
      },

      createTrip: async (t) => {
        try {
          const newTrip = await api.createTrip(t);
          set((s) => ({ trips: [newTrip, ...s.trips] }));
          return { ok: true, id: newTrip.id };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to create trip" };
        }
      },
      setTripStatus: async (id, status, extra) => {
        try {
          if (status === "Dispatched") {
            await api.dispatchTrip(id);
          } else if (status === "Completed") {
            const actualKm = extra?.actualKm ?? 0;
            const fuelLiters = extra?.fuelLiters ?? 0;
            await api.completeTrip(id, actualKm, fuelLiters);
          } else if (status === "Cancelled") {
            await api.cancelTrip(id);
          }
          await get().sync();
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to update trip status" };
        }
      },

      openMaintenance: async (m) => {
        try {
          await api.openMaintenance(m.vehicleId, m.notes || m.type, m.cost);
          await get().sync();
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to open maintenance log" };
        }
      },
      closeMaintenance: async (id) => {
        try {
          await api.closeMaintenance(id);
          await get().sync();
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to close maintenance log" };
        }
      },

      addFuel: async (f) => {
        try {
          const newFuel = await api.createFuelLog(f);
          set((s) => ({ fuel: [newFuel, ...s.fuel] }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to log fuel" };
        }
      },
      addExpense: async (e) => {
        try {
          const newExpense = await api.createExpense(e);
          set((s) => ({ expenses: [newExpense, ...s.expenses] }));
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e.message || "Failed to add expense" };
        }
      },

      resetDemo: () => {
        get().sync();
      },
    }),
    { name: "trackteq-v3-live" },
  ),
);
