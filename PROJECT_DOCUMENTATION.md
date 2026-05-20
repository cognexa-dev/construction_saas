# Forever Buildcon — Complete Project Documentation

## Overview

**Forever Buildcon** is a production-grade, mobile-first SaaS Construction Management Platform built for the Gujarat real estate market. It replaces Excel/Tally workflows with a unified cloud-based system covering project management, budget control, inventory, vendor management, safety compliance, RERA tracking, land approvals, and financial reporting.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + Vite | UI framework + build tool |
| TypeScript (strict) | Type safety |
| Material UI v5 | Component library |
| Recharts | Charts and data visualization |
| TanStack React Query | Server state management |
| Zustand + persist | Client state + offline queue |
| React Hook Form + Yup | Form handling and validation |
| React Router v6 | Client-side routing |
| Axios | HTTP client with interceptors |
| notistack | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | HTTP server |
| TypeScript (strict) | Type safety |
| TypeORM | ORM with PostgreSQL |
| PostgreSQL | Primary database |
| JWT (access + refresh) | Authentication |
| bcrypt | Password hashing |
| AES-256 (CryptoJS) | Data encryption |
| class-validator | DTO validation |
| Winston | Logging |
| Helmet + CORS + rate-limit | Security middleware |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| npm Workspaces (monorepo) | `/frontend`, `/backend`, `/shared` |
| ts-node-dev | Backend hot reload |
| dotenv | Environment config |

---

## Project Structure

```
forever-buildcon/
├── package.json                    # npm workspaces root
├── README.md
├── API.md                          # Full API documentation
├── PROJECT_DOCUMENTATION.md       # This file
│
├── database/
│   ├── schema.sql                  # Phase 1 — users, auth, audit
│   ├── phase2_schema.sql           # Phase 2 — projects, budget, inventory, vendors
│   ├── phase3_schema.sql           # Phase 3 — safety, compliance, sync
│   ├── phase4_schema.sql           # Phase 4 — financials, tally
│   └── seed.sql                    # Demo users
│
├── shared/
│   └── src/
│       ├── types/
│       │   ├── user.ts             # UserRole, UserStatus, IUser
│       │   └── auth.ts             # ITokenPayload, IAuthTokens
│       └── index.ts
│
├── backend/
│   ├── .env                        # Environment variables
│   ├── .env.example
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts               # Entry point
│       ├── app.ts                  # Express app setup
│       ├── config/
│       │   ├── env.ts              # Environment config loader
│       │   └── database.ts         # TypeORM DataSource
│       ├── entities/               # TypeORM entities (24 entities)
│       ├── dto/                    # Validation DTOs
│       ├── repositories/           # Extended TypeORM repos
│       ├── services/               # Business logic
│       ├── controllers/            # Request handlers
│       ├── routes/                 # Express routers
│       ├── middleware/             # Auth, RBAC, validation, errors
│       └── utils/                  # JWT, logger, response helpers
│
└── frontend/
    ├── .env                        # VITE_API_BASE_URL
    ├── .env.example
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/index.ts          # All shared TypeScript types
        ├── theme/index.ts          # MUI theme
        ├── store/                  # Zustand stores
        ├── contexts/               # AuthContext
        ├── hooks/                  # useOfflineSync
        ├── api/                    # API call functions
        ├── components/             # Shared components
        ├── pages/                  # Page components
        └── routes/                 # AppRoutes, ProtectedRoute
```

---

## Architecture Decisions

### Authentication
- **JWT dual-token**: 15-minute access tokens + 7-day refresh tokens
- Refresh tokens stored in DB with revocation support
- Axios interceptor handles silent token refresh with queue pattern (prevents concurrent refresh race conditions)
- `@BeforeInsert` / `@BeforeUpdate` hooks auto-hash passwords with bcrypt (rounds: 12)

### Role-Based Access Control (RBAC)
Three roles with different access levels:

| Role | Access |
|------|--------|
| `admin` | Full access to all modules |
| `owner` | Full access except user deletion |
| `supervisor` | Read + create access, no management operations |

RBAC enforced via `authorize(...roles)` middleware on every route.

