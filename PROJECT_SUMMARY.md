# Forever Buildcon — Project Summary
> Construction Management SaaS Platform for Gujarat real estate/construction companies
> Last updated: April 2026

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + MUI v5 |
| Backend | Node.js + Express + TypeScript + TypeORM |
| Database | PostgreSQL 14+ |
| Auth | JWT (access token 15m + refresh token 7d) |
| State | TanStack Query (server state) + Zustand (client state) |
| Charts | Recharts |
| Forms | React Hook Form + Yup |
| Notifications | Notistack |

---

## Project Structure

```
forever-buildcon/
├── frontend/                  React + Vite + TypeScript + MUI
│   └── src/
│       ├── api/               Axios API clients per module
│       ├── components/        Shared UI (Layout, Sidebar, ConfirmDialog, etc.)
│       ├── contexts/          AuthContext (JWT + user state)
│       ├── pages/             One folder per module
│       ├── routes/            AppRoutes + ProtectedRoute
│       └── types/             Shared TypeScript types/enums
├── backend/                   Node.js + Express + TypeORM
│   └── src/
│       ├── config/            DB config, JWT config
│       ├── controllers/       Auth controller
│       ├── dto/               Validation DTOs (class-validator)
│       ├── entities/          TypeORM entities (DB tables)
│       ├── middleware/        Auth middleware, error handler
│       ├── routes/            Express routers per module
│       └── services/          Business logic per module
├── database/
│   ├── seed.sql               Demo user seed (bcrypt hashed passwords)
│   └── phase3_schema.sql      Safety/compliance reference tables
└── PROJECT_SUMMARY.md         This file
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@foreverbuildcon.com | Admin@123 |
| Owner | owner@foreverbuildcon.com | Admin@123 |
| Supervisor | supervisor@foreverbuildcon.com | Admin@123 |

---

## How to Start

### 1. Database
```bash
# Create DB (run once)
createdb forever_buildcon

# Seed demo users (run after backend starts for the first time)
# Use pgAdmin Query Tool — paste contents of database/seed.sql
```

> **Important:** TypeORM `synchronize: true` is enabled in development. All tables are auto-created by TypeORM when the backend starts. Never run SQL schema files alongside synchronize — it causes conflicts.

### 2. Backend
```bash
cd backend
cp .env.example .env     # fill in DB credentials + JWT secrets
npm install
npm run dev              # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

---

## Modules Built (Phases 1–4)

### Phase 1 — Auth & User Management ✅

**Features:**
- JWT login with access (15m) + refresh (7d) tokens, auto-refresh
- Role-based access: Admin, Owner, Supervisor, Accountant, Viewer
- User CRUD (Admin/Owner only) — create, edit, deactivate
- Protected routes per role
- Persistent login via localStorage

