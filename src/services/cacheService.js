// Inamdar POS & ERP - Production Local Caching & Delta Sync Engine
// Designed for High-Throughput Desktop POS (Web & Electron Ready)
// Instant 0ms boot from local cache + fine-grained delta updates without full DB re-fetches.

import { INITIAL_TABLES, INITIAL_UNSETTLED_BILLS, INITIAL_ALL_BILLS } from '../data/initialData';

const CACHE_VERSION_KEY = 'inamdar_cache_version';
const CURRENT_VERSION = 'inamdar_v5_clean_scratch';

const KEYS = {
  TABLES: 'inamdar_tables',
  UNSETTLED_BILLS: 'inamdar_unsettled_bills',
  ALL_BILLS: 'inamdar_all_bills',
  DAILY_TX: 'inamdar_daily_transactions',
  PAST_BILLS: 'inamdar_past_bills',
  AUDIT_LOGS: 'inamdar_audit_logs',
  ROOM_POSTS: 'inamdar_room_posts',
  CREDIT_ACCOUNTS: 'inamdar_credit_accounts',
  KOT_COUNTER: 'inamdar_kot_counter',
  BILL_COUNTER: 'inamdar_bill_counter',
  MENU: 'inamdar_cached_menu',
};

// Check if running in Electron environment
export const isElectron = () => {
  return typeof window !== 'undefined' && Boolean(window.process?.type || window.electronAPI);
};

// Generic storage abstraction: Uses window.electronAPI if in Electron, or localStorage in Web
const saveToStorage = (key, value) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);

    // If future Electron IPC bridge is available, mirror to local PC file system
    if (isElectron() && window.electronAPI?.saveToLocalDisk) {
      window.electronAPI.saveToLocalDisk(key, serialized).catch(err => {
        console.warn('Electron disk write notice:', err);
      });
    }
  } catch (err) {
    console.warn(`Local cache write warning for ${key}:`, err);
  }
};

const getFromStorage = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// 1. One-time Version Migration & Scratch Reset
// Guarantees all tables, bills, and logs start 100% clean from scratch
export function enforceScratchResetIfNeeded() {
  if (typeof window === 'undefined') return;

  const installedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  if (installedVersion !== CURRENT_VERSION) {
    console.log(`[CacheService] Resetting to clean scratch state: ${CURRENT_VERSION}`);
    localStorage.removeItem(KEYS.TABLES);
    localStorage.removeItem(KEYS.UNSETTLED_BILLS);
    localStorage.removeItem(KEYS.ALL_BILLS);
    localStorage.removeItem(KEYS.DAILY_TX);
    localStorage.removeItem(KEYS.PAST_BILLS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.ROOM_POSTS);
    localStorage.removeItem(KEYS.CREDIT_ACCOUNTS);
    localStorage.setItem(KEYS.KOT_COUNTER, '1');
    localStorage.setItem(KEYS.BILL_COUNTER, '1');
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
  }
}

// 2. Hydration getters (Instant 0ms boot)
export function getCachedTables() {
  enforceScratchResetIfNeeded();
  const tables = getFromStorage(KEYS.TABLES, null);
  return tables || INITIAL_TABLES;
}

export function saveCachedTables(tables) {
  saveToStorage(KEYS.TABLES, tables);
}

export function getCachedUnsettledBills() {
  enforceScratchResetIfNeeded();
  const bills = getFromStorage(KEYS.UNSETTLED_BILLS, null);
  return Array.isArray(bills) ? bills : INITIAL_UNSETTLED_BILLS;
}

export function saveCachedUnsettledBills(bills) {
  saveToStorage(KEYS.UNSETTLED_BILLS, bills);
}

export function getCachedAllBills() {
  enforceScratchResetIfNeeded();
  const bills = getFromStorage(KEYS.ALL_BILLS, null);
  return Array.isArray(bills) ? bills : INITIAL_ALL_BILLS;
}

export function saveCachedAllBills(bills) {
  saveToStorage(KEYS.ALL_BILLS, bills);
}

export function getCachedDailyTransactions() {
  enforceScratchResetIfNeeded();
  const tx = getFromStorage(KEYS.DAILY_TX, null);
  return Array.isArray(tx) ? tx : [];
}

export function saveCachedDailyTransactions(tx) {
  saveToStorage(KEYS.DAILY_TX, tx);
}

export function getCachedPastBills() {
  enforceScratchResetIfNeeded();
  const pb = getFromStorage(KEYS.PAST_BILLS, null);
  return Array.isArray(pb) ? pb : [];
}

export function saveCachedPastBills(pb) {
  saveToStorage(KEYS.PAST_BILLS, pb);
}

export function getCachedCounters() {
  enforceScratchResetIfNeeded();
  const kot = Number(localStorage.getItem(KEYS.KOT_COUNTER)) || 1;
  const bill = Number(localStorage.getItem(KEYS.BILL_COUNTER)) || 1;
  return { kotCounter: kot, billCounter: bill };
}

export function saveCachedCounters(kotCounter, billCounter) {
  if (kotCounter !== undefined) localStorage.setItem(KEYS.KOT_COUNTER, String(kotCounter));
  if (billCounter !== undefined) localStorage.setItem(KEYS.BILL_COUNTER, String(billCounter));
}

// 3. Fine-Grained Delta Updates (Production Realtime Sync)
// Instead of re-fetching the entire database on every Captain or KDS action,
// these handlers update only the affected table, bill, or line item locally.

