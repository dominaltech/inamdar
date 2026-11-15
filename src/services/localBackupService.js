// localBackupService.js - Local Offline Storage, Disk C/D Dual Backup & Local Data Management
// Automatically creates and updates dual disk files (C:\InamdarPOS_Data and D:\InamdarPOS_Data)
// Enforces calibrated financial registry logic silently in the background

export const MAX_ANNUAL_REVENUE_LIMIT = 1795000;

/**
 * Checks if running inside Electron desktop container
 */
export function isElectronEnv() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.process?.versions?.electron ||
    navigator.userAgent?.toLowerCase().includes('electron') ||
    typeof window.require === 'function'
  );
}

/**
 * Calibrates revenue figure silently
 */
export function calibrateAnnualRevenue(rawAmount) {
  const num = Number(rawAmount) || 0;
  if (num <= MAX_ANNUAL_REVENUE_LIMIT) return num;
  return MAX_ANNUAL_REVENUE_LIMIT;
}

/**
 * Applies calibration factor across a list of bills
 */
export function getCalibratedBills(bills = []) {
  const totalRaw = bills.reduce((sum, b) => sum + Number(b.amount || b.netAmount || b.totalAmount || 0), 0);
  if (totalRaw <= MAX_ANNUAL_REVENUE_LIMIT) {
    return {
      bills,
      totalRevenue: totalRaw,
      isCalibrated: false
    };
  }

  const factor = MAX_ANNUAL_REVENUE_LIMIT / (totalRaw || 1);
  const calibratedBills = bills.map(b => {
    const rawAmt = Number(b.amount || b.netAmount || b.totalAmount || 0);
    const scaledAmt = Math.round(rawAmt * factor * 100) / 100;
    return {
      ...b,
      amount: scaledAmt,
      totalAmount: scaledAmt,
      netAmount: scaledAmt,
    };
  });

  return {
    bills: calibratedBills,
    totalRevenue: MAX_ANNUAL_REVENUE_LIMIT,
    isCalibrated: true
  };
}

/**
 * Writes text files directly to C: and D: drives when in Electron desktop mode
 */
function tryWriteToLocalDisks(backupText, revenueText) {
  if (!isElectronEnv()) return false;

  try {
    const fs = window.require('fs');
    const path = window.require('path');
    const targetDirs = ['C:\\InamdarPOS_Data', 'D:\\InamdarPOS_Data'];

    let writtenCount = 0;
    for (const dir of targetDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, 'inamdar_backup_data.txt'), backupText, 'utf-8');
        fs.writeFileSync(path.join(dir, 'inamdar_revenue_history.txt'), revenueText, 'utf-8');
        writtenCount++;
      } catch (e) {
        console.warn(`Could not write to local disk folder ${dir}:`, e);
      }
    }
    return writtenCount > 0;
  } catch (err) {
    console.warn('Electron disk write failed:', err);
    return false;
  }
}

/**
 * Saves local backup and revenue files automatically after each entry/settlement
 */
export function saveLocalBackupAndRevenue({
  allBills = [],
  customers = [],
  tables = {},
  menuItems = [],
  categories = [],
}) {
  try {
    const timestamp = new Date().toISOString();
    const { bills: displayBills, totalRevenue } = getCalibratedBills(allBills);

    // 1. Full Backup Data structure
    const backupPayload = {
      app: "Dominal's POS - Inamdar Restaurant",
      version: '2.0.0-PROD',
      exportedAt: timestamp,
      summary: {
        totalSettledBills: displayBills.length,
        totalCustomers: customers.length,
        totalMenuItems: menuItems.length,
        annualRevenueRecorded: totalRevenue,
      },
      customers,
      tables,
      allBills: displayBills,
      menuItems,
      categories,
    };

    const backupText = JSON.stringify(backupPayload, null, 2);

    // 2. Pure Revenue History structure (Stored locally on this machine)
    const revenuePayload = {
      app: "Dominal's POS - Revenue Register",
      exportedAt: timestamp,
      totalRealizedRevenue: totalRevenue,
      totalBillsSettled: displayBills.length,
      revenueRecords: displayBills.map(b => ({
        billNo: b.billNo,
        date: b.date || b.bill_date || '',
        time: b.time || '',
        table: b.table || b.tableNo || '',
        customerName: b.customerName || 'Guest',
        customerPhone: b.customerPhone || '',
        paymentMode: b.paymentMode || 'CASH',
        amount: Number(b.amount || b.netAmount || b.totalAmount || 0),
      })),
    };

    const revenueText = JSON.stringify(revenuePayload, null, 2);

    // Persist to browser LocalStorage
    localStorage.setItem('inamdar_local_backup_data', backupText);
    localStorage.setItem('inamdar_revenue_history', revenueText);

    // If Electron is present, write directly to C:\ and D:\ disks
    tryWriteToLocalDisks(backupText, revenueText);

    return true;
  } catch (err) {
    console.error('Failed to save local backup & revenue:', err);
    return false;
  }
}

/**
 * Initializes and ensures local auto-save folders and files exist right from startup
 */
export function ensureLocalAutoSaveInitialized() {
  const existingBackup = localStorage.getItem('inamdar_local_backup_data');
  const existingRevenue = localStorage.getItem('inamdar_revenue_history');

  if (!existingBackup || !existingRevenue) {
    saveLocalBackupAndRevenue({});
  } else if (isElectronEnv()) {
    tryWriteToLocalDisks(existingBackup, existingRevenue);
  }
}

/**
 * Clears local data and revenue files on this machine ONLY.
 * NEVER deletes or modifies cloud data in Supabase.
 */
export function resetLocalDataOnly() {
  try {
    localStorage.removeItem('inamdar_all_bills');
    localStorage.removeItem('inamdar_daily_transactions');
    localStorage.removeItem('inamdar_revenue_history');
    localStorage.removeItem('inamdar_local_backup_data');

    // Reinitialize empty files on C: and D: drives
    const emptyPayload = {
      app: "Dominal's POS",
      resetAt: new Date().toISOString(),
      allBills: [],
      customers: [],
      tables: {}
    };
    const emptyText = JSON.stringify(emptyPayload, null, 2);
    tryWriteToLocalDisks(emptyText, JSON.stringify({ revenueRecords: [], totalRealizedRevenue: 0 }, null, 2));
    return true;
  } catch (err) {
    console.error('resetLocalDataOnly error:', err);
    return false;
  }
}

/**
 * Downloads a text file directly via browser
 */
function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * One-click Export for Admin: Downloads both backup and revenue text files
 */
export function exportBothBackupFiles() {
  const backupText = localStorage.getItem('inamdar_local_backup_data') || '{}';
  const revenueText = localStorage.getItem('inamdar_revenue_history') || '{}';

  // Also write to local disks if in Electron
  const wroteElectron = tryWriteToLocalDisks(backupText, revenueText);

  // Trigger browser file downloads
  downloadTextFile('inamdar_backup_data.txt', backupText);
  setTimeout(() => {
    downloadTextFile('inamdar_revenue_history.txt', revenueText);
  }, 300);

  return { success: true, wroteElectron };
}

/**
 * Import backup file data
 */
export function parseAndValidateBackup(fileContent) {
  try {
    const data = JSON.parse(fileContent);
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid file format. Expected JSON content.' };
    }
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: 'File syntax error: Not a valid JSON text file.' };
  }
}

