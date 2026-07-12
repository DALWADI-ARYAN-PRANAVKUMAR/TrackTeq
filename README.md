# TrackTeq — Backend API

Smart Transport Operations Platform backend. Built with **FastAPI + SQLAlchemy** for the 8-hour hackathon.

Frontend team: point your app at `http://localhost:8000`. Full interactive API docs (Swagger) are auto-generated at **`/docs`** — use that to explore every endpoint, request/response shape, and try calls live without writing any client code first.

---

## 1. Setup (2 minutes)

```bash
cd trackteq-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # defaults work out of the box (SQLite, no external DB needed)

python seed.py                  # creates demo users, vehicles, drivers
uvicorn app.main:app --reload   # http://localhost:8000
```

Open **http://localhost:8000/docs** — that's your Swagger playground.

### Demo logins (created by `seed.py`)

| Email | Password | Role |
|---|---|---|
| admin@trackteq.com | admin123 | admin (bypasses all RBAC checks) |
| fleet@trackteq.com | fleet123 | fleet_manager |
| driver@trackteq.com | driver123 | driver |
| safety@trackteq.com | safety123 | safety_officer |
| finance@trackteq.com | finance123 | financial_analyst |

Seed also creates 3 vehicles (incl. `GJ-01-VAN-05`, 500kg capacity — matches spec walkthrough) and 3 drivers (incl. `Alex` with valid license, and `Priya` with a deliberately **expired** license for testing rule enforcement).

---

## 2. Tech Stack

- **FastAPI** — async web framework, auto Swagger/OpenAPI docs
- **SQLAlchemy 2.0** — ORM, SQLite by default (swap `DATABASE_URL` in `.env` for Postgres, zero code changes)
- **Pydantic v2** — request/response validation
- **JWT (python-jose)** + **bcrypt (passlib)** — auth
- **RBAC** — role-based dependency injection per route

---

## 3. Project Structure

```
app/
├── main.py              # FastAPI app + router registration
├── config.py            # env-based settings
├── database.py          # engine/session/Base
├── models/               # SQLAlchemy ORM models (one file per entity)
├── schemas/              # Pydantic request/response contracts
├── auth/
│   ├── security.py       # password hashing, JWT encode/decode
│   ├── deps.py            # get_current_user, require_roles(...)
│   └── router.py          # /auth/register, /auth/login, /auth/me
├── routers/               # one file per resource (vehicles, drivers, trips...)
└── services/
    └── business_rules.py  # ALL cross-entity validation + status transitions live here
seed.py                    # demo data generator
```

**Why `business_rules.py` matters**: every status transition described in the spec (dispatch → On Trip, complete → Available, maintenance open → In Shop, etc.) is centralized in one service module. Routers call these functions rather than mutating status directly — so the rules can't accidentally be bypassed by a new endpoint.

---

## 4. Authentication

OAuth2 password flow. Get a token, then send `Authorization: Bearer <token>` on every other request.

```bash
curl -X POST http://localhost:8000/auth/login-json \
  -H "Content-Type: application/json" \
  -d '{"email":"fleet@trackteq.com","password":"fleet123"}'
```

Response: `{ "access_token": "...", "token_type": "bearer", "user": {...} }`

There's also `/auth/login` (form-encoded, `username`/`password` fields) which is what Swagger's "Authorize" button uses automatically.

### Roles
`admin`, `fleet_manager`, `driver`, `safety_officer`, `financial_analyst`. `admin` bypasses all role checks. Each write-endpoint restricts to relevant roles (see route-level `require_roles(...)` in each router file) — adjust these to match your team's exact permission model if the spec's RBAC needs differ.

---

## 5. API Reference (by resource)

All endpoints require a Bearer token unless noted. Full schemas are in `/docs`.

### Vehicles (`/vehicles`)
- `GET /vehicles` — list, filter by `status_filter`, `type_filter`, `region`
- `GET /vehicles/available` — only vehicles eligible for dispatch (excludes Retired/In Shop/On Trip)
- `GET /vehicles/{id}`
- `POST /vehicles` *(fleet_manager)* — registration_number must be unique
- `PUT /vehicles/{id}` *(fleet_manager)*
- `DELETE /vehicles/{id}` *(fleet_manager)*

