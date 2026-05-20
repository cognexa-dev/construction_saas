-- Phase 4 Schema: Financials — Revenue Tracking & Tally Integration
-- Requires: phase1 + phase2 schemas (users, projects, cost_entries + update_updated_at() function)

-- =====================
-- ENUMS
-- =====================

CREATE TYPE revenue_category AS ENUM (
  'unit_sale', 'advance', 'installment', 'final_payment', 'rental', 'other'
);

CREATE TYPE payment_mode AS ENUM (
  'cash', 'cheque', 'neft', 'rtgs', 'upi', 'other'
);

CREATE TYPE revenue_status AS ENUM (
  'expected', 'received', 'overdue', 'cancelled'
);

CREATE TYPE tally_export_type AS ENUM (
  'cost_entries', 'revenue_entries', 'vendors', 'full'
);

CREATE TYPE tally_export_status AS ENUM (
  'success', 'failed'
);

-- =====================
-- REVENUE ENTRIES
-- =====================

CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  category revenue_category NOT NULL,
  status revenue_status NOT NULL DEFAULT 'expected',
  payment_mode payment_mode,
  description VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  unit_number VARCHAR(50),
  amount DECIMAL(15,2) NOT NULL,
  gst_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tds_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  expected_date DATE,
  received_date DATE,
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TALLY EXPORT LOGS
-- =====================

CREATE TABLE IF NOT EXISTS tally_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type tally_export_type NOT NULL,
  status tally_export_status NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date_from DATE,
  date_to DATE,
  row_count INT NOT NULL DEFAULT 0,
  file_name VARCHAR(255),
  error_message TEXT,
  exported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TRIGGERS
-- =====================

CREATE TRIGGER update_revenue_entries_updated_at
  BEFORE UPDATE ON revenue_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_revenue_entries_project ON revenue_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_status ON revenue_entries(status);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_received_date ON revenue_entries(received_date);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_expected_date ON revenue_entries(expected_date);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_category ON revenue_entries(category);
CREATE INDEX IF NOT EXISTS idx_tally_export_logs_type ON tally_export_logs(export_type);
CREATE INDEX IF NOT EXISTS idx_tally_export_logs_created ON tally_export_logs(created_at DESC);
