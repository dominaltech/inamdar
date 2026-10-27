const fs = require('fs');
const path = require('path');

const menuData = require('../src/data/menuData.json');

const sqlHeader = `-- ==============================================================================
-- INAMDAR RESTAURANT & TAKEAWAY POS - MASTER DATABASE SCHEMA
-- Migration: 20261027_init_inamdar_pos_schema.sql
-- Covers: Counter POS (Desktop), Captain WEB PWA (Waiter), and KDS System (Cook)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES IF RE-INITIALIZING
DROP TABLE IF EXISTS cancellations_audit CASCADE;
DROP TABLE IF EXISTS daily_transactions CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS kots CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;
DROP TABLE IF EXISTS pos_counters CASCADE;

-- 3. STAFF USERS TABLE
CREATE TABLE staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OPERATOR', 'MANAGER', 'OWNER', 'WAITER', 'COOK')),
    pin TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POS DAILY COUNTERS TABLE (For daily KOT & Bill reset)
CREATE TABLE pos_counters (
    counter_key TEXT PRIMARY KEY,
    counter_val INT NOT NULL DEFAULT 1,
    last_reset_date DATE DEFAULT CURRENT_DATE
);

-- 5. MENU ITEMS MASTER
CREATE TABLE menu_items (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_order INT NOT NULL DEFAULT 99,
    ac_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hall_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_kitchen BOOLEAN NOT NULL DEFAULT true, -- false for Sweets, Mocktails, Cold Drinks, Water
    is_available BOOLEAN NOT NULL DEFAULT true, -- Item 86 toggle
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_menu_category ON menu_items(category_order, category);

-- 6. RESTAURANT TABLES MASTER
CREATE TABLE tables (
    id TEXT PRIMARY KEY, -- e.g. '1', '2', '4A', '0', '0B', '00 - MOOSA'
    section TEXT NOT NULL CHECK (section IN ('AC', 'FAMILY AC', 'PARCEL', 'HOME DELIVERY')),
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'BILLED')),
    active_waiter TEXT DEFAULT '1 COUNTER',
    pax INT DEFAULT 2,
    kot_nos INT[] DEFAULT '{}'::INT[],
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tables_status ON tables(status, section);

-- 7. KITCHEN ORDER TOKENS (KOT)
CREATE TABLE kots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kot_number INT NOT NULL,
    table_id TEXT NOT NULL REFERENCES tables(id) ON UPDATE CASCADE ON DELETE CASCADE,
    section TEXT NOT NULL,
    waiter_name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'KITCHEN' CHECK (department IN ('KITCHEN', 'PANTRY', 'ALL')),
    source TEXT NOT NULL DEFAULT 'POS_COUNTER' CHECK (source IN ('POS_COUNTER', 'CAPTAIN_APP')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kots_table ON kots(table_id, status);
CREATE INDEX idx_kots_created ON kots(created_at DESC);

-- 8. ORDER LINE ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kot_id BIGINT REFERENCES kots(id) ON DELETE CASCADE,
    kot_number INT,
    table_id TEXT NOT NULL REFERENCES tables(id) ON UPDATE CASCADE ON DELETE CASCADE,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    qty NUMERIC(10, 2) NOT NULL,
    rate NUMERIC(10, 2) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    category_order INT DEFAULT 99,
    customization TEXT DEFAULT '',
    department TEXT NOT NULL DEFAULT 'KITCHEN',
    is_staged BOOLEAN NOT NULL DEFAULT false,
    is_cancelled BOOLEAN NOT NULL DEFAULT false,
    cancel_reason TEXT DEFAULT NULL,
    authorized_by TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_table ON order_items(table_id, status);
CREATE INDEX idx_order_items_kot ON order_items(kot_id);

-- 9. BILLS / CASH MEMOS
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_no INT NOT NULL,
    table_id TEXT NOT NULL,
    section TEXT NOT NULL,
    employee_no TEXT DEFAULT '1',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_items INT NOT NULL DEFAULT 0,
    total_qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_mode TEXT DEFAULT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Credit', NULL)),
    status TEXT NOT NULL DEFAULT 'UNSETTLED' CHECK (status IN ('UNSETTLED', 'SETTLED')),
    cashier_name TEXT DEFAULT '1. Operator',
    bill_date TEXT NOT NULL,
    bill_time TEXT NOT NULL,
    items_json JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX idx_bills_status ON bills(status, table_id);
CREATE INDEX idx_bills_created ON bills(created_at DESC);

-- 10. DAILY SETTLED TRANSACTIONS JOURNAL
CREATE TABLE daily_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_no TEXT NOT NULL,
    table_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card')),
    cashier_name TEXT DEFAULT '1. Operator',
    settled_time TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CANCELLATION AUDIT TRAIL
CREATE TABLE cancellations_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kot_id BIGINT,
    kot_number INT,
    table_id TEXT NOT NULL,
    item_code TEXT NOT NULL,
    item_name TEXT NOT NULL,
    qty NUMERIC(10, 2) NOT NULL,
    rate NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    authorized_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ENABLE ROW LEVEL SECURITY (Open Policies for internal POS/PWA/KDS ecosystem)
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kots ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on staff_users" ON staff_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pos_counters" ON pos_counters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tables" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kots" ON kots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bills" ON bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_transactions" ON daily_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cancellations_audit" ON cancellations_audit FOR ALL USING (true) WITH CHECK (true);

-- 13. REALTIME REPLICATION (For live syncing between Desktop POS, Captain PWA, and KDS)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE tables, kots, order_items, bills, pos_counters, menu_items;
COMMIT;

-- 14. SEED DATA - POS COUNTERS
INSERT INTO pos_counters (counter_key, counter_val) VALUES
('daily_kot_counter', 1),
('daily_bill_counter', 1)
ON CONFLICT (counter_key) DO NOTHING;

-- 15. SEED DATA - STAFF USERS
INSERT INTO staff_users (id, name, role, pin) VALUES
('1', '1. Operator', 'OPERATOR', '1'),
('2', 'SUSHANT', 'MANAGER', '1234'),
('3', 'Admin / Owner', 'OWNER', '9999'),
('4', 'AMIT (Waiter)', 'WAITER', '1111'),
('5', 'RAHUL (Waiter)', 'WAITER', '2222'),
('6', 'HEAD CHEF (Cook)', 'COOK', '3333')
ON CONFLICT (id) DO NOTHING;

-- 16. SEED DATA - RESTAURANT TABLES (1-20 AC, 21-40 FAMILY AC, Parcels, Delivery)
INSERT INTO tables (id, section, status, active_waiter) VALUES
-- AC Section (Tables 1 to 20)
('1', 'AC', 'AVAILABLE', '1 COUNTER'),
('2', 'AC', 'AVAILABLE', '1 COUNTER'),
('3', 'AC', 'AVAILABLE', '1 COUNTER'),
('4', 'AC', 'AVAILABLE', '1 COUNTER'),
('5', 'AC', 'AVAILABLE', '1 COUNTER'),
('6', 'AC', 'AVAILABLE', '1 COUNTER'),
('7', 'AC', 'AVAILABLE', '1 COUNTER'),
('8', 'AC', 'AVAILABLE', '1 COUNTER'),
('9', 'AC', 'AVAILABLE', '1 COUNTER'),
('10', 'AC', 'AVAILABLE', '1 COUNTER'),
('11', 'AC', 'AVAILABLE', '1 COUNTER'),
('12', 'AC', 'AVAILABLE', '1 COUNTER'),
('13', 'AC', 'AVAILABLE', '1 COUNTER'),
('14', 'AC', 'AVAILABLE', '1 COUNTER'),
('15', 'AC', 'AVAILABLE', '1 COUNTER'),
('16', 'AC', 'AVAILABLE', '1 COUNTER'),
('17', 'AC', 'AVAILABLE', '1 COUNTER'),
('18', 'AC', 'AVAILABLE', '1 COUNTER'),
('19', 'AC', 'AVAILABLE', '1 COUNTER'),
('20', 'AC', 'AVAILABLE', '1 COUNTER'),
-- FAMILY AC Section (Tables 21 to 40)
('21', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('22', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('23', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('24', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('25', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('26', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('27', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('28', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('29', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('30', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('31', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('32', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('33', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('34', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('35', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('36', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('37', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('38', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('39', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
('40', 'FAMILY AC', 'AVAILABLE', '1 COUNTER'),
-- PARCEL Section
('0', 'PARCEL', 'AVAILABLE', '1 COUNTER'),
('0B', 'PARCEL', 'AVAILABLE', '1 COUNTER'),
('0C', 'PARCEL', 'AVAILABLE', '1 COUNTER'),
('0D', 'PARCEL', 'AVAILABLE', '1 COUNTER'),
('0E', 'PARCEL', 'AVAILABLE', '1 COUNTER'),
-- HOME DELIVERY Section
('00 - MOOSA', 'HOME DELIVERY', 'AVAILABLE', '1 COUNTER'),
('00 - GUEST', 'HOME DELIVERY', 'AVAILABLE', '1 COUNTER')
ON CONFLICT (id) DO NOTHING;

-- 17. SEED DATA - ACTIVE DISHES MASTER
INSERT INTO menu_items (code, name, category, category_order, ac_rate, hall_rate, is_kitchen) VALUES
`;

