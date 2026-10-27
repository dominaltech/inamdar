-- ==============================================================================
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
    payment_mode TEXT DEFAULT NULL,
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

-- 10. DAILY SETTLED TRANSACTIONS JOURNAL (Supports all 18 Settlement Modes)
CREATE TABLE daily_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_no TEXT NOT NULL,
    table_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode TEXT NOT NULL,
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

-- 12. CUSTOMER CREDIT ACCOUNTS
CREATE TABLE credit_accounts (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT,
    balance NUMERIC(10, 2) DEFAULT 0,
    credit_limit NUMERIC(10, 2) DEFAULT 15000,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS TRAIL
CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    table_id TEXT,
    bill_no TEXT,
    operator_name TEXT NOT NULL DEFAULT '1. Operator',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ENABLE ROW LEVEL SECURITY
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE kots ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on staff_users" ON staff_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pos_counters" ON pos_counters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tables" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kots" ON kots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bills" ON bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_transactions" ON daily_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cancellations_audit" ON cancellations_audit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on credit_accounts" ON credit_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 15. REALTIME REPLICATION (For live syncing across POS, Captain PWA, and KDS)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE tables, kots, order_items, bills, pos_counters, menu_items, credit_accounts, daily_transactions;
COMMIT;

-- 16. SEED DATA - CREDIT ACCOUNTS
INSERT INTO credit_accounts (id, customer_name, phone, balance, credit_limit) VALUES
('CR-001', 'VIP GUEST - RAHUL JADHAV', '9822012345', 2450.00, 20000.00),
('CR-002', 'SOLAPUR TEXTILES CORP', '9890123456', 5800.00, 50000.00),
ON CONFLICT (id) DO NOTHING;

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
('1', 'CHICKEN MANCHOW SOUP', 'SOUP', 1, 130, 130, true),
('2', 'CHICKEN HOT AND SOUR SOUP', 'SOUP', 1, 130, 130, true),
('3', 'CHICKEN LEMON CORIANDER SOUP', 'SOUP', 1, 130, 130, true),
('4', 'CHICKEN TOMYOM SOUP', 'SOUP', 1, 150, 150, true),
('5', 'CHICKEN CLER SOUP', 'SOUP', 1, 140, 140, true),
('6', 'VEG MANCHAOW SOUP', 'SOUP', 1, 110, 110, true),
('7', 'VEG HOT AND SOUR SOUP', 'SOUP', 1, 110, 110, true),
('8', 'VEG LEMON CORIANDER SOUP', 'SOUP', 1, 110, 110, true),
('9', 'VEG TOMYOM SOUP', 'SOUP', 1, 120, 120, true),
('10', 'VEG CLER SOUP', 'SOUP', 1, 120, 120, true),
('128', 'CHICKEN SWEET CORN SOUP', 'SOUP', 1, 130, 130, true),
('156', 'TOMATO SOUP', 'SOUP', 1, 110, 110, true),
('188', 'LAMB CLER SOUP', 'SOUP', 1, 180, 180, true),
('213', 'CHICKEN GARLIC SOUP', 'SOUP', 1, 150, 150, true),
('11', 'CHICKEN SATAY', 'STARTERS', 2, 290, 290, true),
('12', 'CHICKEN SHANGHAI', 'STARTERS', 2, 280, 280, true),
('13', 'CHICKEN KUNG PAO', 'STARTERS', 2, 280, 280, true),
('14', 'CHILLI BASIL CHICKEN', 'STARTERS', 2, 280, 280, true),
('15', 'CHICKEN MANCHURIAN', 'STARTERS', 2, 260, 260, true),
('16', 'CHICKEN CHILLY', 'STARTERS', 2, 260, 260, true),
('17', 'THREE PEPPER CHICKEN', 'STARTERS', 2, 280, 280, true),
('18', 'CHICKEN CRISPY', 'STARTERS', 2, 280, 280, true),
('19', 'CHICKEN LOLLIPOP', 'STARTERS', 2, 280, 280, true),
('20', 'CHICKEN FRIED KABAB', 'STARTERS', 2, 270, 270, true),
('42', 'CRISPY CORN WATER CHESTNUT', 'STARTERS', 2, 220, 220, true),
('43', 'PANEER KUNG PAO', 'STARTERS', 2, 280, 280, true),
('44', 'PANEER SATAY', 'STARTERS', 2, 290, 290, true),
('45', 'PANEER SHANGHAI', 'STARTERS', 2, 280, 280, true),
('46', 'PANEER MANCHURIAN', 'STARTERS', 2, 260, 260, true),
('47', 'VEG MANCHURIAN', 'STARTERS', 2, 200, 200, true),
('48', 'CRISPY POTATO SWEET GRILL SOURCE', 'STARTERS', 2, 180, 180, true),
('49', 'BABY CORN CHILLY', 'STARTERS', 2, 250, 250, true),
('50', 'BABY CORN MANCHURAIN', 'STARTERS', 2, 270, 270, true),
('51', 'MASHROOM CHILLY', 'STARTERS', 2, 250, 250, true),
('52', 'MASHROOM MANCHURAIN', 'STARTERS', 2, 270, 270, true),
('117', 'CHICKEN SEEK KABAB', 'STARTERS', 2, 330, 330, true),
('118', 'VEG SEEK KABAB', 'STARTERS', 2, 210, 210, true),
('119', 'FRENCH FRIES', 'STARTERS', 2, 100, 100, true),
('138', 'PATTAYA CHICKEN', 'STARTERS', 2, 250, 250, true),
('139', 'BUTTER GARLIC CHICKEN', 'STARTERS', 2, 280, 280, true),
('140', 'VEG HONG CHILLY LOTE', 'STARTERS', 2, 260, 260, true),
('153', 'ROASTED PAPAD', 'STARTERS', 2, 30, 30, true),
('154', 'FRY PAPAD', 'STARTERS', 2, 30, 30, true),
('155', 'MASALA PAPAD', 'STARTERS', 2, 50, 50, true),
('165', 'SHANGHAI CHICKEN (1 KG)', 'STARTERS', 2, 1250, 1250, true),
('166', 'PANEER CHILLI', 'STARTERS', 2, 260, 260, true),
('175', 'PRAWNS FULL', 'STARTERS', 2, 850, 850, true),
('176', 'PRAWNS HALF', 'STARTERS', 2, 450, 450, true),
('177', 'CRISPY GARLIC FISH', 'STARTERS', 2, 400, 400, true),
('178', 'SHANGHAI FISH', 'STARTERS', 2, 400, 400, true),
('179', 'CHICKEN DRAGON ROLL', 'STARTERS', 2, 80, 80, true),
('182', 'HONEY CHICKEN CHILLY', 'STARTERS', 2, 280, 280, true),
('185', 'CHICKEN OYSTER SAUCE', 'STARTERS', 2, 320, 320, true),
('186', 'CRUMB FRIED FISH', 'STARTERS', 2, 420, 420, true),
('187', 'VEG MANCHURIAN', 'STARTERS', 2, 200, 200, true),
('191', 'CHICKEN MANCHURIAN SAMEY GARAVY', 'STARTERS', 2, 290, 290, true),
('193', 'CHICKEN TERIYAKI', 'STARTERS', 2, 350, 350, true),
('194', 'MUTTON OF YOUR CHOICE', 'STARTERS', 2, 420, 420, true),
('206', 'MUTTON MAKING KG', 'STARTERS', 2, 800, 800, true),
('109', 'PRAWNS', 'SEA FOOD', 3, 0, 0, true),
('110', 'FISH', 'SEA FOOD', 3, 0, 0, true),
('111', 'PAMPHLET', 'SEA FOOD', 3, 0, 0, true),
('211', 'FISH MAKING', 'SEA FOOD', 3, 200, 200, true),
('215', 'TERIYAKI FISH', 'SEA FOOD', 3, 450, 450, true),
('216', 'PRAWNS SHANGHAI', 'SEA FOOD', 3, 450, 450, true),
('217', 'PRAWNS BUTTER GARLIC', 'SEA FOOD', 3, 450, 450, true),
('218', 'PRAWNS TERIYAKI', 'SEA FOOD', 3, 500, 500, true),
('21', 'CHICKEN TANDOORI HALF', 'KABAB', 4, 270, 270, true),
('22', 'CHICKEN TANDOORI FULL', 'KABAB', 4, 540, 540, true),
('23', 'SPL CHICKEN BANJARA KABAB', 'KABAB', 4, 290, 290, true),
('24', 'CHICKEN KALIMIRI KABAB', 'KABAB', 4, 290, 290, true),
('25', 'CHICKEN MALAI KABAB', 'KABAB', 4, 290, 290, true),
('26', 'CHICKEN BARA CHOPS (W.B)', 'KABAB', 4, 340, 340, true),
('27', 'GRILLCHICKEN HALF', 'KABAB', 4, 300, 300, true),
('28', 'GRILL CHICKEN FULL', 'KABAB', 4, 600, 600, true),
('29', 'TANGADI KABAB (2PIS)', 'KABAB', 4, 210, 210, true),
('30', 'TANGADI KABAB (4PIS)', 'KABAB', 4, 420, 420, true),
('53', 'MUSHROOM TIKKA', 'KABAB', 4, 250, 250, true),
('54', 'PANEER TIKKA', 'KABAB', 4, 290, 290, true),
('55', 'PANEER ACHARI TIKKA', 'KABAB', 4, 290, 290, true),
('56', 'MUSHROOM RASBHARI', 'KABAB', 4, 260, 260, true),
('57', 'VEG SHEEK KABAB', 'KABAB', 4, 210, 210, true),
('121', 'C T R', 'KABAB', 4, 140, 140, true),
('144', 'PAHADI KABAB', 'KABAB', 4, 290, 290, true),
('183', 'RED GRILD BASA  FISH', 'KABAB', 4, 400, 400, true),
('184', 'YELLOW GRILD BASA FISH', 'KABAB', 4, 400, 400, true),
('196', 'CHICKEN ANGARA KABAB', 'KABAB', 4, 290, 290, true),
('207', 'LAHAM  ROAST', 'KABAB', 4, 400, 400, true),
('208', 'LAHAM BADAMI', 'KABAB', 4, 400, 400, true),
('210', 'LAHAM AFGANI', 'KABAB', 4, 400, 400, true),
('214', 'LAHAM CILANTRO', 'KABAB', 4, 400, 400, true),
('58', 'KAJU PANEER MASALA', 'MAIN COURSE', 5, 270, 270, true),
('59', 'PANEER KADAI', 'MAIN COURSE', 5, 270, 270, true),
('60', 'PANEER MAKHANWALA', 'MAIN COURSE', 5, 270, 270, true),
('61', 'MUTTON HANDI HALF', 'MAIN COURSE', 5, 400, 400, true),
('62', 'MUTTON HANDI FULL', 'MAIN COURSE', 5, 780, 780, true),
('63', 'MUTTON MALVANI (5 PIS)', 'MAIN COURSE', 5, 430, 430, true),
('64', 'MUTTON MALVANI (10 PIS)', 'MAIN COURSE', 5, 820, 820, true),
('65', 'MUTTON DHANIYA WALA', 'MAIN COURSE', 5, 390, 390, true),
('66', 'MUTTON ROGAN JOSH', 'MAIN COURSE', 5, 390, 390, true),
('67', 'MUTTON MASALA', 'MAIN COURSE', 5, 380, 380, true),
('68', 'BUTTER CHICKEN (BL)', 'MAIN COURSE', 5, 290, 290, true),
('69', 'BUTTER CHICKEN (W.B)', 'MAIN COURSE', 5, 270, 270, true),
('70', 'CHICKEN MALVANI W.B(5 PIS)', 'MAIN COURSE', 5, 380, 380, true),
('71', 'CHICKEN MALVANI W.B(10PIS)', 'MAIN COURSE', 5, 740, 740, true),
('72', 'CHICKEN DHANIYA WALA 3 PIS', 'MAIN COURSE', 5, 220, 220, true),
('73', 'CHICKEN DHANIYA WALA 5 PIS', 'MAIN COURSE', 5, 290, 290, true),
('74', 'CHICKEN HANDI 5 PIS HALF', 'MAIN COURSE', 5, 340, 340, true),
('75', 'CHICKEN HANDI 10 PIS FULL', 'MAIN COURSE', 5, 620, 620, true),
('76', 'MURG MUSALLAM HALF', 'MAIN COURSE', 5, 400, 400, true),
('77', 'MURG MUSALLAM', 'MAIN COURSE', 5, 780, 780, true),
('78', 'CHICKEN AWADHI 3 PIS', 'MAIN COURSE', 5, 220, 220, true),
('79', 'CHICKEN AWADHI 5 PIS', 'MAIN COURSE', 5, 290, 290, true),
('80', 'CHICKEN CHANGEZI 3 PIS', 'MAIN COURSE', 5, 220, 220, true),
('81', 'CHICKEN CHANGEZI 5 PIS', 'MAIN COURSE', 5, 290, 290, true),
('130', 'DAL FRY', 'MAIN COURSE', 5, 140, 140, true),
('131', 'DAL KOLHAPURI', 'MAIN COURSE', 5, 160, 160, true),
('132', 'DAL TADKA', 'MAIN COURSE', 5, 150, 150, true),
('133', 'VEG KADAI', 'MAIN COURSE', 5, 220, 220, true),
('134', 'VEG MAKHANWALA', 'MAIN COURSE', 5, 230, 230, true),
('135', 'VEG KOLHAPURI', 'MAIN COURSE', 5, 220, 220, true),
('137', 'AKBARI TANGADI MASALA', 'MAIN COURSE', 5, 300, 300, true),
('145', 'MUTTON KASTURI KALI', 'MAIN COURSE', 5, 340, 340, true),
('146', 'CHICKEN KASTURI KALI', 'MAIN COURSE', 5, 250, 250, true),
('147', 'MUTTON KALI MIRI KA SALAN', 'MAIN COURSE', 5, 350, 350, true),
('148', 'CHICKEN KALI MIRI KA SALAN', 'MAIN COURSE', 5, 260, 260, true),
('149', 'MUTTON RAJDHANI', 'MAIN COURSE', 5, 340, 340, true),
('150', 'CHICKEN RAJDHANI', 'MAIN COURSE', 5, 250, 250, true),
('151', 'MUTTON BHUNA MASALA', 'MAIN COURSE', 5, 360, 360, true),
('152', 'CHICKEN PATYALA', 'MAIN COURSE', 5, 270, 270, true),
('158', 'KAJU MASALA', 'MAIN COURSE', 5, 270, 270, true),
('160', 'MUTTON DHANYAWALA (3PIS)', 'MAIN COURSE', 5, 300, 300, true),
('161', 'INDIAN GRAVY', 'MAIN COURSE', 5, 130, 130, true),
('162', 'PANEER TIKKA MASALA', 'MAIN COURSE', 5, 300, 300, true),
('192', 'GRAVY', 'MAIN COURSE', 5, 30, 30, true),
('197', 'CHICKEN MASALA', 'MAIN COURSE', 5, 290, 290, true),
('199', 'EXTRA', 'MAIN COURSE', 5, 20, 20, true),
('203', 'CHICKEN TIKKA MASALA (B.L)', 'MAIN COURSE', 5, 330, 330, true),
('212', 'MUTTON ROGAN JOSH 1 KG', 'MAIN COURSE', 5, 1550, 1550, true),
('122', 'OMLET', 'ANDE KA FUNDA', 6, 45, 45, true),
('125', 'BOILED EGG', 'ANDE KA FUNDA', 6, 40, 40, true),
('126', 'EGG MASALA', 'ANDE KA FUNDA', 6, 150, 150, true),
('157', 'EGG CURRY', 'ANDE KA FUNDA', 6, 130, 130, true),
('164', 'EGG BHURJI', 'ANDE KA FUNDA', 6, 110, 110, true),
('31', 'CHICKEN FRIED RICE', 'RICE AND NOODLES', 7, 180, 180, true),
('32', 'VEG FRIED RICE', 'RICE AND NOODLES', 7, 160, 160, true),
('33', 'CHICKEN HAKKA NOODLES', 'RICE AND NOODLES', 7, 180, 180, true),
('34', 'VEG HAKKA NOODLES', 'RICE AND NOODLES', 7, 160, 160, true),
('35', 'CHICKEN CHILLY GARILC RICE', 'RICE AND NOODLES', 7, 190, 190, true),
('36', 'VEG CHILLY GARLIC RICE', 'RICE AND NOODLES', 7, 170, 170, true),
('37', 'CHICKEN SCHEZWAN NOODLES', 'RICE AND NOODLES', 7, 180, 180, true),
('38', 'VEG SCHEZWAN NOODLES', 'RICE AND NOODLES', 7, 160, 160, true),
('39', 'EGG FRIED RICE', 'RICE AND NOODLES', 7, 150, 150, true),
('40', 'THAI CURRY WITH STEAM RICE', 'RICE AND NOODLES', 7, 300, 300, true),
('41', 'THAI CURRY WITH STEAM RICE (NON VEG)', 'RICE AND NOODLES', 7, 350, 350, true),
('120', 'CHICKEN SHEZWAN FRIED RICE', 'RICE AND NOODLES', 7, 180, 180, true),
('124', 'CHICKEN TRIPPLE SCHEZWAN FRIED RICE', 'RICE AND NOODLES', 7, 240, 240, true),
('141', 'BURNT GARLIC RICE (VEG)', 'RICE AND NOODLES', 7, 160, 160, true),
('142', 'BURNT GARLIC RICE (CHICKEN)', 'RICE AND NOODLES', 7, 180, 180, true),
('143', 'VEG TRIPPLE SHEZWAN FRIED RICE', 'RICE AND NOODLES', 7, 220, 220, true),
('180', 'VEG SCHEZWAN FRIED RICE', 'RICE AND NOODLES', 7, 160, 160, true),
('198', 'CHILLI GARLIC NOODLES', 'RICE AND NOODLES', 7, 200, 200, true),
('86', 'EGG BIRYANI', 'BIRYANI AND PULAO', 8, 160, 160, true),
('87', 'DAL KHICHDI', 'BIRYANI AND PULAO', 8, 160, 160, true),
('89', 'GHEE RICE', 'BIRYANI AND PULAO', 8, 150, 150, true),
('90', 'PANEER KAJU BIRYANI', 'BIRYANI AND PULAO', 8, 200, 200, true),
('91', 'VEG BIRYANI', 'BIRYANI AND PULAO', 8, 160, 160, true),
('92', 'PANEER BIRYANI', 'BIRYANI AND PULAO', 8, 200, 200, true),
('93', 'JEERA RICE', 'BIRYANI AND PULAO', 8, 130, 130, true),
('94', 'STEAM RICE', 'BIRYANI AND PULAO', 8, 110, 110, true),
('167', 'JEERA RICE (HALF)', 'BIRYANI AND PULAO', 8, 100, 100, true),
('190', 'VEG BIRYANI 1 KG', 'BIRYANI AND PULAO', 8, 800, 800, true),
('195', 'MUTTON MANDI HALF', 'BIRYANI AND PULAO', 8, 1125, 1125, true),
('95', 'ROTI', 'ROTI', 9, 30, 30, true),
('96', 'BUTTER ROTI', 'ROTI', 9, 40, 40, true),
('97', 'BUTTER NAAN', 'ROTI', 9, 50, 50, true),
('98', 'PIAIN NAAN', 'ROTI', 9, 40, 40, true),
('99', 'KULCHA', 'ROTI', 9, 40, 40, true),
('100', 'BUTTER KULCHA', 'ROTI', 9, 50, 50, true),
('101', 'GARLIC NAAN BUTTER', 'ROTI', 9, 70, 70, true),
('102', 'CHEESE CHILLI GARLIC NAAN', 'ROTI', 9, 80, 80, true),
('127', 'LACCHA PARATHA', 'ROTI', 9, 50, 50, true),
('136', 'BROWN ROTI', 'ROTI', 9, 30, 30, true),
('159', 'BROWN BUTTER ROTI', 'ROTI', 9, 40, 40, true),
('107', 'MIX VEG RAITA', 'SALAD', 10, 60, 60, true),
('108', 'BUNDI RAITA', 'SALAD', 10, 60, 60, true),
('123', 'GREEN SALAD', 'SALAD', 10, 80, 80, true),
('163', 'CURD', 'SALAD', 10, 35, 35, true),
('103', 'GAJAR KA HALWA', 'DESSERTS /MOCKTAL', 11, 80, 80, false),
('104', 'CARAMEL PUDDING', 'DESSERTS /MOCKTAL', 11, 70, 70, false),
('105', 'ROYAL FALOODA', 'DESSERTS /MOCKTAL', 11, 125, 125, false),
('106', 'CHOCOLATE FALOODA', 'DESSERTS /MOCKTAL', 11, 125, 125, false),
('112', 'BLUE LAGOON', 'DESSERTS /MOCKTAL', 11, 90, 90, false),
('113', 'VIRGIN MOJITO', 'DESSERTS /MOCKTAL', 11, 90, 90, false),
('114', 'FRESH LIME SODA', 'DESSERTS /MOCKTAL', 11, 60, 60, false),
('115', 'FRESH LIME WATER', 'DESSERTS /MOCKTAL', 11, 40, 40, false),
('189', 'BUTTER MILK', 'DESSERTS /MOCKTAL', 11, 45, 45, false),
('82', 'CHICKEN BIRYANI 3 PIS', 'BIRYANI', 12, 160, 160, true),
('83', 'CHICKEN BIRYANI (5 PIS)', 'BIRYANI', 12, 200, 200, true),
('84', 'MUTTON BIRYANI (3 PIS )', 'BIRYANI', 12, 230, 230, true),
('85', 'MUTTON BIRYANI (5 PIS)', 'BIRYANI', 12, 280, 280, true),
('168', 'CHICKEN BIRYANI ( 1KG)', 'BIRYANI', 12, 1050, 1050, true),
('169', 'MUTTON BIRYANI (1KG)', 'BIRYANI', 12, 1550, 1550, true),
('170', 'CHICKEN BIRYANI (HALF KG)', 'BIRYANI', 12, 525, 525, true),
('171', 'MUTTON BIRYANI (HALF KG)', 'BIRYANI', 12, 775, 775, true),
('172', 'CHICKEN BIRYANI (1 KG)', 'BIRYANI', 12, 1050, 1050, true),
('173', 'MUTTON BIRYANI ( 1 KG)', 'BIRYANI', 12, 1550, 1550, true),
('174', 'KHUSHKA', 'BIRYANI', 12, 130, 130, true),
('181', 'MUTTON MANDI FULL', 'BIRYANI', 12, 2250, 2250, true),
('200', 'EXTRA RAITA', 'BIRYANI', 12, 15, 15, true),
('205', 'EXTRA RICE', 'BIRYANI', 12, 40, 40, true),
('116', 'MINERAL WATER 1 LTR', 'SOFT DRINKS', 13, 20, 20, false),
('129', 'SOFT DRINK', 'SOFT DRINKS', 13, 20, 20, false),
('201', 'EXTRA GLASS', 'SOFT DRINKS', 13, 150, 150, false),
('204', 'ALKALINE WATER', 'SOFT DRINKS', 13, 50, 50, false)
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
