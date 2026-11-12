import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_USERS, EMPLOYEES, INITIAL_TABLES, INITIAL_UNSETTLED_BILLS, INITIAL_ALL_BILLS } from '../data/initialData';
import { 
  MENU_BY_CODE, 
  MENU_ITEMS,
  LIVE_CATEGORIES,
  DYNAMIC_CATEGORY_ORDER,
  updateDynamicCategories,
  sortItemsByCourse, 
  getItemStation,
  isKitchenItem, 
  loadDynamicMenuItems 
} from '../data/menuService';
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY, saveSupabaseCredentials } from '../supabaseClient';
import {
  fetchLiveTables,
  fetchLiveUnsettledBills,
  fetchLiveDailyTransactions,
  fetchLiveCounters,
  fetchLiveMenuItems,
  fetchLiveCategories,
  saveCategoryInSupabase,
  updateCategoriesOrderInSupabase,
  renameCategoryInSupabase,
  deleteCategoryInSupabase,
  saveMenuItemInSupabase,
  deleteMenuItemInSupabase,
  fetchLiveAllBills,
  fetchOrderItemsForTable,
  fetchOrderItemsForKot,
  fireKotInSupabase,
  saveBillInSupabase,
  settleBillInSupabase,
  cancelItemInSupabase,
  transferTableInSupabase,
  closeDayInSupabase,
  subscribeToSupabaseRealtime,
  upsertTableInSupabase,
  deleteTableInSupabase,
  batchReassignTableSectionInSupabase,
} from '../services/supabaseService';
import {
  getCachedTables,
  saveCachedTables,
  getCachedUnsettledBills,
  saveCachedUnsettledBills,
  getCachedAllBills,
  saveCachedAllBills,
  getCachedDailyTransactions,
  saveCachedDailyTransactions,
  getCachedPastBills,
  saveCachedPastBills,
  getCachedCounters,
  saveCachedCounters,
  applySingleTableDelta,
  applyIncomingKotDelta,
  applySingleBillDelta,
  appendLocalAuditLog,
} from '../services/cacheService';

const PosContext = createContext(null);

