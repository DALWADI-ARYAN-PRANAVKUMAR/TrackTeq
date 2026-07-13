# Track-Teq — Frontend Demo Plan

A frontend-only, mock-data demo of the Track-Teq Smart Transport Operations Platform. Aesthetic: **Fleet Green Terminal** — off-black canvas (#0E0F0C), panel surface (#1A1D18), high-vis green primary (#B6FF3C), orange alert accent (#FF6A00), monospaced numerics, thin grid lines, dispatch-command-center feel.

No backend. All data lives in a typed in-memory store (Zustand) with realistic seeded fleet, drivers, trips, maintenance and fuel logs. Business rules are enforced client-side so the demo *feels* real.

## Design system
- Tokens in `src/styles.css` (`@theme`): `--background`, `--surface`, `--panel`, `--primary` (hi-vis green), `--accent` (orange), `--muted`, `--border`, plus status colors (available/on-trip/in-shop/retired). All oklch.
- Fonts via `<link>` in `__root.tsx`: **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (numerics/IDs).
- Motif: thin 1px hairline borders, subtle scanline/grid background, uppercase micro-labels, monospaced KPI numbers, status pills with a leading dot.
- Sidebar shell using shadcn `Sidebar` (collapsible icon), top header with global search + status ticker.

## Routes (`src/routes/`)
- `__root.tsx` — shell with `SidebarProvider`, header, ticker, meta.
- `login.tsx` — mock auth (pick a role: Fleet Manager / Driver / Safety Officer / Financial Analyst). Stored in Zustand, gates the app.
- `_authed.tsx` — pathless layout that redirects to `/login` if no role.
- `_authed.index.tsx` — **Dashboard**: KPI grid (Active/Available/In Shop, Active/Pending Trips, Drivers On Duty, Fleet Utilization %), fleet-status donut, trips-per-day bar, live trip feed, alerts panel (expiring licenses, overdue maintenance). Filters: vehicle type, status, region.
- `_authed.vehicles.tsx` — Vehicle Registry table (search/sort/filter), add/edit drawer, detail side panel with odometer, cost, status history.
- `_authed.drivers.tsx` — Driver roster with safety score bars, license expiry countdown, status pills.
- `_authed.trips.tsx` — Trip board (Draft / Dispatched / Completed / Cancelled columns) + "New Trip" wizard enforcing all business rules (unique reg, capacity, no expired licence, no double-booking). Dispatch/Complete/Cancel actions flip statuses automatically.
- `_authed.maintenance.tsx` — Maintenance logs; opening a log flips vehicle → In Shop; closing → Available.
- `_authed.fuel.tsx` — Fuel & Expense entries, per-vehicle cost roll-up, fuel efficiency (km/L).
- `_authed.reports.tsx` — Charts (Recharts): fuel efficiency, utilization, operational cost, Vehicle ROI. CSV export button per report.
- `_authed.settings.tsx` — role switcher + dark/light toggle (default dark).

## Extra features (beyond spec)
- **Command palette (⌘K)** for fast nav + "new trip / new vehicle" actions.
- **Live ticker** in header showing active trips and alerts (setInterval mock).
- **Expiring-license reminders** panel with days-left badges.
- **Vehicle document management** stub (upload placeholder list) on vehicle detail.
- **CSV export** working via client-side blob download.
- **Global search** across vehicles/drivers/trips.
- **Dark mode default** with light toggle.

## State (mock)
`src/lib/store.ts` — Zustand store: `vehicles`, `drivers`, `trips`, `maintenance`, `fuelLogs`, `expenses`, `session`. Seed data in `src/lib/seed.ts` (~12 vehicles, 10 drivers, 20 trips, logs). Business-rule helpers in `src/lib/rules.ts` (validateTrip, dispatch, complete, cancel, openMaintenance, closeMaintenance).

## Tech notes
- TanStack Start file-based routes; each route has its own `head()` meta.
- shadcn components: sidebar, table, dialog, drawer, tabs, badge, chart, command.
- Recharts for analytics; lucide-react icons.
- No Cloud, no server functions — pure client demo.

## Out of scope
- Real auth / DB / RBAC enforcement server-side.
- Email reminders, real PDF export (CSV only).
- Real map / GPS tracking (a stylized route strip only).
