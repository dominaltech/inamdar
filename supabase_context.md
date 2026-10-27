# Inamdar Restaurant & Takeaway POS — Supabase Shared Developer Context & API Guide

> **Target Audience**: Developers building the **Captain Web PWA (Waiter App)**, the **KDS System (Cook / Kitchen Display App)**, and the **Desktop POS (Counter & Billing Engine)**.  
> **Shared Backend**: Supabase (PostgreSQL 15+, Supabase Realtime, Row-Level Security).  
> **Database Migration File**: `supabase/migrations/20261027_init_inamdar_pos_schema.sql`

---

## 1. System Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │            SUPABASE CLOUD DATABASE            │
                      │  • PostgreSQL Tables with Realtime CDC        │
                      │  • Shared Live State across all devices       │
                      └───────┬─────────────────┬───────────────┬─────┘
                              │                 │               │
       Realtime Sync (WebSockets)               │               │
                              │                 │               │
                              ▼                 ▼               ▼
          ┌───────────────────────┐   ┌───────────────────┐   ┌───────────────────────┐
          │  Desktop Counter POS  │   │  Captain WEB PWA  │   │   KDS Cook System     │
          │  (Cashier / Manager)  │   │   (Mobile Waiter) │   │   (Kitchen Screen)    │
          │                       │   │                   │   │                       │
          │ • Table Management    │   │ • Table Selection │   │ • Live Food KOT Queue │
          │ • Billing (F6)        │   │ • Menu Search     │   │ • Cook Status Buttons │
          │ • Settlement (F12)    │   │ • Take & Fire KOT │   │ • Department Routing  │
          │ • Manager PIN Auth    │   │ • Course Ordering │   │ • Cancel KOT Alerts   │
          │ • Day Close (EOD)     │   │ • Bill Request    │   │ • Kitchen Printer     │
          └───────────────────────┘   └───────────────────┘   └───────────────────────┘
```

---

## 2. Environment Variables & Supabase Client Setup

Every app (Desktop POS, Captain PWA, KDS) must initialize the Supabase client using the same Project URL and Anon/Public Key:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Initializing the Client in JavaScript / TypeScript:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 3. Master Database Schema Reference

### 3.1. `tables` (Restaurant Table States)
Represents the live state of all restaurant dining tables, parcels, and delivery orders.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Table number (e.g. `'1'`, `'2'`, `'4A'`, `'0'`, `'0B'`, `'00 - MOOSA'`) |
| `section` | `TEXT` | `CHECK IN ('AC', 'FAMILY AC', 'PARCEL', 'HOME DELIVERY')` | Section determines rate card (AC vs Hall Rate) |
| `status` | `TEXT` | `DEFAULT 'AVAILABLE' CHECK IN ('AVAILABLE', 'OCCUPIED', 'BILLED')` | Table lifecycle status |
| `active_waiter`| `TEXT` | `DEFAULT '1 COUNTER'` | Waiter currently assigned to this table |
| `pax` | `INT` | `DEFAULT 2` | Guest head count |
| `kot_nos` | `INT[]` | `DEFAULT '{}'` | Array of KOT numbers fired for this table (e.g. `[18, 19]`) |
| `updated_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Timestamp of last activity |

---

### 3.2. `menu_items` (Master Menu Card — 215 Dishes)
Contains the verified restaurant menu card, categorized into the 13 strict course orders.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `code` | `TEXT` | `PRIMARY KEY` | Unique dish code (e.g. `'1'`, `'82'`, `'95'`) |
| `name` | `TEXT` | `NOT NULL` | Full dish name in uppercase (e.g. `'CHICKEN BIRYANI 3 PIS'`) |
| `category` | `TEXT` | `NOT NULL` | Serving category (e.g. `'SOUP'`, `'BIRYANI'`, `'ROTI'`) |
| `category_order`| `INT` | `DEFAULT 99` | Strictly sorted for course prep order (1: SOUP ➔ 12: BIRYANI) |
| `ac_rate` | `NUMERIC(10,2)`| `DEFAULT 0` | Price applied for AC & FAMILY AC sections |
| `hall_rate` | `NUMERIC(10,2)`| `DEFAULT 0` | Price applied for PARCEL & HOME DELIVERY sections |
| `is_kitchen` | `BOOLEAN` | `DEFAULT true` | `true` = Sent to Cook (KDS); `false` = Sent to Pantry/Counter |
| `is_available` | `BOOLEAN` | `DEFAULT true` | `true` = Available; `false` = Out of Stock (Item 86) |

