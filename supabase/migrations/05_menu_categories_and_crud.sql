-- ==============================================================================
-- INAMDAR RESTAURANT POS - DATABASE SCHEMA MIGRATION 05
-- Migration: 05_menu_categories_and_crud.sql
-- Covers: Dedicated menu_categories table, live category ordering, and CRUD sync
-- ==============================================================================

-- 1. CREATE MENU_CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS menu_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category_order INT NOT NULL DEFAULT 99,
  department TEXT DEFAULT 'KITCHEN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(category_order ASC);
CREATE INDEX IF NOT EXISTS idx_menu_items_cat_order ON menu_items(category_order ASC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);

-- 3. POPULATE INITIAL CATEGORIES FROM EXISTING MENU_ITEMS
INSERT INTO menu_categories (name, category_order, department, is_active)
SELECT 
  category, 
  MIN(category_order) as category_order,
  CASE 
    WHEN category ILIKE '%DESSERT%' OR category ILIKE '%MOCKTAL%' OR category ILIKE '%SOFT DRINK%' 
    THEN 'PANTRY' 
    ELSE 'KITCHEN' 
  END as department,
  true as is_active
FROM menu_items
WHERE category IS NOT NULL AND TRIM(category) != ''
GROUP BY category
ON CONFLICT (name) DO UPDATE 
SET category_order = EXCLUDED.category_order;

-- 4. ENABLE ROW LEVEL SECURITY AND PERMISSIVE POLICIES
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'menu_categories' 
    AND policyname = 'Allow all access to menu_categories'
  ) THEN
    CREATE POLICY "Allow all access to menu_categories" 
      ON menu_categories FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- 5. ENABLE REALTIME PUBLICATION FOR MENU_CATEGORIES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'menu_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
  END IF;
END $$;

-- 6. RPC HELPER: ATOMIC CATEGORY REORDERING & MENU CASCADING
CREATE OR REPLACE FUNCTION update_category_order(
  p_category_name TEXT,
  p_new_order INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update category ledger
  UPDATE menu_categories
  SET category_order = p_new_order,
      updated_at = now()
  WHERE name = p_category_name;

  -- Cascade category order to all member menu items
  UPDATE menu_items
  SET category_order = p_new_order
  WHERE category = p_category_name;
END;
$$;

-- 7. ENSURE ATOMIC BILL SETTLEMENT PRESERVES INDEPENDENT BILLS PER TABLE
CREATE OR REPLACE FUNCTION public.settle_bill_and_free_table(
  p_bill_no text,
  p_table_id text,
  p_payment_mode text,
  p_amount numeric,
  p_operator text DEFAULT 'COUNTER'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_table text := trim(upper(p_table_id));
BEGIN
  -- Mark ONLY specific bill SETTLED
  UPDATE bills
  SET status = 'SETTLED', payment_mode = p_payment_mode, settled_at = now()
  WHERE (p_bill_no IS NOT NULL AND p_bill_no <> '' AND bill_no::text = p_bill_no)
     OR (p_bill_no IS NULL AND table_id = v_clean_table AND status = 'UNSETTLED');

  -- Record daily transaction
  INSERT INTO daily_transactions (
    bill_no, table_id, amount, payment_mode, cashier_name, settled_time, created_at
  ) VALUES (
    p_bill_no, v_clean_table, p_amount, p_payment_mode, p_operator, to_char(now(), 'HH24:MI:SS'), now()
  );

  -- Mark active items for this table as SERVED
  UPDATE order_items
  SET status = 'SERVED'
  WHERE table_id = v_clean_table AND status <> 'CANCELLED';

  -- Free the table
  UPDATE tables
  SET 
    status = 'AVAILABLE',
    kot_nos = ARRAY[]::integer[],
    active_waiter = NULL,
    customer_name = '',
    customer_phone = ''
  WHERE id = v_clean_table;

  RETURN jsonb_build_object('success', true, 'bill_no', p_bill_no, 'table_id', v_clean_table);
END;
$$;

