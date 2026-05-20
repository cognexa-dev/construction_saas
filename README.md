# Forever Buildcon - Construction Management Platform

## Phase 1: Authentication & User Management

### Quick Start

#### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

#### 2. Database Setup
```bash
createdb forever_buildcon
psql forever_buildcon < database/schema.sql
psql forever_buildcon < database/seed.sql
```

#### 3. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and secrets
npm install
npm run dev
# Runs on http://localhost:5000
```

#### 4. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Runs on http://localhost:5173
```

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@foreverbuildcon.com | Admin@123 |
| Owner | owner@foreverbuildcon.com | Admin@123 |
| Supervisor | supervisor@foreverbuildcon.com | Admin@123 |

### Architecture
```
forever-buildcon/
├── frontend/          React + Vite + TypeScript + MUI
├── backend/           Node.js + Express + TypeScript + TypeORM
├── shared/            Shared types
└── database/          SQL schema & seeds
```

### API Base URL
`http://localhost:5000/api/v1`

### Phase Roadmap
- **Phase 1** ✅ Auth + User Management
- **Phase 2** 🔜 Budget, Inventory, Vendors
- **Phase 3** 🔜 Offline-first, Safety, RERA
- **Phase 4** 🔜 Financials, Tally Integration
- **Phase 5** 🔜 Intelligence & Early Warning
