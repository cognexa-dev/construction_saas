-- Phase 3 Schema: Safety, RERA Compliance, Land & Approvals, Sync Queue
-- Requires: phase1 schema (users, projects tables + update_updated_at() function)

-- =====================
-- SAFETY MODULE
-- =====================

CREATE TYPE incident_type AS ENUM ('fall', 'equipment', 'fire', 'electrical', 'chemical', 'structural', 'other');
CREATE TYPE incident_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'under_investigation', 'resolved', 'closed');
CREATE TYPE insurance_type AS ENUM ('health', 'accident', 'life', 'workmen_compensation');

CREATE TABLE IF NOT EXISTS safety_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES safety_checklists(id) ON DELETE CASCADE,
  question VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_checklist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES safety_checklists(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responses JSONB NOT NULL DEFAULT '[]',
  overall_status VARCHAR(20) NOT NULL DEFAULT 'pass' CHECK (overall_status IN ('pass', 'fail', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (checklist_id, project_id, submitted_by, submission_date)
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  incident_type incident_type NOT NULL,
  severity incident_severity NOT NULL,
  status incident_status NOT NULL DEFAULT 'open',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  injured_persons JSONB DEFAULT '[]',
  photo_urls JSONB DEFAULT '[]',
  root_cause TEXT,
  corrective_actions TEXT,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS worker_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name VARCHAR(255) NOT NULL,
  worker_id VARCHAR(100),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  insurance_type insurance_type NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  coverage_amount DECIMAL(15,2),
  premium_amount DECIMAL(15,2),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- RERA COMPLIANCE
-- =====================

CREATE TYPE rera_registration_status AS ENUM ('pending', 'registered', 'renewal_due', 'expired', 'exempt');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed');

CREATE TABLE IF NOT EXISTS rera_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  rera_number VARCHAR(100),
  status rera_registration_status NOT NULL DEFAULT 'pending',
  registration_date DATE,
  expiry_date DATE,
  promoter_name VARCHAR(255),
  carpet_area DECIMAL(10,2),
  total_units INT,
  sold_units INT NOT NULL DEFAULT 0,
  last_quarterly_report DATE,
  next_quarterly_report DATE,
  documents JSONB DEFAULT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rera_compliance_id UUID NOT NULL REFERENCES rera_compliance(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed_date DATE,
  status milestone_status NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- LAND & APPROVALS
-- =====================

CREATE TYPE approval_type AS ENUM (
  'na_order', 'noc_fire', 'building_permission', 'occupancy_certificate',
  'environmental_clearance', 'water_connection', 'electricity_connection',
  'layout_approval', 'completion_certificate', 'structural_stability',
  'other'
);
CREATE TYPE approval_status AS ENUM ('pending', 'applied', 'approved', 'rejected', 'expired');

CREATE TABLE IF NOT EXISTS land_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  survey_number VARCHAR(100),
  village VARCHAR(255),
  taluka VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(100) NOT NULL DEFAULT 'Gujarat',
  total_area DECIMAL(12,4),
  area_unit VARCHAR(20) DEFAULT 'sq_meter',
  jantri_value DECIMAL(15,2),
  purchase_price DECIMAL(15,2),
  purchase_date DATE,
  seller_name VARCHAR(255),
  na_order_number VARCHAR(100),
  na_order_date DATE,
  documents JSONB DEFAULT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  land_record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
  approval_type approval_type NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  reference_number VARCHAR(100),
  authority VARCHAR(255),
  applied_date DATE,
  approved_date DATE,
  expiry_date DATE,
  fee_paid DECIMAL(12,2),
  documents JSONB DEFAULT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (land_record_id, approval_type)
);

-- =====================
-- SYNC QUEUE
-- =====================

CREATE TYPE sync_operation_type AS ENUM ('create', 'update', 'delete');
CREATE TYPE sync_op_status AS ENUM ('pending', 'syncing', 'done', 'failed');

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(100) NOT NULL UNIQUE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  operation sync_operation_type NOT NULL,
  payload JSONB,
  client_timestamp TIMESTAMPTZ NOT NULL,
  status sync_op_status NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TRIGGERS
-- =====================

CREATE TRIGGER update_safety_checklists_updated_at
  BEFORE UPDATE ON safety_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_worker_insurance_updated_at
  BEFORE UPDATE ON worker_insurance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rera_compliance_updated_at
  BEFORE UPDATE ON rera_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_compliance_milestones_updated_at
  BEFORE UPDATE ON compliance_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_land_records_updated_at
  BEFORE UPDATE ON land_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_approval_records_updated_at
  BEFORE UPDATE ON approval_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sync_queue_updated_at
  BEFORE UPDATE ON sync_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_incident_reports_project ON incident_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_worker_insurance_expiry ON worker_insurance(expiry_date);
CREATE INDEX IF NOT EXISTS idx_worker_insurance_project ON worker_insurance(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_submissions_date ON daily_checklist_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_daily_submissions_project ON daily_checklist_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_milestones_rera ON compliance_milestones(rera_compliance_id);
CREATE INDEX IF NOT EXISTS idx_compliance_milestones_due_date ON compliance_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_approval_records_land ON approval_records(land_record_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_status ON approval_records(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_client_id ON sync_queue(client_id);
