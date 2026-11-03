# Inamdar POS & ERP - Project Context & Conversation History

> **Repository:** `dominaltech/inamdar`  
> **Deployment:** [https://inamdarpos.vercel.app](https://inamdarpos.vercel.app)  
> **Database:** Supabase Live Backend (`https://ovxvfzdnwhakkujktxky.supabase.co`)  
> **Target OS & UX:** Authentic Retro Windows 98 / 2000 Menson's POS 9.99.451 replica for Inamdar Restaurant & Takeaway, Solapur.

---

## 1. Executive Summary & Purpose

This document consolidates all discussions, investigations, architecture decisions, and code modifications completed for the **Inamdar Restaurant POS** system. It serves as a persistent context reference for all subsequent development sessions.

---

## 2. Key Architectural Decisions & Restaurant Business Rules

### 2.1 Table Lifecycle & Unsettled Bills Independence
* **No Lock on Unsettled Tables (Strict Requirement):**
  * When a bill (Cash Memo) is printed for a table (e.g. Table 1), the dining guests have completed their meal and physically vacate the table.
  * Payment collection may happen later, or the cashier may settle all bills in a batch at the end of the shift/day.
  * **Table 1 must NEVER be locked from taking new orders.** New guests can immediately sit at Table 1, and the operator can take orders and print new bills.
  * Consequently, the **Unsettled Bills** section can have multiple entries for the same table with distinct bill numbers (e.g., `1(10, 1450)` and `1(15, 1450)`). This is normal and expected restaurant behavior.

### 2.2 Top-Right Workspace Separation
* **Upper Section (Running Tables):** Divided into `AC`, `FAMILY AC`, `HOME DELIVERY`, and `PARCEL`.
  * Displays active occupied tables with fired KOTs.
  * **When a Cash Memo is printed:** The table status changes to `BILLED`, and it **immediately disappears** from the upper running tables section.
* **Lower Section (Unsettled Bills):**
  * Shows all bills with `status: 'UNSETTLED'` in red tags (e.g., `1(33, 1450)`).
  * **When settled:** The bill is marked `status: 'SETTLED'` and **immediately disappears** from the Unsettled Bills list.

### 2.3 Keyboard-First Progression (Menson's POS Authentic Workflow)
* **New Order Screen:**
  * **Table Input:** Initial focus. Pressing <kbd>Enter</kbd> with value advances to Employee select. Empty <kbd>Enter</kbd> toggles to Cash Memo.
  * **Existing Table Entry:** Entering an occupied base table (e.g. `2` or `14`) directly selects `2A` or `14A` and **does not** pop up the subtable selection modal (`A, B, +`).
  * **Item Code Box (`Code/CTM`):** Type dish number or acronym (e.g. `1` for Chicken Manchow Soup). Pressing <kbd>Enter</kbd> advances to `Qty`.
  * **Qty Box:** Typing quantity and pressing <kbd>Enter</kbd> immediately commits the item row (with `[NEW]` badge) and **jumps directly back to the Item Code box**, bypassing Waiter/Counter and Customization.
  * **Two-Stage Escape:** First <kbd>Esc</kbd> clears staged items and resets screen; second <kbd>Esc</kbd> opens `Display Order (KOT Transfer)`.
  * **<kbd>F12</kbd> Guard:** In New Order mode (`screenMode === 'ORDER'`), pressing <kbd>F12</kbd> does **not** open the settlement modal.

### 2.4 Cash Memo Pure Billing Screen
* Reached via empty <kbd>Enter</kbd> on empty table input or `Transaction -> Billing (Cash Memo)`.
* Quick item entry row (`Code/CTM`, `Qty`, `Rate`) is hidden.
* Entering an occupied table triggers the **Number of Persons (PAX)** prompt modal, followed by Cash Memo generation.

### 2.5 Details of Bill Screen (`DetailsOfBillModal.jsx`)
* **Styling:** All text and bill numbers are rendered in crisp retro black (`#000000`).
* **Highlighting:** Soft green background (`#dcf5dc`) is applied exclusively to unsettled bills (`!b.isSettled`).
* **Data Binding:** Both Table No and Net Amount are formatted and bound correctly.
* **Keyboard Navigation:** Pressing <kbd>Enter</kbd> closes the modal, returns to Cash Memo, and focuses `#pos-table-input`.
* **Settlement Menu / Batch Settle (<kbd>F12</kbd>):** When the Batch Settlement modal opens, global number key interception is suspended so digits type into `#batch-settle-bill-input` without shifting background row selections.

---

## 3. Database Architecture (Supabase Cloud + Local Cache)

### 3.1 Cloud Tables (`supabase/migrations/01_init_inamdar_pos_schema.sql`)
1. **`bills` Table:**
   * `id`: UUID (Primary Key)
   * `bill_no`: INT (Unique sequential bill number)
   * `table_id`: TEXT (Table identifier, e.g., '1', '2A')
   * `section`: TEXT ('AC', 'FAMILY AC', 'PARCEL', 'HOME DELIVERY')
   * `total_amount`: NUMERIC(10, 2)
   * `items_json`: JSONB (Complete itemized dish array)
   * `status`: TEXT (`'UNSETTLED'` | `'SETTLED'`)
   * `payment_mode`: TEXT (Cash, UPI, Card, etc.)
   * `settled_at`: TIMESTAMPTZ
2. **`daily_transactions` Table:** Permanent journal log of all settled bills with payment mode, amount, and timestamp.
3. **`tables` Table:** Maintains current live occupancy, active KOT numbers, and table status (`AVAILABLE`, `OCCUPIED`, `BILLED`).
4. **`kots` & `order_items` Tables:** Kitchen Order Tickets and individual dish orders with kitchen/pantry routing.
5. **Realtime Replication:** `supabase_realtime` publication enabled on `bills`, `tables`, `kots`, `order_items`, and `pos_counters` for instant cross-terminal sync.

### 3.2 Offline-First Local Cache Engine (`src/services/cacheService.js`)
* Stores tables, unsettled bills, bill counters, and daily transactions in `localStorage`.
* Provides instant **0ms application boot** without network latency.
* Performs delta synchronization with Supabase when online.

---

## 4. Key Investigations & Resolutions

### 4.1 Resolution of Repeated Table Numbers in Unsettled Bills
* **Observed Issue:** The sidebar displayed duplicate table entries like `1(27, 1450)`, `1(21, 1450)`, `2(29, 4460)`, `2(23, 4460)`.
* **Root Cause:**
  * During manual testing on the live Vercel app between 18:42 and 18:51 IST (13:12–13:21 UTC), orders were placed and Cash Memos were printed repeatedly without settling previous bills.
  * Each bill was inserted into Supabase with `status: 'UNSETTLED'`, resulting in 29 unsettled bills across 6 tables.
* **Playwright Clarification:** Automated Playwright tests **did not** create these bills. Playwright only tests Table 16 with a single ₹130 soup item and settles it immediately within the test run (Bill #42).
* **Fix & Cleanup Executed (Option B):**
  * Executed a cleanup script against Supabase patching all 29 unsettled bills to `status = 'SETTLED'`.
  * Reset all occupied tables in Supabase to `status = 'AVAILABLE'`.
  * Unsettled bills count in database is now **0 (clean slate)**.

### 4.2 Fix for "Bills cannot be settled because they have 0 items"
* **Observed Issue:** Clicking an unsettled bill tag threw *"Table X has no active items to settle!"*.
* **Root Cause:** `openSettleModal` was inspecting `tables[cleanId].items.length`. When a bill is printed or upon page reload, the physical table's active items array is empty (`[]`), even though the bill itself retains its full items list and amount in `unsettledBills` / Supabase `items_json`.
* **Fix Architecture:** Decouple settlement from physical table occupancy. `openSettleModal(tableId, billNo)` loads data directly from the bill record, displaying the bill's amount and dishes regardless of physical table state.

---

## 5. File Inventory & Critical Components

| Component / File | Purpose & Key Logic |
| :--- | :--- |
| [src/context/PosContext.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/context/PosContext.jsx) | Global state provider for tables, active orders, billing, settlement, Supabase sync, and counters. |
| [src/components/OrderWorkspace.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/components/OrderWorkspace.jsx) | Main retro POS workspace: table input, item grid, sequential keyboard flow, running tables, and unsettled bills panel. |
| [src/components/DetailsOfBillModal.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/components/DetailsOfBillModal.jsx) | Retro bill ledger modal: black font, green unsettled rows, Enter-to-Memo navigation, and F12 settlement access. |
| [src/components/SettlementModal.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/components/SettlementModal.jsx) | Single-bill settlement modal (Cash, UPI, Card) with keyboard hotkeys (1, 2, 3, Enter). |
| [src/components/BatchSettlementModal.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/components/BatchSettlementModal.jsx) | Batch settlement modal for end-of-day settling across multiple bill numbers. |
| [src/hooks/usePosKeyboard.js](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/hooks/usePosKeyboard.js) | Global hotkey listener for POS operations (F5, F6, F12, Escape, Tab). |
| [src/services/supabaseService.js](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/services/supabaseService.js) | Supabase client operations: CRUD for bills, KOTs, tables, and realtime event channels. |
| [src/services/cacheService.js](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/services/cacheService.js) | Local storage cache engine and migration manager (`enforceScratchResetIfNeeded`). |
| [tests/pos.spec.js](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/tests/pos.spec.js) | Comprehensive 13-test Playwright end-to-end test suite verifying all Menson's POS workflows. |

---

## 6. Implementation Checklist for Next Step (Pending User "Proceed")

- [ ] **Bill-Centric Settlement Update:**
  - Update `openSettleModal(tableId, billNo)` in [src/context/PosContext.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/context/PosContext.jsx) to accept `billNo`.
  - Fall back to finding the bill in `unsettledBills` or `allBills` when `table.items` is empty.
  - Update [src/components/SettlementModal.jsx](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/components/SettlementModal.jsx) to display the bill's amount and dishes correctly.
- [ ] **Ensure No Table Lock on Unsettled Tables:**
  - Verify that table input in New Order allows entering any table number even if prior bills exist in `unsettledBills`.
- [ ] **Bump Cache Version:**
  - Set `CURRENT_VERSION = 'inamdar_v6_clean_scratch'` in [src/services/cacheService.js](file:///c:/Users/Administrator/Desktop/All%20projects/Inamdar/src/services/cacheService.js) to clear stale local storage in client browsers.
- [ ] **Test & Build Verification:**
  - Run `npm test` (Playwright test suite).
  - Run `npm run build` (Vite build).
- [ ] **Git Push:**
  - Commit changes and push to `origin/main` upon receiving user confirmation.
