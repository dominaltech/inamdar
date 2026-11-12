-- Migration 06: Add Family AC Tables 41 and 42
-- Ensures tables 41 and 42 exist in Supabase and sync with all POS terminals and Captain PWAs

INSERT INTO public.tables (id, section, active_waiter, status, pax, kot_nos)
VALUES 
  ('41', 'FAMILY AC', '1 COUNTER', 'AVAILABLE', 4, '[]'::jsonb),
  ('42', 'FAMILY AC', '1 COUNTER', 'AVAILABLE', 4, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET section = 'FAMILY AC', pax = 4;

