import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Truck, ShieldCheck, Wallet, User } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Track-Teq — Create Account" },
      { name: "description", content: "Create an account in the Track-Teq fleet operations terminal." },
    ],
  }),
  component: Signup,
});

const roles: { role: Role; icon: typeof Truck; blurb: string }[] = [
  { role: "Fleet Manager", icon: Truck, blurb: "Full fleet & maintenance access" },
  { role: "Driver", icon: User, blurb: "Trip creation & active deliveries" },
  { role: "Safety Officer", icon: ShieldCheck, blurb: "Driver compliance & safety" },
  { role: "Financial Analyst", icon: Wallet, blurb: "Costs, fuel & profitability" },
];

function Signup() {
  const [name, setName] = useState("Jane Doe");
  const [email, setEmail] = useState("jane@transitops.com");
  const [pw, setPw] = useState("fleet123");
  const [role, setRole] = useState<Role>("Fleet Manager");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useStore((s) => s.register);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await register(name, email, pw, role);
    setLoading(false);
    if (res.ok) {
      navigate({ to: "/" });
    } else {
      setError(res.error || "Registration failed");
    }
  };

  return (
    <div className="relative min-h-screen w-full grid-bg dark bg-background text-foreground">
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-10">
        <div className="flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-sm bg-primary/15 border border-primary/40">
              <Radio className="h-4 w-4 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold tracking-tight">TRACK-TEQ</div>
              <div className="micro-label text-[9px]">FLEET // OPS TERMINAL v1.4</div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="micro-label mb-3">SYSTEM STATUS</div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-tight">
              Dispatch, monitor,<br />
              <span className="text-primary">move freight.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              A command-center for your fleet — vehicles, drivers, trips, maintenance, fuel and analytics
              in one operational surface. Business rules enforced. Zero spreadsheets.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                ["12", "VEHICLES"], ["10", "DRIVERS"], ["03", "ACTIVE"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-sm border border-border bg-panel p-3">
                  <div className="text-mono text-2xl font-semibold text-primary">{n}</div>
                  <div className="micro-label mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono text-muted-foreground">
            NODE-01 · REGION-NA · UPTIME 42d 06h · TLS OK
          </div>
        </div>

        <div className="flex items-center">
          <form onSubmit={submit} className="w-full rounded-sm border border-border bg-panel p-6 md:p-8 shadow-2xl">
            <div className="micro-label">Registration</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">Create account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Select role and register your credentials.</p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = role === r.role;
                return (
                  <button
                    type="button"
                    key={r.role}
                    onClick={() => setRole(r.role)}
                    className={`flex flex-col items-start gap-1 rounded-sm border p-3 text-left transition-colors ${
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-semibold">{r.role}</div>
                    <div className="text-[10px] text-muted-foreground">{r.blurb}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <Label htmlFor="name" className="micro-label">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 font-mono" />
              </div>
              <div>
                <Label htmlFor="email" className="micro-label">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 font-mono" />
              </div>
              <div>
                <Label htmlFor="pw" className="micro-label">Password</Label>
                <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1 font-mono" />
              </div>
            </div>

            {error && <div className="mt-4 text-xs font-mono text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{error}</div>}

            <Button type="submit" disabled={loading} className="mt-6 w-full h-11 font-mono uppercase tracking-widest text-xs">
              {loading ? "Registering..." : "Create account →"}
            </Button>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-[10px] font-mono text-muted-foreground">
              </div>
              <Link to="/login" className="text-xs text-primary hover:underline">
                Sign in instead
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
