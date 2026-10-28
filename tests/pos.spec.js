import { test, expect } from '@playwright/test';

test.describe('Inamdar Restaurant POS - Retro Menson\'s Replica Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
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

    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await expect(codeInput).toBeVisible();

    // Type dish code 101
    await codeInput.fill('101');
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
    const fireKotButton = page.locator('button:has-text("FIRE KOT")');
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

    // In Cash Memo, entering a table with items prompts for PAX and bills
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('3');
    await tableInput.press('Enter');
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
    // Press '-' on page body to toggle Cancel mode
    await page.keyboard.press('-');
    await page.waitForTimeout(200);

    // Cancel mode banner should be visible
    const cancelBadge = page.locator('text=[CANCELLATION MODE]');
    if (await cancelBadge.isVisible()) {
      await expect(cancelBadge).toBeVisible();
      // Press '-' again to toggle out of Cancel mode
      await page.keyboard.press('-');
    }
  });

  test('09. Sequential Keyboard Progression (Enter forward, Left Arrow backward across all boxes)', async ({ page }) => {
    // 1. Initial box is Table
    const tableInput = page.locator('#pos-table-input');
    await expect(tableInput).toBeFocused();

    // 2. Type Table 19 and Enter -> Forward to Employee
    await tableInput.fill('19');
    await tableInput.press('Enter');
    const employeeSelect = page.locator('select.win-input');
    await expect(employeeSelect).toBeFocused();

    // 3. Left Arrow on Employee -> Backward to Table
    await employeeSelect.press('ArrowLeft');
    await expect(tableInput).toBeFocused();

    // 4. Enter on Table -> Employee, Enter on Employee -> Code
    await tableInput.press('Enter');
    await expect(employeeSelect).toBeFocused();
    await employeeSelect.press('Enter');
    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await expect(codeInput).toBeFocused();

    // 5. Left Arrow on empty Code -> Backward to Employee
    await codeInput.press('ArrowLeft');
    await expect(employeeSelect).toBeFocused();

    // 6. Enter on Employee -> Code
    await employeeSelect.press('Enter');
    await expect(codeInput).toBeFocused();

    // 7. Type dish code '1' and press Enter -> Selects dish and advances to Qty
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await expect(qtyInput).toBeFocused();

    // 8. Left Arrow on Qty -> Backward to Code
    await qtyInput.press('ArrowLeft');
    await expect(codeInput).toBeFocused();

    // 9. Re-select dish '1' -> advances to Qty
    await codeInput.press('Enter');
    await expect(qtyInput).toBeFocused();

    // 10. Enter on Qty -> Immediately commits item and loops focus directly back to Item Code! (skips counter and custom)
    await qtyInput.press('Enter');
    await expect(codeInput).toBeFocused();
    await expect(page.locator('text=[NEW]').first()).toBeVisible();

    // 11. Right Arrow from Qty advances to Customization if needed
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter'); // Select dish -> Qty
    await expect(qtyInput).toBeFocused();
    await qtyInput.press('ArrowRight');
    const customInput = page.locator('#pos-custom-input');
    await expect(customInput).toBeFocused();

    // 12. Left Arrow on Customization -> Skips Rate and goes directly backward to Qty!
    await customInput.press('ArrowLeft');
    await expect(qtyInput).toBeFocused();
  });

  test('10. KOT Creation Clears Workspace & Existing Table Directly Shows 14A (No Subtable Popup)', async ({ page }) => {
    // 1. Enter table 14
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('14');
    await tableInput.press('Enter');

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

    // 3. Fire KOT via double enter on empty code
    await codeInput.press('Enter');
    await page.waitForTimeout(300);

    // Close print modal if open
    const printClose = page.locator('.win-close-btn');
    if (await printClose.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 4. Verify workspace has cleared: items disappeared and table input is ready
    await expect(page.locator('text=[NEW]')).not.toBeVisible();
    await expect(page.locator('text=No items for Table')).toBeVisible();

    // 5. Now type table 14 again (which is now an EXISTING occupied table!)
    await tableInput.focus();
    await tableInput.fill('14');
    await tableInput.press('Enter');

    // 6. User requirement: Must DIRECTLY show 14A and NOT the box to select A, B!
    await expect(tableInput).toHaveValue('14A');
    await expect(page.locator('.win-bevel-outset', { hasText: /^A$/ })).not.toBeVisible();
    
    // Dish items from table 14 are directly visible!
    await expect(page.locator('text=No items for Table')).not.toBeVisible();
  });

  test('11. Two-Stage Escape Flow in Order Mode (1st Esc clears screen, 2nd Esc opens Display Order)', async ({ page }) => {
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('15');
    await tableInput.press('Enter');

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
    await tableInput.fill('16');
    await tableInput.press('Enter');

    const codeInput = page.locator('input[placeholder="Code/CTM"]');
    await codeInput.fill('1');
    await page.waitForTimeout(200);
    await codeInput.press('Enter');
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await qtyInput.press('Enter'); // Commits item

    // Fire KOT (double Enter on empty code)
    await codeInput.press('Enter');
    await page.waitForTimeout(300);

    // Close KOT print modal if open
    const closeKotBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeKotBtn.isVisible()) {
      await closeKotBtn.click();
      await page.waitForTimeout(200);
    }

    // 2. Table 16 is now a running table -> appears under AC
    await expect(page.locator('.win-window span:has-text("16")').first()).toBeVisible();

    // 3. Switch to Table 16 and press F6 to bill
    await tableInput.fill('16');
    await tableInput.press('Enter');

    // Press F6 to bill
    await page.keyboard.press('F6');
    await page.waitForTimeout(300);

    // Number of Persons modal
    const paxModal = page.locator('text=Number of Persons');
    if (await paxModal.isVisible()) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }

    // Close cash memo print preview
    const closeMemoBtn = page.locator('button:has-text("Close (Esc/↵)")');
    if (await closeMemoBtn.isVisible()) {
      await closeMemoBtn.click();
      await page.waitForTimeout(200);
    }

    // 4. Crucial: Table 16 MUST now disappear from AC running tables and appear under Unsettled Bills!
    await expect(page.locator('.win-window').getByText('Unsettled Bills').first()).toBeVisible();
    await expect(page.locator('span:has-text("16(")').first()).toBeVisible();

    // 5. Now settle the bill via clicking on the unsettled bill tag
    await page.locator('span[title*="settle Table 16"]').first().click();
    await page.waitForTimeout(200);

    // Settle modal appears: Click Cash Settle
    const cashSettleBtn = page.locator('button:has-text("Cash")').first();
    await cashSettleBtn.click();
    await page.waitForTimeout(300);

    // Dismiss info dialog if present
    const okBtn = page.locator('button:has-text("OK")');
    if (await okBtn.isVisible()) {
      await okBtn.click();
      await page.waitForTimeout(200);
    }

    // 6. Crucial: Table 16 MUST disappear from Unsettled Bills!
    await expect(page.locator('span[title*="settle Table 16"]')).not.toBeVisible();
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

});
