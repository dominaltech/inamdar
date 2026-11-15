-- ==============================================================================
-- INAMDAR RESTAURANT POS & ERP - DATABASE SCHEMA MIGRATION 08
-- Migration: 08_customers_and_repeat_tracking.sql
-- Purpose:
--   1. Create `customers` table with phone number as unique identifier (PK) for
--      tracking repeat customer visits, lifetime spend, and item purchase history.
--   2. Enable Row-Level Security (RLS) with open anonymous policies for live counter sync.
--   3. Add `customers` table to Supabase Realtime publication.
--   4. Clear remote daily_transactions table to ensure revenue data is stored
--      exclusively in local disk files (C: and D: drives) and never exposed to cloud.
-- ==============================================================================

-- 1. Create customers master table
CREATE TABLE IF NOT EXISTS customers (
    phone VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    visit_count INT NOT NULL DEFAULT 1,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast search by phone or customer name
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to customers" ON customers;
CREATE POLICY "Allow public read access to customers" ON customers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert to customers" ON customers;
CREATE POLICY "Allow public insert to customers" ON customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to customers" ON customers;
CREATE POLICY "Allow public update to customers" ON customers
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete to customers" ON customers;
CREATE POLICY "Allow public delete to customers" ON customers
    FOR DELETE USING (true);

-- 3. Enable Supabase Realtime on customers table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'customers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE customers;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Purge remote daily_transactions table in cloud to preserve local revenue privacy
TRUNCATE TABLE daily_transactions;

