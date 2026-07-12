import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: string;
  tone?: "default" | "primary" | "accent" | "info";
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent"
        : tone === "info"
          ? "text-[oklch(0.72_0.15_220)]"
          : "text-foreground";
  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-panel p-4 hover-lift animate-slide-up">
      <div className="flex items-start justify-between">
        <span className="micro-label">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", toneCls)} />}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={cn("text-mono text-3xl font-semibold tabular-nums", toneCls)}>
          {value}
        </span>
        {unit && <span className="micro-label">{unit}</span>}
      </div>
      {trend && <div className="mt-1 text-[11px] text-muted-foreground font-mono">{trend}</div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}
