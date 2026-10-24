import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_USERS, EMPLOYEES, INITIAL_TABLES, INITIAL_UNSETTLED_BILLS } from '../data/initialData';
import { MENU_BY_CODE, sortItemsByCourse } from '../data/menuService';

const PosContext = createContext(null);

export function PosProvider({ children }) {
  // Current user / role
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[1]); // Default to Manager for full visibility
  
  // Active screen mode: 'ORDER' (New Order / KOT) vs 'CASH_MEMO' (New Cash Memo / Settle) vs 'REPORTS'
  const [screenMode, setScreenMode] = useState('ORDER');

  // Cancel order mode (active when '-' is pressed)
  const [isCancelMode, setIsCancelMode] = useState(false);

  // Active table
  const [activeTableId, setActiveTableId] = useState('2');
  const [activeSubTable, setActiveSubTable] = useState('A');
  const [activeEmployee, setActiveEmployee] = useState(EMPLOYEES[0].name);

  // Tables state
  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem('inamdar_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  // Unsettled bills state
  const [unsettledBills, setUnsettledBills] = useState(() => {
    const saved = localStorage.getItem('inamdar_unsettled_bills');
    return saved ? JSON.parse(saved) : INITIAL_UNSETTLED_BILLS;
  });

  // Counters
  const [kotCounter, setKotCounter] = useState(32);
  const [billCounter, setBillCounter] = useState(18);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showCancelAuthModal, setShowCancelAuthModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTableId, setSettleTableId] = useState('2');
  const [pendingCancelDetails, setPendingCancelDetails] = useState(null);
  const [printData, setPrintData] = useState(null); // { type: 'KOT' | 'BILL', data: ... }
  const [infoDialog, setInfoDialog] = useState(null); // { title, message }

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('inamdar_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('inamdar_unsettled_bills', JSON.stringify(unsettledBills));
  }, [unsettledBills]);

  // Active table data
  const currentTableData = tables[activeTableId] || {
    id: activeTableId,
    section: parseInt(activeTableId) > 20 ? 'FAMILY AC' : (activeTableId.startsWith('00') ? 'HOME DELIVERY' : (activeTableId.startsWith('0') ? 'PARCEL' : 'AC')),
    waiter: activeEmployee,
    status: 'AVAILABLE',
    items: [],
    kotNos: [],
  };

  // Switch active table
  const switchTable = (tableId) => {
    const cleanId = String(tableId).trim().toUpperCase();
    if (!cleanId) return;

    setActiveTableId(cleanId);
    if (!tables[cleanId]) {
      // Determine section automatically
      let sec = 'AC';
      const num = parseInt(cleanId);
      if (cleanId.startsWith('00')) sec = 'HOME DELIVERY';
      else if (cleanId.startsWith('0')) sec = 'PARCEL';
      else if (!isNaN(num) && num > 20) sec = 'FAMILY AC';

      setTables(prev => ({
        ...prev,
        [cleanId]: {
          id: cleanId,
          section: sec,
          waiter: activeEmployee,
          status: 'AVAILABLE',
          items: [],
          kotNos: [],
        }
      }));
    }
  };

  // Add line item to active table
  const addItemToActiveTable = (item) => {
    setTables(prev => {
      const existing = prev[activeTableId] || {
        id: activeTableId,
        section: parseInt(activeTableId) > 20 ? 'FAMILY AC' : 'AC',
        waiter: activeEmployee,
        status: 'OCCUPIED',
        items: [],
        kotNos: [],
      };

      const rate = existing.section.includes('AC') ? (item.acRate || item.rate) : (item.hallRate || item.rate);
      const qty = item.qty || 1;
      const amount = qty * rate;

      const newItem = {
        code: item.code,
        name: item.name,
        qty: qty,
        rate: rate,
        amount: amount,
        category: item.category || 'UNCATEGORIZED',
        categoryOrder: item.categoryOrder ?? 99,
        customization: item.customization || '',
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

  // Table shift logic (transfers all active items to destination table)
  const transferTable = (fromId, toId) => {
    const cleanFrom = String(fromId).trim().toUpperCase();
    const cleanTo = String(toId).trim().toUpperCase();

    if (!tables[cleanFrom] || tables[cleanFrom].items.length === 0) {
      setInfoDialog({ title: 'Transfer Error', message: `Table ${cleanFrom} has no items to transfer!` });
      return false;
    }

    setTables(prev => {
      const sourceTable = prev[cleanFrom];
      const targetTable = prev[cleanTo] || {
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
          ...targetTable,
          status: 'OCCUPIED',
          items: [...(targetTable.items || []), ...(sourceTable.items || [])],
          kotNos: [...new Set([...(targetTable.kotNos || []), ...(sourceTable.kotNos || [])])],
        }
      };
    });

    setActiveTableId(cleanTo);
    setInfoDialog({
      title: "Dominal's POS 9.99.451",
      message: `Table ${cleanFrom} transferred to ${cleanTo}`,
    });
    return true;
  };

  // Order cancellation logic
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
    };

    setTables(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        items: [...prev[tableId].items, cancelEntry],
      }
    }));

    setIsCancelMode(false);
    return true;
  };

  // Generate KOT and trigger print preview
  const printKOT = (tableId = activeTableId) => {
    const table = tables[tableId];
    if (!table || table.items.length === 0) return;

    // Filter out items that are net cancelled or already handled
    const activeItems = table.items.filter(it => it.qty > 0);
    if (activeItems.length === 0) return;

    // Auto-sort according to culinary course order
    const sortedItems = sortItemsByCourse(activeItems);
    const nextOrdNo = kotCounter;
    setKotCounter(c => c + 1);

    const kotSlip = {
      ordNo: nextOrdNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
      tableNo: tableId,
      section: table.section,
      employee: table.waiter || activeEmployee,
      items: sortedItems,
      totalItems: sortedItems.reduce((acc, it) => acc + (it.qty || 1), 0),
    };

    setPrintData({ type: 'KOT', data: kotSlip });
  };

  // Generate Cash Memo bill and trigger print preview
  const printCashMemo = (tableId = activeTableId) => {
    const table = tables[tableId];
    if (!table || table.items.length === 0) return;

    const nextBillNo = billCounter;
    setBillCounter(c => c + 1);

    // Calculate aggregated items (positive minus cancellations)
    const aggregated = {};
    table.items.forEach(it => {
      const code = it.code;
      if (!aggregated[code]) {
        aggregated[code] = {
          code: it.code,
          name: it.name,
          qty: 0,
          rate: it.rate,
          amount: 0,
        };
      }
      aggregated[code].qty += it.qty;
      aggregated[code].amount += it.amount;
    });

    const billItems = Object.values(aggregated).filter(it => it.qty > 0);
    const totalAmount = billItems.reduce((sum, it) => sum + it.amount, 0);
    const totalQty = billItems.reduce((sum, it) => sum + it.qty, 0);

    const memoSlip = {
      billNo: nextBillNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      tableNo: tableId,
      section: table.section,
      employeeNo: '1',
      items: billItems,
      totalItems: billItems.length,
      totalQty: totalQty,
      totalAmount: totalAmount,
    };

    // Add to unsettled bills
    setUnsettledBills(prev => {
      const filtered = prev.filter(b => b.table !== tableId);
      return [...filtered, { table: tableId, billNo: String(nextBillNo), amount: totalAmount }];
    });

    setPrintData({ type: 'BILL', data: memoSlip });
  };

  // Open settle modal
  const openSettleModal = (tableId = activeTableId) => {
    const targetId = tableId || activeTableId;
    const table = tables[targetId];
    if (!table || table.items.length === 0) {
      setInfoDialog({
        title: "Dominal's POS 9.99.451",
        message: `Table ${targetId} has no active items to settle!`,
      });
      return;
    }
    setSettleTableId(targetId);
    setShowSettleModal(true);
  };

  // Settle bill directly
  const settleBill = (tableId = activeTableId) => {
    openSettleModal(tableId);
  };

  // Settle bill with selected payment mode
  const settleBillWithPayment = (tableId, paymentMode) => {
    const table = tables[tableId];
    const netAmount = table ? table.items.reduce((s, it) => s + it.amount, 0) : 0;

    setTables(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        status: 'AVAILABLE',
        items: [],
        kotNos: [],
      }
    }));
    setUnsettledBills(prev => prev.filter(b => b.table !== tableId));
    setShowSettleModal(false);
    setInfoDialog({
      title: "Dominal's POS 9.99.451",
      message: `Table ${tableId} bill (₹${netAmount.toFixed(2)}) settled via ${paymentMode} successfully.`,
    });
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
      currentTableData,
      unsettledBills,
      switchTable,
      addItemToActiveTable,
      transferTable,
      cancelItemFromTable,
      printKOT,
      printCashMemo,
      settleBill,
      openSettleModal,
      settleBillWithPayment,
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
    }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
}
