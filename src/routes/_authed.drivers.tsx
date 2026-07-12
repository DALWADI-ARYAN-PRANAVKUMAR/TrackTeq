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
import { Plus, FileText, ShieldAlert, Search } from "lucide-react";
import { toast } from "sonner";
import { exportCSV } from "@/lib/csv";
import type { DriverStatus } from "@/lib/types";
import { StateCityFilter } from "@/components/state-city-filter";
import { INDIAN_STATES } from "@/lib/india";

export const Route = createFileRoute("/_authed/drivers")({
  head: () => ({ meta: [{ title: "Drivers — TransitOps" }] }),
  component: DriversPage,
});

function DriversPage() {
  const { drivers, addDriver, updateDriver } = useStore();
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [cityF, setCityF] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    license: "",
    licenseCategory: "HMV",
    licenseExpiry: "",
    phone: "",
    safetyScore: 85,
    status: "Available" as DriverStatus,
    region: "Maharashtra",
  });

  const options = useMemo(
    () => drivers.map((d) => ({ state: d.region ?? null, city: null as string | null })),
    [drivers],
  );

  const filtered = drivers.filter((d) => {
    const matchQ = [d.name, d.license, d.licenseCategory, d.region ?? "", d.phone]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase());
    const matchState = stateF === "all" || d.region === stateF;
    return matchQ && matchState;
  });

  const submit = async () => {
    if (!form.name || !form.license || !form.licenseExpiry)
      return toast.error("All fields required");
    const r = await addDriver(form);
    if (!r.ok) return toast.error(r.error!);
    toast.success(`Driver ${form.name} added`);
    setOpen(false);
    setForm({
      name: "",
      license: "",
      licenseCategory: "HMV",
      licenseExpiry: "",
      phone: "",
      safetyScore: 85,
      status: "Available",
      region: "Maharashtra",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Roster</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Drivers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {drivers.length} in roster
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              list="driver-suggest"
              placeholder="Search name, license, phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 h-9 w-64 font-mono text-xs"
            />
            <datalist id="driver-suggest">
              {drivers.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
              {drivers.map((d) => (
                <option key={d.license} value={d.license} />
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
          <Button variant="outline" size="sm" onClick={() => exportCSV("drivers.csv", filtered)}>
            <FileText className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add driver</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="micro-label">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="micro-label">License #</Label>
                  <Input
                    value={form.license}
                    onChange={(e) => setForm({ ...form, license: e.target.value })}
                    className="font-mono"
                    placeholder="MH14 20230011029"
                  />
                </div>
                <div>
                  <Label className="micro-label">Category</Label>
                  <Select
                    value={form.licenseCategory}
                    onValueChange={(v) => setForm({ ...form, licenseCategory: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["LMV", "HMV", "HTV", "HPMV", "TRANS"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="micro-label">Expiry</Label>
                  <Input
                    type="date"
                    value={form.licenseExpiry}
                    onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="micro-label">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98xxx xxxxx"
                  />
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
                  <Label className="micro-label">Safety score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.safetyScore}
                    onChange={(e) => setForm({ ...form, safetyScore: +e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((d) => {
          const days = Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400_000);
          const expired = days < 0;
          const soon = days >= 0 && days < 45;
          return (
            <div key={d.id} className="rounded-md border border-border bg-panel p-4 hover-lift">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {d.license} · {d.licenseCategory}
                  </div>
                  {d.region && (
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
                      {d.region}
                    </div>
                  )}
                </div>
                <StatusPill status={d.status} />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="micro-label">Safety</span>
                  <span className="font-mono">{d.safetyScore}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${d.safetyScore}%`,
                      background:
                        d.safetyScore >= 85
                          ? "var(--color-primary)"
                          : d.safetyScore >= 70
                            ? "var(--color-warn)"
                            : "var(--color-destructive)",
                    }}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="text-[11px]">
                  <div className="micro-label">License expires</div>
                  <div
                    className={`font-mono mt-0.5 ${expired ? "text-destructive" : soon ? "text-warn" : ""}`}
                  >
                    {expired ? `Expired ${-days}d ago` : `${days}d — ${d.licenseExpiry}`}
                  </div>
                </div>
                {(expired || d.status === "Suspended") && (
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="mt-3 flex gap-1">
                {(["Available", "Off Duty", "Suspended"] as DriverStatus[]).map((s) => (
                  <Button
                    key={s}
                    variant={d.status === s ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-[10px] font-mono uppercase"
                    disabled={d.status === "On Trip"}
                    onClick={async () => {
                      const r = await updateDriver(d.id, { status: s });
                      if (!r.ok) toast.error(r.error!);
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-10">
            No drivers match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