### Offline-First Sync
- Zustand `syncStore` persists a queue of pending operations to `localStorage`
- `useOfflineSync` hook listens to `window.online/offline` events
- Background polling every 60 seconds when online
- Operations sent to `POST /api/v1/sync/batch`
- Conflict resolution: compares `_clientTimestamp` in payload vs server `updatedAt`
- `OfflineIndicator` component shows sync status in header

### Auto-Generated Codes
| Entity | Format | Example |
|--------|--------|---------|
| Project | `FB-XXXXXX` | FB-823945 |
| Vendor | `VND-CAT-XXXX` | VND-ELE-4821 |
| Inventory SKU | `CAT-NAME-NNNN` | CEM-OPC-0012 |
| Purchase Requisition | `PR-YEAR-NNNNN` | PR-2025-00042 |
| Incident Report | `INC-YEAR-NNNNN` | INC-2025-00003 |
| Revenue Receipt | `RCT-YEAR-NNNNN` | RCT-2025-00018 |

### Budget Status (Computed)
Computed via TypeORM entity getter (no stored column — always fresh):
- **Green**: utilization < 75%
- **Amber**: 75% – 90%
- **Red**: > 90%

### Vendor Performance Score
Rolling average: `(quality + delivery + pricing) / 3 * 20` → 0–100 scale. Recomputed on every new rating.

---

## Phases Built

---

## Phase 1 — Authentication & User Management

### Backend
**Entities:** `User`, `RefreshToken`, `AuditLog`

**API Endpoints:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me

GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
PATCH  /api/v1/users/:id/toggle-status
```

**Key Features:**
- bcrypt password hashing (rounds 12)
- JWT access token (15m) + refresh token (7d)
- Refresh token rotation on every use
- Full audit logging (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED)
- Self-delete protection

### Frontend
**Pages:** `LoginPage`, `UsersPage`

**Features:**
- Login form with show/hide password, demo credentials box
- Users DataGrid with server pagination
- Search by name/email, filter by role and status
- Create / Edit user dialogs (React Hook Form + Yup)
- Toggle active/inactive status
- Confirm delete dialog

---

## Phase 2 — Budget Control, Inventory & Vendor Management

### Backend
**Entities:** `Project`, `BudgetItem`, `CostEntry`, `Vendor`, `VendorRating`, `InventoryItem`, `StockTransaction`, `PurchaseRequisition`, `PRLineItem`

**API Endpoints:**
```
# Projects
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET    /api/v1/projects/stats

# Budget
GET    /api/v1/budget/:projectId/items
POST   /api/v1/budget/:projectId/items
PUT    /api/v1/budget/items/:id
DELETE /api/v1/budget/items/:id
GET    /api/v1/budget/:projectId/cost-entries
POST   /api/v1/budget/:projectId/cost-entries
DELETE /api/v1/budget/cost-entries/:id
GET    /api/v1/budget/:projectId/variance

# Inventory
GET    /api/v1/inventory/items
POST   /api/v1/inventory/items
PUT    /api/v1/inventory/items/:id
POST   /api/v1/inventory/transactions
GET    /api/v1/inventory/low-stock
GET    /api/v1/inventory/requisitions
POST   /api/v1/inventory/requisitions
PATCH  /api/v1/inventory/requisitions/:id/status

