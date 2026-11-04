import { test, expect } from '@playwright/test';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function resetSupabaseTables() {
  try {
    const env = fs.readFileSync('.env', 'utf-8');
    const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
    const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
    if (!url || !key) return;
    const sb = createClient(url, key);
    await sb.from('tables').update({
      status: 'AVAILABLE',
      kot_nos: [],
      active_waiter: null,
      customer_name: '',
      customer_phone: ''
    }).neq('id', 'dummy');
  } catch (err) {
    console.warn('resetSupabaseTables notice:', err.message);
  }
}

test.describe('Inamdar Restaurant POS - Retro Menson\'s Replica Test Suite', () => {

  test.beforeAll(async () => {
    await resetSupabaseTables();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=SUPABASE: LIVE')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Ensure screen is in ORDER (New Order) mode
    const orderTitle = page.locator('.win-titlebar-title', { hasText: 'New Order' });
    if (!await orderTitle.isVisible()) {
      const memoToggle = page.locator('span:has-text("[F5 Order]")');
      if (await memoToggle.isVisible()) {
        await memoToggle.click();
      } else {
        await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
        await page.locator('.win-dropdown-row', { hasText: 'New Order' }).click();
      }
    }
  });

  test('01. Top Menu Navigation - All 6 Top Menus and Zero Dummy Elements', async ({ page }) => {
    // 0. Verify main application title bar
    await expect(page.locator('.win-titlebar-title').first()).toContainText('Dominal\'s POS - INAMDAR RESTAURANT');

    // 1. Reports Menu -> Item Sales Report
    await page.locator('.win-menu-item', { hasText: 'Reports' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Item Sales Report' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Item Sales Report' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Item Sales Report' })).not.toBeVisible();

    // 2. Reports Menu -> Cancelled Orders Report
    await page.locator('.win-menu-item', { hasText: 'Reports' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Cancelled Orders & Waste Report' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cancelled Orders & Waste Audit Report' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cancelled Orders & Waste Audit Report' })).not.toBeVisible();

    // 3. Reports Menu -> Audit Alteration Report
    await page.locator('.win-menu-item', { hasText: 'Reports' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Audit Alteration Report' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'System Audit Trail & Alteration Register' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'System Audit Trail & Alteration Register' })).not.toBeVisible();

    // 4. Reports Menu -> Sales Register
    await page.locator('.win-menu-item', { hasText: 'Reports' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Sales Register & Bills Ledger' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Sales Register & Bill Settlement Ledger' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 5. Master Menu -> Menu Card Master
    await page.locator('.win-menu-item', { hasText: 'Master' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Menu Card Master' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Menu Card Master' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 6. Master Menu -> Tables Master & Layout Inspector
    await page.locator('.win-menu-item', { hasText: 'Master' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Tables Master & Layout Inspector' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Restaurant Tables Master' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 7. Master Menu -> Cancel KOT Reason Master
    await page.locator('.win-menu-item', { hasText: 'Master' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Cancel KOT Reason Master' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cancel KOT Reason Master' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 8. Master Menu -> Waiters & Staff Master
    await page.locator('.win-menu-item', { hasText: 'Master' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Waiters & Staff Master' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Waiters & Staff Master' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 9. Master Menu -> Thermal Printer Setup
    await page.locator('.win-menu-item', { hasText: 'Master' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Thermal Printer Setup' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Thermal Printer Setup' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 10. Credits Menu -> Customer Credit Ledger
    await page.locator('.win-menu-item', { hasText: 'Credits' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Customer Credit Ledger & Payments' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Customer Credit Accounts & Ledger' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 11. Credits Menu -> Room Post
    await page.locator('.win-menu-item', { hasText: 'Credits' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Hotel Room Post Charges' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Hotel Room Post Ledger' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();

    // 12. Utilities Menu -> Supabase Cloud Config
    await page.locator('.win-menu-item', { hasText: 'Utilities' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Supabase Cloud Database Config' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Supabase Cloud Database Configuration' })).toBeVisible();
    await page.locator('button:has-text("Close (Esc)")').click();
  });

  test('02. Screen Toggling via Empty Enter Key', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await expect(tableInput).toBeVisible();
    
    // In Order mode, empty Enter switches to Cash Memo
    await tableInput.fill('');
    await tableInput.press('Enter');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cash Memo' })).toBeVisible();

    // In Cash Memo mode, empty Enter switches back to New Order
    await tableInput.fill('');
    await tableInput.press('Enter');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'New Order' })).toBeVisible();
  });

  test('03. Subtable Creation and Selection', async ({ page }) => {
    const subtableTrigger = page.locator('div[title*="Select Subtable"]');
    await expect(subtableTrigger).toBeVisible();
    await subtableTrigger.click();

    // Subtable dropdown options appear: A, B, +
    const subtableB = page.locator('.win-bevel-outset div', { hasText: /^B$/ }).first();
    await expect(subtableB).toBeVisible();
    await subtableB.click();

    // Verify trigger shows B
    await expect(subtableTrigger).toContainText('B');
  });

  test('04. Dish Code Entry, Staging with [NEW] Badge and KOT Firing', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('2');
    await tableInput.press('Enter');

    // Customer details modal appears: skip via Escape
    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await expect(codeInput).toBeVisible();

    // Type dish code 1
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');

    // Qty input: Enter commits item row immediately and loops focus directly back to Item Code!
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await expect(qtyInput).toBeVisible();
    await qtyInput.fill('2');
    await qtyInput.press('Enter');

    // Verify item is staged with [NEW] badge and focus returns directly to Code input (skips counter and custom)
    await expect(page.locator('text=[NEW]').first()).toBeVisible();
    await expect(codeInput).toBeFocused();

    // Fire KOT button
    const fireKotButton = page.locator('button:has-text("Fire KOT (↵↵)")');
    if (await fireKotButton.isVisible()) {
      await fireKotButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('05. Pax Prompt Modal on Cash Memo Table Entry', async ({ page }) => {
    // Switch to Cash Memo mode via Transaction menu
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Billing (Cash Memo)' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cash Memo' })).toBeVisible();

    // In Cash Memo, quick item entry row (Code, Qty, Rate) must NOT be present
    await expect(page.locator('input[placeholder="Code/CTM"]')).not.toBeVisible();

    // In Cash Memo: 1st Enter loads table preview; 2nd Enter opens PAX prompt
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('3');
    await tableInput.press('Enter');
    await page.waitForTimeout(200);

    // 1st Enter: Shows preview, PAX prompt is not opened yet
    await expect(page.locator('text=Number of Persons')).not.toBeVisible();

    // 2nd Enter: Now opens Number of Persons (PAX) prompt!
    await tableInput.press('Enter');
    await page.waitForTimeout(200);
    const paxModal = page.locator('text=Number of Persons');
    if (await paxModal.isVisible()) {
      await page.keyboard.press('Escape');
    }
  });

  test('06. Display Order KOT Transfer Flow (Esc in Order Mode)', async ({ page }) => {
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Display Order (KOT Transfer)' }).click();

    // Verify Display Order modal title
    await expect(page.locator('.win-titlebar-title', { hasText: 'Display Order' })).toBeVisible();

    // Close via Close (Esc) button
    await page.locator('button:has-text("Close (Esc)")').click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Display Order' })).not.toBeVisible();
  });

  test('07. Details of Bill and 18-Mode Settlement Menu (F12)', async ({ page }) => {
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Details of Bill' }).click();

    // Verify Details of Bill modal
    await expect(page.locator('.win-titlebar-title', { hasText: 'Details of Bill No.' })).toBeVisible();

    // Open Settlement Menu via Settle link
    await page.locator('span:has-text("[F12 Settlement]")').click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Bill Settlement' })).toBeVisible();

    // Verify retro payment modes inside modal
    await expect(page.locator('.win-modal-backdrop span', { hasText: /^Cash$/ })).toBeVisible();
    await expect(page.locator('.win-modal-backdrop span', { hasText: /^UPI$/ })).toBeVisible();
    await expect(page.locator('.win-modal-backdrop span', { hasText: /^Cheque$/ })).toBeVisible();

    // Click Cash to open Batch Settlement
    await page.locator('.win-modal-backdrop span', { hasText: /^Cash$/ }).click();
    await expect(page.locator('.win-modal-backdrop .win-titlebar-title', { hasText: /^Cash$/ })).toBeVisible();

    // Close Batch Settlement via window close button
    await page.locator('.win-close-btn').first().click();
  });

  test('08. Order Cancellation Mode (- Key) & Security Authorization', async ({ page }) => {
    // Open dedicated Cancel Order / Items Modal via Cancel (-) button or hotkey
    await page.locator('button:has-text("Cancel (-)")').click();
    await page.waitForTimeout(200);

    // Cancel modal should be visible
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cancel Order / Remove Items' })).toBeVisible();

    // Press 'Escape' to close Cancel modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cancel Order / Remove Items' })).not.toBeVisible();
  });

  test('09. Sequential Keyboard Progression (Enter forward, Left Arrow backward across all boxes)', async ({ page }) => {
    // 1. Initial box is Table
    const tableInput = page.locator('#pos-table-input');
    await expect(tableInput).toBeFocused();

    // 2. Type Table 19 and Enter -> Prompts Customer Details Modal
    await tableInput.fill('19');
    await tableInput.press('Enter');

    const custName = page.locator('#cust-name-input');
    await expect(custName).toBeVisible();
    await custName.fill('Moosa Inamdar');
    await custName.press('Enter'); // moves to phone

    const custPhone = page.locator('#cust-phone-input');
    await expect(custPhone).toBeVisible();
    await custPhone.fill('9876543210');
    await custPhone.press('Enter'); // submits customer and advances to Code!

    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await expect(codeInput).toBeFocused();

    // 3. Type dish code '1' and press Enter -> Selects dish and advances to Qty
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await expect(qtyInput).toBeFocused();

    // 4. Left Arrow on Qty -> Backward to Code
    await qtyInput.press('ArrowLeft');
    await expect(codeInput).toBeFocused();

    // 5. Re-select dish '1' -> advances to Qty
    await codeInput.press('Enter');
    await expect(qtyInput).toBeFocused();

    // 6. Enter on Qty -> Immediately commits item and loops focus directly back to Item Code!
    await qtyInput.press('Enter');
    await expect(codeInput).toBeFocused();
    await expect(page.locator('text=[NEW]').first()).toBeVisible();
  });

  test('10. KOT Creation Clears Workspace & Typing Running Table Opens Subtable Menu (A/B)', async ({ page }) => {
    // 1. Enter table 14 (starts as clean table 14 without 'A' suffix)
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('14');
    await tableInput.press('Enter');

    // Verify tableInput stayed '14'
    await expect(tableInput).toHaveValue('14');

    // Skip/Confirm Customer Details modal
    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // 2. Add an item
    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter'); // Select dish -> Qty
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await expect(qtyInput).toBeVisible();
    await qtyInput.press('Enter'); // Enter on Qty directly commits item and loops to Code

    // Item is visible in grid
    await expect(page.locator('text=[NEW]').first()).toBeVisible();

    // 3. Fire KOT
    const fireKotBtn = page.locator('button:has-text("Fire KOT (↵↵)")');
    if (await fireKotBtn.isVisible()) {
      await fireKotBtn.click();
      await page.waitForTimeout(300);
    } else {
      await codeInput.press('Enter');
      await page.waitForTimeout(100);
      await codeInput.press('Enter');
      await page.waitForTimeout(300);
    }

    // Close print modal if open
    const closeKotBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // 4. Verify workspace has cleared: items disappeared and table input is ready
    await expect(page.locator('text=[NEW]')).not.toBeVisible();
    await expect(page.locator('text=No items for Table')).toBeVisible();

    // 5. Now type table 14 again (which is now an ALREADY RUNNING occupied table!)
    await tableInput.focus();
    await tableInput.fill('14');
    await expect(tableInput).toHaveValue('14');
    await tableInput.press('Enter');

    // User requirement: When typing a table that is ALREADY RUNNING, open the subtable box (A or B)!
    const subtableMenu = page.locator('.win-bevel-outset');
    await expect(subtableMenu).toBeVisible();

    // Select A and press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Customer modal appears for 14A
    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Now table input shows 14A!
    await expect(tableInput).toHaveValue('14A');
  });

  test('11. Two-Stage Escape Flow in Order Mode (1st Esc clears screen, 2nd Esc opens Display Order)', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('15');
    await tableInput.press('Enter');

    // Skip/Confirm Customer Details modal
    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Add an item so screen is dirty
    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await qtyInput.press('Enter'); // Directly commits item

    // Verify item is present
    await expect(page.locator('text=[NEW]')).toBeVisible();

    // 1st Esc: Should clear the screen, items disappear, Display Order must NOT open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('text=[NEW]')).not.toBeVisible();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Display Order' })).not.toBeVisible();
    await expect(tableInput).toBeFocused();
    await expect(tableInput).toHaveValue('');

    // 2nd Esc (screen is already clear): Now opens Display Order!
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Display Order' })).toBeVisible();

    // Esc from Display Order returns to Order and focuses table
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Display Order' })).not.toBeVisible();
    await expect(tableInput).toBeFocused();
  });

  test('12. Running Tables vs Unsettled Bills Separation, Bill Print & Full Settle', async ({ page }) => {
    // 1. Enter Table 16, add item, fire KOT
    const tableInput = page.locator('#pos-table-input');
    await tableInput.click();
    await tableInput.fill('16');
    await expect(tableInput).toHaveValue('16');
    await tableInput.press('Enter');

    // Skip/Confirm Customer Details modal
    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await qtyInput.press('Enter'); // Commits item

    // Fire KOT
    const fireKotBtn = page.locator('button:has-text("Fire KOT (↵↵)")');
    if (await fireKotBtn.isVisible()) {
      await fireKotBtn.click();
      await page.waitForTimeout(300);
    } else {
      await codeInput.press('Enter');
      await page.waitForTimeout(100);
      await codeInput.press('Enter');
      await page.waitForTimeout(300);
    }

    // Close KOT print modal if open
    const closeKotBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // 2. Table 16 is now a running table -> appears under GENERAL section
    await expect(page.locator('.win-window span:has-text("16")').first()).toBeVisible();

    // 3. Switch to Cash Memo mode and bill Table 16
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Billing (Cash Memo)' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cash Memo' })).toBeVisible();

    await tableInput.fill('16');
    await tableInput.press('Enter'); // 1st Enter: preview
    await page.waitForTimeout(200);
    await tableInput.press('Enter'); // 2nd Enter: opens PAX prompt
    await page.waitForTimeout(300);

    await expect(page.locator('text=Number of Persons')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Enter'); // 3rd Enter: prints bill
    await page.waitForTimeout(300);

    // Close cash memo print preview
    const closeMemoBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeMemoBtn.isVisible()) {
      await closeMemoBtn.click();
      await page.waitForTimeout(200);
    }

    // 4. Crucial: Table 16 MUST now disappear from running tables and appear under Unsettled Bills!
    await expect(page.locator('.win-window').getByText('Unsettled Bills').first()).toBeVisible();
    await expect(page.locator('span:has-text("16(")').first()).toBeVisible();

    // 5. Now settle the bill via clicking on the unsettled bill tag
    while (await page.locator('span:has-text("16(")').count() > 0) {
      await page.locator('span:has-text("16(")').first().click();
      await page.waitForTimeout(200);
      const cashBtn = page.locator('.win-modal-backdrop button:has-text("Cash")').first();
      if (await cashBtn.isVisible()) {
        await cashBtn.click();
        await page.waitForTimeout(200);
      }
      const okBtn = page.locator('button:has-text("OK")');
      if (await okBtn.isVisible()) {
        await okBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // 6. Crucial: Table 16 MUST disappear from Unsettled Bills!
    await expect(page.locator('span:has-text("16(")')).not.toBeVisible();
  });

  test('13. Details of Bill (Black Numbers, Green Unsettled Highlight, Table/Amount Display, F12 Typing & Order Mode F12 Guard)', async ({ page }) => {
    // 1. In New Order mode: F12 must NOT show box to settle!
    await page.keyboard.press('F12');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Settlement' })).not.toBeVisible();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Bill Settlement' })).not.toBeVisible();

    // 2. Open Details of Bill via Top Menu
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Details of Bill' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Details of Bill No.' })).toBeVisible();

    // 3. Pressing Enter inside Details of Bill returns to Cash Memo and focuses Table input!
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Details of Bill No.' })).not.toBeVisible();
    await expect(page.locator('#pos-table-input')).toBeFocused();

    // 4. Return to Details of Bill via Top Menu
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Details of Bill' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Details of Bill No.' })).toBeVisible();

    // 5. Open Settlement Menu via F12
    await page.keyboard.press('F12');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'Bill Settlement' })).toBeVisible();

    // 6. Select Cash to open Batch Settlement modal
    await page.locator('.win-modal-backdrop span:has-text("Cash")').first().click();
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: /^Cash$/ })).toBeVisible();

    // 7. Verify typing numbers into Batch Settlement input works without background list interference
    const billInput = page.locator('#batch-settle-bill-input');
    await expect(billInput).toBeVisible();
    await billInput.focus();
    await billInput.type('123');
    await expect(billInput).toHaveValue('123');

    // 8. Close Batch Settlement via Esc
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  });

  test('14. Independent Bills on Reused Table (Table 18 Multiple Turnovers generate Independent Unsettled Bills without item bleed)', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await expect(tableInput).toBeVisible();

    // Wait for Supabase live sync and unsettled bills initial load to complete
    await expect(page.locator('text=SUPABASE: LIVE')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Record baseline unsettled bills count for Table 18
    const base18Count = await page.locator('span:has-text("18(")').count();

    // --- SESSION 1 on Table 18 ---
    // 1. Order Table 18
    await tableInput.fill('18');
    await tableInput.press('Enter');
    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Enter Dish code '1', qty '1'
    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await qtyInput.press('Enter'); // Commits item
    await expect(page.locator('text=[NEW]').first()).toBeVisible();

    // Fire KOT via button
    const fireKotBtn = page.locator('button:has-text("Fire KOT (↵↵)")');
    await fireKotBtn.click();
    await page.waitForTimeout(300);

    // Close KOT print modal if open
    const closeKotBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // Table 18 appears in running tables
    await expect(page.locator('.win-window span:has-text("18")').first()).toBeVisible();

    // 2. Bill Table 18 via Cash Memo (Bill #1)
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Billing (Cash Memo)' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cash Memo' })).toBeVisible();

    await tableInput.click();
    await tableInput.fill('18');
    await expect(tableInput).toHaveValue('18');
    await tableInput.press('Enter'); // 1st Enter: preview Table 18 items
    await page.waitForTimeout(300);
    await tableInput.press('Enter'); // 2nd Enter: opens PAX prompt
    await page.waitForTimeout(300);

    await expect(page.locator('text=Number of Persons')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const closeMemoBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeMemoBtn.isVisible()) {
      await closeMemoBtn.click();
      await page.waitForTimeout(200);
    }

    // Table 18 moves to Unsettled Bills (Bill #1)
    await expect(page.locator('.win-window').getByText('Unsettled Bills').first()).toBeVisible();
    await expect(page.locator('span:has-text("18(")')).toHaveCount(base18Count + 1);

    // --- SESSION 2 on Table 18 (New Guest / Second Party) ---
    // Switch to New Order (KOT)
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'New Order' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'New Order' })).toBeVisible();

    // 3. Re-seat Table 18 immediately while previous bill is still unsettled
    await tableInput.fill('18');
    await tableInput.press('Enter');
    // Table input must stay '18' without automatic 'A' suffix!
    await expect(tableInput).toHaveValue('18');

    await page.locator('#cust-name-input').waitFor({ state: 'visible', timeout: 5000 });
    // Verify customer input is completely clean and empty (no old customer data prefilled!)
    await expect(page.locator('#cust-name-input')).toHaveValue('');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Enter Dish code '2', qty '1'
    await codeInput.fill('2');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    await qtyInput.press('Enter'); // Commits item

    // Verify ZERO item bleed: only 1 item in the table order grid (Dish 2, no Dish 1 from Session 1!)
    const activeItemsInGrid = await page.locator('.order-table tbody tr').count();
    expect(activeItemsInGrid).toBe(1);
    await expect(page.locator('text=[NEW]').first()).toBeVisible();

    // Fire KOT via button
    await fireKotBtn.click();
    await page.waitForTimeout(300);

    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // 4. Bill Table 18 second time via Cash Memo (Bill #2)
    await page.locator('.win-menu-item', { hasText: 'Transaction' }).click();
    await page.locator('.win-dropdown-row', { hasText: 'Billing (Cash Memo)' }).click();
    await expect(page.locator('.win-titlebar-title', { hasText: 'Cash Memo' })).toBeVisible();

    await tableInput.click();
    await tableInput.fill('18');
    await expect(tableInput).toHaveValue('18');
    await tableInput.press('Enter'); // 1st Enter: preview Table 18 items
    await page.waitForTimeout(300);
    await tableInput.press('Enter'); // 2nd Enter: opens PAX prompt
    await page.waitForTimeout(300);

    await expect(page.locator('text=Number of Persons')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    if (await closeMemoBtn.isVisible()) {
      await closeMemoBtn.click();
      await page.waitForTimeout(200);
    }

    // 5. CRUCIAL: Both Bill #1 and Bill #2 for Table 18 MUST coexist independently in Unsettled Bills!
    await expect(page.locator('span:has-text("18(")')).toHaveCount(base18Count + 2);

    // 6. Settle the first bill for Table 18
    await page.locator('span:has-text("18(")').last().click();
    await page.waitForTimeout(200);

    const cashSettleBtn = page.locator('.win-modal-backdrop button:has-text("Cash")').first();
    await cashSettleBtn.click();
    await page.waitForTimeout(300);

    const okBtn = page.locator('button:has-text("OK")');
    if (await okBtn.isVisible()) {
      await okBtn.click();
      await page.waitForTimeout(200);
    }

    // 7. CRUCIAL: Exactly 1 bill for Table 18 should remain in Unsettled Bills!
    await expect(page.locator('span:has-text("18(")')).toHaveCount(base18Count + 1);

    // Clean up remaining bill
    await page.locator('span:has-text("18(")').last().click();
    await page.waitForTimeout(200);
    const cashSettleBtn2 = page.locator('.win-modal-backdrop button:has-text("Cash")').first();
    if (await cashSettleBtn2.isVisible()) {
      await cashSettleBtn2.click();
      await page.waitForTimeout(300);
      const okBtn2 = page.locator('button:has-text("OK")');
      if (await okBtn2.isVisible()) {
        await okBtn2.click();
        await page.waitForTimeout(200);
      }
    }
    await expect(page.locator('span:has-text("18(")')).toHaveCount(base18Count);
  });

  test('15. Parcel Allocation Progression (0 -> 0A -> 0B) without skipping 0A', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await expect(tableInput).toBeVisible();

    // Wait for Supabase live sync and tables load to complete
    await expect(page.locator('text=SUPABASE: LIVE')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    // 1. First parcel order: Type 0, press Enter
    await tableInput.fill('0');
    await tableInput.press('Enter');

    // Customer modal appears: skip via Escape
    const custInput = page.locator('#cust-name-input');
    await custInput.waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const firstParcelTable = await tableInput.inputValue();

    // Add Dish code '1'
    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await qtyInput.press('Enter');

    // Fire KOT
    const fireKotBtn = page.locator('button:has-text("Fire KOT (↵↵)")');
    await fireKotBtn.click();
    await page.waitForTimeout(300);

    const closeKotBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // 2. Second parcel order: Type 0, press Enter
    await tableInput.fill('0');
    await tableInput.press('Enter');

    await custInput.waitFor({ state: 'visible', timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Verify next sequential suffix without skipping (e.g. 0 -> 0A, 0B -> 0C)
    const secondParcelTable = await tableInput.inputValue();
    const suffixes = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const s1 = firstParcelTable.replace(/^0/, '');
    const idx1 = suffixes.indexOf(s1);
    const expectedSecond = `0${suffixes[idx1 + 1]}`;
    expect(secondParcelTable).toBe(expectedSecond);
  });

  test('16. Home Delivery 00 Flow without Browser Prompt & Separate Name/Number Topbar Display', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await expect(tableInput).toBeVisible();

    // Ensure dialog event listener verifies NO native window.prompt is triggered
    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    // 1. Type '00' and press Enter
    await tableInput.click();
    await tableInput.fill('00');
    await expect(tableInput).toHaveValue('00');
    await tableInput.press('Enter');
    await page.waitForTimeout(200);

    // Verify native dialog was NEVER triggered
    expect(dialogTriggered).toBe(false);

    // Verify CustomerDetailsModal opened directly with title 'Customer Details - Home Delivery'
    const modalTitle = page.locator('.win-titlebar-title', { hasText: 'Home Delivery' });
    await expect(modalTitle).toBeVisible();

    // Fill customer name and phone
    const nameInput = page.locator('#cust-name-input');
    await expect(nameInput).toBeFocused();
    await nameInput.fill('ADIL');
    await nameInput.press('Enter');

    const phoneInput = page.locator('#cust-phone-input');
    await phoneInput.fill('9876543210');
    await phoneInput.press('Enter'); // Submits modal and focuses code input
    await page.waitForTimeout(200);

    // Verify Table input value is '00 - ADIL'
    await expect(tableInput).toHaveValue('00 - ADIL');

    // Verify subtable dropdown shows '-' (NOT 'ADIL'!)
    const subtableTrigger = page.locator('div[title*="Select Subtable"]');
    await expect(subtableTrigger).toContainText('-');

    // Verify dedicated topbar Customer Name box shows 'ADIL'
    const custNameBox = page.locator('#topbar-customer-name');
    await expect(custNameBox).toHaveText('ADIL');

    // Verify dedicated topbar Customer Number box shows '9876543210'
    const custPhoneBox = page.locator('#topbar-customer-phone');
    await expect(custPhoneBox).toHaveText('9876543210');

    // Add item and Fire KOT
    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('2');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await qtyInput.press('Enter');

    const fireKotBtn = page.locator('button:has-text("Fire KOT (↵↵)")');
    await fireKotBtn.click();
    await page.waitForTimeout(300);

    const closeKotBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // Verify '00 - ADIL' appears under HOME DELIVERY on the right sidebar
    const deliveryTag = page.locator('.win-window div[title="Click to view dishes for 00 - ADIL"]');
    await expect(deliveryTag).toBeVisible();

    // Click '00 - ADIL' in sidebar: customer name and number remain populated
    await deliveryTag.click();
    await page.waitForTimeout(100);
    await expect(custNameBox).toHaveText('ADIL');
    await expect(custPhoneBox).toHaveText('9876543210');
  });

});
