import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_USERS, EMPLOYEES, INITIAL_TABLES, INITIAL_UNSETTLED_BILLS } from '../data/initialData';
import { MENU_BY_CODE, sortItemsByCourse, isKitchenItem } from '../data/menuService';

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

  // Daily settled transactions journal
  const [dailyTransactions, setDailyTransactions] = useState(() => {
    const saved = localStorage.getItem('inamdar_daily_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Past bills record for instant duplicate reprint
  const [pastBills, setPastBills] = useState(() => {
    const saved = localStorage.getItem('inamdar_past_bills');
    return saved ? JSON.parse(saved) : [];
  });

  // Counters (Sequential throughout the day)
  const [kotCounter, setKotCounter] = useState(() => {
    const saved = localStorage.getItem('inamdar_kot_counter');
    return saved ? Number(saved) : 32;
  });
  const [billCounter, setBillCounter] = useState(() => {
    const saved = localStorage.getItem('inamdar_bill_counter');
    return saved ? Number(saved) : 18;
  });

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showCancelAuthModal, setShowCancelAuthModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTableId, setSettleTableId] = useState('2');
  const [pendingCancelDetails, setPendingCancelDetails] = useState(null);
  const [printData, setPrintData] = useState(null); // { type: 'KOT' | 'BILL' | 'CANCEL_KOT', data: ... }
  const [infoDialog, setInfoDialog] = useState(null); // { title, message }

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('inamdar_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('inamdar_unsettled_bills', JSON.stringify(unsettledBills));
  }, [unsettledBills]);

  useEffect(() => {
    localStorage.setItem('inamdar_daily_transactions', JSON.stringify(dailyTransactions));
  }, [dailyTransactions]);

  useEffect(() => {
    localStorage.setItem('inamdar_past_bills', JSON.stringify(pastBills));
  }, [pastBills]);

  useEffect(() => {
    localStorage.setItem('inamdar_kot_counter', String(kotCounter));
  }, [kotCounter]);

  useEffect(() => {
    localStorage.setItem('inamdar_bill_counter', String(billCounter));
  }, [billCounter]);

  // Helper: Find next available parcel table (0, 0B, 0C, 0D, ...)
  const getNextParcelTable = () => {
    const suffixes = ['', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    for (const s of suffixes) {
      const key = `0${s}`;
      const t = tables[key];
      if (!t || !t.items || t.items.length === 0) {
        return key;
      }
    }
    return `0${String.fromCharCode(65 + Math.floor(Math.random() * 20))}`;
  };

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
    let cleanId = String(tableId).trim().toUpperCase();
    if (!cleanId) return;

    // Automatic Parcel sequence: '0' -> auto find next available parcel (0, 0B, 0C, ...)
    if (cleanId === '0') {
      cleanId = getNextParcelTable();
    } else if (cleanId === '00') {
      cleanId = '00 - GUEST';
    }

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

  // Add line item to active table (marked as isStaged: true until KOT is fired)
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
  // Per Rule 8: If target table is ALREADY OCCUPIED, show error - DO NOT MERGE!
  const transferTable = (fromId, toId) => {
    const cleanFrom = String(fromId).trim().toUpperCase();
    const cleanTo = String(toId).trim().toUpperCase();

    if (!tables[cleanFrom] || tables[cleanFrom].items.length === 0) {
      setInfoDialog({ title: 'Transfer Error', message: `Table ${cleanFrom} has no items to transfer!` });
      return false;
    }

    // Check if target table is already occupied
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

    setActiveTableId(cleanTo);
    setInfoDialog({
      title: "Dominal's POS",
      message: `Table ${cleanFrom} transferred to ${cleanTo}`,
    });
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

    // Generate Cancellation KOT Slip to Kitchen/Pantry thermal printer!
    const cancelSlip = {
      ordNo: table.kotNos?.[table.kotNos.length - 1] || kotCounter,
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
  // Rule 2: Only newly added staged items are assigned the new KOT and printed!
  const printKOT = (tableId = activeTableId) => {
    const table = tables[tableId];
    if (!table || table.items.length === 0) return;

    // Check if there are newly staged items
    const stagedItems = table.items.filter(it => it.isStaged && it.qty > 0);

    let itemsToPrint = [];
    let currentKotNo = kotCounter;

    if (stagedItems.length > 0) {
      // Fire newly added items with next sequential KOT number
      currentKotNo = kotCounter;
      setKotCounter(c => c + 1);

      // Mark staged items as fired
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
    } else {
      // If no new staged items, reprint latest/all active items
      const activeItems = table.items.filter(it => it.qty > 0);
      if (activeItems.length === 0) return;
      itemsToPrint = sortItemsByCourse(activeItems);
      currentKotNo = table.kotNos?.[table.kotNos.length - 1] || kotCounter;
    }

    // Separate Kitchen vs Bar/Pantry items (Rule 18)
    const kitchenItems = itemsToPrint.filter(isKitchenItem);
    const pantryItems = itemsToPrint.filter(it => !isKitchenItem(it));

    const kotSlip = {
      ordNo: currentKotNo,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
      tableNo: tableId,
      section: table.section,
      employee: table.waiter || activeEmployee,
      items: itemsToPrint,
      kitchenItems,
      pantryItems,
      totalItems: itemsToPrint.reduce((acc, it) => acc + (it.qty || 1), 0),
    };

    setPrintData({ type: 'KOT', data: kotSlip });
  };

  // Generate Cash Memo bill and trigger print preview
  // Rule 12: When F6 is pressed, sends table to Unsettled Bills!
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

    // Save to past bills for duplicate reprint
    setPastBills(prev => [memoSlip, ...prev.filter(b => b.billNo !== nextBillNo)]);

    // Add to unsettled bills (Rule 12 & 14)
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
        title: "Dominal's POS",
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

  // Settle bill with selected payment mode (Rule 13: Direct amount)
  const settleBillWithPayment = (tableId, paymentMode) => {
    const table = tables[tableId];
    const netAmount = table ? table.items.reduce((s, it) => s + it.amount, 0) : 0;
    const unsettled = unsettledBills.find(b => b.table === tableId);
    const billNum = unsettled ? unsettled.billNo : String(billCounter);

    // Record into daily settled transactions journal
    const transaction = {
      billNo: billNum,
      tableId,
      amount: netAmount,
      paymentMode,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      timestamp: Date.now(),
    };
    setDailyTransactions(prev => [transaction, ...prev]);

    // Free the table
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
      title: "Dominal's POS",
      message: `Table ${tableId} bill #${billNum} (₹${netAmount.toFixed(2)}) settled via ${paymentMode} successfully.`,
    });
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
  // Must settle all unsettled bills and clear running tables first; then resets KOT and Bill numbers for new day.
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
      setInfoDialog({
        title: "Day Closed Successfully",
        message: "All accounts finalized. KOT Number and Bill Number have been reset to 1 for the new day.",
      });
      return true;
    }
    return false;
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
