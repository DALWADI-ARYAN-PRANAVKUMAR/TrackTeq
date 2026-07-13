# Track-Teq

Track-Teq is a modern, modular, and extensible Transport Operations Platform built to seamlessly handle fleet management, driver logistics, route tracking, fuel and maintenance expenses, and comprehensive audit trails. It provides role-based access for different stakeholders to oversee and execute transportation tasks efficiently.

## Core Features
*   **Role-Based Access Control (RBAC):** Customized dashboards and permissions based on user roles.
*   **Audit Logging:** Complete tracking of user login, logout, and activity sessions.
*   **Fleet Management:** Vehicle registry and maintenance scheduling.
*   **Driver Operations:** Real-time driver assignments and trip management.
*   **Financial Tracking:** Operational expenses, fuel consumption, and profitability reviews.
*   **Data Export:** Downloadable reports and audit logs in both CSV and PDF formats.

---

## Default User Credentials

Track-Teq comes pre-configured with several default accounts mapped to the platform's various roles. Use these credentials to test and explore the features of each role:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Admin | `admin@gmail.com` | `Admin@1234` |
| **Fleet Manager** | Fleet Manager | `fleetmanager@gmail.com` | `Fleet@1234` |
| **Safety Officer** | Safety Officer | `safetyofficer@gmail.com` | `Safety@1234` |
| **Driver** | Driver | `driver@gmail.com` | `Driver@1234` |
| **Financial Analyst**| Financial Analyst| `financialanalyst@gmail.com` | `Financial@1234` |

---

## Architecture Overview

Track-Teq follows a modern, decoupled architecture splitting the Frontend and Backend into separate but integrated domains, utilizing a DDD-inspired modular monolith design.

### Backend (FastAPI & SQLite/SQLAlchemy)
The backend is a robust RESTful API built with **FastAPI**. It organizes logic into distinct domains:
1.  **API Routing Layer (`app/routers/`):** Exposes clean REST endpoints categorized by business functions (e.g., `/audit`, `/vehicles`, `/trips`). Dependencies are heavily utilized here for enforcing Role-Based Access Control (RBAC).
2.  **Core Services & Business Rules (`app/services/business_rules.py`):** Acts as the central nervous system of the application, validating and enforcing business rules (e.g., making sure a vehicle isn't assigned to multiple concurrent trips).
3.  **Data Models (`app/models/`):** SQLAlchemy ORM models handle the database schema and relational mappings securely.
4.  **Audit System:** Automatically records session lifecycle events (login, logout, active status) directly into an `AuditLog` table, ensuring strict operational compliance.

### Frontend (TanStack Start & React)
The frontend relies on the cutting-edge **TanStack Start** framework (built on top of Vite and React) offering a seamless Single Page Application (SPA) experience with SSR capabilities.
1.  **State Management:** Utilizes `zustand` to maintain global application states (e.g., active user sessions, role identification).
2.  **Component Library:** Uses `shadcn/ui` and `lucide-react` for beautiful, responsive, and accessible user interfaces.
3.  **Routing (`src/routes/`):** File-based routing allows for clear separation of authenticated (`_authed.*`) vs unauthenticated views. Role-based rendering ensures users only see what they are authorized to access.
4.  **PDF/CSV Processing:** Client-side generation of comprehensive reports directly via `jspdf` and standard browser data encoding.

## Getting Started

### Backend Setup
1. Open a terminal in the `TrackTeq-main` directory.
2. Create and activate a Python virtual environment.
3. Run `pip install -r requirements.txt`.
4. Start the server with `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

### Frontend Setup
1. Open a terminal in the root directory.
2. Run `npm install` to install dependencies.
3. Start the Vite development server with `npm run dev`.
