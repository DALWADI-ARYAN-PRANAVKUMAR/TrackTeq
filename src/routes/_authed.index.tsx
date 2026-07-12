import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { KpiCard } from "@/components/kpi-card";
import { StatusPill } from "@/components/status-pill";
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route as RouteIcon,
  Clock,
  Users,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RouteMap } from "@/components/route-map";
import { INDIAN_STATES } from "@/lib/india";

export const Route = createFileRoute("/_authed/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TrackTeq" },
      { name: "description", content: "Live fleet KPIs, active dispatch and operational alerts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { vehicles, drivers, trips } = useStore();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const filteredV = vehicles.filter(
    (v) =>
      (typeFilter === "all" || v.type === typeFilter) &&
      (statusFilter === "all" || v.status === statusFilter) &&
      (regionFilter === "all" || v.region === regionFilter),
  );

  const active = filteredV.filter((v) => v.status === "On Trip").length;
  const available = filteredV.filter((v) => v.status === "Available").length;
  const inShop = filteredV.filter((v) => v.status === "In Shop").length;
  const retired = filteredV.filter((v) => v.status === "Retired").length;
  const total = filteredV.length || 1;
  const utilization = Math.round((active / total) * 100);
  const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
  const pendingTrips = trips.filter((t) => t.status === "Draft").length;
  const onDuty = drivers.filter((d) => d.status === "On Trip" || d.status === "Available").length;

  const statusData = [
    { name: "Available", value: available, color: "var(--chart-1)" },
    { name: "On Trip", value: active, color: "var(--chart-2)" },
    { name: "In Shop", value: inShop, color: "var(--chart-3)" },
    { name: "Retired", value: retired, color: "var(--chart-5)" },
  ];

  const tripsPerDay = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(5, 10)] = 0;
    }
    trips.forEach((t) => {
      const k = t.createdAt.slice(5, 10);
      if (k in buckets) buckets[k]++;
    });
    return Object.entries(buckets).map(([day, count]) => ({ day, count }));
  }, [trips]);

  const alerts = [
    ...drivers
      .map((d) => ({
        d,
        days: Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400_000),
      }))
      .filter((x) => x.days < 45)
      .map((x) => ({
        kind: x.days < 0 ? "critical" : ("warn" as const),
        title: `License ${x.days < 0 ? "expired" : "expiring"}`,
        detail: `${x.d.name} · ${x.d.license}`,
        meta: `${x.days < 0 ? `${-x.days}d ago` : `in ${x.days}d`}`,
      })),
    ...vehicles
      .filter((v) => v.status === "In Shop")
      .map((v) => ({
        kind: "info" as const,
        title: "In maintenance",
        detail: `${v.reg} · ${v.name}`,
        meta: "IN SHOP",
      })),
  ].slice(0, 6);

  const activeFeed = trips.filter((t) => t.status === "Dispatched");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Overview / T+00:00:00</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Operations Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {["Van", "Truck", "Semi", "Pickup", "Refrigerated"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["Available", "On Trip", "In Shop", "Retired"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {INDIAN_STATES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Active Vehicles" value={active} icon={Truck} tone="info" />
        <KpiCard label="Available" value={available} icon={CheckCircle2} tone="primary" />
        <KpiCard label="In Shop" value={inShop} icon={Wrench} tone="accent" />
        <KpiCard label="Active Trips" value={activeTrips} icon={RouteIcon} tone="info" />
        <KpiCard label="Pending Trips" value={pendingTrips} icon={Clock} />
        <KpiCard label="Drivers On Duty" value={onDuty} icon={Users} tone="primary" />
        <KpiCard label="Utilization" value={utilization} unit="%" icon={Gauge} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-sm border border-border bg-panel p-4">
          <div className="flex items-center justify-between">
            <span className="micro-label">Fleet Status Distribution</span>
            <span className="text-mono text-xs text-muted-foreground">{total} units</span>
          </div>
          <div className="mt-2 h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={80}
                  stroke="none"
                >
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.20 0.010 130)",
                    border: "1px solid oklch(0.30 0.010 130)",
                    borderRadius: 2,
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-mono">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  {d.name}
                </span>
                <span className="ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-panel p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="micro-label">Trips Created — Last 7 Days</span>
            <span className="text-mono text-xs text-primary">{trips.length} total</span>
          </div>
          <div className="mt-2 h-56">
            <ResponsiveContainer>
              <BarChart data={tripsPerDay}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: 2,
                    fontSize: 11,
                  }}
                  cursor={{ fill: "var(--chart-1) / 0.1" }}
                />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <RouteMap />
        </div>
        <div className="lg:col-span-2 rounded-md border border-border bg-panel">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="micro-label">Live Dispatch Feed</span>
            <span className="text-mono text-[11px] text-primary">● {activeFeed.length} ACTIVE</span>
          </div>
          <div className="divide-y divide-border">
            {activeFeed.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No trips currently dispatched.
              </div>
            )}
            {activeFeed.map((t) => {
              const v = vehicles.find((x) => x.id === t.vehicleId);
              const d = drivers.find((x) => x.id === t.driverId);
              return (
                <div key={t.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm">
                  <div className="col-span-2 font-mono text-xs text-primary">{t.code}</div>
                  <div className="col-span-5">
                    <div className="font-medium">
                      {t.source} <span className="text-muted-foreground">→</span> {t.destination}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {t.plannedKm}km · {t.cargoKg}kg
                    </div>
                  </div>
                  <div className="col-span-2 text-xs">
                    <div className="font-mono">{v?.reg}</div>
                    <div className="text-muted-foreground text-[10px]">{v?.name}</div>
                  </div>
                  <div className="col-span-2 text-xs">
                    <div>{d?.name}</div>
                    <div className="text-muted-foreground text-[10px] font-mono">{d?.license}</div>
                  </div>
                  <div className="col-span-1">
                    <StatusPill status={t.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="micro-label">Alerts</span>
          <AlertTriangle className="h-3.5 w-3.5 text-accent" />
        </div>
        <div className="divide-y divide-border">
          {alerts.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">All clear.</div>
          )}
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <span
                className={`mt-1 h-2 w-2 rounded-full ${
                  a.kind === "critical"
                    ? "bg-destructive"
                    : a.kind === "warn"
                      ? "bg-warn"
                      : "bg-info"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-[11px] text-muted-foreground truncate font-mono">
                  {a.detail}
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                {a.meta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
