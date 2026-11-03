-- ==============================================================================
-- INAMDAR RESTAURANT POS - DATABASE SCHEMA MIGRATION 02
-- Migration: 02_features_update.sql
-- Covers: Customer Name & Phone, GENERAL section support, and replica identity
-- ==============================================================================

-- 1. ADD CUSTOMER DETAILS TO TABLES, KOTS, AND BILLS
ALTER TABLE tables ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE tables ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';

ALTER TABLE kots ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE kots ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';

ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';

-- 2. UPDATE SECTION CONSTRAINTS TO SUPPORT 'GENERAL' INSTEAD OF 'AC'
-- (Allows both 'GENERAL' and 'AC' for backwards-compatibility during migration)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tables_section_check' 
        AND conrelid = 'tables'::regclass
    ) THEN
        ALTER TABLE tables DROP CONSTRAINT tables_section_check;
    END IF;
END $$;

ALTER TABLE tables ADD CONSTRAINT tables_section_check 
    CHECK (section IN ('GENERAL', 'FAMILY AC', 'PARCEL', 'HOME DELIVERY', 'AC'));

-- Migrate existing 'AC' tables (Tables 1 to 20) to 'GENERAL'
UPDATE tables SET section = 'GENERAL' WHERE section = 'AC';

-- 3. ENSURE FULL REPLICA IDENTITY FOR REALTIME DELTAS
ALTER TABLE tables REPLICA IDENTITY FULL;
ALTER TABLE bills REPLICA IDENTITY FULL;
ALTER TABLE kots REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;