export function PosProvider({ children }) {
  // Current user / role
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[1]); // Default to Manager for full visibility
  
  // Active screen mode: 'ORDER' (New Order / KOT) vs 'CASH_MEMO' (New Cash Memo / Settle) vs 'REPORTS'
  const [screenMode, setScreenMode] = useState('ORDER');

  // Cancel order mode (active when '-' is pressed)
  const [isCancelMode, setIsCancelMode] = useState(false);

  // Active table (Starts at Table 1)
  const [activeTableId, setActiveTableId] = useState('1');
  const [activeSubTable, setActiveSubTable] = useState('');
  const [activeEmployee, setActiveEmployee] = useState(EMPLOYEES[0].name);

  // Cloud status
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());

  // Local caching hydration (0ms boot)
  const [tables, setTables] = useState(getCachedTables);
  const [unsettledBills, setUnsettledBills] = useState(getCachedUnsettledBills);
  const [dailyTransactions, setDailyTransactions] = useState(getCachedDailyTransactions);
  const [pastBills, setPastBills] = useState(getCachedPastBills);
  const [allBills, setAllBills] = useState(getCachedAllBills);

  const initialCounters = getCachedCounters();
  const [kotCounter, setKotCounter] = useState(initialCounters.kotCounter);
  const [billCounter, setBillCounter] = useState(initialCounters.billCounter);

  // Settlement Menu & Batch Settle states (F12)
  const [showSettlementMenu, setShowSettlementMenu] = useState(false);
  const [batchSettleMode, setBatchSettleMode] = useState(null);

  // Pax count popup prompt for Cash Memo
  const [paxPrompt, setPaxPrompt] = useState(null);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showCancelAuthModal, setShowCancelAuthModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTableId, setSettleTableId] = useState('1');
  const [settleBillData, setSettleBillData] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalTableId, setCancelModalTableId] = useState('');
  const [pendingCancelDetails, setPendingCancelDetails] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [infoDialog, setInfoDialog] = useState(null);

  // Menu and Categories Live State (Supabase direct sync)
  const [categories, setCategories] = useState(LIVE_CATEGORIES);
  const [menuItems, setMenuItems] = useState(MENU_ITEMS);

  const openCancelModal = (tableId) => {
    setCancelModalTableId(tableId || activeTableId);
    setShowCancelModal(true);
  };

  // Trigger keyboard focus to table input box whenever actions complete or modals close
  const triggerTableFocus = useCallback(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new Event('inamdar-focus-table'));
      }, 50);
    }
  }, []);

  // Top Menu Modal Controller (Zero Dummy Elements!)
  const [activeModal, setActiveModal] = useState(null);
  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => {
    setActiveModal(null);
    triggerTableFocus();
  };

  // Refresh menu & categories from Supabase
  const refreshMenuAndCategories = useCallback(async () => {
    try {
      const [liveCats, liveMenu] = await Promise.all([
        fetchLiveCategories(),
        fetchLiveMenuItems(),
      ]);
      if (liveCats && Array.isArray(liveCats) && liveCats.length > 0) {
        setCategories(liveCats);
        updateDynamicCategories(liveCats);
      }
      if (liveMenu && Array.isArray(liveMenu) && liveMenu.length > 0) {
        loadDynamicMenuItems(liveMenu);
        setMenuItems(liveMenu);
      }
      return { categories: liveCats, menuItems: liveMenu };
    } catch (e) {
      console.warn('refreshMenuAndCategories error:', e);
      return null;
    }
  }, []);

  // Category CRUD Operations
  const addOrUpdateCategory = useCallback(async (catData) => {
    const cleanName = (catData.name || '').toUpperCase().trim();
    if (!cleanName) return null;
    const catOrder = Number(catData.categoryOrder) || 99;
    const dept = catData.department || 'KITCHEN';

    setCategories(prev => {
      const existingIdx = prev.findIndex(c => c.name === cleanName);
      let next;
      if (existingIdx >= 0) {
        next = prev.map((c, i) => i === existingIdx ? { ...c, ...catData, name: cleanName, categoryOrder: catOrder, department: dept } : c);
      } else {
        const nextOrder = catOrder !== 99 ? catOrder : (prev.length > 0 ? Math.max(...prev.map(c => c.categoryOrder || 0)) + 1 : 1);
        next = [...prev, { name: cleanName, categoryOrder: nextOrder, department: dept, isActive: true }];
      }
      next.sort((a, b) => a.categoryOrder - b.categoryOrder);
      updateDynamicCategories(next);
      return next;
    });

    return await saveCategoryInSupabase({ name: cleanName, categoryOrder: catOrder, department: dept });
  }, []);

  const reorderCategories = useCallback(async (newCategoriesList) => {
    // 0ms Optimistic UI update
    const updated = newCategoriesList.map((cat, idx) => ({
      ...cat,
      categoryOrder: idx + 1,
    }));
    setCategories(updated);
    updateDynamicCategories(updated);
    setMenuItems([...MENU_ITEMS]);

    // Persist batch reorder to Supabase
    await updateCategoriesOrderInSupabase(updated);
  }, []);

  const renameCategory = useCallback(async (oldName, newName) => {
    const cleanOld = oldName.toUpperCase().trim();
    const cleanNew = newName.toUpperCase().trim();
    if (!cleanOld || !cleanNew) return;

    setCategories(prev => {
      const next = prev.map(c => c.name === cleanOld ? { ...c, name: cleanNew } : c);
      updateDynamicCategories(next);
      return next;
    });

    setMenuItems(prev => {
      const next = prev.map(it => it.category === cleanOld ? { ...it, category: cleanNew } : it);
      loadDynamicMenuItems(next);
      return next;
    });

    await renameCategoryInSupabase(cleanOld, cleanNew);
  }, []);

  const deleteCategory = useCallback(async (categoryName) => {
    const cleanName = categoryName.toUpperCase().trim();
    setCategories(prev => {
      const next = prev.filter(c => c.name !== cleanName);
      updateDynamicCategories(next);
      return next;
    });
    await deleteCategoryInSupabase(cleanName);
  }, []);

  // Menu Item CRUD Operations
  const addOrUpdateMenuItem = useCallback(async (itemData) => {
    const cleanCode = String(itemData.code).trim();
    const cleanCat = (itemData.category || 'UNCATEGORIZED').toUpperCase().trim();
    const catOrder = Number(itemData.categoryOrder) || (DYNAMIC_CATEGORY_ORDER[cleanCat] || 99);

    const fullItem = {
      ...itemData,
      code: cleanCode,
      name: (itemData.name || '').toUpperCase().trim(),
      category: cleanCat,
      categoryOrder: catOrder,
      acRate: Number(itemData.acRate) || 0,
      hallRate: Number(itemData.hallRate) || Number(itemData.acRate) || 0,
      isKitchen: itemData.isKitchen !== false,
      isAvailable: itemData.isAvailable !== false,
    };

    setMenuItems(prev => {
      const existing = prev.some(it => String(it.code) === cleanCode);
      const next = existing ? prev.map(it => String(it.code) === cleanCode ? fullItem : it) : [...prev, fullItem];
      loadDynamicMenuItems(next);
      return next;
    });

    return await saveMenuItemInSupabase(fullItem);
  }, []);

  const deleteMenuItem = useCallback(async (code) => {
    const cleanCode = String(code).trim();
    setMenuItems(prev => {
      const next = prev.filter(it => String(it.code) !== cleanCode);
      loadDynamicMenuItems(next);
      return next;
    });
    return await deleteMenuItemInSupabase(cleanCode);
  }, []);

  // Table Management CRUD (Admin / Manager Studio)
  const addOrUpdateTable = useCallback(async (tableData) => {
    if (!tableData || !tableData.id) return false;
    const cleanId = String(tableData.id).trim().toUpperCase();
    const section = tableData.section || 'AC';
    const pax = Number(tableData.pax) || (section.includes('FAMILY') ? 4 : 2);
    const waiter = tableData.waiter || '1 COUNTER';

    setTables(prev => {
      const existing = prev[cleanId] || {};
      return {
        ...prev,
        [cleanId]: {
          ...existing,
          id: cleanId,
          section,
          pax,
          waiter,
          status: existing.status || 'AVAILABLE',
          kotNos: existing.kotNos || [],
          items: existing.items || [],
        }
      };
    });

    // Cloud sync
    await upsertTableInSupabase({ id: cleanId, section, pax, waiter });
    return true;
  }, []);

  const deleteTable = useCallback(async (tableId) => {
    if (!tableId) return false;
    const cleanId = String(tableId).trim().toUpperCase();
    const existing = tables[cleanId];
    if (existing && existing.items && existing.items.some(i => i.qty > 0)) {
      alert(`Cannot delete Table ${cleanId}: Table is currently OCCUPIED with active orders!`);
      return false;
    }

    setTables(prev => {
      const next = { ...prev };
      delete next[cleanId];
      return next;
    });

    await deleteTableInSupabase(cleanId);
    return true;
  }, [tables]);

  const reassignTableRange = useCallback(async (startNum, endNum, targetSection) => {
    const s = Number(startNum);
    const e = Number(endNum);
    if (isNaN(s) || isNaN(e) || !targetSection) return false;

    const min = Math.min(s, e);
    const max = Math.max(s, e);
    const affectedIds = [];

    setTables(prev => {
      const next = { ...prev };
      for (let i = min; i <= max; i++) {
        const id = String(i);
        if (next[id]) {
          next[id] = { ...next[id], section: targetSection };
          affectedIds.push(id);
        } else {
          next[id] = {
            id,
            section: targetSection,
            waiter: '1 COUNTER',
            status: 'AVAILABLE',
            pax: targetSection.includes('FAMILY') ? 4 : 2,
            kotNos: [],
            items: [],
          };
          affectedIds.push(id);
        }
      }
      return next;
    });

    if (affectedIds.length > 0) {
      await batchReassignTableSectionInSupabase(affectedIds, targetSection);
    }
    return true;
  }, []);

  const moveTableNumber = useCallback(async (oldId, newId, targetSection) => {
    const cleanOld = String(oldId).trim().toUpperCase();
    const cleanNew = String(newId).trim().toUpperCase();
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return false;

    const source = tables[cleanOld];
    if (!source) return false;
    const dest = tables[cleanNew];
    if (dest && dest.items && dest.items.some(i => i.qty > 0)) {
      alert(`Destination Table ${cleanNew} is currently occupied! Settle or clear it first.`);
      return false;
    }

    const sec = targetSection || source.section;

    setTables(prev => {
      const next = { ...prev };
      delete next[cleanOld];
      next[cleanNew] = {
        ...source,
        id: cleanNew,
        section: sec,
      };
      return next;
    });

    await deleteTableInSupabase(cleanOld);
    await upsertTableInSupabase({ ...source, id: cleanNew, section: sec });
    return true;
  }, [tables]);

  // 1. Initial Cloud Sync from Supabase & Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    async function loadCloudData() {
      try {
        const [cloudTables, cloudBills, cloudTx, cloudCounters, cloudMenu, cloudCats, cloudAllBills] = await Promise.all([
          fetchLiveTables(),
          fetchLiveUnsettledBills(),
          fetchLiveDailyTransactions(),
          fetchLiveCounters(),
          fetchLiveMenuItems(),
          fetchLiveCategories(),
          fetchLiveAllBills(),
        ]);

        if (!isMounted) return;

        if (cloudCats && Array.isArray(cloudCats) && cloudCats.length > 0) {
          setCategories(cloudCats);
          updateDynamicCategories(cloudCats);
        }
        if (cloudMenu && Array.isArray(cloudMenu) && cloudMenu.length > 0) {
          loadDynamicMenuItems(cloudMenu);
          setMenuItems(cloudMenu);
        }
        if (cloudTables && Object.keys(cloudTables).length > 0) {
          setTables(cloudTables);
          saveCachedTables(cloudTables);
        }
        if (cloudBills) {
          setUnsettledBills(cloudBills);
          saveCachedUnsettledBills(cloudBills);
        }
        if (cloudAllBills && Array.isArray(cloudAllBills) && cloudAllBills.length > 0) {
          setAllBills(cloudAllBills);
          saveCachedAllBills(cloudAllBills);
        }
        if (cloudTx) {
          setDailyTransactions(cloudTx);
          saveCachedDailyTransactions(cloudTx);
        }
        if (cloudCounters) {
          setKotCounter(cloudCounters.kotCounter);
          setBillCounter(cloudCounters.billCounter);
          saveCachedCounters(cloudCounters.kotCounter, cloudCounters.billCounter);
        }
        setIsCloudConnected(true);
      } catch (err) {
        console.warn('Initial cloud sync notice:', err);
      }
    }

    loadCloudData();

    // Fine-grained Realtime delta subscription: zero full DB re-fetches!
    const unsubscribe = subscribeToSupabaseRealtime({
      onIncomingKot: async (newKot) => {
        console.log('[Realtime Delta] Incoming KOT:', newKot);
        const kotItems = await fetchOrderItemsForKot(newKot.id);
        if (!isMounted) return;
        setTables(prev => applyIncomingKotDelta(prev, newKot, kotItems));
        setKotCounter(prev => Math.max(prev, Number(newKot.kot_number) + 1));
      },
      onMenuUpdate: async () => {
        const liveMenu = await fetchLiveMenuItems();
        if (liveMenu && isMounted) {
          loadDynamicMenuItems(liveMenu);
          setMenuItems(liveMenu);
        }
      },
      onCategoryUpdate: async () => {
        const liveCats = await fetchLiveCategories();
        if (liveCats && isMounted) {
          setCategories(liveCats);
          updateDynamicCategories(liveCats);
        }
        const liveMenu = await fetchLiveMenuItems();
        if (liveMenu && isMounted) {
          loadDynamicMenuItems(liveMenu);
          setMenuItems(liveMenu);
        }
      },
      onTableUpdate: async (payload) => {
        console.log('[Realtime Delta] Table updated:', payload);
        const updatedTable = payload.new;
        if (!updatedTable) return;

        if (updatedTable.status === 'AVAILABLE') {
          if (isMounted) setTables(prev => applySingleTableDelta(prev, updatedTable));
        } else {
          // Fetch order items for ONLY this single table
          const tblItems = await fetchOrderItemsForTable(updatedTable.id);
          if (!isMounted) return;
          setTables(prev => {
            const tableId = String(updatedTable.id);
            const next = {
              ...prev,
              [tableId]: {
                id: tableId,
                section: updatedTable.section === 'AC' ? 'GENERAL' : updatedTable.section,
                waiter: updatedTable.active_waiter || '1 COUNTER',
                status: updatedTable.status,
                pax: updatedTable.pax || 2,
                customerName: updatedTable.customer_name || '',
                customerPhone: updatedTable.customer_phone || '',
                kotNos: updatedTable.kot_nos || [],
                items: tblItems,
              }
            };
            saveCachedTables(next);
            return next;
          });
        }
      },
      onBillUpdate: (payload) => {
        console.log('[Realtime Delta] Bill updated:', payload);
        const billRow = payload.new;
        if (!billRow) return;

        setUnsettledBills(prevUnsettled => {
          setAllBills(prevAll => {
            const { unsettledBills: nextU, allBills: nextA } = applySingleBillDelta(prevUnsettled, prevAll, billRow);
            return nextA;
          });
          const { unsettledBills: nextU } = applySingleBillDelta(prevUnsettled, allBills, billRow);
          return nextU;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 2. Persist to local cache for instant offline resilience
  useEffect(() => {
    saveCachedTables(tables);
  }, [tables]);

  useEffect(() => {
    saveCachedUnsettledBills(unsettledBills);
  }, [unsettledBills]);

  useEffect(() => {
    saveCachedDailyTransactions(dailyTransactions);
  }, [dailyTransactions]);

  useEffect(() => {
    saveCachedPastBills(pastBills);
  }, [pastBills]);

  useEffect(() => {
    saveCachedAllBills(allBills);
  }, [allBills]);

  useEffect(() => {
    saveCachedCounters(kotCounter, billCounter);
  }, [kotCounter, billCounter]);

  // Helper: Find next available parcel table (0, 0A, 0B, 0C, 0D, ...)
  const getNextParcelTable = () => {
    const suffixes = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    for (const s of suffixes) {
      const key = `0${s}`;
      const t = tables[key];
      const hasActive = t && t.items && t.items.some(it => it.qty > 0 && !it.isCancelled);
      if (!hasActive) {
        return key;
      }
    }
    return `0${String.fromCharCode(65 + Math.floor(Math.random() * 20))}`;
  };

  // Active table data (Seamless base/subtable lookup)
  const currentTableData = (() => {
    if (!activeTableId) {
      return { id: '', section: 'AC', waiter: activeEmployee, status: 'AVAILABLE', items: [], kotNos: [] };
    }
    if (tables[activeTableId]) return tables[activeTableId];
    const baseNum = String(activeTableId).replace(/[A-Z]/g, '');
    if (baseNum && tables[baseNum]) return tables[baseNum];
    if (baseNum && tables[`${baseNum}A`]) return tables[`${baseNum}A`];
    return {
      id: activeTableId,
      section: parseInt(activeTableId) > 20 ? 'FAMILY AC' : (String(activeTableId).startsWith('00') ? 'HOME DELIVERY' : (String(activeTableId).startsWith('0') ? 'PARCEL' : 'AC')),
      waiter: activeEmployee,
      status: 'AVAILABLE',
      items: [],
      kotNos: [],
    };
  })();

  // Switch active table
  const switchTable = (tableId) => {
    let cleanId = String(tableId || '').trim().toUpperCase();
    if (!cleanId) {
      setActiveTableId('');
      return;
    }

    if (cleanId === '0') {
      cleanId = getNextParcelTable();
    } else if (cleanId === '00') {
      cleanId = '00 - GUEST';
    }

    setActiveTableId(cleanId);
    let sec = 'GENERAL';
    const num = parseInt(cleanId);
    if (cleanId.startsWith('00')) sec = 'HOME DELIVERY';
    else if (cleanId.startsWith('0')) sec = 'PARCEL';
    else if (!isNaN(num) && num > 20) sec = 'FAMILY AC';

    setTables(prev => {
      if (prev[cleanId]) return prev;
      return {
        ...prev,
        [cleanId]: {
          id: cleanId,
          section: sec,
          waiter: activeEmployee,
          status: 'AVAILABLE',
          items: [],
          kotNos: [],
        }
      };
    });
  };

  // Update customer name & phone for table
  const updateTableCustomer = (tableId, customerName, customerPhone) => {
    if (!tableId) return;
    setTables(prev => {
      const existing = prev[tableId] || {
        id: tableId,
        section: parseInt(tableId) > 20 ? 'FAMILY AC' : (String(tableId).startsWith('00') ? 'HOME DELIVERY' : (String(tableId).startsWith('0') ? 'PARCEL' : 'GENERAL')),
        waiter: activeEmployee,
        status: 'AVAILABLE',
        items: [],
        kotNos: [],
      };
      return {
        ...prev,
        [tableId]: {
          ...existing,
          customerName: customerName !== undefined ? customerName : (existing.customerName || ''),
          customerPhone: customerPhone !== undefined ? customerPhone : (existing.customerPhone || ''),
        }
      };
    });
  };

  // Add line item to active table (marked as isStaged: true until KOT is fired)
  const addItemToActiveTable = (item) => {
    setTables(prev => {
      const existing = prev[activeTableId] || {
        id: activeTableId,
        section: parseInt(activeTableId) > 20 ? 'FAMILY AC' : 'GENERAL',
        waiter: activeEmployee,
        status: 'OCCUPIED',
        items: [],
        kotNos: [],
      };

      const rate = getApplicableRate(existing.section, item);
      const qty = item.qty || 1;
      const amount = qty * rate;

      const newItem = {
        code: String(item.code),
        name: item.name,
        qty: qty,
        rate: rate,
        amount: amount,
        category: item.category || 'UNCATEGORIZED',
        categoryOrder: item.categoryOrder ?? 99,
        customization: item.customization || '',
        isStaged: true, // Pending / unfired item
        status: 'STAGED',
        createdAt: Date.now(),
      };

      return {
        ...prev,
        [activeTableId]: {
          ...existing,
          status: 'OCCUPIED',
          items: [...existing.items, newItem],
        }
      };
    });
  };

  // Remove an unstaged/staged item before KOT is fired
  const removeStagedItem = (index) => {
    setTables(prev => {
      const table = prev[activeTableId];
      if (!table) return prev;
      const newItems = table.items.filter((_, i) => i !== index);
      return {
        ...prev,
        [activeTableId]: {
          ...table,
          items: newItems,
          status: newItems.length === 0 ? 'AVAILABLE' : table.status,
        }
      };
    });
  };

  // Table shift logic (transfers all active items to destination table)
  const transferTable = (fromId, toId) => {
    const cleanFrom = String(fromId).trim().toUpperCase();
    const cleanTo = String(toId).trim().toUpperCase();

    if (!tables[cleanFrom] || tables[cleanFrom].items.length === 0) {
      setInfoDialog({ title: 'Transfer Error', message: `Table ${cleanFrom} has no items to transfer!` });
      return false;
    }

    // Check if target table is already occupied (Rule 8: Error, not merged!)
    const targetTable = tables[cleanTo];
    if (targetTable && targetTable.items && targetTable.items.some(it => it.qty > 0)) {
      setInfoDialog({
        title: 'Transfer Error',
        message: `Error: Table ${cleanTo} is already OCCUPIED! Merging is prohibited.`,
      });
      return false;
    }

    setTables(prev => {
      const sourceTable = prev[cleanFrom];
      const newTarget = targetTable || {
        id: cleanTo,
        section: parseInt(cleanTo) > 20 ? 'FAMILY AC' : 'AC',
        waiter: sourceTable.waiter,
        status: 'OCCUPIED',
        items: [],
        kotNos: [],
      };

      return {
        ...prev,
        [cleanFrom]: {
          ...sourceTable,
          status: 'AVAILABLE',
          items: [],
          kotNos: [],
        },
        [cleanTo]: {
          ...newTarget,
          status: 'OCCUPIED',
          items: [...sourceTable.items],
          kotNos: [...sourceTable.kotNos],
        }
      };
    });

    // Cloud sync
    transferTableInSupabase(cleanFrom, cleanTo);

    setActiveTableId(cleanTo);
    setInfoDialog({
      title: "Dominal's POS",
      message: `Table ${cleanFrom} transferred to ${cleanTo}`,
    });
    return true;
  };

  // KOT Transfer logic (Transfer specific KOT from Table A to Table B)
  const transferKot = (kotNo, fromId, toId) => {
    const cleanFrom = String(fromId).trim().toUpperCase();
    const cleanTo = String(toId).trim().toUpperCase();

    if (!tables[cleanFrom] || !tables[cleanFrom].items) {
      setInfoDialog({ title: 'Transfer Error', message: `Table ${cleanFrom} not found!` });
      return false;
    }

    const sourceTable = tables[cleanFrom];
    const kotItems = sourceTable.items.filter(it => String(it.kotNo) === String(kotNo) || (sourceTable.items.length > 0 && !it.kotNo));
    const remainingItems = sourceTable.items.filter(it => !kotItems.includes(it));

    if (kotItems.length === 0) {
      setInfoDialog({ title: 'Transfer Error', message: `No items found for KOT #${kotNo} on Table ${cleanFrom}!` });
      return false;
    }

    let sec = 'AC';
    const num = parseInt(cleanTo);
    if (cleanTo.startsWith('00')) sec = 'HOME DELIVERY';
    else if (cleanTo.startsWith('0')) sec = 'PARCEL';
    else if (!isNaN(num) && num > 20) sec = 'FAMILY AC';

    setTables(prev => {
      const targetTable = prev[cleanTo] || {
        id: cleanTo,
        section: sec,
        waiter: sourceTable.waiter || activeEmployee,
        status: 'OCCUPIED',
        items: [],
        kotNos: [],
      };

      const updatedKotItems = kotItems.map(it => ({ ...it, kotNo }));

      return {
        ...prev,
        [cleanFrom]: {
          ...sourceTable,
          items: remainingItems,
          status: remainingItems.length === 0 ? 'AVAILABLE' : sourceTable.status,
          kotNos: (sourceTable.kotNos || []).filter(k => String(k) !== String(kotNo)),
        },
        [cleanTo]: {
          ...targetTable,
          section: targetTable.section || sec,
          status: 'OCCUPIED',
          items: [...targetTable.items, ...updatedKotItems],
          kotNos: [...new Set([...(targetTable.kotNos || []), Number(kotNo)])],
        }
      };
    });

    transferTableInSupabase(cleanFrom, cleanTo);
    return true;
  };

  // Order cancellation logic with Cancellation KOT slip & immediate auto-exit
  const cancelItemFromTable = (tableId, itemCode, qtyToCancel, reason, authorizedBy) => {
    const table = tables[tableId];
    if (!table) return false;

    const menuItem = MENU_BY_CODE.get(String(itemCode));
    const rate = menuItem ? (table.section.includes('AC') ? menuItem.acRate : menuItem.hallRate) : 0;
    const cancelQty = -Math.abs(Number(qtyToCancel) || 1);
    const cancelAmount = cancelQty * rate;

    const cancelEntry = {
      code: String(itemCode),
      name: menuItem ? menuItem.name : 'CANCELLED ITEM',
      qty: cancelQty,
      rate: rate,
      amount: cancelAmount,
      isCancelled: true,
      reason: reason || 'CANCELLED BY GUEST',
      authorizedBy: authorizedBy || 'MANAGER',
      category: menuItem?.category || 'UNCATEGORIZED',
      categoryOrder: menuItem?.categoryOrder ?? 99,
      isStaged: false,
      status: 'FIRED',
    };

    setTables(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        items: [...prev[tableId].items, cancelEntry],
      }
    }));

    const lastKotNo = table.kotNos?.[table.kotNos.length - 1] || kotCounter;

    // Cloud sync
    cancelItemInSupabase({
      tableId,
      itemCode,
      itemName: menuItem?.name || 'CANCELLED ITEM',
      qty: qtyToCancel,
      rate,
      reason,
      authorizedBy,
      kotNumber: lastKotNo,
    });

    // Generate Cancellation KOT Slip to Kitchen/Pantry thermal printer
    const cancelSlip = {
      ordNo: lastKotNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
      tableNo: tableId,
      section: table.section,
      employee: table.waiter || activeEmployee,
      cancelledItem: {
        code: String(itemCode),
        name: menuItem ? menuItem.name : 'CANCELLED ITEM',
        qty: Math.abs(Number(qtyToCancel)),
        rate: rate,
        reason: reason || 'CANCELLED BY GUEST',
        authorizedBy: authorizedBy || 'MANAGER',
      },
      department: isKitchenItem(menuItem) ? 'KITCHEN' : 'PANTRY / COUNTER',
    };

    // Auto-exit cancel mode back to normal New Order screen (Rule 10)
    setIsCancelMode(false);

    // Show thermal print slip for Cancellation KOT
    setPrintData({ type: 'CANCEL_KOT', data: cancelSlip });
    return true;
  };

  // Generate KOT and trigger print preview
  const printKOT = (tableId = activeTableId) => {
    const table = tables[tableId];
    if (!table || table.items.length === 0) return;

    // Check for newly staged items
    const stagedItems = table.items.filter(it => it.isStaged && it.qty > 0);

    let itemsToPrint = [];
    let currentKotNo = kotCounter;

    if (stagedItems.length > 0) {
      currentKotNo = kotCounter;
      setKotCounter(c => c + 1);

      // Optimistic state update: mark staged items as fired
      setTables(prev => {
        const tbl = prev[tableId];
        if (!tbl) return prev;
        const updatedItems = tbl.items.map(it => {
          if (it.isStaged) {
            return {
              ...it,
              isStaged: false,
              status: 'FIRED',
              kotNo: currentKotNo,
              firedAt: Date.now(),
            };
          }
          return it;
        });

        return {
          ...prev,
          [tableId]: {
            ...tbl,
            items: updatedItems,
            kotNos: [...new Set([...(tbl.kotNos || []), currentKotNo])],
          }
        };
      });

      itemsToPrint = sortItemsByCourse(stagedItems);

      // Cloud sync to Supabase (KDS and other devices receive it live!)
      fireKotInSupabase({
        tableId,
        section: table.section,
        waiterName: table.waiter || activeEmployee,
        customerName: table.customerName || '',
        customerPhone: table.customerPhone || '',
        kotNumber: currentKotNo,
        items: stagedItems,
        source: 'POS_COUNTER',
      });
    } else {
      const activeItems = table.items.filter(it => it.qty > 0);
      if (activeItems.length === 0) return;
      itemsToPrint = sortItemsByCourse(activeItems);
      currentKotNo = table.kotNos?.[table.kotNos.length - 1] || kotCounter;
    }

    // Separate Kitchen, Dessert, and Beverage items for multi-station split KOT printing
    const kitchenItems = itemsToPrint.filter(it => getItemStation(it) === 'KITCHEN');
    const dessertItems = itemsToPrint.filter(it => getItemStation(it) === 'DESSERT');
    const beverageItems = itemsToPrint.filter(it => getItemStation(it) === 'BEVERAGE');

    const kotSlip = {
      ordNo: currentKotNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
      tableNo: tableId,
      section: table.section || 'AC',
      employee: table.waiter || activeEmployee || 'COUNTER',
      items: itemsToPrint,
      kitchenItems,
      dessertItems,
      beverageItems,
      pantryItems: [...dessertItems, ...beverageItems],
      totalItems: itemsToPrint.reduce((acc, it) => acc + (it.qty || 1), 0),
    };

    setPrintData({ type: 'KOT', data: kotSlip });
  };

  // Generate Cash Memo bill and trigger print preview
  const printCashMemo = (tableId = activeTableId, pax = 2) => {
    const table = tables[tableId];
    if (!table || table.items.length === 0) return;

    const nextBillNo = billCounter;
    setBillCounter(c => c + 1);

    const aggregated = {};
    table.items.forEach(it => {
      const code = it.code;
      if (!aggregated[code]) {
        const cat = it.category || 'UNCATEGORIZED';
        const catOrder = it.categoryOrder ?? (DYNAMIC_CATEGORY_ORDER[cat] || 99);
        aggregated[code] = {
          code: it.code,
          name: it.name,
          category: cat,
          categoryOrder: catOrder,
          qty: 0,
          rate: it.rate,
          amount: 0,
        };
      }
      aggregated[code].qty += it.qty;
      aggregated[code].amount += it.amount;
    });

    const rawBillItems = Object.values(aggregated).filter(it => it.qty > 0);
    // Strict culinary course ordering: Soup -> Starters -> Main Course -> Biryani -> Drinks
    const billItems = sortItemsByCourse(rawBillItems);
    const totalAmount = billItems.reduce((sum, it) => sum + it.amount, 0);
    const totalQty = billItems.reduce((sum, it) => sum + it.qty, 0);

    const memoSlip = {
      billNo: nextBillNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      table: tableId,
      tableNo: tableId,
      section: table.section,
      employeeNo: '1',
      pax: pax || 2,
      items: billItems,
      totalItems: billItems.length,
      totalQty: totalQty,
      amount: totalAmount,
      totalAmount: totalAmount,
      isSettled: false,
      paymentMode: null,
      settledAt: null,
    };

    // Save to past bills for duplicate reprint
    setPastBills(prev => [memoSlip, ...prev.filter(b => b.billNo !== nextBillNo)]);

    // Save to allBills ledger (unsettled = green, settled = black)
    setAllBills(prev => [memoSlip, ...prev.filter(b => String(b.billNo) !== String(nextBillNo))]);

    // Add to unsettled bills: NEVER overwrite prior bills for the same table!
    const cleanTbl = String(tableId).trim().toUpperCase();
    const baseTbl = cleanTbl.replace(/[A-Z]/g, '');
    setUnsettledBills(prev => [
      ...prev.filter(b => String(b.billNo) !== String(nextBillNo)),
      {
        table: tableId,
        tableNo: tableId,
        billNo: String(nextBillNo),
        amount: totalAmount,
        totalAmount: totalAmount,
        customerName: table.customerName || '',
        customerPhone: table.customerPhone || '',
        section: table.section === 'AC' ? 'GENERAL' : table.section,
        time: memoSlip.time,
        date: memoSlip.date,
        items: billItems,
      }
    ]);

    // Vacate table so new guests can sit immediately and take new orders
    setTables(prev => {
      const updated = { ...prev };
      const isDynamic = String(cleanTbl).startsWith('0') || /^[0-9]+[A-Z]$/i.test(String(cleanTbl));
      if (isDynamic) {
        delete updated[cleanTbl];
        if (baseTbl && baseTbl !== cleanTbl) delete updated[baseTbl];
        if (baseTbl) delete updated[`${baseTbl}A`];
      } else {
        const variants = [cleanTbl, baseTbl, `${baseTbl}A`].filter(Boolean);
        variants.forEach(k => {
          if (updated[k]) {
            updated[k] = {
              ...updated[k],
              status: 'AVAILABLE',
              customerName: '',
              customerPhone: '',
              items: [],
              kotNos: [],
            };
          }
        });
      }
      return updated;
    });

    // Cloud sync bill
    saveBillInSupabase(memoSlip);

    setPrintData({ type: 'BILL', data: memoSlip });
  };

  // Open settle modal (Bill-centric: binds directly to bill snapshot)
  const openSettleModal = (tableId = activeTableId, billNo = null) => {
    const targetId = tableId || activeTableId;
    const cleanId = String(targetId).trim().toUpperCase();
    const baseId = cleanId.replace(/[A-Z]/g, '');

    // 1. Look for matching bill in unsettledBills or allBills first!
    let matchingBill = null;
    if (billNo) {
      matchingBill = unsettledBills.find(b => String(b.billNo) === String(billNo)) ||
                     allBills.find(b => String(b.billNo) === String(billNo));
    }
    if (!matchingBill) {
      matchingBill = unsettledBills.find(b => {
        const bT = String(b.table || b.tableNo || '').trim().toUpperCase();
        return bT === cleanId || (baseId && bT.replace(/[A-Z]/g, '') === baseId);
      });
    }

    if (matchingBill) {
      setSettleTableId(matchingBill.table || cleanId);
      setSettleBillData({
        billNo: String(matchingBill.billNo),
        table: matchingBill.table || cleanId,
        amount: Number(matchingBill.amount ?? matchingBill.totalAmount ?? 0),
        items: matchingBill.items || [],
        customerName: matchingBill.customerName || '',
        customerPhone: matchingBill.customerPhone || '',
        waiter: matchingBill.waiter || '1 COUNTER',
        section: matchingBill.section || 'GENERAL',
      });
      setShowSettleModal(true);
      return;
    }

    // 2. Fallback to active physical table
    const table = tables[cleanId] || (baseId && tables[baseId]) || (baseId && tables[`${baseId}A`]);
    if (!table || !table.items || table.items.length === 0) {
      setInfoDialog({
        title: "Dominal's POS",
        message: `Table ${targetId} has no active items or unsettled bill to settle!`,
      });
      return;
    }

    const netAmount = table.items.reduce((s, it) => s + (it.amount || it.qty * it.rate || 0), 0);
    setSettleTableId(table.id || cleanId);
    setSettleBillData({
      billNo: String(table.kotNos?.[0] || billCounter),
      table: table.id || cleanId,
      amount: netAmount,
      items: table.items,
      customerName: table.customerName || '',
      customerPhone: table.customerPhone || '',
      waiter: table.waiter || '1 COUNTER',
      section: table.section || 'GENERAL',
    });
    setShowSettleModal(true);
  };

  // Settle bill directly
  const settleBill = (tableId = activeTableId, billNo = null) => {
    openSettleModal(tableId, billNo);
  };

  // Settle bill with selected payment mode (Rule 13: Direct amount)
  const settleBillWithPayment = (tableId, paymentMode, specificBillNo = null) => {
    const cleanTbl = String(tableId || '').trim().toUpperCase();
    const baseTbl = cleanTbl.replace(/[A-Z]/g, '');

    const billNum = specificBillNo || settleBillData?.billNo || unsettledBills.find(b => {
      const bT = String(b.table || b.tableNo || '').trim().toUpperCase();
      return bT === cleanTbl || (baseTbl && bT.replace(/[A-Z]/g, '') === baseTbl);
    })?.billNo || String(billCounter);

    const matchingUnsettled = unsettledBills.find(b => String(b.billNo) === String(billNum));
    const netAmount = settleBillData?.amount ?? (matchingUnsettled ? matchingUnsettled.amount : 0);

    // Record into daily settled transactions journal
    const transaction = {
      billNo: String(billNum),
      tableId: cleanTbl,
      amount: netAmount,
      paymentMode,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestamp: Date.now(),
    };
    setDailyTransactions(prev => [transaction, ...prev]);

    // Update in allBills ledger
    setAllBills(prev => prev.map(b => {
      if (String(b.billNo) === String(billNum)) {
        return {
          ...b,
          isSettled: true,
          paymentMode,
          settledAt: Date.now(),
        };
      }
      return b;
    }));

    // Remove ONLY this bill from unsettledBills
    setUnsettledBills(prev => prev.filter(b => String(b.billNo) !== String(billNum)));
    setShowSettleModal(false);
    setSettleBillData(null);

    // If dynamic order slot (takeaway / delivery), purge from local tables state
    setTables(prev => {
      const isDynamic = String(cleanTbl).startsWith('0') || /^[0-9]+[A-Z]$/i.test(String(cleanTbl));
      if (isDynamic && prev[cleanTbl]) {
        const next = { ...prev };
        delete next[cleanTbl];
        return next;
      }
      return prev;
    });

    // Cloud sync settlement
    settleBillInSupabase({
      tableId: cleanTbl,
      billNo: billNum,
      amount: netAmount,
      paymentMode,
      cashierName: currentUser?.name || '1. Operator',
    });

    setInfoDialog({
      title: "Dominal's POS",
      message: `Bill #${billNum} (₹${netAmount.toFixed(2)}) settled via ${paymentMode} successfully.`,
    });
  };

  // Open batch settlement dialog from F12 settlement menu
  const openBatchSettle = (mode) => {
    setBatchSettleMode(mode);
    setShowSettlementMenu(false);
  };

  // Execute batch settlement for multiple bills (vid5 & vid6)
  const settleBillsBatch = (billNumbers, mode) => {
    const billNumStrings = billNumbers.map(n => String(n));
    let settledCount = 0;

    // 1. Mark in allBills ledger
    setAllBills(prev => prev.map(b => {
      if (billNumStrings.includes(String(b.billNo))) {
        settledCount++;
        return {
          ...b,
          isSettled: true,
          paymentMode: mode,
          settledAt: Date.now(),
        };
      }
      return b;
    }));

    // 2. Identify tables and remove from unsettled bills
    const matchingBills = unsettledBills.filter(b => billNumStrings.includes(String(b.billNo)));
    const matchingTableIds = matchingBills.map(b => String(b.table || b.tableNo || '').trim().toUpperCase());

    setUnsettledBills(prev => prev.filter(b => !billNumStrings.includes(String(b.billNo))));

    // 3. Clear tables locally (all variants)
    setTables(prev => {
      const updated = { ...prev };
      matchingTableIds.forEach(tblId => {
        const baseId = tblId.replace(/[A-Z]/g, '');
        const variants = [tblId, baseId, `${baseId}A`].filter(Boolean);
        variants.forEach(k => {
          if (updated[k]) {
            updated[k] = {
              ...updated[k],
              status: 'AVAILABLE',
              items: [],
              kotNos: [],
            };
          }
        });
      });
      return updated;
    });

    // 4. Create daily transaction records
    const newTx = matchingBills.map(b => ({
      billNo: b.billNo,
      tableId: b.table,
      amount: b.amount,
      paymentMode: mode,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestamp: Date.now(),
    }));
    setDailyTransactions(prev => [...newTx, ...prev]);

    // 5. Cloud sync each settlement
    matchingBills.forEach(b => {
      settleBillInSupabase({
        tableId: b.table,
        billNo: b.billNo,
        amount: b.amount,
        paymentMode: mode,
        cashierName: currentUser?.name || '1. Operator',
      });
    });

    return settledCount || billNumbers.length;
  };

  // Reprint past bill (Rule 15)
  const reprintBill = (billNumber) => {
    const bill = pastBills.find(b => String(b.billNo) === String(billNumber));
    if (bill) {
      setPrintData({ type: 'BILL', data: bill });
      return true;
    }
    setInfoDialog({
      title: "Reprint Error",
      message: `Bill #${billNumber} not found in recent records!`,
    });
    return false;
  };

  // End of Day / Close Day (Rule 16)
  const closeDay = () => {
    const hasUnsettled = unsettledBills.length > 0;
    const hasActiveTables = Object.values(tables).some(t => t.items && t.items.some(it => it.qty > 0));

    if (hasUnsettled || hasActiveTables) {
      setInfoDialog({
        title: "Day Close Blocked",
        message: "Cannot Close Day! Please settle all unsettled bills and clear active tables first.",
      });
      return false;
    }

    if (window.confirm("Are you sure you want to perform End of Day Close? All daily counters will reset for the new day.")) {
      setKotCounter(1);
      setBillCounter(1);
      closeDayInSupabase();
      setInfoDialog({
        title: "Day Closed Successfully",
        message: "All accounts finalized. KOT Number and Bill Number have been reset to 1 for the new day.",
      });
      return true;
    }
    return false;
  };

  const promptSupabaseConfig = () => {
    const url = window.prompt("Enter Supabase Project URL:", SUPABASE_URL || "");
    if (url === null) return;
    const key = window.prompt("Enter Supabase Anon Public Key:", SUPABASE_ANON_KEY || "");
    if (key === null) return;
    saveSupabaseCredentials(url, key);
  };

  return (
    <PosContext.Provider value={{
      currentUser,
      setCurrentUser,
      screenMode,
      setScreenMode,
      isCancelMode,
      setIsCancelMode,
      activeTableId,
      setActiveTableId,
      activeSubTable,
      setActiveSubTable,
      activeEmployee,
      setActiveEmployee,
      tables,
      setTables,
      currentTableData,
      unsettledBills,
      dailyTransactions,
      pastBills,
      switchTable,
      addItemToActiveTable,
      removeStagedItem,
      transferTable,
      cancelItemFromTable,
      printKOT,
      printCashMemo,
      reprintBill,
      settleBill,
      openSettleModal,
      settleBillWithPayment,
      closeDay,
      getNextParcelTable,
      triggerTableFocus,
      updateTableCustomer,
      // Cloud Supabase
      isCloudConnected,
      promptSupabaseConfig,
      // Modals
      showLoginModal,
      setShowLoginModal,
      showShiftModal,
      setShowShiftModal,
      showCancelAuthModal,
      setShowCancelAuthModal,
      showSettleModal,
      setShowSettleModal,
      settleTableId,
      setSettleTableId,
      pendingCancelDetails,
      setPendingCancelDetails,
      printData,
      setPrintData,
      infoDialog,
      setInfoDialog,
      // Settle Bill Snapshot Data
      settleBillData,
      setSettleBillData,
      // Cancel Items / Table Modal
      showCancelModal,
      setShowCancelModal,
      cancelModalTableId,
      openCancelModal,
      // Rate Helper
      getApplicableRate,
      // All Bills & Details of Bill
      allBills,
      setAllBills,
      // F12 Settlement Menu & Batch Settle
      showSettlementMenu,
      setShowSettlementMenu,
      batchSettleMode,
      setBatchSettleMode,
      openBatchSettle,
      settleBillsBatch,
      // Pax Prompt & KOT Transfer
      paxPrompt,
      setPaxPrompt,
      transferKot,
      // Zero-Dummy Top Menu Modals
      activeModal,
      setActiveModal,
      openModal,
      closeModal,
      // Menu & Categories Live Management
      categories,
      setCategories,
      menuItems,
      setMenuItems,
      refreshMenuAndCategories,
      addOrUpdateCategory,
      reorderCategories,
      renameCategory,
      deleteCategory,
      addOrUpdateMenuItem,
      deleteMenuItem,
      // Table Studio Management
      addOrUpdateTable,
      deleteTable,
      reassignTableRange,
      moveTableNumber,
    }}>
      {children}
    </PosContext.Provider>
  );
}

export function getApplicableRate(arg1, arg2) {
  const item = (typeof arg1 === 'object' && arg1 !== null) ? arg1 : arg2;
  const section = (typeof arg1 === 'string') ? arg1 : (typeof arg2 === 'string' ? arg2 : '');
  if (!item) return 0;
  const sec = String(section || '').toUpperCase();
  if (sec === 'GENERAL') {
    return Number(item.hallRate ?? item.hall_rate ?? item.rate ?? item.acRate ?? item.ac_rate) || 0;
  }
  return Number(item.acRate ?? item.ac_rate ?? item.rate ?? item.hallRate ?? item.hall_rate) || 0;
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
}

