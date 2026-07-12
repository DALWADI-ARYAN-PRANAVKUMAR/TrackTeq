import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { RoleGuard } from "@/components/role-guard";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Play, CheckCircle2, XCircle, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import type { TripStatus } from "@/lib/types";
import { StateCityFilter } from "@/components/state-city-filter";
import { cityFromLocation, stateFromLocation } from "@/lib/india";

export const Route = createFileRoute("/_authed/trips")({
  head: () => ({ meta: [{ title: "Trips — TransitOps" }] }),
  component: TripsPage,
});

function TripsPage() {
  const { trips, vehicles, drivers, createTrip, setTripStatus } = useStore();
  const session = useStore((s) => s.session);
  const canManageTrips = session?.role === "Fleet Manager" || session?.role === "Driver";
  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [completeData, setCompleteData] = useState({ actualKm: 0, fuelLiters: 0, revenue: 0 });
  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoKg: 0,
    plannedKm: 0,
  });
  const [stateF, setStateF] = useState("all");
  const [cityF, setCityF] = useState("all");

  const columns: { key: TripStatus; label: string; tone: string }[] = [
    { key: "Draft", label: "Draft", tone: "text-muted-foreground" },
    { key: "Dispatched", label: "Dispatched", tone: "text-info" },
    { key: "Completed", label: "Completed", tone: "text-primary" },
    { key: "Cancelled", label: "Cancelled", tone: "text-destructive" },
  ];

  const geoOptions = useMemo(
    () =>
      trips.flatMap((t) => [
        { state: stateFromLocation(t.source), city: cityFromLocation(t.source) },
        { state: stateFromLocation(t.destination), city: cityFromLocation(t.destination) },
      ]),
    [trips],
  );

  const filteredTrips = useMemo(
    () =>
      trips.filter((t) => {
        if (stateF === "all" && cityF === "all") return true;
        const s1 = stateFromLocation(t.source),
          s2 = stateFromLocation(t.destination);
        const c1 = cityFromLocation(t.source),
          c2 = cityFromLocation(t.destination);
        const stateOk = stateF === "all" || s1 === stateF || s2 === stateF;
        const cityOk = cityF === "all" || c1 === cityF || c2 === cityF;
        return stateOk && cityOk;
      }),
    [trips, stateF, cityF],
  );

  const grouped = useMemo(() => {
    const g: Record<TripStatus, typeof trips> = {
      Draft: [],
      Dispatched: [],
      Completed: [],
      Cancelled: [],
    };
    filteredTrips.forEach((t) => g[t.status].push(t));
    return g;
  }, [filteredTrips]);

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter(
    (d) => d.status === "Available" && new Date(d.licenseExpiry) > new Date(),
  );

  const submit = async () => {
    if (!form.source || !form.destination || !form.vehicleId || !form.driverId)
      return toast.error("Fill all fields");
    const r = await createTrip(form);
    if (!r.ok) return toast.error(r.error!);
    toast.success("Trip created as Draft");
    setOpen(false);
    setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoKg: 0, plannedKm: 0 });
  };

  const doDispatch = async (id: string) => {
    const r = await setTripStatus(id, "Dispatched");
    if (r.ok) {
      toast.success("Dispatched — vehicle & driver flipped to On Trip");
    } else {
      toast.error(r.error!);
    }
  };
  const doCancel = async (id: string) => {
    const r = await setTripStatus(id, "Cancelled");
    if (r.ok) {
      toast.success("Trip cancelled");
    } else {
      toast.error(r.error!);
    }
  };
  const doComplete = async () => {
    if (!completing) return;
    const r = await setTripStatus(completing, "Completed", completeData);
    if (r.ok) {
      toast.success("Trip completed — vehicle & driver back to Available");
      setCompleting(null);
      setCompleteData({ actualKm: 0, fuelLiters: 0, revenue: 0 });
    } else {
      toast.error(r.error!);
    }
  };

  return (
    <RoleGuard allowedRoles={["Fleet Manager", "Driver"]}>
      <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Dispatch board</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Trips</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTrips.length} of {trips.length} trips
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <StateCityFilter
            state={stateF}
            city={cityF}
            onState={setStateF}
            onCity={setCityF}
            options={geoOptions}
          />

          {canManageTrips && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create trip</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="micro-label">Source</Label>
                    <Input
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="micro-label">Destination</Label>
                    <Input
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="micro-label">Vehicle</Label>
                    <Select
                      value={form.vehicleId}
                      onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select available" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles
                          .filter((v) => v.status === "Available")
                          .map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.reg} ({v.name})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="micro-label">Driver</Label>
                    <Select
                      value={form.driverId}
                      onValueChange={(v) => setForm({ ...form, driverId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select available" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers
                          .filter((d) => d.status === "Available")
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} (Safety: {d.safetyScore})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="micro-label">Cargo (kg)</Label>
                    <Input
                      type="number"
                      value={form.cargoKg}
                      onChange={(e) => setForm({ ...form, cargoKg: +e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="micro-label">Planned distance (km)</Label>
                    <Input
                      type="number"
                      value={form.plannedKm}
                      onChange={(e) => setForm({ ...form, plannedKm: +e.target.value })}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
                  System enforces: unique reg · capacity ≥ cargo · valid license · no double-booking.
                </div>
                <DialogFooter>
                  <Button onClick={submit}>Create draft</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col.key} className="rounded-sm border border-border bg-panel">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className={`micro-label ${col.tone}`}>{col.label}</span>
              <span className="text-mono text-xs">{grouped[col.key].length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[300px]">
              {grouped[col.key].map((t) => {
                const v = vehicles.find((x) => x.id === t.vehicleId);
                const d = drivers.find((x) => x.id === t.driverId);
                return (
                  <div key={t.id} className="rounded-sm border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-primary">{t.code}</span>
                      <RouteIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="mt-1.5 text-xs font-medium leading-snug">
                      {t.source}
                      <br />
                      <span className="text-muted-foreground">→</span> {t.destination}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{v?.reg}</span>
                      <span>
                        {t.plannedKm}km · {t.cargoKg}kg
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground truncate">{d?.name}</div>
                    <div className="mt-2 flex gap-1">
                      {canManageTrips ? (
                        <>
                          {t.status === "Draft" && (
                            <>
                              <Button
                                size="sm"
                                className="h-6 text-[10px] flex-1"
                                onClick={() => doDispatch(t.id)}
                              >
                                <Play className="h-3 w-3 mr-1" /> Dispatch
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px]"
                                onClick={() => doCancel(t.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {t.status === "Dispatched" && (
                            <>
                              <Button
                                size="sm"
                                className="h-6 text-[10px] flex-1"
                                onClick={() => {
                                  setCompleting(t.id);
                                  setCompleteData({
                                    actualKm: t.plannedKm,
                                    fuelLiters: Math.round(t.plannedKm / 8),
                                    revenue: Math.round(t.plannedKm * 4),
                                  });
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px]"
                                onClick={() => doCancel(t.id)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        t.status !== "Completed" && t.status !== "Cancelled" && (
                          <div className="text-[10px] font-mono text-muted-foreground italic">
                            Read Only
                          </div>
                        )
                      )}
                      {(t.status === "Completed" || t.status === "Cancelled") && t.actualKm && (
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {t.actualKm}km · {t.fuelLiters}L
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {grouped[col.key].length === 0 && (
                <div className="text-center text-[11px] text-muted-foreground py-8">Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!completing} onOpenChange={(v) => !v && setCompleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete trip</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="micro-label">Actual km</Label>
              <Input
                type="number"
                value={completeData.actualKm}
                onChange={(e) => setCompleteData({ ...completeData, actualKm: +e.target.value })}
              />
            </div>
            <div>
              <Label className="micro-label">Fuel (L)</Label>
              <Input
                type="number"
                value={completeData.fuelLiters}
                onChange={(e) => setCompleteData({ ...completeData, fuelLiters: +e.target.value })}
              />
            </div>
            <div>
              <Label className="micro-label">Revenue (₹)</Label>
              <Input
                type="number"
                value={completeData.revenue}
                onChange={(e) => setCompleteData({ ...completeData, revenue: +e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={doComplete}>Mark completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </RoleGuard>
  );
}
