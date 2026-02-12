-- Phase 7: Rental Management
-- Run: psql -h localhost -U postgres -d propconnect -f migrations/phase7-rental-management.sql

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  property_id INTEGER REFERENCES properties(id) NOT NULL,
  landlord_id INTEGER REFERENCES users(id) NOT NULL,
  
  -- Tenant info (if no user account yet)
  tenant_name VARCHAR(200),
  tenant_email VARCHAR(200),
  tenant_phone VARCHAR(50),
  
  -- Lease details
  lease_start DATE NOT NULL,
  lease_end DATE,
  rent_amount DECIMAL(10,2) NOT NULL,
  rent_due_day INTEGER DEFAULT 1, -- Day of month rent is due
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, notice, vacated
  notice_date DATE, -- When notice was given
  vacate_date DATE, -- Actual/expected vacate date
  
  -- Documents
  lease_document_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rent Payments table
CREATE TABLE IF NOT EXISTS rent_payments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
  property_id INTEGER REFERENCES properties(id) NOT NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  period_start DATE, -- Rent period start
  period_end DATE,   -- Rent period end
  
  -- Payment info
  paid_date DATE,
  paid_amount DECIMAL(10,2),
  payment_method VARCHAR(20), -- ozow, eft, cash, debit_order
  payment_reference TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, partial
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
  property_id INTEGER REFERENCES properties(id) NOT NULL,
  
  -- Request details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- plumbing, electrical, structural, appliance, other
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, urgent, emergency
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'new', -- new, acknowledged, in_progress, completed, cancelled
  
  -- Images
  images TEXT[], -- Array of image URLs
  
  -- Resolution
  landlord_notes TEXT,
  resolution_notes TEXT,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_property ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_landlord ON tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant ON rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date ON rent_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);

-- Add rental-related fields to properties if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_rental_managed') THEN
    ALTER TABLE properties ADD COLUMN is_rental_managed BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON TABLE tenants IS 'Tenant records linked to rental properties';
COMMENT ON TABLE rent_payments IS 'Monthly rent payment tracking';
COMMENT ON TABLE maintenance_requests IS 'Tenant maintenance/repair requests';