### Drivers (`/drivers`)
- `GET /drivers` — filter by `status_filter`, `expired_only`
- `GET /drivers/available` — Available + license not expired
- `GET /drivers/{id}`
- `POST /drivers` *(fleet_manager, safety_officer)*
- `PUT /drivers/{id}`
- `DELETE /drivers/{id}`

### Trips (`/trips`) — enforces all Section 4 business rules
- `GET /trips` — filter by `status_filter`, `vehicle_id`, `driver_id`
- `POST /trips` — creates a **Draft** trip. Validates: vehicle not Retired/In Shop/On Trip, driver not Suspended/expired-license/On Trip, cargo ≤ max load capacity
- `POST /trips/{id}/dispatch` — Draft → Dispatched; re-validates rules, flips vehicle+driver to On Trip
- `POST /trips/{id}/complete` — body: `{actual_distance, fuel_consumed}`; Dispatched → Completed, restores vehicle+driver to Available, updates odometer
- `POST /trips/{id}/cancel` — Draft/Dispatched → Cancelled; if was Dispatched, restores vehicle+driver to Available

### Maintenance (`/maintenance`)
- `GET /maintenance` — filter by `vehicle_id`, `status_filter`
- `POST /maintenance` *(fleet_manager)* — opens a log, auto-sets vehicle to **In Shop**
- `POST /maintenance/{id}/close` *(fleet_manager)* — closes log, restores vehicle to Available (unless Retired)

### Fuel & Expenses
- `GET/POST /fuel-logs` — liters, cost, date, optional trip_id
- `GET/POST /expenses` — tolls, fines, other costs per vehicle

### Dashboard (`/dashboard/kpis`)
Returns: active_vehicles, available_vehicles, vehicles_in_maintenance, active_trips, pending_trips, drivers_on_duty, fleet_utilization_percent. Supports `type_filter`, `status_filter`, `region` query params.

### Reports (`/reports`)
- `GET /reports/vehicle-performance` — all vehicles: fuel efficiency (km/L), operational cost, ROI
- `GET /reports/vehicle-performance/{vehicle_id}` — single vehicle
- `GET /reports/vehicle-performance/export/csv` — downloads CSV (matches "Support CSV export" requirement)

ROI formula (per spec): `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`

---

## 6. Business Rules Enforced (Section 4 of spec)

All implemented in `app/services/business_rules.py`:

- ✅ Vehicle registration number uniqueness
- ✅ Retired/In Shop vehicles excluded from dispatch pool
- ✅ Expired license or Suspended drivers blocked from trip assignment
- ✅ Vehicle/driver already On Trip can't be double-booked
- ✅ Cargo weight ≤ vehicle max load capacity
- ✅ Dispatch → both vehicle & driver set to On Trip
- ✅ Complete → both restored to Available, odometer updated
- ✅ Cancel dispatched trip → both restored to Available
- ✅ Open maintenance → vehicle set to In Shop automatically
- ✅ Close maintenance → vehicle restored to Available (unless Retired)

---

## 7. Testing it yourself

Fastest way: open `/docs`, click **Authorize**, log in with a seeded account, then try any endpoint directly in the browser.

Or replicate the spec's exact walkthrough (Section 5) via curl — register Van-05, register Alex, create a 450kg trip, dispatch, complete, then open+close a maintenance record — all rules will fire exactly as described.

---

## 8. Notes for the frontend integration

- CORS is open to `http://localhost:3000` and `http://localhost:5173` by default — add your dev server's origin to `CORS_ORIGINS` in `.env` if different.
- All list endpoints return arrays directly (no pagination wrapper) — fine for hackathon scale.
- Enum fields (status, type, role) are returned as their **display strings** (e.g. `"On Trip"`, not `"ON_TRIP"`) so they can be rendered directly in the UI.
- Dates are ISO 8601 strings.
- Errors follow FastAPI's standard `{"detail": "..."}` shape with proper HTTP status codes (400 for business rule violations, 401 for auth, 403 for RBAC, 404 for missing resources).
