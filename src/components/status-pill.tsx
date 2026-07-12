import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Available: "text-primary bg-primary/10 border-primary/30",
  "On Trip":
    "text-[oklch(0.72_0.15_220)] bg-[oklch(0.72_0.15_220)]/10 border-[oklch(0.72_0.15_220)]/30",
  "In Shop": "text-accent bg-accent/10 border-accent/30",
  Retired: "text-muted-foreground bg-muted border-border",
  "Off Duty": "text-muted-foreground bg-muted border-border",
  Suspended: "text-destructive bg-destructive/10 border-destructive/30",
  Draft: "text-muted-foreground bg-muted border-border",
  Dispatched:
    "text-[oklch(0.72_0.15_220)] bg-[oklch(0.72_0.15_220)]/10 border-[oklch(0.72_0.15_220)]/30",
  Completed: "text-primary bg-primary/10 border-primary/30",
  Cancelled: "text-destructive bg-destructive/10 border-destructive/30",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
        map[status] ?? "text-muted-foreground bg-muted border-border",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
