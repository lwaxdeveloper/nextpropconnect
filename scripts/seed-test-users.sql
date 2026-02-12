-- Seed test users for E2E tests
-- Password for all: test1234 (bcrypt hash)

-- Admin user
INSERT INTO users (email, password_hash, name, phone, role, is_verified) VALUES
  ('admin@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Admin User', '071 000 0001', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Buyer user
INSERT INTO users (email, password_hash, name, phone, role, is_verified) VALUES
  ('buyer@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Test Buyer', '071 000 0002', 'buyer', true)
ON CONFLICT (email) DO NOTHING;

-- Renter user
INSERT INTO users (email, password_hash, name, phone, role, is_verified) VALUES
  ('renter@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Test Renter', '071 000 0003', 'buyer', true)
ON CONFLICT (email) DO NOTHING;

-- Landlord user
INSERT INTO users (email, password_hash, name, phone, role, is_verified) VALUES
  ('landlord@propconnect.co.za', '$2a$10$LQ3XYFD7P.8K7dI6JiVsHuqK0SLnRfjx6bwJ0BPdUzJmYNjQxN/4e', 'Test Landlord', '071 000 0004', 'seller', true)
ON CONFLICT (email) DO NOTHING;

-- Create tenant record for renter
-- First get a rental property (listing_type='rent')
DO $$
DECLARE
  renter_id INTEGER;
  landlord_id INTEGER;
  rental_property_id INTEGER;
BEGIN
  -- Get user IDs
  SELECT id INTO renter_id FROM users WHERE email = 'renter@propconnect.co.za';
  SELECT id INTO landlord_id FROM users WHERE email = 'landlord@propconnect.co.za';
  
  -- Get a rental property
  SELECT id INTO rental_property_id FROM properties WHERE listing_type = 'rent' LIMIT 1;
  
  -- If no rental exists, get any property
  IF rental_property_id IS NULL THEN
    SELECT id INTO rental_property_id FROM properties LIMIT 1;
  END IF;
  
  -- Only insert if we have all the IDs and tenant doesn't exist
  IF renter_id IS NOT NULL AND landlord_id IS NOT NULL AND rental_property_id IS NOT NULL THEN
    INSERT INTO tenants (user_id, property_id, landlord_id, lease_start, lease_end, rent_amount, rent_due_day, status)
    VALUES (renter_id, rental_property_id, landlord_id, CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 8500.00, 1, 'active')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
