import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { RoleGuard } from "@/components/role-guard";
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
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — TransitOps" }] }),
  component: MaintPage,
});

function MaintPage() {
  const { maintenance, vehicles, openMaintenance, closeMaintenance } = useStore();
  const session = useStore((s) => s.session);
  const isFleetManager = session?.role === "Fleet Manager";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", type: "", notes: "", cost: 0 });

  const submit = async () => {
    if (!form.vehicleId || !form.type) return toast.error("Vehicle + type required");
    const r = await openMaintenance(form);
    if (!r.ok) return toast.error(r.error!);
    toast.success("Maintenance opened — vehicle set to In Shop");
    setOpen(false);
    setForm({ vehicleId: "", type: "", notes: "", cost: 0 });
  };

  const openLogs = maintenance.filter((m) => !m.closedAt);
  const closedLogs = maintenance.filter((m) => m.closedAt);

  return (
    <RoleGuard allowedRoles={["Fleet Manager"]}>
      <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="micro-label">Shop floor</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Maintenance</h1>
        </div>
        {isFleetManager && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" /> Open log
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Open maintenance log</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="micro-label">Vehicle</Label>
                  <Select
                    value={form.vehicleId}
                    onValueChange={(v) => setForm({ ...form, vehicleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles
                        .filter((v) => v.status !== "Retired" && v.status !== "In Shop")
                        .map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.reg} — {v.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="micro-label">Type / Issue</Label>
                  <Input
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    placeholder="e.g. Brake repair"
                  />
                </div>
                <div>
                  <Label className="micro-label">Notes</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="micro-label">Cost (₹)</Label>
                  <Input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: +e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit}>Open</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-sm border border-border bg-panel">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="micro-label">Open · {openLogs.length}</span>
            <Wrench className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="divide-y divide-border">
            {openLogs.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId);
              return (
                <div key={m.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{m.type}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {v?.reg} · {v?.name}
                      </div>
                    </div>
                    <span className="text-mono text-xs">₹{m.cost}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.notes}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      OPENED {new Date(m.openedAt).toLocaleDateString()}
                    </span>
                    {isFleetManager && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const r = await closeMaintenance(m.id);
                          if (r.ok) {
                            toast.success("Closed — vehicle restored");
                          } else {
                            toast.error(r.error!);
                          }
                        }}
                      >
                        Close log
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {openLogs.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No open logs.</div>
            )}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-panel">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="micro-label">History · {closedLogs.length}</span>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {closedLogs.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId);
              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{m.type}</div>
                    <span className="text-mono text-xs text-muted-foreground">₹{m.cost}</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{v?.reg}</div>
                </div>
              );
            })}
            {closedLogs.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No history yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
