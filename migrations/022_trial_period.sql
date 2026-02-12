-- Add trial period tracking to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Set trial for all existing users (90 days from now)
UPDATE users 
SET trial_started_at = created_at,
    trial_ends_at = created_at + INTERVAL '90 days',
    subscription_plan = 'trial'
WHERE trial_started_at IS NULL;

-- Index for quick trial checks
CREATE INDEX IF NOT EXISTS idx_users_trial_ends ON users(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_plan);