// Apply a single table update delta
export function applySingleTableDelta(prevTables, updatedTable) {
  if (!updatedTable || !updatedTable.id) return prevTables;

  const tableId = String(updatedTable.id);
  const existing = prevTables[tableId] || {
    id: tableId,
    section: updatedTable.section || 'AC',
    waiter: updatedTable.active_waiter || '1 COUNTER',
    status: 'AVAILABLE',
    pax: updatedTable.pax || 2,
    kotNos: [],
    items: [],
  };

  const nextTable = {
    ...existing,
    section: updatedTable.section || existing.section,
    waiter: updatedTable.active_waiter || existing.waiter,
    status: updatedTable.status || existing.status,
    pax: updatedTable.pax || existing.pax,
    kotNos: updatedTable.kot_nos || existing.kotNos,
    // If status became AVAILABLE, clear items
    items: updatedTable.status === 'AVAILABLE' ? [] : existing.items,
  };

  const nextTables = {
    ...prevTables,
    [tableId]: nextTable,
  };

  saveCachedTables(nextTables);
  return nextTables;
}

// Merge an incoming KOT delta from Captain PWA without re-fetching all tables
export function applyIncomingKotDelta(prevTables, kotHeader, kotItems = []) {
  if (!kotHeader || !kotHeader.table_id) return prevTables;

  const tableId = String(kotHeader.table_id);
  const existing = prevTables[tableId] || {
    id: tableId,
    section: kotHeader.section || 'AC',
    waiter: kotHeader.waiter_name || '1 COUNTER',
    status: 'AVAILABLE',
    pax: 2,
    kotNos: [],
    items: [],
  };

  const updatedKotNos = Array.from(new Set([...(existing.kotNos || []), Number(kotHeader.kot_number)]));

  // Format incoming items
  const formattedItems = (kotItems || []).map(it => ({
    id: it.id,
    code: String(it.item_code || it.code),
    name: it.item_name || it.name,
    qty: Number(it.qty),
    rate: Number(it.rate),
    amount: Number(it.amount),
    category: it.category || 'UNCATEGORIZED',
    categoryOrder: it.category_order ?? it.categoryOrder ?? 99,
    customization: it.customization || '',
    isStaged: false,
    isCancelled: Boolean(it.is_cancelled),
    kotNo: kotHeader.kot_number,
    status: it.status || 'PENDING',
  }));

  const updatedItems = [...(existing.items || []), ...formattedItems];

  const nextTables = {
    ...prevTables,
    [tableId]: {
      ...existing,
      status: 'OCCUPIED',
      waiter: kotHeader.waiter_name || existing.waiter,
      kotNos: updatedKotNos,
      items: updatedItems,
    },
  };

  saveCachedTables(nextTables);
  return nextTables;
}

// Apply a single bill delta (unsettled or settled)
export function applySingleBillDelta(prevUnsettled, prevAllBills, billRow) {
  if (!billRow || !billRow.bill_no) return { unsettledBills: prevUnsettled, allBills: prevAllBills };

  const billNoStr = String(billRow.bill_no);
  const isSettled = billRow.status === 'SETTLED' || billRow.is_settled;

  // 1. Update unsettled list
  let nextUnsettled;
  if (isSettled) {
    nextUnsettled = (prevUnsettled || []).filter(b => String(b.billNo) !== billNoStr);
  } else {
    const existingIdx = (prevUnsettled || []).findIndex(b => String(b.billNo) === billNoStr);
    const formatted = {
      table: billRow.table_id,
      billNo: billNoStr,
      amount: Number(billRow.total_amount),
      id: billRow.id,
      time: billRow.bill_time,
    };
    if (existingIdx >= 0) {
      nextUnsettled = [...prevUnsettled];
      nextUnsettled[existingIdx] = formatted;
    } else {
      nextUnsettled = [formatted, ...(prevUnsettled || [])];
    }
  }

  // 2. Update all bills list
  let nextAllBills = [...(prevAllBills || [])];
  const allIdx = nextAllBills.findIndex(b => String(b.billNo) === billNoStr);
  const fullBillObj = {
    billNo: Number(billRow.bill_no),
    date: billRow.bill_date || new Date().toISOString().split('T')[0],
    time: billRow.bill_time || 'Just now',
    tableNo: billRow.table_id,
    section: billRow.section,
    employeeNo: billRow.employee_no || '1',
    pax: billRow.pax || 2,
    totalAmount: Number(billRow.total_amount),
    isSettled: isSettled,
    paymentMode: billRow.payment_mode || null,
    items: billRow.items || [],
  };

  if (allIdx >= 0) {
    nextAllBills[allIdx] = { ...nextAllBills[allIdx], ...fullBillObj };
  } else {
    nextAllBills = [fullBillObj, ...nextAllBills];
  }

  saveCachedUnsettledBills(nextUnsettled);
  saveCachedAllBills(nextAllBills);

  return { unsettledBills: nextUnsettled, allBills: nextAllBills };
}

// Log audit event to local cache
export function appendLocalAuditLog(event) {
  try {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    const logs = raw ? JSON.parse(raw) : [];
    logs.push({
      ...event,
      timestamp: event.timestamp || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });
    // Keep last 200 logs
    if (logs.length > 200) logs.shift();
    saveToStorage(KEYS.AUDIT_LOGS, logs);
  } catch (err) {
    console.warn('appendLocalAuditLog error:', err);
  }
}
