-- Phase 8: Verification & Trust System
-- Run: docker exec -e PGPASSWORD=... supabase-db psql -U postgres -d propconnect -f /path/to/this.sql

-- Verification requests table
CREATE TABLE IF NOT EXISTS verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'identity', 'property', 'agent', 'agency'
  property_id INTEGER REFERENCES properties(id), -- for property verifications
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
  documents JSONB DEFAULT '[]', -- array of document URLs
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  rejection_reason TEXT,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}' -- extra data like EAAB number, etc.
);

-- Verification documents (detailed tracking)
CREATE TABLE IF NOT EXISTS verification_documents (
  id SERIAL PRIMARY KEY,
  verification_id INTEGER REFERENCES verifications(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'id_front', 'id_back', 'selfie', 'title_deed', 'eaab_cert', 'rates_account'
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Add verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_badge VARCHAR(20); -- 'blue_tick', 'verified_agent', etc.

-- Add verification to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_verified BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_verified_at TIMESTAMP;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_verification_id INTEGER REFERENCES verifications(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);
CREATE INDEX IF NOT EXISTS idx_verifications_type ON verifications(type);
CREATE INDEX IF NOT EXISTS idx_verification_documents_verification_id ON verification_documents(verification_id);

-- View for pending verifications (admin dashboard)
CREATE OR REPLACE VIEW pending_verifications AS
SELECT 
  v.*,
  u.name as user_name,
  u.email as user_email,
  u.avatar_url as user_avatar,
  p.title as property_title,
  p.address as property_address,
  (SELECT COUNT(*) FROM verification_documents WHERE verification_id = v.id) as document_count
FROM verifications v
JOIN users u ON v.user_id = u.id
LEFT JOIN properties p ON v.property_id = p.id
WHERE v.status = 'pending'
ORDER BY v.submitted_at ASC;
