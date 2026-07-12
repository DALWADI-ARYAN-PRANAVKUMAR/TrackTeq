import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Truck, ShieldCheck, Wallet, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "TransitOps — Sign in" },
      { name: "description", content: "Sign in to the TransitOps fleet operations terminal." },
    ],
  }),
  component: Login,
});

const roles: { role: Role; icon: typeof Truck; blurb: string }[] = [
  { role: "Fleet Manager", icon: Truck, blurb: "Full fleet & maintenance access" },
  { role: "Driver", icon: User, blurb: "Trip creation & active deliveries" },
  { role: "Safety Officer", icon: ShieldCheck, blurb: "Driver compliance & safety" },
  { role: "Financial Analyst", icon: Wallet, blurb: "Costs, fuel & profitability" },
];

function Login() {
  const [email, setEmail] = useState("fleet@transitops.com");
  const [pw, setPw] = useState("fleet123");
  const [role, setRoleState] = useState<Role>("Fleet Manager");
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const setRole = (r: Role) => {
    setRoleState(r);
    if (r === "Fleet Manager") {
      setEmail("fleet@transitops.com");
      setPw("fleet123");
    } else if (r === "Driver") {
      setEmail("driver@transitops.com");
      setPw("driver123");
    } else if (r === "Safety Officer") {
      setEmail("safety@transitops.com");
      setPw("safety123");
    } else if (r === "Financial Analyst") {
      setEmail("finance@transitops.com");
      setPw("finance123");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await login(email, pw);
    if (r.ok) {
      toast.success("Welcome to TransitOps terminal");
      navigate({ to: "/" });
    } else {
      toast.error(r.error || "Login failed");
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
              <div className="font-display text-sm font-semibold tracking-tight">TRANSITOPS</div>
              <div className="micro-label text-[9px]">FLEET // OPS TERMINAL v1.4</div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="micro-label mb-3">SYSTEM STATUS</div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] tracking-tight">
              Dispatch, monitor,
              <br />
              <span className="text-primary">move freight.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              A command-center for your fleet — vehicles, drivers, trips, maintenance, fuel and
              analytics in one operational surface. Business rules enforced. Zero spreadsheets.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                ["12", "VEHICLES"],
                ["10", "DRIVERS"],
                ["03", "ACTIVE"],
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
          <form
            onSubmit={submit}
            className="w-full rounded-sm border border-border bg-panel p-6 md:p-8 shadow-2xl"
          >
            <div className="micro-label">Authentication</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">Access terminal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select role and sign in with your credentials.
            </p>

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
                    <Icon
                      className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="text-xs font-semibold">{r.role}</div>
                    <div className="text-[10px] text-muted-foreground">{r.blurb}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <Label htmlFor="email" className="micro-label">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="pw" className="micro-label">
                  Password
                </Label>
                <Input
                  id="pw"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full h-11 font-mono uppercase tracking-widest text-xs"
            >
              Enter terminal →
            </Button>
            <div className="mt-4 text-center text-[10px] font-mono text-muted-foreground">
              DEMO MODE · any credentials accepted
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
