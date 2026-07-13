import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, LogOut, Sun, Moon } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState("");
  const navigate = useNavigate();
  const logout = useStore((s) => s.logout);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const trips = useStore((s) => s.trips);
  const drivers = useStore((s) => s.drivers);
  const vehicles = useStore((s) => s.vehicles);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  const active = trips.filter((t) => t.status === "Dispatched").length;
  const expiring = drivers.filter((d) => {
    const days = (new Date(d.licenseExpiry).getTime() - Date.now()) / 86400_000;
    return days < 30 && days >= 0;
  }).length;
  const inShop = vehicles.filter((v) => v.status === "In Shop").length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 backdrop-blur px-3">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="hidden md:flex items-center gap-4 text-[11px] font-mono">
        <span className="text-primary">● OPS ONLINE</span>
        <span className="text-muted-foreground">{tick}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-sm border border-border bg-panel px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search fleet…</span>
          <kbd className="ml-6 rounded border border-border px-1 font-mono text-[10px]">⌘K</kbd>
        </button>
        <div className="hidden lg:flex items-center gap-3 border-l border-border pl-3 text-[11px] font-mono">
          <span><span className="text-muted-foreground">ACTIVE</span> <span className="text-primary">{active}</span></span>
          <span><span className="text-muted-foreground">SHOP</span> <span className="text-accent">{inShop}</span></span>
          <span><span className="text-muted-foreground">EXP</span> <span className="text-warn">{expiring}</span></span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { logout(); navigate({ to: "/login" }); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search vehicles, drivers, trips, or jump to…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {[
              ["Dashboard", "/"], ["Vehicles", "/vehicles"], ["Drivers", "/drivers"],
              ["Trips", "/trips"], ["Maintenance", "/maintenance"], ["Fuel & Expenses", "/fuel"],
              ["Reports", "/reports"], ["Settings", "/settings"],
            ].map(([label, url]) => (
              <CommandItem key={url} onSelect={() => { setOpen(false); navigate({ to: url }); }}>
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Vehicles">
            {vehicles.slice(0, 8).map((v) => (
              <CommandItem key={v.id} onSelect={() => { setOpen(false); navigate({ to: "/vehicles" }); }}>
                <span className="font-mono">{v.reg}</span> — {v.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Drivers">
            {drivers.slice(0, 8).map((d) => (
              <CommandItem key={d.id} onSelect={() => { setOpen(false); navigate({ to: "/drivers" }); }}>
                {d.name} <span className="ml-2 font-mono text-xs text-muted-foreground">{d.license}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