# Vendors
GET    /api/v1/vendors
POST   /api/v1/vendors
PUT    /api/v1/vendors/:id
DELETE /api/v1/vendors/:id
GET    /api/v1/vendors/top
POST   /api/v1/vendors/:id/ratings
```

**Key Features:**
- Budget categories: civil, electrical, plumbing, finishing, landscaping, other
- Computed budget status (green/amber/red) based on utilization %
- Cost entries automatically update `actualAmount` on budget items
- Inventory outward validates against current stock
- Auto-SKU generation per category
- Purchase Requisition workflow with approval (approvedBy / approvedAt)
- Vendor performance score = rolling average of all ratings
- Soft delete vendors (status → inactive)

### Frontend
**Pages:** `DashboardPage`, `ProjectsPage`, `BudgetPage`, `InventoryPage`, `VendorsPage`

**Features:**
- Dashboard: 4 stat cards, AreaChart (budget vs actual by month), BarChart (project progress), recent activity
- Projects: card grid layout, status filter, create/edit dialog
- Budget: per-project view with summary cards, colored BarChart, line items with LinearProgress, cost entry dialog with vendor selector
- Inventory: tabbed (All / Low Stock), DataGrid, low-stock alert banner, stock transaction dialog
- Vendors: DataGrid with performance LinearProgress, star rating dialog (MUI Rating)

---

## Phase 3 — Offline-First, Safety Module, RERA & Land Compliance

### Backend
**Entities:** `SafetyChecklist`, `ChecklistItem`, `DailyChecklistSubmission`, `IncidentReport`, `WorkerInsurance`, `ReraCompliance`, `ComplianceMilestone`, `LandRecord`, `ApprovalRecord`, `SyncQueue`

**API Endpoints:**
```
# Safety
GET    /api/v1/safety/dashboard
GET    /api/v1/safety/checklists
POST   /api/v1/safety/checklists
POST   /api/v1/safety/checklists/submit
GET    /api/v1/safety/checklists/submissions
GET    /api/v1/safety/incidents
POST   /api/v1/safety/incidents
PUT    /api/v1/safety/incidents/:id
GET    /api/v1/safety/insurance
POST   /api/v1/safety/insurance
GET    /api/v1/safety/insurance/expiring

# Compliance
GET    /api/v1/compliance/rera/:projectId
POST   /api/v1/compliance/rera
POST   /api/v1/compliance/milestones
PUT    /api/v1/compliance/milestones/:id
GET    /api/v1/compliance/land/:projectId
POST   /api/v1/compliance/land
POST   /api/v1/compliance/approvals
PUT    /api/v1/compliance/approvals/:id
GET    /api/v1/compliance/summary

