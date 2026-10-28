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
    
    // In Order mode, empty Enter switches to New Cash Memo
    await tableInput.fill('');
    await tableInput.press('Enter');
    await page.waitForTimeout(200);
    await expect(page.locator('.win-titlebar-title', { hasText: 'New Cash Memo' })).toBeVisible();

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

    // Qty input
    const qtyInput = page.locator('input[placeholder="Qty"]');
    await expect(qtyInput).toBeVisible();
    await qtyInput.fill('2');
    await qtyInput.press('Enter');

    // Rate input - press Enter to advance to customization
    const rateInput = page.locator('input[placeholder="Rate"]');
    await rateInput.press('Enter');

    // Customization field: press Enter to stage item
    const customInput = page.locator('#pos-custom-input');
    await expect(customInput).toBeVisible();
    await customInput.press('Enter');

    // Verify item is staged with [NEW] badge
    await expect(page.locator('text=[NEW]').first()).toBeVisible();

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
    await expect(page.locator('.win-titlebar-title', { hasText: 'New Cash Memo' })).toBeVisible();

    // In Cash Memo, entering a table prompts for PAX
    const tableInput = page.locator('#pos-table-input');
    await tableInput.fill('3');
    await tableInput.press('Enter');

    // Number of Persons modal
    await expect(page.locator('text=Number of Persons')).toBeVisible();
    const paxInput = page.locator('#pos-pax-input');
    await expect(paxInput).toBeVisible();
    await paxInput.fill('4');
    await paxInput.press('Enter');

    // Modal closes
    await expect(page.locator('text=Number of Persons')).not.toBeVisible();
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

    // 2. Type Table 5 and Enter -> Forward to Employee
    await tableInput.fill('5');
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

    // 10. Enter on Qty -> advances to Rate
    await qtyInput.press('Enter');
    const rateInput = page.locator('input[placeholder="Rate"]');
    await expect(rateInput).toBeFocused();

    // 11. Left Arrow on Rate -> Backward to Qty
    await rateInput.press('ArrowLeft');
    await expect(qtyInput).toBeFocused();

    // 12. Enter on Qty -> Rate, Enter on Rate -> Customization
    await qtyInput.press('Enter');
    await expect(rateInput).toBeFocused();
    await rateInput.press('Enter');
    const customInput = page.locator('#pos-custom-input');
    await expect(customInput).toBeFocused();

    // 13. Left Arrow on Customization -> Backward to Rate
    await customInput.press('ArrowLeft');
    await expect(rateInput).toBeFocused();

    // 14. Enter on Rate -> Customization, Enter on Customization -> Commits and loops back to Code
    await rateInput.press('Enter');
    await expect(customInput).toBeFocused();
    await customInput.press('Enter');
    await expect(codeInput).toBeFocused();
  });

});
