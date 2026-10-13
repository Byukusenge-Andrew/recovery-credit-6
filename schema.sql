-- Schema for Recovery Credit 6 on Neon PostgreSQL

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collector')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Debtors Table
CREATE TABLE IF NOT EXISTS debtors (
  id TEXT PRIMARY KEY,
  account_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  debtor_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date_of_payment TEXT,
  whatsapp_number TEXT,
  category TEXT NOT NULL,
  color_flag TEXT NOT NULL,
  assigned_collector TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  debtor_id TEXT NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
  amount_paid NUMERIC(12, 2) NOT NULL,
  payment_date TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  debtor_id TEXT NOT NULL REFERENCES debtors(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_date TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_username TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  debtor_id TEXT,
  debtor_name TEXT,
  client_name TEXT,
  amount NUMERIC(12, 2),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (Append-only / Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_id TEXT,
  actor_username TEXT NOT NULL,
  actor_full_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_description TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_debtors_collector ON debtors(assigned_collector);
CREATE INDEX IF NOT EXISTS idx_debtors_account ON debtors(account_number);
CREATE INDEX IF NOT EXISTS idx_payments_debtor ON payments(debtor_id);
CREATE INDEX IF NOT EXISTS idx_activities_debtor ON activities(debtor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