# Sync
POST   /api/v1/sync/batch
GET    /api/v1/sync/status
```

**Key Features:**

**Safety:**
- Daily checklist submissions with duplicate prevention (1 per user/project/day)
- Checklist `overallStatus` computed from required item responses (pass/fail/partial)
- Incident reports: type (fall/equipment/fire/electrical/chemical/structural/other), severity (minor/moderate/major/critical), JSONB injured persons + photo URLs
- Worker insurance computed status: active / expiring_soon (≤30 days) / expired
- Safety dashboard aggregates open incidents, today's submissions, expiring insurance count

**RERA Compliance:**
- Registration status: pending / registered / renewal_due / expired / exempt
- Milestone tracking with progress (0–100%) and auto-set completedDate
- Unit sale tracking (totalUnits / soldUnits)
- JSONB documents array

**Land & Approvals:**
- 11 approval types: NA Order, NOC Fire, Building Permission, Occupancy Certificate, Environmental Clearance, Water Connection, Electricity Connection, Layout Approval, Completion Certificate, Structural Stability, Other
- Jantri value tracking for Gujarat land valuation
- UNIQUE constraint per (land_record, approval_type)

**Offline Sync:**
- Client operations queued in Zustand persist store
- Conflict detection via `_clientTimestamp` vs server `updatedAt`
- Retry mechanism with `retryCount` tracking
- `OfflineIndicator` component shows: offline chip / syncing spinner / pending badge count / cloud-done icon

### Frontend
**Pages:** `SafetyPage`, `CompliancePage`
**Components:** `OfflineIndicator`
**Hooks:** `useOfflineSync`
**Store:** `syncStore`

**Features:**
- Safety: 4 dashboard stat cards, tabs (Checklists / Incidents / Insurance), incident DataGrid with severity chips, insurance card list with expiry status
- Compliance: project selector dropdown, tabs (RERA / Land / Approvals), RERA detail card with milestone progress bars and "Mark Complete" buttons, land detail card, approval grid for all 11 types

---

## Phase 4 — Financials & Tally Integration

### Backend
**Entities:** `RevenueEntry`, `TallyExportLog`

**API Endpoints:**
```
GET    /api/v1/financials/dashboard
GET    /api/v1/financials/revenue/summary
GET    /api/v1/financials/revenue
POST   /api/v1/financials/revenue
PUT    /api/v1/financials/revenue/:id
DELETE /api/v1/financials/revenue/:id
GET    /api/v1/financials/margin
POST   /api/v1/financials/tally/export    (returns CSV file download)
GET    /api/v1/financials/tally/logs
```

**Key Features:**

**Revenue Tracking:**
- Categories: unit_sale, advance, installment, final_payment, rental, other
- Status: expected / received / overdue / cancelled
- Payment modes: cash, cheque, NEFT, RTGS, UPI, other
- GST and TDS amounts tracked separately
- `netAmount` getter: `amount + gstAmount - tdsAmount`
- Auto receipt numbers: `RCT-YEAR-NNNNN`

**Margin Analysis (per project):**
- `totalBudget` from budget items
- `totalCost` from actual cost entries
- `totalRevenue` from received revenue entries
- `grossMargin = totalRevenue - totalCost`
- `grossMarginPct = (grossMargin / totalRevenue) * 100`
- `roiPct = (grossMargin / totalCost) * 100`
- `costUtilizationPct = (totalCost / totalBudget) * 100`

**Tally CSV Export:**
- Export types: Revenue Entries, Cost Entries, Vendor Master, Full (combined)
- Filter by project, date range
- Every export logged to `tally_export_logs` (success/failed, row count, filename)
- File downloads immediately in browser

### Frontend
**Page:** `FinancialsPage`

**Tabs:**
1. **Dashboard** — 4 stat cards, 6-month revenue AreaChart, revenue-by-category BarChart, project financial overview table
2. **Revenue Entries** — full CRUD table with receipt number, customer, unit, amount, status chip
3. **Margin Analysis** — aggregate summary cards, margin % BarChart (green ≥20% / amber ≥10% / red <10%), ROI + cost utilization LinearProgress per project
4. **Tally Logs** — export history table with status, row count, filename, error messages

---

## Database Schema Summary

### Tables Created (TypeORM synchronize in development)

| Table | Phase | Description |
|-------|-------|-------------|
| `users` | 1 | User accounts with RBAC |
| `refresh_tokens` | 1 | JWT refresh token store |
| `audit_logs` | 1 | Action audit trail |
| `projects` | 2 | Construction projects |
| `budget_items` | 2 | Budget line items per project |
| `cost_entries` | 2 | Actual cost records |
| `vendors` | 2 | Vendor/supplier master |
| `vendor_ratings` | 2 | Vendor performance ratings |
| `inventory_items` | 2 | Material/item master |
| `stock_transactions` | 2 | Inward/outward stock movements |
| `purchase_requisitions` | 2 | Material purchase requests |
| `pr_line_items` | 2 | PR line items |
| `safety_checklists` | 3 | Checklist templates |
| `checklist_items` | 3 | Individual checklist questions |
| `daily_checklist_submissions` | 3 | Daily checklist completions |
| `incident_reports` | 3 | Safety incident records |
| `worker_insurances` | 3 | Worker insurance policies |
| `rera_compliance` | 3 | RERA registration per project |
| `compliance_milestones` | 3 | RERA milestone tracking |
| `land_records` | 3 | Land ownership records |
| `approval_records` | 3 | Regulatory approval tracking |
| `sync_queue` | 3 | Offline sync operation queue |
| `revenue_entries` | 4 | Revenue / payment records |
| `tally_export_logs` | 4 | Tally CSV export history |

---

## Frontend Pages & Routes

| Route | Page | Roles |
|-------|------|-------|
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | All |
| `/users` | UsersPage | Admin, Owner |
| `/projects` | ProjectsPage | All |
| `/budget/:projectId` | BudgetPage | All |
| `/inventory` | InventoryPage | All |
| `/vendors` | VendorsPage | All |
| `/safety` | SafetyPage | All |
| `/compliance` | CompliancePage | Admin, Owner |
| `/financials` | FinancialsPage | Admin, Owner |

---

## Sidebar Navigation

| Item | Icon | Roles |
|------|------|-------|
| Dashboard | Dashboard | All |
| Users | People | Admin, Owner |
| Projects | Business | All |
| Budget Control | AccountBalanceWallet | All |
| Inventory | Inventory | All |
| Vendors | LocalShipping | All |
| Safety | HealthAndSafety | All |
| Compliance | Gavel | Admin, Owner |
| Financials | CurrencyRupee | Admin, Owner |
| Reports | BarChart | Admin, Owner (Phase 5) |

---

## Environment Configuration

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=forever_buildcon
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

JWT_SECRET=your_32_char_secret_here_minimum_
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_32_char_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

AES_SECRET_KEY=your_32_char_aes_key_exactly____

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Forever Buildcon
```

