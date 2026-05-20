-- Forever Buildcon Phase 2 Schema

CREATE TYPE project_type AS ENUM ('residential', 'commercial', 'mixed');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE budget_category AS ENUM ('rcc','plumbing','electrical','finishing','civil','procurement','labor','land','approval','other');
CREATE TYPE vendor_category AS ENUM ('material','labor','contractor','consultant','other');
CREATE TYPE vendor_status AS ENUM ('active','inactive','blacklisted');
CREATE TYPE item_unit AS ENUM ('kg','tons','bags','nos','sqft','rft','liters','cubic_meter','meters');
CREATE TYPE item_category AS ENUM ('cement','steel','sand','aggregate','bricks','tiles','plumbing','electrical','finishing','paint','wood','glass','other');
CREATE TYPE transaction_type AS ENUM ('inward','outward','adjustment','return');
CREATE TYPE pr_status AS ENUM ('draft','pending_approval','approved','ordered','received','cancelled');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  type project_type NOT NULL DEFAULT 'residential',
  status project_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  total_budget DECIMAL(15,2) DEFAULT 0,
  rera_number VARCHAR(100),
  land_area DECIMAL(10,2),
  jantri_rate DECIMAL(10,2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category vendor_category NOT NULL DEFAULT 'material',
  contact_person VARCHAR(100), email VARCHAR(255), phone VARCHAR(20),
  address TEXT, gst_number VARCHAR(20), pan_number VARCHAR(10),
  status vendor_status NOT NULL DEFAULT 'active',
  performance_score DECIMAL(5,2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category budget_category NOT NULL DEFAULT 'other',
  name VARCHAR(255) NOT NULL, description TEXT,
  budgeted_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  actual_amount DECIMAL(15,2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE cost_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_item_id UUID NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL, description TEXT,
  entry_date DATE NOT NULL, invoice_number VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cost_entries_updated_at BEFORE UPDATE ON cost_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE vendor_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  quality_score INT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  delivery_score INT NOT NULL CHECK (delivery_score BETWEEN 1 AND 5),
  pricing_score INT NOT NULL CHECK (pricing_score BETWEEN 1 AND 5),
  overall_score DECIMAL(5,2) NOT NULL, comments TEXT,
  rated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL, description TEXT,
  unit item_unit NOT NULL DEFAULT 'nos',
  category item_category NOT NULL DEFAULT 'other',
  unit_price DECIMAL(12,2) DEFAULT 0,
  current_stock DECIMAL(12,3) DEFAULT 0,
  minimum_stock DECIMAL(12,3) DEFAULT 0,
  qr_code VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2), total_value DECIMAL(15,2),
  reference_no VARCHAR(100), notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number VARCHAR(30) NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  status pr_status NOT NULL DEFAULT 'draft',
  required_by DATE, notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  total_amount DECIMAL(15,2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_pr_updated_at BEFORE UPDATE ON purchase_requisitions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE pr_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  received_quantity DECIMAL(12,3) DEFAULT 0,
  remarks TEXT
);
