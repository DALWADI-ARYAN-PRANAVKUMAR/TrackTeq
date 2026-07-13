import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Fuel, DollarSign, Droplets, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportCSV } from "@/lib/csv";

export const Route = createFileRoute("/_authed/fuel")({
  head: () => ({ meta: [{ title: "Fuel & Expenses — Track-Teq" }] }),
  component: FuelPage,
});

function FuelPage() {
  const { fuel, expenses, vehicles, maintenance, addFuel, addExpense } = useStore();
  const [openF, setOpenF] = useState(false);
  const [openE, setOpenE] = useState(false);
  const [ff, setFF] = useState({ vehicleId: "", liters: 0, cost: 0, date: new Date().toISOString().slice(0, 10) });
  const [ef, setEF] = useState({ vehicleId: "", category: "Toll" as const, amount: 0, date: new Date().toISOString().slice(0, 10), notes: "" });

  const totalLiters = fuel.reduce((s, f) => s + f.liters, 0);
  const totalFuelCost = fuel.reduce((s, f) => s + f.cost, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMaint = maintenance.reduce((s, m) => s + m.cost, 0);

  const perVehicle = useMemo(() => {
    return vehicles.map((v) => {
      const f = fuel.filter((x) => x.vehicleId === v.id);
      const e = expenses.filter((x) => x.vehicleId === v.id);
      const m = maintenance.filter((x) => x.vehicleId === v.id);
      const fuelCost = f.reduce((s, x) => s + x.cost, 0);
      const maintCost = m.reduce((s, x) => s + x.cost, 0);
      const expCost = e.reduce((s, x) => s + x.amount, 0);
      return { ...v, fuelCost, maintCost, expCost, total: fuelCost + maintCost + expCost, liters: f.reduce((s, x) => s + x.liters, 0) };
    }).sort((a, b) => b.total - a.total);
  }, [vehicles, fuel, expenses, maintenance]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Cost tracking</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Fuel & Expenses</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV("fuel-logs.csv", fuel)}>
            <FileText className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Dialog open={openE} onOpenChange={setOpenE}>
            <DialogTrigger asChild><Button size="sm" variant="outline">Add expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="micro-label">Vehicle</Label>
                  <Select value={ef.vehicleId} onValueChange={(v) => setEF({ ...ef, vehicleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.reg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="micro-label">Category</Label>
                  <Select value={ef.category} onValueChange={(v) => setEF({ ...ef, category: v as typeof ef.category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Toll", "Parking", "Fine", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="micro-label">Amount (₹)</Label><Input type="number" value={ef.amount} onChange={(e) => setEF({ ...ef, amount: +e.target.value })} /></div>
                <div className="col-span-2"><Label className="micro-label">Date</Label><Input type="date" value={ef.date} onChange={(e) => setEF({ ...ef, date: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={async () => { if (!ef.vehicleId) return toast.error("Pick vehicle"); const r = await addExpense(ef); if(!r.ok) return toast.error(r.error!); toast.success("Expense added"); setOpenE(false); }}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={openF} onOpenChange={setOpenF}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Log fuel</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log fuel</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="micro-label">Vehicle</Label>
                  <Select value={ff.vehicleId} onValueChange={(v) => setFF({ ...ff, vehicleId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.reg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="micro-label">Liters</Label><Input type="number" value={ff.liters} onChange={(e) => setFF({ ...ff, liters: +e.target.value })} /></div>
                <div><Label className="micro-label">Cost (₹)</Label><Input type="number" value={ff.cost} onChange={(e) => setFF({ ...ff, cost: +e.target.value })} /></div>
                <div className="col-span-2"><Label className="micro-label">Date</Label><Input type="date" value={ff.date} onChange={(e) => setFF({ ...ff, date: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={async () => { if (!ff.vehicleId || !ff.liters) return toast.error("Vehicle & liters"); const r = await addFuel(ff); if(!r.ok) return toast.error(r.error!); toast.success("Fuel logged"); setOpenF(false); }}>Log</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Fuel Consumed" value={totalLiters.toLocaleString()} unit="L" icon={Droplets} tone="info" />
        <KpiCard label="Fuel Cost" value={`₹${totalFuelCost.toLocaleString()}`} icon={Fuel} tone="primary" />
        <KpiCard label="Maintenance" value={`₹${totalMaint.toLocaleString()}`} icon={DollarSign} tone="accent" />
        <KpiCard label="Other Expenses" value={`₹${totalExpense.toLocaleString()}`} icon={DollarSign} />
      </div>

      <div className="rounded-sm border border-border bg-panel">
        <div className="border-b border-border px-4 py-3 micro-label">Operational Cost by Vehicle</div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/30">
            <tr>{["Reg", "Model", "Fuel (L)", "Fuel ₹", "Maint ₹", "Other ₹", "Total"].map((h) => (
              <th key={h} className="px-4 py-2 text-left micro-label">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {perVehicle.map((v) => (
              <tr key={v.id} className="hover:bg-secondary/20">
                <td className="px-4 py-2 font-mono text-xs text-primary">{v.reg}</td>
                <td className="px-4 py-2">{v.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{v.liters}</td>
                <td className="px-4 py-2 font-mono text-xs">₹{v.fuelCost.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">₹{v.maintCost.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs">₹{v.expCost.toLocaleString()}</td>
                <td className="px-4 py-2 font-mono text-xs text-primary">₹{v.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