---

## Setup & Running

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### Installation
```bash
cd forever-buildcon
npm run install:all
```

### Database Setup
1. Create the database in pgAdmin or psql:
```sql
CREATE DATABASE forever_buildcon;
```

2. Start the backend — TypeORM will auto-create all tables:
```bash
npm run dev:backend
```
Wait for: `Server running on http://localhost:5000`

3. Insert demo users (pgAdmin Query Tool):
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

INSERT INTO users (id, email, password, first_name, last_name, phone, role, status)
VALUES
  (uuid_generate_v4(), 'admin@foreverbuildcon.com', '$2b$12$PuLVum7ZpKthJK1GQ89fBeQHqrObur8cDgUzLS5gMIVxV7JTtHuyS', 'Super', 'Admin', '9876543210', 'admin', 'active'),
  (uuid_generate_v4(), 'owner@foreverbuildcon.com', '$2b$12$PuLVum7ZpKthJK1GQ89fBeQHqrObur8cDgUzLS5gMIVxV7JTtHuyS', 'Rajesh', 'Shah', '9876543211', 'owner', 'active'),
  (uuid_generate_v4(), 'supervisor@foreverbuildcon.com', '$2b$12$PuLVum7ZpKthJK1GQ89fBeQHqrObur8cDgUzLS5gMIVxV7JTtHuyS', 'Suresh', 'Patel', '9876543212', 'supervisor', 'active')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, status = 'active';
```

### Running the App

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# http://localhost:5173
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foreverbuildcon.com | Admin@123 |
| Owner | owner@foreverbuildcon.com | Admin@123 |
| Supervisor | supervisor@foreverbuildcon.com | Admin@123 |

---

## Mobile Access

Both devices must be on the same WiFi network.

1. Find your PC's IP: run `ipconfig` → look for IPv4 Address (e.g. `192.168.1.5`)
2. Update `backend/.env`: `CORS_ORIGIN=http://192.168.1.5:5173`
3. Update `frontend/.env`: `VITE_API_BASE_URL=http://192.168.1.5:5000/api/v1`
4. Restart both servers
5. Open `http://192.168.1.5:5173` on your phone browser

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt, rounds 12 |
| Token authentication | JWT RS256, 15m expiry |
| Refresh token rotation | New token on every refresh, old revoked |
| Rate limiting | 100 req / 15 min per IP |
| CORS | Restricted to configured origin |
| HTTP headers | Helmet (XSS, clickjacking, HSTS) |
| Input validation | class-validator on all DTOs |
| SQL injection | TypeORM parameterized queries |
| RBAC | Role check on every protected route |
| Audit logging | All create/update/delete/login actions |

---

## What's Next — Phase 5 (Planned)

### Project Intelligence Module
- **Early Warning System** — rule-based alerts for:
  - Budget utilization > 90% (cost overrun warning)
  - Purchase requisitions pending > 7 days
  - Overdue incident resolutions
  - Insurance / RERA expiring within 30 days
  - Material consumption anomalies (>20% variance from expected)
- **Notification Center** — in-app bell icon with all active warnings
- **Cash Flow Forecast** — project revenue vs cost projection chart
- **Vendor Risk Scoring** — flag vendors with performance score < 40

---

## Known Limitations

- No file upload (document storage uses URL strings — integrate S3/Cloudinary for production)
- No email notifications (SMTP integration needed)
- No push notifications (FCM integration needed for mobile)
- Reports page not yet built (Phase 5)
- No multi-tenant support (single company instance)
- TypeORM `synchronize: true` used in development — use migrations for production

---

*Built with React + Node.js + PostgreSQL | Forever Buildcon © 2025*
