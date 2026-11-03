-- ==============================================================================
-- INAMDAR RESTAURANT POS - DATABASE SCHEMA MIGRATION 03
-- Migration: 03_independent_bills_support.sql
-- Covers: Independent bills per table, order_items status 'BILLED', and table vacancy decoupling
-- ==============================================================================

-- 1. UPDATE CHECK CONSTRAINT ON order_items.status TO SUPPORT 'BILLED'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'order_items_status_check' 
        AND conrelid = 'order_items'::regclass
    ) THEN
        ALTER TABLE order_items DROP CONSTRAINT order_items_status_check;
    END IF;
END $$;

ALTER TABLE order_items ADD CONSTRAINT order_items_status_check 
    CHECK (status IN ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'BILLED'));

-- 2. ADD is_billed AND bill_no COLUMNS TO order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bill_no INT DEFAULT NULL;

-- 3. ADD is_closed_for_ordering TO bills
-- When a Cash Memo is generated (status = 'UNSETTLED'), it is a finalized bill awaiting payment.
-- New orders placed on that table must NEVER append to an existing unsettled bill, but start an independent bill.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_closed_for_ordering BOOLEAN DEFAULT true;

-- 4. ENSURE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_order_items_active ON order_items(table_id) WHERE is_billed = false;
CREATE INDEX IF NOT EXISTS idx_bills_unsettled ON bills(table_id, status) WHERE status = 'UNSETTLED';

-- 5. CLEAN UP STALE ACTIVE ITEMS FOR AVAILABLE TABLES
-- If any table in tables has status = 'AVAILABLE', clean up leftover order_items so the table starts 100% clean
DELETE FROM order_items 
WHERE table_id IN (SELECT id FROM tables WHERE status = 'AVAILABLE');
