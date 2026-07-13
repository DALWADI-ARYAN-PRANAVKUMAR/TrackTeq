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

### Local Setup
Since Track-Teq is configured as a monorepo, you can start both the backend and frontend simultaneously with a single command.

1. Open a terminal in the root directory.
2. Run `npm install` to install the root dependencies and frontend packages.
3. (Optional) Set up your Python virtual environment in the `backend/` folder if you haven't already:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```
4. Start the application by running:
   ```bash
   npm run dev
   ```
## Vercel Deployment (Production)

Because Track-Teq uses a Nitro-based server for the frontend and a Python server for the backend, they must be deployed as **two separate projects** on Vercel to work properly.

### 1. Deploy the Backend
1. Go to Vercel and create a new project by importing your GitHub repository.
2. In the "Configure Project" section, open the **Root Directory** settings and select the `backend` folder.
3. Keep the Framework Preset as "Other".
4. Click **Deploy**. Vercel will detect `api/index.py` and deploy your FastAPI backend.
5. Copy the deployed backend URL (e.g., `https://track-teq-backend.vercel.app`).

### 2. Deploy the Frontend
1. Go back to the Vercel dashboard and create *another* new project using the exact same GitHub repository.
2. In the "Configure Project" section, open the **Root Directory** settings and select the `frontend` folder.
3. In the **Environment Variables** section, add a new variable:
   * **Name**: `VITE_API_URL`
   * **Value**: *Paste the backend URL you copied in step 1*
4. Click **Deploy**. Vercel will automatically detect TanStack Start/Vite and build your frontend!

> **Database Note**: Because the current project uses a local SQLite file (`transitops.db`), your data will be frequently wiped by Vercel's Serverless Functions. For true production use, change the SQLite connection string in `backend/app/database.py` to a managed PostgreSQL database (e.g., Supabase or Neon).
