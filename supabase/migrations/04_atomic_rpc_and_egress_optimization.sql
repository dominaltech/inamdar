-- ==============================================================================
-- INAMDAR RESTAURANT POS & ERP - DATABASE SCHEMA MIGRATION 04
-- Migration: 04_atomic_rpc_and_egress_optimization.sql
-- Covers: Atomic RPC Database Functions for Zero Egress Waste & Network Crash Safety
-- Includes: fire_kot, settle_bill_and_free_table, transfer_table, cancel_kot_item
-- ==============================================================================

-- =========================================================================
-- 1. ATOMIC ORDER / KOT PLACEMENT FUNCTION
-- Eliminates 5-roundtrip network lag from mobile captain phones
-- Atomically increments daily KOT counter, inserts KOT header, bulk inserts dishes,
-- and updates table status to OCCUPIED in one single ACID transaction.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.fire_kot(
  p_table_id text,
  p_section text,
  p_waiter_name text,
  p_customer_name text DEFAULT '',
  p_customer_phone text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_kot_num integer;
  v_new_kot_id bigint;
  v_item jsonb;
  v_clean_table_id text := trim(upper(p_table_id));
  v_clean_cust_name text := trim(coalesce(p_customer_name, ''));
  v_clean_cust_phone text := trim(coalesce(p_customer_phone, ''));
  v_waiter_display text;
BEGIN
  -- Atomically increment daily KOT counter
  INSERT INTO pos_counters (counter_key, counter_val)
  VALUES ('daily_kot_counter', 1)
  ON CONFLICT (counter_key)
  DO UPDATE SET counter_val = pos_counters.counter_val + 1
  RETURNING counter_val INTO v_next_kot_num;

  v_waiter_display := p_waiter_name;
  IF v_clean_cust_name <> '' THEN
    v_waiter_display := v_waiter_display || ' • ' || v_clean_cust_name;
    IF v_clean_cust_phone <> '' THEN
      v_waiter_display := v_waiter_display || ' (' || v_clean_cust_phone || ')';
    END IF;
  END IF;

  -- Insert KOT Header
  INSERT INTO kots (
    kot_number, table_id, section, waiter_name, customer_name, customer_phone, department, status
  ) VALUES (
    v_next_kot_num, v_clean_table_id, p_section, v_waiter_display, v_clean_cust_name, v_clean_cust_phone, 'ALL', 'PENDING'
  )
  RETURNING id INTO v_new_kot_id;

  -- Bulk Insert Dishes
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      kot_id, kot_number, table_id, item_code, item_name, qty, rate, amount, category, department, status, is_cancelled
    ) VALUES (
      v_new_kot_id,
      v_next_kot_num,
      v_clean_table_id,
      coalesce(v_item->>'code', v_item->>'item_code', ''),
      coalesce(v_item->>'name', v_item->>'item_name', ''),
      (v_item->>'qty')::numeric,
      (v_item->>'rate')::numeric,
      coalesce((v_item->>'amount')::numeric, (v_item->>'qty')::numeric * (v_item->>'rate')::numeric),
      coalesce(v_item->>'category', 'GENERAL'),
      coalesce(v_item->>'department', 'KITCHEN'),
      'PENDING',
      false
    );
  END LOOP;

  -- Update Table to OCCUPIED
  UPDATE tables
  SET 
    status = 'OCCUPIED',
    kot_nos = array_append(coalesce(kot_nos, ARRAY[]::integer[]), v_next_kot_num),
    active_waiter = p_waiter_name,
    customer_name = v_clean_cust_name,
    customer_phone = v_clean_cust_phone,
    updated_at = now()
  WHERE id = v_clean_table_id;

  RETURN jsonb_build_object(
    'success', true,
    'kot_id', v_new_kot_id,
    'kot_number', v_next_kot_num,
    'table_id', v_clean_table_id
  );
END;
$$;

-- =========================================================================
-- 2. ATOMIC BILL SETTLEMENT & TABLE FREE FUNCTION
-- Settles bill, records daily transaction, marks order items served,
-- and frees the table in one shot, preventing multiple captain phones from colliding.
-- =========================================================================
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
  -- Mark bill SETTLED (targets specific bill_no when provided to protect independent bills per table)
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
    customer_phone = '',
    updated_at = now()
  WHERE id = v_clean_table;

  RETURN jsonb_build_object('success', true, 'bill_no', p_bill_no, 'table_id', v_clean_table);
END;
$$;

-- =========================================================================
-- 3. ATOMIC TABLE SHIFT / TRANSFER FUNCTION
-- Moves all order items and KOTs from Table A to Table B and frees Table A.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.transfer_table(
  p_from_table text,
  p_to_table text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from text := trim(upper(p_from_table));
  v_to text := trim(upper(p_to_table));
  v_from_kots integer[];
  v_from_waiter text;
  v_from_name text;
  v_from_phone text;
BEGIN
  -- Grab source table details
  SELECT kot_nos, active_waiter, customer_name, customer_phone
  INTO v_from_kots, v_from_waiter, v_from_name, v_from_phone
  FROM tables WHERE id = v_from;

  -- Transfer order items and active KOTs to target table
  UPDATE order_items SET table_id = v_to WHERE table_id = v_from;
  UPDATE kots SET table_id = v_to WHERE table_id = v_from;

  -- Update destination table
  UPDATE tables
  SET
    status = 'OCCUPIED',
    kot_nos = array_cat(coalesce(kot_nos, ARRAY[]::integer[]), coalesce(v_from_kots, ARRAY[]::integer[])),
    active_waiter = coalesce(v_from_waiter, active_waiter),
    customer_name = coalesce(v_from_name, customer_name),
    customer_phone = coalesce(v_from_phone, customer_phone),
    updated_at = now()
  WHERE id = v_to;

  -- Free source table
  UPDATE tables
  SET
    status = 'AVAILABLE',
    kot_nos = ARRAY[]::integer[],
    active_waiter = NULL,
    customer_name = '',
    customer_phone = '',
    updated_at = now()
  WHERE id = v_from;

  RETURN jsonb_build_object('success', true, 'from_table', v_from, 'to_table', v_to);
END;
$$;

-- =========================================================================
-- 4. ATOMIC ITEM CANCELLATION & AUDIT FUNCTION
-- Marks item cancelled and writes cancellation audit record together.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.cancel_kot_item(
  p_item_id uuid,
  p_reason text,
  p_authorized_by text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item record;
BEGIN
  -- Mark item cancelled
  UPDATE order_items
  SET 
    is_cancelled = true,
    status = 'CANCELLED',
    cancel_reason = p_reason,
    authorized_by = p_authorized_by
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  -- Insert into cancellation audit
  IF v_item.id IS NOT NULL THEN
    INSERT INTO cancellations_audit (
      table_id, kot_number, item_code, item_name, qty, rate, reason, authorized_by
    ) VALUES (
      v_item.table_id, v_item.kot_number, v_item.item_code, v_item.item_name,
      v_item.qty, v_item.rate, p_reason, p_authorized_by
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'item_id', p_item_id);
END;
$$;

