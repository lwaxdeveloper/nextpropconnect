-- Phase 5: Reviews & Trust System
-- Run: docker exec -i supabase-db psql -U postgres -d propconnect < migrations/phase5-reviews-trust.sql

BEGIN;

-- =====================
-- REVIEWS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  
  -- Who is being reviewed (agent)
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Who wrote the review
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Link to transaction (property + lead if applicable)
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  
  -- What type of transaction
  transaction_type VARCHAR(20) NOT NULL DEFAULT 'sale', -- sale, rental, viewing
  
  -- Verification
  is_verified_transaction BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, flagged
  moderation_note TEXT,
  moderated_by INTEGER REFERENCES users(id),
  moderated_at TIMESTAMP,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One review per reviewer per agent per property
  UNIQUE(reviewer_id, agent_id, property_id)
);

CREATE INDEX idx_reviews_agent ON reviews(agent_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- =====================
-- REVIEW RESPONSES
-- =====================
CREATE TABLE IF NOT EXISTS review_responses (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One response per review
  UNIQUE(review_id)
);

-- =====================
-- REVIEW HELPFUL VOTES
-- =====================
CREATE TABLE IF NOT EXISTS review_votes (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

-- =====================
-- DISPUTES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  
  -- Who reported it
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- What/who is being reported
  reported_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reported_property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  reported_review_id INTEGER REFERENCES reviews(id) ON DELETE SET NULL,
  
  -- Dispute details
  category VARCHAR(50) NOT NULL, -- scam, misrepresentation, harassment, spam, fake_listing, other
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Evidence
  evidence_urls TEXT[], -- screenshots, documents
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, dismissed
  priority INTEGER DEFAULT 0, -- AI-assigned priority (0-100)
  
  -- Resolution
  resolution TEXT,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  -- Assignment
  assigned_to INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_category ON disputes(category);
CREATE INDEX idx_disputes_priority ON disputes(priority DESC);
CREATE INDEX idx_disputes_reported_user ON disputes(reported_user_id);

-- =====================
-- DISPUTE MESSAGES
-- =====================
CREATE TABLE IF NOT EXISTS dispute_messages (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- internal notes for moderators
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dispute_messages_dispute ON dispute_messages(dispute_id);

-- =====================
-- AREA/NEIGHBORHOOD REVIEWS
-- =====================
CREATE TABLE IF NOT EXISTS area_reviews (
  id SERIAL PRIMARY KEY,
  
  -- Location
  suburb VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50) NOT NULL,
  
  -- Reviewer
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Verification (did they live/work there?)
  is_verified_resident BOOLEAN DEFAULT false,
  residency_type VARCHAR(20), -- resident, former_resident, worker, visitor
  years_in_area INTEGER,
  
  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  schools_rating INTEGER CHECK (schools_rating >= 1 AND schools_rating <= 5),
  transport_rating INTEGER CHECK (transport_rating >= 1 AND transport_rating <= 5),
  amenities_rating INTEGER CHECK (amenities_rating >= 1 AND amenities_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Review content
  title VARCHAR(200),
  pros TEXT,
  cons TEXT,
  tips TEXT, -- insider tips for newcomers
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One review per person per suburb
  UNIQUE(reviewer_id, suburb, city)
);

CREATE INDEX idx_area_reviews_location ON area_reviews(suburb, city);
CREATE INDEX idx_area_reviews_status ON area_reviews(status);

-- =====================
-- TRUST SCORE HISTORY
-- =====================
CREATE TABLE IF NOT EXISTS trust_score_history (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_score INTEGER,
  new_score INTEGER NOT NULL,
  reason VARCHAR(100), -- review_added, dispute_resolved, response_time_improved, etc.
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trust_score_history_agent ON trust_score_history(agent_id);

-- =====================
-- UPDATE AGENT PROFILES
-- =====================
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS response_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS avg_response_time_hours NUMERIC(6,2);
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS completed_transactions INTEGER DEFAULT 0;
ALTER TABLE agent_profiles ADD COLUMN IF NOT EXISTS trust_score_updated_at TIMESTAMP;

-- =====================
-- FUNCTIONS
-- =====================

-- Function to recalculate agent trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(p_agent_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_rating_score NUMERIC;
  v_review_count INTEGER;
  v_response_score NUMERIC;
  v_completion_score NUMERIC;
  v_dispute_penalty NUMERIC;
  v_total_score INTEGER;
  v_agent_profile agent_profiles%ROWTYPE;
BEGIN
  -- Get agent profile
  SELECT * INTO v_agent_profile FROM agent_profiles WHERE user_id = p_agent_id;
  
  -- 1. Rating score (max 40 points) - weighted by review count
  SELECT 
    COALESCE(AVG(rating) * 8, 20), -- 5 stars = 40 points, 0 reviews = 20 (neutral)
    COUNT(*)
  INTO v_rating_score, v_review_count
  FROM reviews 
  WHERE agent_id = p_agent_id AND status = 'approved';
  
  -- Boost for more reviews (up to +10 for 50+ reviews)
  v_rating_score := v_rating_score + LEAST(v_review_count * 0.2, 10);
  
  -- 2. Response rate score (max 25 points)
  v_response_score := COALESCE(v_agent_profile.response_rate * 0.25, 12.5);
  
  -- 3. Completion/experience score (max 20 points)
  v_completion_score := LEAST(COALESCE(v_agent_profile.completed_transactions, 0) * 0.5, 20);
  
  -- 4. Dispute penalty (can subtract up to 15 points)
  SELECT COALESCE(COUNT(*) * 3, 0)
  INTO v_dispute_penalty
  FROM disputes 
  WHERE reported_user_id = p_agent_id 
    AND status = 'resolved' 
    AND resolved_at > NOW() - INTERVAL '1 year';
  
  v_dispute_penalty := LEAST(v_dispute_penalty, 15);
  
  -- Calculate total (max 100)
  v_total_score := GREATEST(0, LEAST(100,
    v_rating_score + v_response_score + v_completion_score - v_dispute_penalty
  ))::INTEGER;
  
  -- Update agent profile
  UPDATE agent_profiles 
  SET 
    trust_score = v_total_score,
    total_reviews = v_review_count,
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE agent_id = p_agent_id AND status = 'approved'),
    trust_score_updated_at = NOW()
  WHERE user_id = p_agent_id;
  
  -- Log history
  INSERT INTO trust_score_history (agent_id, old_score, new_score, reason, details)
  VALUES (
    p_agent_id, 
    v_agent_profile.trust_score, 
    v_total_score, 
    'recalculated',
    jsonb_build_object(
      'rating_score', v_rating_score,
      'response_score', v_response_score,
      'completion_score', v_completion_score,
      'dispute_penalty', v_dispute_penalty,
      'review_count', v_review_count
    )
  );
  
  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate trust score on new review
CREATE OR REPLACE FUNCTION trigger_update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM calculate_trust_score(NEW.agent_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM calculate_trust_score(OLD.agent_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_trust_score_trigger ON reviews;
CREATE TRIGGER review_trust_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trust_score();

COMMIT;

-- Show created tables
\dt reviews
\dt disputes
\dt area_reviews