#### Strict Kitchen vs. Pantry Routing Rule:
- **`is_kitchen = true` (Goes to Cook / KDS)**:
  `SOUP` (1), `STARTERS` (2), `SEA FOOD` (3), `KABAB` (4), `MAIN COURSE` (5), `ANDE KA FUNDA` (6), `RICE AND NOODLES` (7), `BIRYANI AND PULAO` (8), `ROTI` (9), `SALAD` (10), `BIRYANI` (12).
- **`is_kitchen = false` (Pantry / Bar / Counter — NOT Cook's Work!)**:
  `DESSERTS /MOCKTAL` (11), `SOFT DRINKS` (13), `MINERAL WATER`, `COLD DRINK`, `SODA`.

---

### 3.3. `kots` (Kitchen Order Tokens)
Generated sequentially each time a waiter (Captain) or cashier fires an order.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `IDENTITY PRIMARY KEY` | Internal database unique ID |
| `kot_number` | `INT` | `NOT NULL` | Daily sequential token counter (e.g. `1`, `2`, `33`) |
| `table_id` | `TEXT` | `REFERENCES tables(id)` | Target table ID |
| `section` | `TEXT` | `NOT NULL` | Table section at time of order |
| `waiter_name` | `TEXT` | `NOT NULL` | Name of waiter who took the order |
| `department` | `TEXT` | `'KITCHEN'`, `'PANTRY'`, `'ALL'` | Routing department |
| `source` | `TEXT` | `'CAPTAIN_APP'` or `'POS_COUNTER'`| Order originator |
| `status` | `TEXT` | `'PENDING'`, `'PREPARING'`, `'READY'`, `'SERVED'`, `'CANCELLED'` | KOT kitchen lifecycle |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Timestamp order was placed |

---

### 3.4. `order_items` (Line Items for KOTs & Bills)
Individual dishes attached to a table and KOT.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique item row ID |
| `kot_id` | `BIGINT` | `REFERENCES kots(id)` | Parent KOT ID |
| `kot_number` | `INT` | `NOT NULL` | Sequential KOT number for display |
| `table_id` | `TEXT` | `REFERENCES tables(id)` | Active table ID |
| `item_code` | `TEXT` | `NOT NULL` | Dish code |
| `item_name` | `TEXT` | `NOT NULL` | Dish name |
| `qty` | `NUMERIC(10,2)`| `NOT NULL` | Ordered quantity (negative if cancelled) |
| `rate` | `NUMERIC(10,2)`| `NOT NULL` | Charged unit rate |
| `amount` | `NUMERIC(10,2)`| `NOT NULL` | Total line amount (`qty * rate`) |
| `category` | `TEXT` | `NOT NULL` | Dish category |
| `category_order`| `INT` | `DEFAULT 99` | Course sorting rank |
| `customization`| `TEXT` | `DEFAULT ''` | Special instructions (e.g. `'Less Spicy'`, `'Jain'`) |
| `department` | `TEXT` | `'KITCHEN'` or `'PANTRY'` | Route flag |
| `is_staged` | `BOOLEAN` | `DEFAULT false` | `true` = in waiter cart; `false` = fired to kitchen |
| `is_cancelled` | `BOOLEAN` | `DEFAULT false` | `true` = cancelled by manager |
| `cancel_reason`| `TEXT` | `DEFAULT NULL` | Cancellation reason |
| `authorized_by`| `TEXT` | `DEFAULT NULL` | Authorizing manager name |
| `status` | `TEXT` | `'PENDING'`, `'PREPARING'`, `'READY'`, `'SERVED'`, `'CANCELLED'` | Kitchen item status |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Creation timestamp |

---

### 3.5. `bills` (Customer Invoices / Cash Memos)
Generated when the customer requests their bill (`F6` on Desktop POS).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | Invoice UUID |
| `bill_no` | `INT` | `NOT NULL` | Daily sequential bill number (e.g. `18`) |
| `table_id` | `TEXT` | `NOT NULL` | Table ID |
| `section` | `TEXT` | `NOT NULL` | Section name |
| `subtotal` | `NUMERIC(10,2)`| `NOT NULL` | Sum of active dishes |
| `discount` | `NUMERIC(10,2)`| `DEFAULT 0` | Discount amount |
| `tax` | `NUMERIC(10,2)`| `DEFAULT 0` | Tax amount |
| `total_amount` | `NUMERIC(10,2)`| `NOT NULL` | Net final amount to collect |
| `total_items` | `INT` | `NOT NULL` | Count of unique active dishes |
| `total_qty` | `NUMERIC(10,2)`| `NOT NULL` | Total quantity of items |
| `payment_mode` | `TEXT` | `'Cash'`, `'UPI'`, `'Card'`, `NULL` | Mode of settlement |
| `status` | `TEXT` | `'UNSETTLED'` or `'SETTLED'` | Settlement status |
| `cashier_name` | `TEXT` | `DEFAULT '1. Operator'` | Settling user |
| `bill_date` | `TEXT` | `NOT NULL` | Date string (e.g. `'27/10/26'`) |
| `bill_time` | `TEXT` | `NOT NULL` | Time string (e.g. `'01:32 PM'`) |
| `items_json` | `JSONB` | `DEFAULT '[]'` | Snapshot of all dishes at time of bill |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Bill print time |
| `settled_at` | `TIMESTAMPTZ`| `DEFAULT NULL` | Payment completion timestamp |

---

### 3.6. `staff_users` & `pos_counters`
- **`staff_users`**: Contains credentials and PINs for Counter Operators (`pin: 1`), Managers (`SUSHANT`, `pin: 1234`), Admin (`pin: 9999`), Waiters (`AMIT`, `RAHUL`), and Cooks.
- **`pos_counters`**: Holds daily counters `daily_kot_counter` and `daily_bill_counter`. Reset to 1 upon End of Day Close.

---

## 4. Guide for Captain Web PWA (Mobile Waiter App)

The Captain PWA allows waitstaff to move around tables on mobile phones/tablets.

### 4.1. Step 1: Waiter Login
```javascript
// Query staff_users with role 'WAITER' or 'MANAGER'
const { data: staff, error } = await supabase
  .from('staff_users')
  .select('id, name, role, pin')
  .eq('is_active', true);
```

### 4.2. Step 2: Fetching Dining Tables & Occupancy
```javascript
// Fetch all tables with current status and active waiter
const { data: tables, error } = await supabase
  .from('tables')
  .select('*')
  .order('id');

// Subscribe to live table updates
supabase
  .channel('tables_live')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
    console.log('Table state changed:', payload.new);
    // Refresh table grid in Captain UI
  })
  .subscribe();
```

### 4.3. Step 3: Fetching Menu with Categories & Course Order
```javascript
// Fetch active dishes sorted in course order
const { data: menu, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('is_available', true)
  .order('category_order', { ascending: true })
  .order('code', { ascending: true });
```

### 4.4. Step 4: Firing a New KOT from Captain App
When the waiter taps **"Fire KOT"** or **"Send to Kitchen"**:

1. **Increment the daily KOT counter**:
```javascript
const { data: counter } = await supabase
  .from('pos_counters')
  .select('counter_val')
  .eq('counter_key', 'daily_kot_counter')
  .single();

const nextKotNumber = (counter?.counter_val || 1);

// Increment counter for next order
await supabase
  .from('pos_counters')
  .update({ counter_val: nextKotNumber + 1 })
  .eq('counter_key', 'daily_kot_counter');
```

2. **Insert the KOT Header**:
```javascript
const { data: newKot, error: kotErr } = await supabase
  .from('kots')
  .insert([{
    kot_number: nextKotNumber,
    table_id: selectedTable.id,
    section: selectedTable.section,
    waiter_name: currentWaiter.name,
    department: 'ALL', // Or split into KITCHEN / PANTRY
    source: 'CAPTAIN_APP',
    status: 'PENDING'
  }])
  .select()
  .single();
```

3. **Insert the Order Items (Separating Food vs Drinks/Desserts)**:
```javascript
const itemsToInsert = cartItems.map(item => ({
  kot_id: newKot.id,
  kot_number: nextKotNumber,
  table_id: selectedTable.id,
  item_code: item.code,
  item_name: item.name,
  qty: item.qty,
  rate: selectedTable.section.includes('AC') ? item.ac_rate : item.hall_rate,
  amount: item.qty * (selectedTable.section.includes('AC') ? item.ac_rate : item.hall_rate),
  category: item.category,
  category_order: item.category_order,
  customization: item.customization || '',
  department: item.is_kitchen ? 'KITCHEN' : 'PANTRY', // Crucial routing!
  is_staged: false,
  status: 'PENDING'
}));

await supabase.from('order_items').insert(itemsToInsert);

// 4. Update Table Status to OCCUPIED
await supabase
  .from('tables')
  .update({
    status: 'OCCUPIED',
    active_waiter: currentWaiter.name,
    updated_at: new Date().toISOString()
  })
  .eq('id', selectedTable.id);
```

---

## 5. Guide for KDS System (Kitchen Display & Cook App)

The KDS runs in the kitchen on a tablet or screen mounted near the tandoor/prep counter.

### 5.1. Filtering Rule (Cook Work Only!)
The cook only prepares kitchen dishes. **Beverages, Mineral Water, Soft Drinks, and Sweets must NOT show on the cook's KDS!**

```javascript
// Query only active orders where department = 'KITCHEN'
const { data: kitchenOrders } = await supabase
  .from('order_items')
  .select('*')
  .eq('department', 'KITCHEN')
  .eq('is_cancelled', false)
  .in('status', ['PENDING', 'PREPARING'])
  .order('created_at', { ascending: true });
```

### 5.2. Realtime Subscription for Incoming KOTs
```javascript
const kdsChannel = supabase
  .channel('kds_live')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'order_items' },
    payload => {
      const newItem = payload.new;
      // Only process kitchen items!
      if (newItem.department === 'KITCHEN' && !newItem.is_cancelled) {
        // Play kitchen notification bell tone
        playAudioNotification();
        // Add to active KDS queue
        addOrderToKdsGrid(newItem);
        // Optionally trigger local Kitchen ESC/POS thermal printer
        printKitchenTicket(newItem);
      }
    }
  )
  .subscribe();
```

### 5.3. Handling Live Item Cancellations on KDS (`*** CANCEL KOT ***`)
When the manager cancels an item on the Counter POS:
```javascript
supabase
  .channel('kds_cancellations')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'order_items' },
    payload => {
      if (payload.new.is_cancelled) {
        // Flash Red Alert on Cook Screen: *** DO NOT PREPARE ***
        showCancellationBanner({
          dish: payload.new.item_name,
          table: payload.new.table_id,
          reason: payload.new.cancel_reason,
          authorizedBy: payload.new.authorized_by,
        });
        // Stop cook work
        removeOrMarkCancelledInQueue(payload.new.id);
      }
    }
  )
  .subscribe();
```

### 5.4. Cook Status Updates
When a cook begins or finishes preparing a dish:
```javascript
// Mark as PREPARING
await supabase
  .from('order_items')
  .update({ status: 'PREPARING' })
  .eq('id', itemId);

// Mark as READY (Notifies waiter to pick up food!)
await supabase
  .from('order_items')
  .update({ status: 'READY' })
  .eq('id', itemId);
```

---

## 6. Guide for Desktop POS (Counter / Cashier / Manager)

The Counter POS acts as the central control terminal:

1. **Realtime Audio Chime on Captain Orders**:
   Subscribes to `kots` channel. When `INSERT` with `source = 'CAPTAIN_APP'` arrives:
   - Plays audio chime: *"Table [X] Order Received"*.
   - Flashes Table [X] on the Live Right Sidebar.
   - Triggers counter thermal receipt print if desired.

2. **Billing (`F6`)**:
   - Aggregates active dishes from `order_items`.
   - Inserts row into `bills` (`status: 'UNSETTLED'`).
   - Updates `tables` (`status: 'BILLED'`).
   - Prints Cash Memo slip.

3. **Settlement (`F12`)**:
   - Updates `bills` (`status: 'SETTLED'`, `payment_mode: 'Cash' | 'UPI' | 'Card'`).
   - Inserts row into `daily_transactions`.
   - Clears `tables` (`status: 'AVAILABLE'`).

4. **End of Day Close (`Close Day`)**:
   - Confirms all tables are `AVAILABLE` and all bills are `SETTLED`.
   - Resets `pos_counters` (`daily_kot_counter = 1`, `daily_bill_counter = 1`).

---

## 7. Migration Execution Checklist

To initialize this schema in your Supabase project:
1. Open your **Supabase Dashboard** ➔ Go to the **SQL Editor**.
2. Click **New Query**.
3. Open `supabase/migrations/20261027_init_inamdar_pos_schema.sql` from this repository.
4. Copy and paste the entire script into the SQL Editor.
5. Click **Run**.
6. Verify in the **Table Editor** that all 9 tables have been created and 215 menu items are seeded.
7. Copy your `Project URL` and `anon public key` from **Project Settings ➔ API** and place them into your `.env` file.