**Files:**
- `backend/src/entities/User.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`, `user.routes.ts`
- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/pages/users/UsersPage.tsx`
- `frontend/src/contexts/AuthContext.tsx`

---

### Phase 2 — Projects, Budget, Inventory, Vendors ✅

**Features:**

**Projects**
- Create/edit/delete projects with code, location, RERA number, type, status, dates
- Budget stored internally in paise/rupees, displayed in ₹ Crores throughout UI
- BOQ icon shortcut per project card
- Status filter (Planning, Active, On Hold, Completed, Cancelled)

**Budget**
- Per-project budget breakdown by category (civil, MEP, finishing, etc.)
- Spent vs budgeted with progress bars
- Cost entries with vendor, invoice, date tracking
- All amounts displayed in ₹ Crores

**Inventory**
- Material items with quantity tracking (minimum stock alerts)
- Site-level inventory per project
- Stock movement history

**Vendors**
- Vendor master: name, GSTIN, contact, category, rating
- Contract tracking per vendor per project
- Payment history

**Files:**
- `backend/src/entities/` — Project, BudgetItem, CostEntry, InventoryItem, Vendor, VendorContract
- `frontend/src/pages/projects/`, `budget/`, `inventory/`, `vendors/`
- `frontend/src/api/` — project.api.ts, budget.api.ts, inventory.api.ts, vendor.api.ts

---

### Phase 3 — Safety & Compliance ✅

**Features:**

**Safety**
- Incident reporting: type, severity (low/medium/high/critical), status
- Inspection scheduling and tracking
- Safety metrics dashboard

**Compliance**
- RERA registration tracking per project
- Document/approval management
- Compliance status per project
- Admin/Owner only access

**Sidebar Navigation:**
- Safety: accessible to Admin, Owner, Supervisor
- Compliance: Admin/Owner only

**Files:**
- `backend/src/entities/` — SafetyIncident, SafetyInspection, ReraRegistration, ComplianceDocument
- `frontend/src/pages/safety/SafetyPage.tsx`
- `frontend/src/pages/compliance/CompliancePage.tsx`
- `database/phase3_schema.sql` — reference tables for safety/compliance

---

### Phase 4 — Financials & Tally Integration ✅

**Features:**

**Revenue Tracking**
- Revenue entries with auto-generated receipt numbers (RCT-YYYY-NNNNN)
- Categories: unit sale, advance, installment, final payment, rental, other
- Payment modes: cash, cheque, NEFT, RTGS, UPI
- Statuses: expected, received, overdue, cancelled
- GST and TDS tracking per entry

**Financial Dashboard**
- Total received, expected revenue, overdue payments, gross margin cards
- Monthly revenue trend chart (last 6 months) — AreaChart
- Revenue by category — horizontal BarChart
- Per-project financial overview table (budget, cost, revenue, gross margin %)

**Margin Analysis Tab**
- Aggregate: total budget, cost, revenue, gross margin
- Per-project gross margin % bar chart with color coding (green ≥20%, orange ≥10%, red <10%)
- ROI analysis with cost utilization progress bars

**Tally Export**
- CSV export for: Revenue Entries, Cost Entries, Vendor Master, Full Export
- Date range and project filters
- Export logs tab with history
- File download via blob URL

**Files:**
- `backend/src/entities/` — RevenueEntry, TallyExportLog
- `backend/src/routes/financials.routes.ts`
- `frontend/src/pages/financials/FinancialsPage.tsx`
- `frontend/src/api/financials.api.ts`

---

### Bonus — BOQ (Bill of Quantities) ✅

Built on request during Phase 4. Per-project quantity tracking.

**Features:**
- 13 categories: earthwork, concrete, steel, masonry, plastering, flooring, waterproofing, formwork, painting, doors & windows, plumbing, electrical, other
- 9 units: m³, m², MT, KG, Nos, RMT, Bags, Sqft, LS
- Per item: work item name, estimated qty, executed qty, rate per unit, remarks
- Progress bar per item (executed / estimated %)
- Summary cards: total items, overall progress %, estimated cost Cr, actual cost Cr
- Items grouped by category with color-coded left border
- Admin/Owner can add/edit/delete; Supervisors view only

**Route:** `/boq/:projectId` — accessible from project card BOQ icon

**Files:**
- `backend/src/entities/BoqItem.ts`
- `backend/src/services/boq.service.ts`
- `backend/src/routes/boq.routes.ts`
- `frontend/src/pages/boq/BoqPage.tsx`
- `frontend/src/api/boq.api.ts`

---

## Role-Based Access Summary

| Module | Admin | Owner | Supervisor | Accountant | Viewer |
|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ |
| Budget | ✅ | ✅ | ✅ | ✅ | ✅ |
| BOQ | ✅ | ✅ | View | View | View |
| Inventory | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vendors | ✅ | ✅ | ✅ | ✅ | ✅ |
| Safety | ✅ | ✅ | ✅ | ❌ | ❌ |
| Compliance | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financials | ✅ | ✅ | ❌ | ❌ | ❌ |
| Users | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Database Entities (TypeORM — auto-synced)

| Entity | Table | Description |
|---|---|---|
| User | users | Auth, roles, status |
| RefreshToken | refresh_tokens | JWT refresh tokens |
| Project | projects | Construction projects |
| BudgetItem | budget_items | Budget categories per project |
| CostEntry | cost_entries | Actual spends |
| InventoryItem | inventory_items | Material stock |
| StockMovement | stock_movements | Inventory transactions |
| Vendor | vendors | Vendor master |
| VendorContract | vendor_contracts | Contracts per vendor/project |
| VendorPayment | vendor_payments | Payment history |
| SafetyIncident | safety_incidents | Site incidents |
| SafetyInspection | safety_inspections | Scheduled inspections |
| ReraRegistration | rera_registrations | RERA per project |
| ComplianceDocument | compliance_documents | Approval docs |
| RevenueEntry | revenue_entries | Revenue with receipt no. |
| TallyExportLog | tally_export_logs | CSV export history |
| BoqItem | boq_items | Bill of quantities per project |

---

## API Endpoints Summary

```
Auth
  POST   /api/auth/login
  POST   /api/auth/refresh
  POST   /api/auth/logout

Users
  GET    /api/users
  POST   /api/users
  PATCH  /api/users/:id
  DELETE /api/users/:id

Projects
  GET    /api/projects
  POST   /api/projects
  GET    /api/projects/:id
  PATCH  /api/projects/:id
  DELETE /api/projects/:id

Budget
  GET    /api/budget/:projectId
  POST   /api/budget/:projectId/items
  PATCH  /api/budget/items/:id
  DELETE /api/budget/items/:id
  POST   /api/budget/:projectId/costs
  DELETE /api/budget/costs/:id

Inventory
  GET    /api/inventory
  POST   /api/inventory
  PATCH  /api/inventory/:id
  DELETE /api/inventory/:id
  POST   /api/inventory/:id/movements

Vendors
  GET    /api/vendors
  POST   /api/vendors
  PATCH  /api/vendors/:id
  DELETE /api/vendors/:id
  GET    /api/vendors/:id/contracts
  POST   /api/vendors/:id/contracts

