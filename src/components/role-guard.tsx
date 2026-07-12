import { ReactNode } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const session = useStore((s) => s.session);

  if (!session) {
    return null;
  }

  if (!allowedRoles.includes(session.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-panel border border-border rounded-sm max-w-lg mx-auto mt-12 shadow-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-destructive/10 border border-destructive/30 mb-4">
          <ShieldAlert className="h-6 w-6 text-destructive animate-pulse" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-destructive">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Your active profile role of <strong>{session.role}</strong> does not have authorization to view this terminal surface.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
