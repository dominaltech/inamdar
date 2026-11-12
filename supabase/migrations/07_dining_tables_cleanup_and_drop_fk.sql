-- ==============================================================================
-- INAMDAR RESTAURANT POS & ERP - DATABASE SCHEMA MIGRATION 07
-- Migration: 07_dining_tables_cleanup_and_drop_fk.sql
-- Purpose:
--   1. Drop FK constraints on kots and order_items so historical KOTs/items are
--      permanently preserved even when temporary delivery/parcel orders are cleared.
--   2. Remove all temporary parcel, takeaway, and delivery ghost rows from tables table.
--   3. Normalize dine-in table sections:
--      - Tables 1 to 20: 'AC'
--      - Tables 21 to 42: 'FAMILY AC'
-- ==============================================================================

-- 1. Drop foreign key constraints linking kots and order_items to tables(id)
-- This allows Takeaway & Home Delivery orders to use dynamic customer/takeaway tokens
-- without creating phantom rows in the physical dining tables table.
ALTER TABLE IF EXISTS kots DROP CONSTRAINT IF EXISTS kots_table_id_fkey;
ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_table_id_fkey;

-- 2. Remove obsolete / temporary delivery and takeaway records from tables table
-- (Past bills and past KOTs remain completely intact in bills and kots tables)
DELETE FROM tables 
WHERE id LIKE '00%' 
   OR id LIKE '0%' 
   OR id IN ('1A', '1B');

-- 3. Normalize AC Dine-In tables (Tables 1 to 20)
UPDATE tables 
SET section = 'AC' 
WHERE id ~ '^[0-9]+$' 
  AND id::integer BETWEEN 1 AND 20;

-- 4. Normalize Family AC Dine-In tables (Tables 21 to 42)
UPDATE tables 
SET section = 'FAMILY AC' 
WHERE id ~ '^[0-9]+$' 
  AND id::integer BETWEEN 21 AND 42;