Safety
  GET    /api/safety/incidents
  POST   /api/safety/incidents
  PATCH  /api/safety/incidents/:id
  DELETE /api/safety/incidents/:id

Compliance
  GET    /api/compliance/rera
  POST   /api/compliance/rera
  PATCH  /api/compliance/rera/:id

Financials
  GET    /api/financials/dashboard
  GET    /api/financials/revenue
  POST   /api/financials/revenue
  PATCH  /api/financials/revenue/:id
  DELETE /api/financials/revenue/:id
  GET    /api/financials/margin
  POST   /api/financials/export/tally
  GET    /api/financials/export/logs

BOQ
  GET    /api/boq/:projectId
  POST   /api/boq/:projectId
  PATCH  /api/boq/:id
  DELETE /api/boq/:id
```

---

## Known Behaviours & Notes

- **Budget/cost values** stored as full rupees (integers) in DB, displayed as ₹ Crores in UI (÷ 10,000,000)
- **Project creation form** accepts crores → multiplied by 10,000,000 before saving
- **MUI Select fields** require `Controller` from react-hook-form — plain `register()` does not work with MUI Select
- **TypeORM synchronize: true** in dev — never run SQL schema files alongside this; tables are auto-created
- **Seed users** must be run after the backend starts (tables must exist first)
- **Vite** pre-bundles all heavy deps via `optimizeDeps.include` — first run may be slow, subsequent runs are fast
- **Financials page** loads project list via `.then(r => r.data)` — `projectApi.getAll()` returns `PaginatedResponse<Project>`, not a plain array

---

## Deployment — Railway.app

### Overview
The project deploys as **three Railway services** inside one Railway project:
1. **PostgreSQL** — managed database (Railway plugin)
2. **Backend** — Node.js/Express API
3. **Frontend** — React/Vite static site

### Step 1 — Create Railway Project
Go to [railway.app](https://railway.app) → **New Project**

---

### Step 2 — Add PostgreSQL
**Add Service → Database → PostgreSQL**
Railway auto-provisions the database and injects `DATABASE_URL` into any service you link to it.

---

### Step 3 — Deploy Backend
- **Add Service → GitHub Repo** → select `cognexa-dev/construction_saas`
- **Settings → Source → Root Directory**: `backend`
- Railway picks up `backend/railway.toml` automatically:
  - Build: `npm install && npm run build`
  - Start: `npm start` (runs compiled `dist/server.js`)

**Environment Variables to set on backend service:**

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Click "Add Reference" → select Postgres service → `DATABASE_URL` |
| `JWT_SECRET` | Random 32+ character string |
| `JWT_REFRESH_SECRET` | Another random 32+ character string |
| `AES_SECRET_KEY` | Exactly 32 characters |
| `CORS_ORIGIN` | Frontend Railway URL (set after frontend is deployed) |
| `OPENROUTER_API_KEY` | Your key from openrouter.ai |
| `OPENROUTER_MODEL` | `deepseek/deepseek-v4-flash:free` |

> `DATABASE_URL` is auto-injected by Railway when you reference the Postgres service. The `database.ts` config uses `DATABASE_URL` if present, otherwise falls back to individual `DB_*` vars.

---

### Step 4 — Deploy Frontend
- **Add Service → GitHub Repo** → same repo
- **Settings → Source → Root Directory**: `frontend`
- Railway picks up `frontend/railway.toml`:
  - Build: `npm install && npm run build`
  - Start: `vite preview --host 0.0.0.0 --port $PORT`

**Environment Variables to set on frontend service:**

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://your-backend.up.railway.app/api/v1` |

---

### Step 5 — Cross-link the two URLs
Once both services are live:
1. Copy **frontend Railway URL** → paste into backend's `CORS_ORIGIN`
2. Copy **backend Railway URL** → paste into frontend's `VITE_API_BASE_URL`
3. Railway auto-redeploys when env vars are saved

---

### First-Deploy Database Note
TypeORM `synchronize: true` only runs in `development`. On first production deploy:
- Temporarily set `NODE_ENV=development` on the backend service → Railway redeploys → TypeORM auto-creates all tables
- Then set `NODE_ENV=production` again

---

### Railway Config Files Added
| File | Purpose |
|---|---|
| `backend/railway.toml` | Build + start commands for backend service |
| `frontend/railway.toml` | Build + start commands for frontend service |
| `backend/src/config/database.ts` | Supports `DATABASE_URL` env var (Railway Postgres) |
| `backend/.env.example` | Updated with Railway-ready variable docs |

---

## What's Next — Phase 5 (Not Started)

| Feature | Description |
|---|---|
| Early Warning System | Cost overrun alerts, overdue payments, expiring RERA/insurance |
| Notification Center | In-app alerts with read/unread state |
| Cash Flow Forecast | Monthly projected inflows vs outflows |
| CKQ Analytics | Key quantity ratios (steel kg/sqft, cement bags/m³) derived from BOQ data |
| Reports Page | Exportable reports — currently shows "Phase 5" badge in sidebar |
