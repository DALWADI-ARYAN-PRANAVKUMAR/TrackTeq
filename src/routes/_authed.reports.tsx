import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { FileText, Gauge, Fuel, TrendingUp, DollarSign, Download, MapPin } from "lucide-react";
import { exportCSV } from "@/lib/csv";
import { cityFromLocation, stateFromLocation } from "@/lib/india";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authed/reports")({
  head: () => ({ meta: [{ title: "Reports — TransitOps" }] }),
  component: Reports,
});

function Reports() {
  const { vehicles, drivers, trips, fuel, maintenance } = useStore();

  const perVehicle = useMemo(
    () =>
      vehicles.map((v) => {
        const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "Completed");
        const km = vTrips.reduce((s, t) => s + (t.actualKm ?? 0), 0);
        const revenue = vTrips.reduce((s, t) => s + (t.revenue ?? 0), 0);
        const fuelL = fuel.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.liters, 0);
        const fuelC = fuel.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
        const maintC = maintenance
          .filter((m) => m.vehicleId === v.id)
          .reduce((s, m) => s + m.cost, 0);
        const efficiency = fuelL > 0 ? +(km / fuelL).toFixed(2) : 0;
        const opCost = fuelC + maintC;
        const roi =
          v.acquisitionCost > 0 ? +(((revenue - opCost) / v.acquisitionCost) * 100).toFixed(2) : 0;
        return {
          reg: v.reg,
          model: v.name,
          type: v.type,
          state: v.region ?? "",
          city: "",
          km,
          revenue,
          fuelLiters: fuelL,
          opCost,
          efficiencyKmPerL: efficiency,
          roiPercent: roi,
        };
      }),
    [vehicles, trips, fuel, maintenance],
  );

  const dispatchSummary = useMemo(
    () =>
      trips.map((t) => {
        const v = vehicles.find((x) => x.id === t.vehicleId);
        const d = drivers.find((x) => x.id === t.driverId);
        return {
          tripCode: t.code,
          status: t.status,
          sourceCity: cityFromLocation(t.source) ?? "",
          sourceState: stateFromLocation(t.source) ?? "",
          destinationCity: cityFromLocation(t.destination) ?? "",
          destinationState: stateFromLocation(t.destination) ?? "",
          plannedKm: t.plannedKm,
          actualKm: t.actualKm ?? "",
          cargoKg: t.cargoKg,
          fuelLiters: t.fuelLiters ?? "",
          revenueINR: t.revenue ?? "",
          vehicleReg: v?.reg ?? "",
          vehicleModel: v?.name ?? "",
          vehicleState: v?.region ?? "",
          driverName: d?.name ?? "",
          driverLicense: d?.license ?? "",
          driverState: d?.region ?? "",
          createdAt: t.createdAt,
          dispatchedAt: t.dispatchedAt ?? "",
          completedAt: t.completedAt ?? "",
        };
      }),
    [trips, vehicles, drivers],
  );

  // Blank dispatch template — a downloadable CSV skeleton for planning.
  const dispatchTemplate = [
    {
      tripCode: "TRP-XXXX",
      status: "Draft",
      sourceCity: "Mumbai",
      sourceState: "Maharashtra",
      destinationCity: "Pune",
      destinationState: "Maharashtra",
      plannedKm: 0,
      actualKm: "",
      cargoKg: 0,
      fuelLiters: "",
      revenueINR: "",
      vehicleReg: "MH 12 AB 0000",
      vehicleModel: "Tata Ace Gold",
      vehicleState: "Maharashtra",
      driverName: "",
      driverLicense: "",
      driverState: "",
      createdAt: new Date().toISOString(),
      dispatchedAt: "",
      completedAt: "",
    },
  ];

  const fleetUtil = Math.round(
    (vehicles.filter((v) => v.status === "On Trip").length / (vehicles.length || 1)) * 100,
  );
  const avgEff = +(
    perVehicle.filter((x) => x.efficiencyKmPerL > 0).reduce((s, x) => s + x.efficiencyKmPerL, 0) /
    (perVehicle.filter((x) => x.efficiencyKmPerL > 0).length || 1)
  ).toFixed(2);
  const totalCost = perVehicle.reduce((s, x) => s + x.opCost, 0);
  const totalRev = perVehicle.reduce((s, x) => s + x.revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Analytics</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Reports</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV("fleet-report.csv", perVehicle)}
          >
            <FileText className="h-3.5 w-3.5 mr-1" /> Fleet CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV("dispatch-summary.csv", dispatchSummary)}
          >
            <MapPin className="h-3.5 w-3.5 mr-1" /> Dispatch summary
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportCSV("dispatch-template.csv", dispatchTemplate)}
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Dispatch template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Fleet Utilization" value={fleetUtil} unit="%" icon={Gauge} tone="primary" />
        <KpiCard label="Avg Efficiency" value={avgEff} unit="km/L" icon={Fuel} tone="info" />
        <KpiCard
          label="Total Revenue"
          value={`₹${totalRev.toLocaleString()}`}
          icon={TrendingUp}
          tone="primary"
        />
        <KpiCard
          label="Op Cost"
          value={`₹${totalCost.toLocaleString()}`}
          icon={DollarSign}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-md border border-border bg-panel p-4">
          <div className="micro-label">Fuel Efficiency (km/L)</div>
          <div className="h-72 mt-2">
            <ResponsiveContainer>
              <BarChart data={perVehicle.filter((x) => x.efficiencyKmPerL > 0)}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="reg"
                  stroke="var(--color-muted-foreground)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-panel)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="efficiencyKmPerL" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border border-border bg-panel p-4">
          <div className="micro-label">Operational Cost vs Revenue</div>
          <div className="h-72 mt-2">
            <ResponsiveContainer>
              <BarChart data={perVehicle}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="reg"
                  stroke="var(--color-muted-foreground)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-panel)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="opCost" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border border-border bg-panel p-4 lg:col-span-2">
          <div className="micro-label">Vehicle ROI (%)</div>
          <div className="h-64 mt-2">
            <ResponsiveContainer>
              <LineChart data={perVehicle}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="reg"
                  stroke="var(--color-muted-foreground)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-panel)",
                    border: "1px solid var(--color-border)",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="roiPercent"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-primary)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel overflow-hidden">
        <div className="border-b border-border px-4 py-3 micro-label">
          Per-Vehicle Report (with state)
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>
              {["Reg", "Model", "State", "Km", "Revenue", "Op Cost", "km/L", "ROI %"].map((h) => (
                <th key={h} className="px-4 py-2 text-left micro-label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {perVehicle.map((v) => (
              <tr key={v.reg}>
                <td className="px-4 py-2 font-mono text-xs text-primary">{v.reg}</td>
                <td className="px-4 py-2">{v.model}</td>
                <td className="px-4 py-2 text-muted-foreground text-xs">{v.state}</td>
                <td className="px-4 py-2 font-mono text-xs">{v.km.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">₹{v.revenue.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">₹{v.opCost.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">{v.efficiencyKmPerL || "—"}</td>
                <td
                  className={`px-4 py-2 font-mono text-xs ${v.roiPercent > 0 ? "text-primary" : v.roiPercent < 0 ? "text-destructive" : ""}`}
                >
                  {v.roiPercent ? `${v.roiPercent}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