// Helper to determine if an item is kitchen cook work or pantry/counter
function isKitchen(category, name) {
  const cat = (category || '').toUpperCase();
  const n = (name || '').toUpperCase();
  if (
    cat.includes('DESSERT') ||
    cat.includes('MOCKTAL') ||
    cat.includes('SOFT DRINK') ||
    n.includes('MINERAL WATER') ||
    n.includes('COLD DRINK') ||
    n.includes('SODA')
  ) {
    return false;
  }
  return true;
}

const seenCodes = new Set();
const validRows = [];

for (const it of menuData.items) {
  const code = String(it.code).trim();
  if (!code || code === 'Code' || isNaN(Number(code))) continue;
  if (seenCodes.has(code)) continue;
  seenCodes.add(code);

  const name = String(it.name).replace(/'/g, "''").toUpperCase();
  const cat = String(it.category || 'UNCATEGORIZED').replace(/'/g, "''");
  const order = Number(it.categoryOrder) || 99;
  const acRate = Number(it.acRate) || 0;
  const hallRate = Number(it.hallRate) || acRate;
  const kit = isKitchen(cat, name);

  validRows.push(`('${code}', '${name}', '${cat}', ${order}, ${acRate}, ${hallRate}, ${kit})`);
}

const sqlFooter = validRows.join(',\n') + `
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  category_order = EXCLUDED.category_order,
  ac_rate = EXCLUDED.ac_rate,
  hall_rate = EXCLUDED.hall_rate,
  is_kitchen = EXCLUDED.is_kitchen;

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
`;

const fullSql = sqlHeader + sqlFooter;

const outputDir = path.join(__dirname, '../supabase/migrations');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, '20261027_init_inamdar_pos_schema.sql');
fs.writeFileSync(outputPath, fullSql, 'utf8');
console.log('Successfully generated clean master migration. Total unique dishes seeded:', validRows.length);
