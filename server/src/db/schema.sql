-- Users (populated from Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profile / retirement plan inputs
CREATE TABLE IF NOT EXISTS retirement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Primary user
  current_age INTEGER NOT NULL DEFAULT 40,
  current_income NUMERIC(12,2) NOT NULL DEFAULT 0,
  retirement_age INTEGER NOT NULL DEFAULT 65,
  
  -- Spouse (optional)
  has_spouse BOOLEAN DEFAULT FALSE,
  spouse_current_age INTEGER,
  spouse_current_income NUMERIC(12,2),
  spouse_retirement_age INTEGER,
  
  -- Budget
  annual_retirement_budget NUMERIC(12,2) DEFAULT 80000,
  
  -- Real estate
  real_estate_equity NUMERIC(12,2) DEFAULT 0,
  plan_to_sell_real_estate BOOLEAN DEFAULT FALSE,
  real_estate_sale_age INTEGER,
  
  -- Social security
  ss_draw_age INTEGER DEFAULT 67,
  ss_monthly_estimate NUMERIC(10,2) DEFAULT 0,
  spouse_ss_draw_age INTEGER,
  spouse_ss_monthly_estimate NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Accounts (401k, IRA, Roth IRA, brokerage, etc.)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('401k', 'traditional_ira', 'roth_ira', 'brokerage', 'savings', 'pension')),
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  annual_contribution NUMERIC(12,2) DEFAULT 0,
  employer_match_pct NUMERIC(5,2) DEFAULT 0,  -- e.g. 50 = 50%
  employer_match_limit_pct NUMERIC(5,2) DEFAULT 0, -- % of salary matched up to
  owner TEXT DEFAULT 'primary' CHECK (owner IN ('primary', 'spouse')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session store (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
  sid TEXT PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- Migration: add inflation + income growth assumptions to retirement_plans
ALTER TABLE retirement_plans
  ADD COLUMN IF NOT EXISTS inflation_rate NUMERIC(5,4) DEFAULT 0.0300,
  ADD COLUMN IF NOT EXISTS income_growth_rate NUMERIC(5,4) DEFAULT 0.0200;
