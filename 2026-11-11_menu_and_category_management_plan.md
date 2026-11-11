# Live Menu & Category Management Studio Implementation Plan

## 1. Overview & Objectives
This plan outlines the architecture, database schema, state management, UI components, companion app integrations, and Playwright automated test suites to fulfill the user's requirements:
1. **Top Header Menu Bar "Menu" Button**: Added alongside `Transaction`, `Master`, `Credits`, `Employee`, `Reports`, `Utilities`.
2. **Direct Supabase Menu & Category CRUD Studio**: 
   - Manage categories: view, add, rename, delete, and re-order (`category_order`).
   - Manage dishes / menu items: view, add new with custom code, edit name/rates (`ac_rate`, `hall_rate`), kitchen/pantry routing (`is_kitchen`), toggle availability (`is_available`), and delete.
   - All changes persist directly to Supabase with instantaneous optimistic UI updates and real-time syncing.
3. **Dynamic Culinary Course Sorting**:
   - Both **KOT (Kitchen Order Ticket)** and **Cash Memo / Final Bill** prints strictly sort line items by dynamic `category_order` (then item code), regardless of the order in which items were added by the operator or captain.
4. **Companion Apps Live Integration**:
   - **Inamdar Captain App**: Listens to realtime changes on `menu_items` and `menu_categories`, displaying dishes according to dynamic category order.
   - **Inamdar KDS System**: Ticket line items are sorted according to `category_order`.
5. **SQL Migration (`05_menu_categories_and_crud.sql`)**:
   - Schema creation for `menu_categories`, data migration from `menu_items`, and triggers/functions for atomic order updates.
6. **Automated Playwright Tests & Code Quality**:
   - Brute automated test verifying Menu Studio, Category reordering, Dish CRUD, and dynamic slip sorting.
   - Zero `oxlint` errors and 100% test pass rate across all suites.
   - Safe push of all 3 repos to GitHub.

---

## 2. Architecture & Database Design

### Supabase Table: `menu_categories`
```sql
CREATE TABLE IF NOT EXISTS menu_categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category_order INT NOT NULL DEFAULT 99,
  department TEXT DEFAULT 'KITCHEN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table Synchronization & Cascading:
- When a category order is modified in the studio, `menu_categories.category_order` is updated, and all corresponding records in `menu_items.category_order` are updated in Supabase to keep them synchronized.
- When a category name is edited, all dishes belonging to that category in `menu_items` are updated.

---

## 3. Implementation Steps

| Step | Component / File | Description |
| :--- | :--- | :--- |
| **1** | `supabase/migrations/05_menu_categories_and_crud.sql` | SQL migration script for `menu_categories` table and sync logic. |
| **2** | `src/services/supabaseService.js` | Add `fetchLiveCategories`, `saveCategoryInSupabase`, `updateCategoryOrderInSupabase`, `renameCategoryInSupabase`, `deleteCategoryInSupabase`, `deleteMenuItemInSupabase`, and realtime listeners. |
| **3** | `src/data/menuService.js` | Enable dynamic category ordering cache and update `sortItemsByCourse`. |
| **4** | `src/context/PosContext.jsx` | Expose categories state, CRUD methods, and update `printCashMemo` to sort bill items by `sortItemsByCourse`. |
| **5** | `src/components/HeaderMenuBar.jsx` | Add "Menu" button next to "Utilities" triggering `screenMode = 'MENU'`. |
| **6** | `src/components/MenuManagementView.jsx` | Retro Windows 98/2000 style dual-panel manager for Categories (left) and Menu Items (right). |
| **7** | `src/App.jsx` | Render `<MenuManagementView />` when `screenMode === 'MENU'`. |
| **8** | `Inamdar Captain App` | Add realtime `menu_items` subscription and dynamic category sorting in `CaptainContext.jsx`. |
| **9** | `Inamdar KDS System` | Ensure ticket dishes are sorted by `category_order` in `TicketGrid.jsx`. |
| **10** | `tests/pos.spec.js` | Add Playwright test suite 19 covering Menu Studio CRUD, category reordering, and dynamic course order verification on KOT and Bill prints. |
| **11** | Verification & Deployment | Run `oxlint`, execute all Playwright tests, commit and push to GitHub. |

---

## 4. Verification Plan
- Playwright test running with browser UI and assertions:
  - Open Menu Management.
  - Reorder categories and assert position changes.
  - Add new item and verify it appears in search.
  - Place order with mixed dishes and fire KOT -> verify KOT slip course order.
  - Generate Cash Memo bill -> verify bill items course order.
- Oxlint linting pass with 0 errors.

