# Inamdar Restaurant POS — Complete System Architecture & Specification
**Benchmark Reference**: Menson's POS 9.99.451  
**Target Repository**: `dominaltech/inamdar` on GitHub (`main` branch)  
**Database**: Supabase PostgreSQL 15+ with Realtime Synchronization  

---

## 1. Executive Summary & Design Aesthetics
The Inamdar POS system is an exact, high-performance, pixel-authentic replica of the retro Windows POS system **Menson's POS 9.99.451**. 
Key design pillars:
1. **Windows 98/2000 Aesthetics**: Classic `#ece9d8` palettes, 3D outset/inset bevel borders (`#dfdfdf`, `#808080`, `#404040`), and blue gradient title bars with crisp 11px/12px sans-serif typography.
2. **10-Key Numpad Keyboard-First Operations**: Cashiers can complete entire shifts without touching a mouse. Sub-millisecond keystroke responsiveness with zero UI latency.
3. **No Split Billing**: Standard unified bills per table / subtable.
4. **Dynamic Supabase Architecture**: Zero hardcoded dishes. The complete 215-dish menu is queried dynamically from Supabase and cached locally for instantaneous offline resilience.
5. **Zero Dummy Elements**: Every single item in the top menu bar (**Transaction**, **Master**, **Credits**, **Employee**, **Reports**, **Utilities**) opens a dedicated, interactive retro dialog or report with live database connectivity.

---

## 2. Dynamic Supabase Database Schema
The database migration (`supabase/migrations/20261027_init_inamdar_pos_schema.sql`) implements 11 unified tables:

1. **`menu_items`**: Complete menu card (215 unique dishes). Stores `code`, `name`, `category`, `category_order` (1: Soup to 13: Soft Drinks), `hall_rate`, `ac_rate`, `is_kitchen`, and `is_available`.
2. **`tables`**: Active table states across AC (1–20), Family AC (21–40), Parcels (0, 0B, 0C..), and Home Delivery (00 - Customer). Stores `section`, `status`, `active_waiter`, `pax`, and `kot_nos`.
3. **`kots` & `order_items`**: Kitchen Order Tokens and item line details. Distinguishes Kitchen dishes (Cook station) from Pantry/Bar items (sweets, soft drinks, water bottles).
4. **`bills` & `daily_transactions`**: Cash memo bills and settled transactions supporting all **18 payment modes**.
5. **`cancellations_audit`**: Audit trail of cancelled dishes requiring supervisor PIN verification.
6. **`credit_accounts`**: Customer credit ledgers with balances and credit limits.
7. **`audit_logs`**: System audit trail tracking table shifts, cancellations, duplicate reprints, and day closures.
8. **`pos_counters`**: Daily counters for sequential KOT and Bill numbers resetting at End of Day.
9. **`staff_users`**: User roles and PIN authentication (`OPERATOR`, `MANAGER`, `OWNER`, `WAITER`, `COOK`).

---

## 3. Operational Mechanics (Extracted from Videos 1–9)

### 3.1. Enter Screen Toggling (`vid1`, `vid2`)
- In **New Order**: Pressing `Enter` on an empty Table field toggles directly to **New Cash Memo**.
- In **New Cash Memo**: Pressing `Enter` on an empty Table field toggles directly to **New Order**.

### 3.2. Cash Memo Billing & Pax Prompt (`vid1`, `vid2`)
- In **New Cash Memo**, entering a table number opens the authentic popup: `Number of Persons: [ ]` with the retro guest graphic.
- Confirming pax generates the Cash Memo bill, triggers thermal receipt printing, and displays the bill in **Unsettled Bills** in red: `Table(BillNo, Amount)` (e.g. `2(4, 960)`).

### 3.3. Display Order (`Escape` in New Order) (`vid3`, `vid4`)
- Pressing `Escape` in New Order opens **Display Order**.
- Right pane lists live KOTs (`KOT No`, `Table`, `Section`, `Waiter`, `Time`, `Amount`).
- Left pane displays all items in the selected KOT.
- Selecting a KOT and pressing `Enter` opens **Transfer KOT** (`From: [ 1-A ]` ➔ `To: [ 2-A ]`) with confirmation: `Transfer KOTs from 1-A to 2-A? [Yes] [No] [Cancel]`.

### 3.4. Details of Bill (`Escape` in Cash Memo) (`vid3`, `vid7`)
- Pressing `Escape` in New Cash Memo opens **Details of Bill**.
- **Unsettled bills are displayed in VIBRANT GREEN text.**
- **Settled bills are displayed in CRISP BLACK text.**
- Left pane displays line items of the highlighted bill.
- Pressing `F12` inside Details of Bill opens the 18-Mode Settlement Menu.

### 3.5. 18-Mode Settlement & Batch Settlement (`vid5`, `vid6`)
- Settlement Menu contains 18 modes:
  1: Cash, 2: Digital Payments, 3: Online Payment, 4: Swiggy, 5: Zomato, 6: UPI, 7: Bill On Hold, 8: Debit Card, 9: Room Post, 10: Cheque, 11: Sodexo, 12: Ticket, 13: Bills Returned, 14: Void, 15: Guest, 16: Complimentary, 17: Staff, 18: No Charge KOTs.
- Selecting a mode opens **Batch Settlement**.
- Allows entering multiple bill numbers into a batch grid with real-time total calculation.
- Validates non-existent bills with `"Bill No [X] Does Not Exist"`.
- Features `"Recall Bills"` and confirms batch with `"[N] Bills Settled"`.

### 3.6. Subtable Splitting (`vid8`)
- Entering an occupied table triggers the Subtable dropdown showing `A`, `B`, and `+`.
- Selecting `+` creates subtable `2B` with a fresh empty grid and displays `2B` on the right sidebar under AC.

### 3.7. Order Cancellation (`-` Key)
- Unprinted staged items display with `[NEW]` badge until fired with double Enter.
- Pressing `-` activates Cancel Order mode, restricts search to ordered dishes, prompts for Reason and Manager PIN, logs cancellation, prints Cancel KOT slip, and auto-returns to New Order.

### 3.8. Table Shift (`*` Key)
- Numpad `*` opens Shift Table. Blocks transfer if destination table is occupied: `"Error: Table is already OCCUPIED! Merging is prohibited."`

### 3.9. End of Day / Close Day
- Blocks Day Close if active tables or unsettled bills exist. Once cleared, resets KOT and Bill counters to 1.

---

## 4. Top Menu Navigation Architecture (Zero Dummy Elements)
- **Transaction**: New Order (F5), New Cash Memo (F6), Display Order, Details of Bill, Table Shift (*), Settlement Menu (F12), Duplicate Bills, Close Day.
- **Master**: Menu Card Master (Supabase Sync), Tables Master & Layout Inspector, Cancel KOT Reason Master, Customers Credit Master, Waiters & Staff Master, Thermal Printer Setup.
- **Credits**: Customer Credit Ledger & Payments, Hotel Room Post Charges.
- **Employee**: Waiters & Staff Performance, Change Operator / Shift PIN (F11).
- **Reports**: Day Summary / Dayclose Report, Item Sales Report, Cancelled Orders & Waste Report, Audit Alteration Report & System Log, Sales Register & Bills Ledger.
- **Utilities**: Tables Master & Occupancy, Supabase Cloud Database Config, Thermal Printer Routing Setup, End of Day Finalize.
