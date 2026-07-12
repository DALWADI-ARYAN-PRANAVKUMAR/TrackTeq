import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({ meta: [{ title: "Settings — TransitOps" }] }),
  component: Settings,
});

function Settings() {
  const { session, login, theme, setTheme, reducedMotion, setReducedMotion, resetDemo } =
    useStore();
  const roles: Role[] = ["Fleet Manager", "Driver", "Safety Officer", "Financial Analyst"];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="micro-label">Preferences</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Settings</h1>
      </div>

      <div className="rounded-md border border-border bg-panel p-5">
        <div className="micro-label">Session</div>
        <div className="mt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span> {session?.name}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-mono">{session?.email}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Role:</span> {session?.role}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel p-5">
        <div className="micro-label">Appearance</div>
        <div className="mt-3 flex gap-2">
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="micro-label">Accessibility</div>
            <Label htmlFor="rm" className="mt-2 block text-sm font-medium">
              Reduce motion
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Disables the cursor companion, aurora shimmer and heavy transitions across the app.
            </p>
          </div>
          <Switch
            id="rm"
            checked={reducedMotion}
            onCheckedChange={(v) => {
              setReducedMotion(v);
              toast.success(v ? "Motion reduced" : "Motion restored");
            }}
          />
        </div>
      </div>

    </div>
  );
}
