import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MouseTracker } from "@/components/mouse-tracker";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const session = useStore.getState().session;
      if (!session) throw redirect({ to: "/login" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const theme = useStore((s) => s.theme);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const sync = useStore((s) => s.sync);
  const session = useStore((s) => s.session);

  useEffect(() => {
    if (session) {
      sync();
    }
  }, [session, sync]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [reducedMotion]);

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-background aurora-bg">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          <main className={`flex-1 p-4 md:p-6 ${reducedMotion ? "" : "animate-fade-in"}`}>
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <MouseTracker />
    </SidebarProvider>
  );
}
