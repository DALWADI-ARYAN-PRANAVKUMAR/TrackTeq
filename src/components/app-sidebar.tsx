import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Truck, Users, Route as RouteIcon, Wrench, Fuel, BarChart3, Settings, Radio,
  ShieldAlert
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useStore } from "@/lib/store";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Vehicles", url: "/vehicles", icon: Truck },
  { title: "Drivers", url: "/drivers", icon: Users },
  { title: "Trips", url: "/trips", icon: RouteIcon },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Fuel & Expenses", url: "/fuel", icon: Fuel },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Audit Logs", url: "/audit", icon: ShieldAlert },
  { title: "Settings", url: "/settings", icon: Settings },
];

const roleNav: Record<string, string[]> = {
  "Fleet Manager": ["Dashboard", "Vehicles", "Maintenance", "Settings"],
  "Driver": ["Dashboard", "Trips", "Settings"],
  "Safety Officer": ["Dashboard", "Drivers", "Settings"],
  "Financial Analyst": ["Dashboard", "Fuel & Expenses", "Reports", "Settings"],
  "Admin": ["Dashboard", "Vehicles", "Drivers", "Trips", "Maintenance", "Fuel & Expenses", "Reports", "Audit Logs", "Settings"]
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const session = useStore((s) => s.session);
  const active = useStore((s) => s.trips.filter((t) => t.status === "Dispatched").length);

  const allowedNav = session?.role ? nav.filter((item) => roleNav[session.role]?.includes(item.title)) : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-sm bg-primary/15 border border-primary/40">
            <Radio className="h-4 w-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">TRACK-TEQ</span>
              <span className="micro-label text-[9px]">FLEET // OPS TERMINAL</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="micro-label">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed ? (
          <div className="px-2 py-1">
            <div className="micro-label">Active Dispatch</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold text-primary">{String(active).padStart(2, "0")}</span>
              <span className="micro-label">LIVE</span>
            </div>
            <div className="mt-2 border-t border-sidebar-border pt-2">
              <div className="micro-label">Signed in</div>
              <div className="text-xs text-sidebar-foreground truncate">{session?.name ?? "—"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{session?.role}</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <span className="font-mono text-xs text-primary">{active}</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
