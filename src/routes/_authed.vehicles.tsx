import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
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
import { Plus, Search, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import type { VehicleType, VehicleStatus } from "@/lib/types";
import { exportCSV } from "@/lib/csv";
import { StateCityFilter } from "@/components/state-city-filter";
import { INDIAN_STATES } from "@/lib/india";

export const Route = createFileRoute("/_authed/vehicles")({
  head: () => ({ meta: [{ title: "Vehicles — TransitOps" }] }),
  component: VehiclesPage,
});

// Common Indian commercial vehicle models — used for autocomplete
const MODEL_SUGGESTIONS = [
  "Tata Ace Gold",
  "Tata Ace HT+",
  "Tata 407",
  "Tata LPT 1109",
  "Tata Signa 4825.TK",
  "Tata Prima 4028.S",
  "Tata Ultra T.7",
  "Ashok Leyland Dost+",
  "Ashok Leyland Bada Dost",
  "Ashok Leyland Partner",
  "Ashok Leyland Ecomet 1015",
  "Ashok Leyland 4225",
  "Ashok Leyland Captain",
  "Mahindra Bolero Pik-Up",
  "Mahindra Jeeto",
  "Mahindra Furio 17",
  "Mahindra Blazo X",
  "Eicher Pro 2049",
  "Eicher Pro 2059",
  "Eicher Pro 3015",
  "Eicher Pro 6055",
  "BharatBenz 1015R",
  "BharatBenz 2823R",
  "BharatBenz 3523R",
  "BharatBenz 4023",
  "Force Traveller Delivery Van",
  "Force Trump 40",
  "SML Isuzu Prestige",
  "SML Isuzu Sartaj GS",
  "VE Volvo FM 400",
  "Scania G410",
  "MAN CLA 25.220 EVO",
];

function VehiclesPage() {
  const { vehicles, addVehicle, removeVehicle } = useStore();
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [cityF, setCityF] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reg: "",
    name: "",
    type: "Van" as VehicleType,
    capacityKg: 500,
    odometer: 0,
    acquisitionCost: 800000,
    status: "Available" as VehicleStatus,
    region: "Maharashtra",
  });

  const options = useMemo(
    () => vehicles.map((v) => ({ state: v.region, city: null as string | null })),
    [vehicles],
  );

  const filtered = vehicles.filter((v) => {
    const matchQ = [v.reg, v.name, v.type, v.region]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchState = stateF === "all" || v.region === stateF;
    return matchQ && matchState;
  });

  const submit = async () => {
    if (!form.reg || !form.name) return toast.error("Registration and name required");
    const r = await addVehicle(form);
    if (!r.ok) return toast.error(r.error!);
    toast.success(`Vehicle ${form.reg} registered`);
    setOpen(false);
    setForm({
      reg: "",
      name: "",
      type: "Van",
      capacityKg: 500,
      odometer: 0,
      acquisitionCost: 800000,
      status: "Available",
      region: "Maharashtra",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Registry</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {vehicles.length} units
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              list="vehicle-models"
              placeholder="Search reg, name, model…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-9 w-64 font-mono text-xs"
            />
            <datalist id="vehicle-models">
              {MODEL_SUGGESTIONS.map((m) => (
                <option key={m} value={m} />
              ))}
              {vehicles.map((v) => (
                <option key={v.id} value={v.reg} />
              ))}
            </datalist>
          </div>
          <StateCityFilter
            state={stateF}
            city={cityF}
            onState={setStateF}
            onCity={setCityF}
            options={options}
          />
          <Button variant="outline" size="sm" onClick={() => exportCSV("vehicles.csv", filtered)}>
            <FileText className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" /> Register vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register vehicle</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="micro-label">Registration</Label>
                  <Input
                    value={form.reg}
                    onChange={(e) => setForm({ ...form, reg: e.target.value.toUpperCase() })}
                    className="font-mono"
                    placeholder="MH 12 AB 4521"
                  />
                </div>
                <div>
                  <Label className="micro-label">Name / Model</Label>
                  <Input
                    list="model-suggest"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Tata Ace Gold"
                  />
                  <datalist id="model-suggest">
                    {MODEL_SUGGESTIONS.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label className="micro-label">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as VehicleType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Van", "Truck", "Semi", "Pickup", "Refrigerated"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="micro-label">State</Label>
                  <Select
                    value={form.region}
                    onValueChange={(v) => setForm({ ...form, region: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="micro-label">Capacity (kg)</Label>
                  <Input
                    type="number"
                    value={form.capacityKg}
                    onChange={(e) => setForm({ ...form, capacityKg: +e.target.value })}
                  />
                </div>
                <div>
                  <Label className="micro-label">Odometer (km)</Label>
                  <Input
                    type="number"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: +e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="micro-label">Acquisition Cost (₹)</Label>
                  <Input
                    type="number"
                    value={form.acquisitionCost}
                    onChange={(e) => setForm({ ...form, acquisitionCost: +e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit}>Register</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr className="text-left">
              {["Reg", "Model", "Type", "State", "Capacity", "Odometer", "Cost", "Status", ""].map(
                (h) => (
                  <th key={h} className="px-4 py-2 micro-label">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{v.reg}</td>
                <td className="px-4 py-2.5">{v.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.type}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.region}</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {v.capacityKg.toLocaleString()} kg
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{v.odometer.toLocaleString()} km</td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  ₹{v.acquisitionCost.toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill status={v.status} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const r = await removeVehicle(v.id);
                      if (r.ok) {
                        toast.success("Removed");
                      } else {
                        toast.error(r.error!);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No vehicles match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
