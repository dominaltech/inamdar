import React, { useState, useEffect, useRef } from 'react';
import { usePos, getApplicableRate } from '../context/PosContext';
import { EMPLOYEES, CANCEL_REASONS } from '../data/initialData';
import { searchMenuItems, MENU_BY_CODE } from '../data/menuService';
import CustomerDetailsModal from './CustomerDetailsModal';

export default function OrderWorkspace() {
  const {
    screenMode,
    setScreenMode,
    isCancelMode,
    activeTableId,
    activeSubTable,
    setActiveSubTable,
    activeEmployee,
    setActiveEmployee,
    tables,
    setTables,
    currentTableData,
    unsettledBills,
    switchTable,
    addItemToActiveTable,
    removeStagedItem,
    printKOT,
    printCashMemo,
    openSettleModal,
    openCancelModal,
    getNextParcelTable,
    paxPrompt,
    setPaxPrompt,
    printData,
    activeModal,
    showCancelModal,
    updateTableCustomer,
  } = usePos();

  // Multi-Order Tabs State (F1 key creates or cycles between concurrent order drafts)
  const [orderDrafts, setOrderDrafts] = useState([
    {
      id: 1,
      tableId: '',
      tableInput: '',
      customerName: '',
      customerPhone: '',
      employee: '1 COUNTER',
      stagedItems: [],
    }
  ]);
  const [activeDraftIdx, setActiveDraftIdx] = useState(0);

  // Active entry row inputs
  const [tableInput, setTableInput] = useState(activeTableId);
  const [showSubTableMenu, setShowSubTableMenu] = useState(false);
  const [subTableIndex, setSubTableIndex] = useState(0);
  const [codeQuery, setCodeQuery] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [rateInput, setRateInput] = useState('');
  const [customizationInput, setCustomizationInput] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState(CANCEL_REASONS[0]);

  // Customer Details Modal prompt state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [pendingCustomerTable, setPendingCustomerTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Double Enter confirmation badge state ('KOT' or 'BILL' or null)
  const [doubleEnterBadge, setDoubleEnterBadge] = useState(null);
  const doubleEnterTimerRef = useRef(null);

  // Cash Memo item preview state
  const [memoTableLoaded, setMemoTableLoaded] = useState(null);

  // Selected item object from search
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Field focus references
  const tableInputRef = useRef(null);
  const employeeSelectRef = useRef(null);
  const codeInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const rateInputRef = useRef(null);
  const customInputRef = useRef(null);
  const cancelReasonRef = useRef(null);

  // Synchronize table input and active table customer details
  useEffect(() => {
    if (activeTableId) {
      setTableInput(activeTableId);
      const isHomeDelivery = String(activeTableId).startsWith('00');
      const subMatch = !isHomeDelivery && String(activeTableId).match(/^[0-9]+([A-Z])$/);
      setActiveSubTable(subMatch ? subMatch[1] : '');

      const tbl = tables[activeTableId];
      if (tbl) {
        const extracted = isHomeDelivery ? String(activeTableId).replace(/^00\s*-\s*/, '') : '';
        setCustomerName(tbl.customerName || (extracted !== 'GUEST' ? extracted : ''));
        setCustomerPhone(tbl.customerPhone || '');
      }
    } else {
      setTableInput('');
      setActiveSubTable('');
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [activeTableId, tables, setActiveSubTable]);

  const focusTableInput = () => {
    setTimeout(() => {
      if (tableInputRef.current && !tableInputRef.current.disabled) {
        tableInputRef.current.focus();
        tableInputRef.current.select();
      }
    }, 30);
  };

  const focusCodeInput = () => {
    setTimeout(() => {
      if (codeInputRef.current && !codeInputRef.current.disabled) {
        codeInputRef.current.focus();
        codeInputRef.current.select();
      }
    }, 40);
  };

  // Focus table input on mount, screen mode switch, or global focus event
  useEffect(() => {
    if (screenMode === 'ORDER' || screenMode === 'CASH_MEMO') {
      focusTableInput();
    }
  }, [screenMode]);

  useEffect(() => {
    const handleFocusTable = () => {
      focusTableInput();
    };
    window.addEventListener('inamdar-focus-table', handleFocusTable);
    return () => window.removeEventListener('inamdar-focus-table', handleFocusTable);
  }, []);

  // Multi-Order Tab Switcher via F1 Hotkey
  const handleSwitchDraft = (targetIdx) => {
    if (targetIdx === activeDraftIdx || targetIdx < 0 || targetIdx >= orderDrafts.length) return;

    // Save current active draft data
    setOrderDrafts(prev => {
      const updated = [...prev];
      updated[activeDraftIdx] = {
        ...updated[activeDraftIdx],
        tableId: activeTableId,
        tableInput: tableInput,
        customerName: customerName,
        customerPhone: customerPhone,
        employee: activeEmployee,
      };
      return updated;
    });

    const targetDraft = orderDrafts[targetIdx];
    setActiveDraftIdx(targetIdx);
    setCustomerName(targetDraft.customerName || '');
    setCustomerPhone(targetDraft.customerPhone || '');
    setTableInput(targetDraft.tableInput || '');
    switchTable(targetDraft.tableId || '');
    if (targetDraft.employee) setActiveEmployee(targetDraft.employee);

    if (targetDraft.tableId) {
      focusCodeInput();
    } else {
      focusTableInput();
    }
  };

  const handleAddNewDraft = () => {
    if (orderDrafts.length >= 5) {
      // Cycle to first
      handleSwitchDraft(0);
      return;
    }

    // Save current active draft data
    setOrderDrafts(prev => {
      const updated = [...prev];
      updated[activeDraftIdx] = {
        ...updated[activeDraftIdx],
        tableId: activeTableId,
        tableInput: tableInput,
        customerName: customerName,
        customerPhone: customerPhone,
        employee: activeEmployee,
      };
      const newDraft = {
        id: Date.now(),
        tableId: '',
        tableInput: '',
        customerName: '',
        customerPhone: '',
        employee: activeEmployee || '1 COUNTER',
        stagedItems: [],
      };
      return [...updated, newDraft];
    });

    const newIdx = orderDrafts.length;
    setActiveDraftIdx(newIdx);
    setCustomerName('');
    setCustomerPhone('');
    setTableInput('');
    switchTable('');
    setCodeQuery('');
    setSelectedItem(null);
    setQtyInput('1');
    setRateInput('');
    focusTableInput();
  };

  const handleCloseDraft = (e, idxToClose) => {
    e?.stopPropagation();
    if (orderDrafts.length <= 1) {
      // Just clear
      setTableInput('');
      switchTable('');
      setCustomerName('');
      setCustomerPhone('');
      setCodeQuery('');
      setSelectedItem(null);
      focusTableInput();
      return;
    }

    const nextDrafts = orderDrafts.filter((_, idx) => idx !== idxToClose);
    const nextIdx = Math.max(0, activeDraftIdx >= idxToClose ? activeDraftIdx - 1 : activeDraftIdx);
    setOrderDrafts(nextDrafts);
    setActiveDraftIdx(nextIdx);

    const target = nextDrafts[nextIdx];
    setCustomerName(target.customerName || '');
    setCustomerPhone(target.customerPhone || '');
    setTableInput(target.tableInput || '');
    switchTable(target.tableId || '');
    focusTableInput();
  };

  // Two-Stage Escape Handling & F1 Tab Capture
  useEffect(() => {
    const handleCaptureKeyDown = (e) => {
      if (
        printData ||
        paxPrompt ||
        activeModal ||
        showCustomerModal ||
        showCancelModal ||
        screenMode === 'DISPLAY_ORDER' ||
        screenMode === 'DETAILS_OF_BILL' ||
        screenMode === 'REPORTS'
      ) {
        return;
      }

      // Hotkey '-' triggers dedicated Cancel Order / Items Modal!
      if (e.key === '-' || e.key === 'Subtract') {
        const target = e.target;
        const isTypingText = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT') && target.id !== 'pos-table-input' && target.value.length > 0;
        if (!isTypingText) {
          e.preventDefault();
          e.stopPropagation();
          openCancelModal(activeTableId || tableInput);
          return;
        }
      }

      // F1 Hotkey: Create new order tab or cycle between open tabs
      if (e.key === 'F1') {
        e.preventDefault();
        e.stopPropagation();
        if (orderDrafts.length > 1 && (activeDraftIdx + 1 < orderDrafts.length)) {
          handleSwitchDraft(activeDraftIdx + 1);
        } else if (orderDrafts.length > 1 && (activeDraftIdx + 1 >= orderDrafts.length)) {
          handleSwitchDraft(0);
        } else {
          handleAddNewDraft();
        }
        return;
      }

      // Two-Stage Escape Handling
      if (e.key === 'Escape') {
        if (showSubTableMenu) return;

        if (screenMode === 'ORDER') {
          const isDirty = Boolean(
            tableInput.trim() ||
            activeTableId ||
            codeQuery.trim() ||
            (currentTableData.items && currentTableData.items.length > 0)
          );

          if (isDirty) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            setTableInput('');
            switchTable('');
            setCodeQuery('');
            setSelectedItem(null);
            setQtyInput('1');
            setRateInput('');
            setCustomizationInput('');
            setShowSubTableMenu(false);
            setDoubleEnterBadge(null);
            focusTableInput();
            return;
          }
        } else if (screenMode === 'CASH_MEMO') {
          const isDirty = Boolean(
            tableInput.trim() ||
            activeTableId ||
            (currentTableData.items && currentTableData.items.length > 0)
          );

          if (isDirty) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            setTableInput('');
            switchTable('');
            setMemoTableLoaded(null);
            setDoubleEnterBadge(null);
            focusTableInput();
            return;
          }
        }
      }

      // CASH_MEMO Mode: If a table preview is already loaded and user presses Enter outside the table input, or presses Enter again:
      if (screenMode === 'CASH_MEMO' && e.key === 'Enter' && !paxPrompt?.show && !activeModal && !showCustomerModal && !showCancelModal) {
        if (e.target?.id === 'pos-table-input') {
          return;
        }
        const target = memoTableLoaded || tableInput.trim().toUpperCase() || activeTableId;
        const tbl = target ? tables[target] : null;
        const hasItems = tbl && tbl.items && tbl.items.some(it => it.qty > 0 && !it.isCancelled);
        if (hasItems) {
          const tableToPrint = tbl.id;
          e.preventDefault();
          e.stopPropagation();
          setPaxPrompt({
            show: true,
            tableId: tableToPrint,
            onConfirm: (pax) => {
              printCashMemo(tableToPrint, pax);
              setTableInput('');
              switchTable('');
              setMemoTableLoaded(null);
              focusTableInput();
            }
          });
          return;
        }
      }

      // Zero-Mouse Workflow: Bring cursor to Table on unhandled Enter
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.tagName === 'TEXTAREA'
      );

      if (e.key === 'Enter' && !isInputFocused) {
        e.preventDefault();
        focusTableInput();
        return;
      }

      if (!isInputFocused && !e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && !e.key.startsWith('F')) {
        if (tableInputRef.current && !tableInputRef.current.disabled) {
          tableInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleCaptureKeyDown, true);
    return () => window.removeEventListener('keydown', handleCaptureKeyDown, true);
  }, [
    screenMode,
    tableInput,
    activeTableId,
    codeQuery,
    currentTableData.items,
    showSubTableMenu,
    printData,
    paxPrompt,
    activeModal,
    showCustomerModal,
    showCancelModal,
    orderDrafts,
    activeDraftIdx,
  ]);

  // Live dish search with section-aware rates
  useEffect(() => {
    if (!codeQuery.trim()) {
      if (isCancelMode) {
        const tableDishes = (currentTableData.items || []).filter(it => it.qty > 0 && !it.isCancelled);
        setSearchResults(tableDishes);
        setHighlightedIndex(0);
      } else {
        setSearchResults([]);
        setSelectedItem(null);
      }
      return;
    }

    if (isCancelMode) {
      const tableItems = (currentTableData.items || []).filter(it => it.qty > 0 && !it.isCancelled);
      const matches = tableItems.filter(it =>
        it.code.startsWith(codeQuery.trim()) ||
        it.name.toLowerCase().includes(codeQuery.trim().toLowerCase())
      );
      setSearchResults(matches);
      setHighlightedIndex(0);
    } else {
      const matches = searchMenuItems(codeQuery);
      setSearchResults(matches);
      setHighlightedIndex(0);
    }
  }, [codeQuery, isCancelMode, currentTableData.items]);

  // Helper for subtable options (A, B, C, +)
  const getSubTableOptions = (tableId) => {
    const base = String(tableId || activeTableId || '1').replace(/[A-Z]/g, '').trim().toUpperCase() || '1';
    return ['A', 'B', 'C', '+'];
  };

  const handleSelectSubTable = (st) => {
    const base = String(pendingCustomerTable || tableInput || activeTableId || '1').replace(/[A-Z]/g, '').trim().toUpperCase() || '1';
    setShowSubTableMenu(false);

    let chosenSub = st;
    if (st === '+') {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      chosenSub = 'A';
      for (const l of letters) {
        if (!tables[`${base}${l}`] || !tables[`${base}${l}`].items?.some(it => it.qty > 0 && !it.isCancelled)) {
          chosenSub = l;
          break;
        }
      }
    }

    setActiveSubTable(chosenSub);
    const full = `${base}${chosenSub}`;
    switchTable(full);
    setTableInput(full);

    if (screenMode === 'ORDER') {
      const tableCustName = tables[full]?.customerName || '';
      const tableCustPhone = tables[full]?.customerPhone || '';
      setCustomerName(tableCustName);
      setCustomerPhone(tableCustPhone);
      setPendingCustomerTable(full);
      setShowCustomerModal(true);
    } else {
      setMemoTableLoaded(full);
      focusTableInput();
    }
  };

  // Fire KOT, print thermal slip, and clear workspace
  const handleFireKOT = (tableId = activeTableId) => {
    if (!tableId) return;
    const table = tables[tableId];
    if (!table || !table.items || table.items.length === 0) return;

    printKOT(tableId);

    // Clear staged fields
    setTableInput('');
    switchTable('');
    setCustomerName('');
    setCustomerPhone('');
    setCodeQuery('');
    setSelectedItem(null);
    setQtyInput('1');
    setRateInput('');
    setCustomizationInput('');
    setShowSubTableMenu(false);
    setDoubleEnterBadge(null);

    // If more than 1 draft was open, close this draft
    if (orderDrafts.length > 1) {
      handleCloseDraft(null, activeDraftIdx);
    }

    focusTableInput();
  };

  // Handle table field enter -> Steps to Customer Details, or Cash Memo preview
  const handleTableKeyDown = (e) => {
    if (showSubTableMenu) {
      const opts = getSubTableOptions(tableInput || activeTableId);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSubTableIndex(prev => (prev + 1) % opts.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSubTableIndex(prev => (prev - 1 + opts.length) % opts.length);
        return;
      }
      if (e.key === '+' || e.key === 'Add') {
        e.preventDefault();
        handleSelectSubTable('+');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const chosen = opts[subTableIndex] || 'A';
        handleSelectSubTable(chosen);
        return;
      }
      if (e.key === 'Escape' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setShowSubTableMenu(false);
        return;
      }
    }

    // Hotkey '-' triggers dedicated Cancel Order / Items Modal!
    if (e.key === '-' || e.key === 'Subtract') {
      e.preventDefault();
      openCancelModal(activeTableId || tableInput);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const rawVal = e.target?.value !== undefined ? e.target.value : tableInput;
      const val = String(rawVal).trim().toUpperCase();

      // Empty Table + Enter toggles between New Order and Cash Memo
      if (!val) {
        setScreenMode(prev => prev === 'ORDER' ? 'CASH_MEMO' : 'ORDER');
        setDoubleEnterBadge(null);
        return;
      }

      let targetTable = val;
      if (val === '0') {
        targetTable = getNextParcelTable();
      } else if (val === '00') {
        if (screenMode === 'ORDER') {
          // Home Delivery: directly open Customer Details Modal without browser prompt or hardcoded names
          setPendingCustomerTable('00');
          setCustomerName('');
          setCustomerPhone('');
          setShowCustomerModal(true);
          return;
        } else {
          targetTable = deliveryTableNums[0] || '00 - GUEST';
        }
      }

      // CASH_MEMO Mode: 1st Enter loads preview; 2nd Enter opens PAX prompt
      if (screenMode === 'CASH_MEMO') {
        let resolvedTableId = targetTable;
        const hasItemsOnTarget = tables[targetTable]?.items?.some(it => it.qty > 0 && !it.isCancelled);
        if (!hasItemsOnTarget) {
          if (tables[`${targetTable}A`]?.items?.some(it => it.qty > 0 && !it.isCancelled)) {
            resolvedTableId = `${targetTable}A`;
          } else {
            const base = String(resolvedTableId).replace(/[A-Z]/g, '');
            if (base && tables[base]?.items?.some(it => it.qty > 0 && !it.isCancelled)) {
              resolvedTableId = base;
            }
          }
        }

        const tbl = tables[resolvedTableId];
        const hasItems = tbl && tbl.items && tbl.items.some(it => it.qty > 0 && !it.isCancelled);

        // If this table is ALREADY active or previewed, pressing Enter proceeds to PAX prompt!
        const isAlreadyPreviewed = (memoTableLoaded && String(memoTableLoaded).trim().toUpperCase() === String(resolvedTableId).trim().toUpperCase()) ||
                                   (activeTableId && String(activeTableId).trim().toUpperCase() === String(resolvedTableId).trim().toUpperCase());

        if (isAlreadyPreviewed && hasItems) {
          setPaxPrompt({
            show: true,
            tableId: resolvedTableId,
            onConfirm: (pax) => {
              printCashMemo(resolvedTableId, pax);
              setTableInput('');
              switchTable('');
              setCustomerName('');
              setCustomerPhone('');
              setMemoTableLoaded(null);
              focusTableInput();
            }
          });
          return;
        }

        // 1st Enter: Load table and show items in preview!
        switchTable(resolvedTableId);
        setTableInput(resolvedTableId);
        setMemoTableLoaded(resolvedTableId);

        if (!hasItems) {
          setMemoTableLoaded(null);
          focusTableInput();
        }
        return;
      }

      // ORDER Mode:
      const hasExplicitSub = Boolean(targetTable.match(/[A-Z]/));
      const subLetter = targetTable.replace(/[^A-Z]/g, '');

      // Check if table is ALREADY RUNNING with active items
      const isAlreadyRunning = !hasExplicitSub && Boolean(
        tables[targetTable]?.status === 'OCCUPIED' && tables[targetTable]?.items?.some(it => it.qty > 0 && !it.isCancelled)
      );

      // If typing the same table number that is ALREADY RUNNING, open the subtable selection menu!
      if (isAlreadyRunning) {
        setTableInput(targetTable);
        setPendingCustomerTable(targetTable);
        setActiveSubTable('A');
        setSubTableIndex(0);
        setShowSubTableMenu(true);
        return;
      }

      // If not running, or explicitly typed subtable (e.g. 23A):
      const targetTableId = targetTable;
      setActiveSubTable(subLetter || '');
      switchTable(targetTableId);
      setTableInput(targetTableId);
      setShowSubTableMenu(false);

      // Reset customer prefill so previous customer details never leak into a new bill/table
      const tableCustName = tables[targetTableId]?.customerName || '';
      const tableCustPhone = tables[targetTableId]?.customerPhone || '';
      setCustomerName(tableCustName);
      setCustomerPhone(tableCustPhone);

      // Prompt Customer Details modal before dish entry
      setPendingCustomerTable(targetTableId);
      setShowCustomerModal(true);
    }
  };

  // Callback when customer details confirmed or skipped
  const handleCustomerConfirm = (custData) => {
    const custName = custData?.name?.trim() || '';
    const custPhone = custData?.phone?.trim() || '';
    setCustomerName(custName);
    setCustomerPhone(custPhone);
    setShowCustomerModal(false);

    let targetTable = pendingCustomerTable || activeTableId || '1';
    if (targetTable === '00' || targetTable.startsWith('00')) {
      targetTable = custName ? `00 - ${custName.toUpperCase()}` : '00 - GUEST';
    }

    switchTable(targetTable);
    setTableInput(targetTable);
    updateTableCustomer?.(targetTable, custName, custPhone);

    // Update current draft
    setOrderDrafts(prev => {
      const updated = [...prev];
      if (updated[activeDraftIdx]) {
        updated[activeDraftIdx] = {
          ...updated[activeDraftIdx],
          tableId: targetTable,
          tableInput: targetTable,
          customerName: custName,
          customerPhone: custPhone,
        };
      }
      return updated;
    });

    // Direct progression to unified Code entry box!
    setTimeout(() => {
      focusCodeInput();
    }, 50);
  };

  const handleCustomerCancel = () => {
    setCustomerName('');
    setCustomerPhone('');
    setShowCustomerModal(false);
    let targetTable = pendingCustomerTable || activeTableId || '1';
    if (targetTable === '00' || targetTable.startsWith('00')) {
      targetTable = '00 - GUEST';
    }
    switchTable(targetTable);
    setTableInput(targetTable);
    setTimeout(() => {
      focusCodeInput();
    }, 50);
  };

  // Handle employee navigation
  const handleEmployeeKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      focusCodeInput();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusTableInput();
    }
  };

  // Select Item and resolve section-aware rate
  const selectItem = (item) => {
    setSelectedItem(item);
    setCodeQuery(item.code);
    const applicableRate = getApplicableRate(item, currentTableData.section);
    setRateInput(String(applicableRate));
    setSearchResults([]);
    setDoubleEnterBadge(null);

    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 40);
  };

  // Handle item code field enter / Double Enter for KOT!
  const handleCodeKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (searchResults.length > 0) {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % searchResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (searchResults.length > 0) {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
      }
    } else if (e.key === 'ArrowLeft') {
      if (!codeQuery.trim()) {
        e.preventDefault();
        employeeSelectRef.current?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      if (selectedItem) {
        e.preventDefault();
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // Double Enter on empty field fires KOT or Cash Memo!
      if (!codeQuery.trim()) {
        if (screenMode === 'ORDER') {
          if (doubleEnterBadge === 'KOT') {
            if (doubleEnterTimerRef.current) clearTimeout(doubleEnterTimerRef.current);
            setDoubleEnterBadge(null);
            handleFireKOT(activeTableId);
          } else {
            setDoubleEnterBadge('KOT');
            if (doubleEnterTimerRef.current) clearTimeout(doubleEnterTimerRef.current);
            doubleEnterTimerRef.current = setTimeout(() => {
              setDoubleEnterBadge(null);
            }, 3000);
          }
          return;
        } else {
          // In Cash Memo mode
          if (doubleEnterBadge === 'BILL') {
            if (doubleEnterTimerRef.current) clearTimeout(doubleEnterTimerRef.current);
            setDoubleEnterBadge(null);
            setPaxPrompt({
              show: true,
              tableId: activeTableId,
              onConfirm: (pax) => {
                printCashMemo(activeTableId, pax);
                setTableInput('');
                switchTable('');
                focusTableInput();
              }
            });
          } else {
            setDoubleEnterBadge('BILL');
            if (doubleEnterTimerRef.current) clearTimeout(doubleEnterTimerRef.current);
            doubleEnterTimerRef.current = setTimeout(() => {
              setDoubleEnterBadge(null);
            }, 3000);
          }
          return;
        }
      }

      setDoubleEnterBadge(null);
      const exactMatch = MENU_BY_CODE.get(codeQuery.trim());
      const chosen = exactMatch || searchResults[highlightedIndex];
      if (chosen) {
        selectItem(chosen);
      }
    } else if (e.key === 'Escape') {
      if (!codeQuery.trim()) {
        focusTableInput();
      } else {
        setCodeQuery('');
        setSearchResults([]);
        setDoubleEnterBadge(null);
      }
    } else {
      setDoubleEnterBadge(null);
    }
  };

  // Handle Qty field enter -> Immediately adds dish and jumps directly back to Code input!
  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitItemRow();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCodeInput();
    }
  };

  // Commit item row to active table
  const commitItemRow = () => {
    let itemToAdd = selectedItem;
    if (!itemToAdd) {
      const match = MENU_BY_CODE.get(codeQuery.trim());
      if (match) {
        itemToAdd = match;
        selectItem(match);
      }
    }
    if (!itemToAdd) return;

    const qty = Number(qtyInput) || 1;
    if (qty <= 0) return;

    const applicableRate = getApplicableRate(itemToAdd, currentTableData.section);
    const amount = qty * applicableRate;

    const itemRow = {
      code: itemToAdd.code,
      name: itemToAdd.name,
      qty,
      rate: applicableRate,
      amount,
      category: itemToAdd.category,
      categoryOrder: itemToAdd.categoryOrder,
      customization: customizationInput.trim(),
      isStaged: true,
      isCancelled: false,
      status: 'NEW',
    };

    addItemToActiveTable(itemRow);

    // Reset entry inputs and jump back to Code input
    setCodeQuery('');
    setSelectedItem(null);
    setQtyInput('1');
    setRateInput('');
    setCustomizationInput('');
    setDoubleEnterBadge(null);
    focusCodeInput();
  };

  // Calculations
  const totalItemsCount = (currentTableData.items || []).filter(it => it.qty > 0 && !it.isCancelled).length;
  const totalQtyCount = (currentTableData.items || []).reduce((s, it) => s + (it.qty > 0 && !it.isCancelled ? it.qty : 0), 0);
  const netAmount = (currentTableData.items || []).reduce((sum, it) => sum + (it.isCancelled ? 0 : it.amount), 0);
  const stagedCount = (currentTableData.items || []).filter(it => it.isStaged && it.qty > 0).length;

  // Real-time Running Tables filtering (GENERAL, FAMILY AC, PARCEL, HOME DELIVERY)
  const isRunningTable = (t) => {
    const hasActiveItems = t.items && t.items.some(it => it.qty > 0 && !it.isCancelled);
    return Boolean(hasActiveItems);
  };

  const generalTableNums = Object.values(tables)
    .filter(t => (t.section === 'GENERAL' || t.section === 'AC') && isRunningTable(t) && !t.id.startsWith('0'))
    .map(t => t.id);

  const familyAcTableNums = Object.values(tables)
    .filter(t => t.section === 'FAMILY AC' && isRunningTable(t))
    .map(t => t.id);

  const parcelTableNums = Object.values(tables)
    .filter(t => t.section === 'PARCEL' && isRunningTable(t))
    .map(t => t.id);

  const deliveryTableNums = Object.values(tables)
    .filter(t => t.section === 'HOME DELIVERY' && isRunningTable(t))
    .map(t => t.id);

  const windowTitle = isCancelMode 
    ? 'Cancel Order' 
    : (screenMode === 'ORDER' ? 'New Order' : 'Cash Memo');

  return (
    <div
      style={{
        height: 'calc(100vh - 48px)',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '4px',
        boxSizing: 'border-box',
      }}
    >
      {/* Centered, Compact Retro Sized Window Frame (Width ~860px, Height ~480px) */}
      <div
        className="win-window"
        style={{
          width: '860px',
          height: '480px',
          maxHeight: 'calc(100vh - 54px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
          background: '#ece9d8',
        }}
      >
        {/* Title Bar & Order Tabs */}
        <div
          className="win-titlebar"
          style={{
            background: isCancelMode 
              ? 'linear-gradient(90deg, #aa0000 0%, #dd4444 100%)' 
              : 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)',
            height: '24px',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Left: Window Title & Multi-Order Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="win-titlebar-title" style={{ fontSize: '11px', fontWeight: 'bold' }}>{windowTitle}</span>

            {/* Multi-Order Tabs Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
              {orderDrafts.map((draft, idx) => {
                const isActive = idx === activeDraftIdx;
                const draftLabel = draft.tableInput
                  ? `T${draft.tableInput}${draft.customerName ? ` (${draft.customerName})` : ''}`
                  : `Order ${idx + 1}`;
                return (
                  <div
                    key={draft.id || idx}
                    onClick={() => handleSwitchDraft(idx)}
                    title={`Switch to Tab ${idx + 1} (F1)`}
                    style={{
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      background: isActive ? '#ece9d8' : 'rgba(255,255,255,0.25)',
                      color: isActive ? '#000000' : '#ffffff',
                      borderTop: isActive ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
                      borderLeft: isActive ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
                      borderRight: isActive ? '2px solid #808080' : 'none',
                      borderBottom: isActive ? 'none' : '1px solid rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{draftLabel}</span>
                    {orderDrafts.length > 1 && (
                      <span
                        onClick={(e) => handleCloseDraft(e, idx)}
                        style={{ fontSize: '9px', fontWeight: 'bold', color: isActive ? '#aa0000' : '#fff' }}
                        title="Close Tab"
                      >
                        ×
                      </span>
                    )}
                  </div>
                );
              })}

              {orderDrafts.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddNewDraft}
                  title="Open New Order Tab (F1)"
                  style={{
                    background: 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    color: '#fff',
                    padding: '0 4px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    height: '18px',
                    fontWeight: 'bold',
                  }}
                >
                  + F1
                </button>
              )}
            </div>

            {/* Double Enter Prompt Badge */}
            {doubleEnterBadge && (
              <span
                style={{
                  background: '#ffff00',
                  color: '#000000',
                  fontWeight: 'bold',
                  padding: '1px 6px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  animation: 'pulse 1s infinite',
                }}
              >
                Press ↵ Enter again to {doubleEnterBadge === 'KOT' ? 'Fire KOT' : 'Print Memo'}
              </span>
            )}

            {stagedCount > 0 && !doubleEnterBadge && (
              <span style={{ color: '#ffff99', fontSize: '10px' }}>
                ({stagedCount} unprinted dishes staged - Press ↵↵ to Fire KOT)
              </span>
            )}
          </div>

          {/* Right: Quick Screen Switcher */}
          <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
            <span
              style={{ cursor: 'pointer', color: '#fff', textDecoration: 'underline' }}
              onClick={() => setScreenMode(screenMode === 'ORDER' ? 'CASH_MEMO' : 'ORDER')}
            >
              [F5 {screenMode === 'ORDER' ? 'Memo' : 'Order'}]
            </span>
          </div>
        </div>

        {/* Window Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4px 6px', background: '#ece9d8', overflow: 'hidden', minHeight: 0 }}>
          
          {/* Top Controls: Table, Customer, Employee */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Table</span>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    ref={tableInputRef}
                    id="pos-table-input"
                    disabled={screenMode !== 'ORDER' && screenMode !== 'CASH_MEMO'}
                    placeholder="Table"
                    type="text"
                    value={tableInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTableInput(val);
                      setShowSubTableMenu(false);
                      if (val !== memoTableLoaded) {
                        setMemoTableLoaded(null);
                      }
                    }}
                    onKeyDown={handleTableKeyDown}
                    className="win-input"
                    style={{ width: '70px', height: '22px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <div
                    onClick={() => {
                      setShowSubTableMenu(prev => !prev);
                      setSubTableIndex(0);
                    }}
                    title="Select Subtable (A, B, +)"
                    style={{
                      marginLeft: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      background: '#fff',
                      border: '1px solid #7f9db9',
                      height: '22px',
                      padding: '0 4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#0a246a',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{activeSubTable || '-'}</span>
                    <span style={{ fontSize: '8px', marginLeft: '2px' }}>▼</span>
                  </div>

                  {/* Subtable Dropdown Menu */}
                  {showSubTableMenu && (
                    <div
                      className="win-bevel-outset"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '72px',
                        width: '54px',
                        background: '#ece9d8',
                        zIndex: 900,
                        border: '2px solid #808080',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.4)',
                      }}
                    >
                      {getSubTableOptions(tableInput || activeTableId).map((st, idx) => {
                        const isPlus = st === '+';
                        const isHighlighted = idx === subTableIndex;
                        const base = String(tableInput || activeTableId || '1').replace(/[A-Z]/g, '').trim().toUpperCase() || '1';
                        return (
                          <div
                            key={st}
                            onClick={() => handleSelectSubTable(st)}
                            style={{
                              padding: '3px 4px',
                              cursor: 'pointer',
                              fontSize: isPlus ? '12px' : '11px',
                              fontWeight: 'bold',
                              background: isHighlighted ? '#0a246a' : (isPlus ? '#e0ffe0' : 'transparent'),
                              color: isHighlighted ? '#ffffff' : (isPlus ? '#006600' : '#000000'),
                              textAlign: 'center',
                              borderTop: isPlus ? '1px solid #aaa' : 'none',
                            }}
                            title={isPlus ? 'Create new subtable (+)' : `Select Subtable ${base}${st}`}
                          >
                            {st}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Name Box */}
              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Customer</span>
                <div
                  id="topbar-customer-name"
                  onClick={() => {
                    setPendingCustomerTable(activeTableId || tableInput);
                    setShowCustomerModal(true);
                  }}
                  title="Click to edit Customer Name and Number"
                  className="win-bevel-thin-inset"
                  style={{
                    height: '22px',
                    width: '110px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '16px',
                    fontWeight: customerName ? 'bold' : 'normal',
                    color: customerName ? '#000000' : '#777777',
                  }}
                >
                  {customerName || 'Guest'}
                </div>
              </div>

              {/* Customer Number Box */}
              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Number</span>
                <div
                  id="topbar-customer-phone"
                  onClick={() => {
                    setPendingCustomerTable(activeTableId || tableInput);
                    setShowCustomerModal(true);
                  }}
                  title="Click to edit Customer Name and Number"
                  className="win-bevel-thin-inset"
                  style={{
                    height: '22px',
                    width: '95px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '16px',
                    color: customerPhone ? '#000000' : '#777777',
                  }}
                >
                  {customerPhone || '-'}
                </div>
              </div>

              {/* Employee Dropdown */}
              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Employee</span>
                <select
                  ref={employeeSelectRef}
                  value={activeEmployee}
                  onChange={(e) => setActiveEmployee(e.target.value)}
                  onKeyDown={handleEmployeeKeyDown}
                  className="win-input"
                  style={{ height: '22px', width: '130px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Cash Memo preview notice */}
              {screenMode === 'CASH_MEMO' && memoTableLoaded && (
                <div style={{ marginLeft: '10px', fontSize: '11px', color: '#006600', fontWeight: 'bold', background: '#dcf5dc', padding: '2px 8px', border: '1px solid #99cc99' }}>
                  ✓ Table {memoTableLoaded} Preview Ready — Press [Enter] to Print Cash Memo!
                </div>
              )}
            </div>

            {/* Section Tag Indicator */}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a' }}>
                Section: {currentTableData.section === 'AC' ? 'GENERAL' : currentTableData.section}
              </span>
            </div>
          </div>

          {/* Main Body Split: Left Unified Grid + Right Live Tables Board */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', border: '1px solid #7f9db9', background: '#fff', overflow: 'hidden' }}>
            
            {/* Left: Unified Table Columns & Ordered Items Grid */}
            <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #7f9db9' }}>
              <table className="order-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {/* Row 1: Unified Table Column Headers */}
                  <tr>
                    <th style={{ width: '80px', textAlign: 'left' }}>Code</th>
                    <th style={{ textAlign: 'left' }}>Item Name</th>
                    <th style={{ width: '45px', textAlign: 'right' }}>Qty</th>
                    <th style={{ width: '55px', textAlign: 'right' }}>Rate</th>
                    <th style={{ width: '65px', textAlign: 'right' }}>Amount</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Action / Status</th>
                  </tr>

                  {/* Row 2: In-Table Input Controls (Only in ORDER mode) */}
                  {screenMode === 'ORDER' && (
                    <tr style={{ background: '#d4d0c8', borderBottom: '2px solid #808080' }}>
                      {/* Code Input & Autocomplete Dropdown */}
                      <td style={{ padding: '2px 3px', position: 'relative' }}>
                        <input
                          ref={codeInputRef}
                          type="text"
                          value={codeQuery}
                          onChange={(e) => setCodeQuery(e.target.value)}
                          onKeyDown={handleCodeKeyDown}
                          placeholder="Code/CTM"
                          className="win-input"
                          style={{ width: '100%', height: '22px', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        {/* Autocomplete dropdown anchored right under Code */}
                        {searchResults.length > 0 && (
                          <div
                            className="win-bevel-outset"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              width: '360px',
                              maxHeight: '220px',
                              overflowY: 'auto',
                              background: '#ffffff',
                              zIndex: 800,
                              padding: '2px',
                              boxShadow: '2px 2px 6px rgba(0,0,0,0.3)',
                            }}
                          >
                            {searchResults.map((item, idx) => {
                              const applicable = getApplicableRate(item, currentTableData.section);
                              return (
                                <div
                                  key={`${item.code}-${idx}`}
                                  onClick={() => selectItem(item)}
                                  style={{
                                    padding: '3px 6px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    background: idx === highlightedIndex ? '#0a246a' : 'transparent',
                                    color: idx === highlightedIndex ? '#ffffff' : '#000000',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span style={{ fontWeight: 'bold', width: '35px' }}>{item.code}</span>
                                  <span style={{ flex: 1 }}>{item.name}</span>
                                  <span style={{ width: '55px', textAlign: 'right' }}>₹{applicable.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Read-Only Selected Dish Name Display */}
                      <td style={{ padding: '2px 3px' }}>
                        <input
                          type="text"
                          readOnly
                          value={selectedItem?.name || ''}
                          placeholder="Dish Name (Type Code e.g. 1, Acronym CTM/CB, or search)"
                          className="win-input"
                          style={{ width: '100%', height: '22px', background: '#f5f5f5', fontSize: '11px' }}
                        />
                      </td>

                      {/* Qty Input */}
                      <td style={{ padding: '2px 3px' }}>
                        <input
                          ref={qtyInputRef}
                          type="text"
                          inputMode="numeric"
                          value={qtyInput}
                          onChange={(e) => setQtyInput(e.target.value.replace(/[^0-9]/g, ''))}
                          onKeyDown={handleQtyKeyDown}
                          placeholder="Qty"
                          className="win-input"
                          style={{ width: '100%', height: '22px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </td>

                      {/* Rate Display */}
                      <td style={{ padding: '2px 3px' }}>
                        <input
                          ref={rateInputRef}
                          type="text"
                          readOnly
                          tabIndex={-1}
                          value={rateInput}
                          placeholder="Rate"
                          className="win-input"
                          style={{
                            width: '100%',
                            height: '22px',
                            textAlign: 'right',
                            background: '#e0e0e0',
                            color: '#333333',
                            fontSize: '11px',
                          }}
                        />
                      </td>

                      {/* Calculated Amount */}
                      <td style={{ padding: '2px 6px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', color: '#006600', lineHeight: '22px' }}>
                        ₹{selectedItem ? (Number(rateInput || 0) * (Number(qtyInput) || 1)).toFixed(2) : '0.00'}
                      </td>

                      {/* Add Button */}
                      <td style={{ padding: '2px 3px', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="win-btn"
                          onClick={commitItemRow}
                          style={{ width: '100%', height: '22px', fontSize: '10px', fontWeight: 'bold' }}
                        >
                          Add (↵)
                        </button>
                      </td>
                    </tr>
                  )}
                </thead>

                {/* Table Body: Ordered Dishes */}
                <tbody>
                  {(currentTableData.items || []).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 10px', color: '#999999' }}>
                        {screenMode === 'ORDER'
                          ? `No items for Table ${activeTableId || '—'}. Type dish number or acronym (e.g. 1, CTM) and press Enter.`
                          : `Enter Table number above to preview items and print Cash Memo.`}
                      </td>
                    </tr>
                  ) : (
                    currentTableData.items.map((row, idx) => {
                      const isCancelled = row.qty < 0 || row.isCancelled;
                      const isStaged = row.isStaged;

                      return (
                        <tr key={idx} className={isCancelled ? 'order-row-cancelled' : (isStaged ? 'order-row-staged' : '')}>
                          <td style={{ color: isCancelled ? '#c00000' : '#0033aa', fontWeight: 'bold' }}>
                            {row.code}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>
                                {row.name}
                                {row.customization && (
                                  <span style={{ color: '#888888', fontStyle: 'italic', marginLeft: '6px' }}>
                                    ({row.customization})
                                  </span>
                                )}
                              </span>
                              {isCancelled && (
                                <span style={{ color: '#c00000', fontSize: '10px', fontWeight: 'bold' }}>
                                  [CANCELLED: {row.cancelReason || 'Customer Request'}]
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.qty}</td>
                          <td style={{ textAlign: 'right' }}>{Number(row.rate || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            {Number(row.amount || row.qty * row.rate || 0).toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isStaged ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                <span className="staged-badge" style={{ fontSize: '9px', padding: '1px 3px' }}>[NEW]</span>
                                <button
                                  className="win-btn"
                                  onClick={() => removeStagedItem(idx)}
                                  title="Remove item before firing KOT"
                                  style={{ padding: '0 3px', fontSize: '9px', height: '18px' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '10px', color: '#666666' }}>
                                KOT #{row.kotNo || 1}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Real-time Live Section Panels & Unsettled Bills */}
            <div style={{ width: '220px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', fontSize: '11px', borderLeft: '2px inset #ffffff' }}>
              
              {/* GENERAL Section (Tables 1 to 20) */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                  GENERAL ({generalTableNums.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', lineHeight: '1.4' }}>
                  {generalTableNums.length > 0 ? (
                    generalTableNums.map(num => {
                      const strNum = String(num);
                      const isMatch = activeTableId === num || activeTableId === strNum;

                      return (
                        <span
                          key={`gen-${num}`}
                          onClick={() => {
                            if (screenMode === 'CASH_MEMO') {
                              setActiveSubTable('');
                              switchTable(num);
                              setTableInput(String(num));
                              setMemoTableLoaded(String(num));
                              setShowSubTableMenu(false);
                              focusTableInput();
                            } else {
                              // ORDER Mode:
                              const isRunning = tables[num]?.status === 'OCCUPIED' &&
                                                tables[num]?.items?.some(it => it.qty > 0 && !it.isCancelled);

                              if (isRunning) {
                                setTableInput(String(num));
                                setActiveSubTable('A');
                                setSubTableIndex(0);
                                setShowSubTableMenu(true);
                                focusTableInput();
                              } else {
                                setActiveSubTable('');
                                switchTable(num);
                                setTableInput(String(num));
                                setShowSubTableMenu(false);
                                const tableCustName = tables[num]?.customerName || '';
                                const tableCustPhone = tables[num]?.customerPhone || '';
                                setCustomerName(tableCustName);
                                setCustomerPhone(tableCustPhone);
                                setPendingCustomerTable(String(num));
                                setShowCustomerModal(true);
                              }
                            }
                          }}
                          onDoubleClick={() => {
                            const strId = String(num);
                            if (screenMode === 'CASH_MEMO') {
                              const tbl = tables[strId];
                              if (tbl?.items?.some(it => it.qty > 0 && !it.isCancelled)) {
                                setPaxPrompt({
                                  show: true,
                                  tableId: strId,
                                  onConfirm: (pax) => {
                                    printCashMemo(strId, pax);
                                    setTableInput('');
                                    switchTable('');
                                    setMemoTableLoaded(null);
                                    focusTableInput();
                                  }
                                });
                              }
                            } else {
                              const tbl = tables[strId];
                              const staged = tbl?.items?.filter(it => it.isStaged && it.qty > 0) || [];
                              if (staged.length > 0) {
                                handleFireKOT(strId);
                              } else {
                                switchTable(strId);
                                setTableInput(strId);
                                focusCodeInput();
                              }
                            }
                          }}
                          title={`Click to view dishes for Table ${num}`}
                          style={{
                            cursor: 'pointer',
                            padding: '1px 5px',
                            fontWeight: 'bold',
                            background: isMatch ? '#0a246a' : '#e4ebf5',
                            color: isMatch ? '#ffffff' : '#000000',
                            border: '1px solid',
                            borderColor: isMatch ? '#001a4d' : '#b0c4de',
                            borderRadius: '2px',
                          }}
                        >
                          {num}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: '#888' }}>None</span>
                  )}
                </div>
              </div>

              {/* FAMILY AC Section (Tables 21 to 40) */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                  FAMILY AC ({familyAcTableNums.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', lineHeight: '1.4' }}>
                  {familyAcTableNums.length > 0 ? (
                    familyAcTableNums.map(num => {
                      const strNum = String(num);
                      const isMatch = activeTableId === num || activeTableId === strNum;

                      return (
                        <span
                          key={`family-${num}`}
                          onClick={() => {
                            if (screenMode === 'CASH_MEMO') {
                              setActiveSubTable('');
                              switchTable(num);
                              setTableInput(String(num));
                              setMemoTableLoaded(String(num));
                              setShowSubTableMenu(false);
                              focusTableInput();
                            } else {
                              // ORDER Mode:
                              const isRunning = tables[num]?.status === 'OCCUPIED' &&
                                                tables[num]?.items?.some(it => it.qty > 0 && !it.isCancelled);

                              if (isRunning) {
                                setTableInput(String(num));
                                setActiveSubTable('A');
                                setSubTableIndex(0);
                                setShowSubTableMenu(true);
                                focusTableInput();
                              } else {
                                setActiveSubTable('');
                                switchTable(num);
                                setTableInput(String(num));
                                setShowSubTableMenu(false);
                                const tableCustName = tables[num]?.customerName || '';
                                const tableCustPhone = tables[num]?.customerPhone || '';
                                setCustomerName(tableCustName);
                                setCustomerPhone(tableCustPhone);
                                setPendingCustomerTable(String(num));
                                setShowCustomerModal(true);
                              }
                            }
                          }}
                          onDoubleClick={() => {
                            const strId = String(num);
                            if (screenMode === 'CASH_MEMO') {
                              const tbl = tables[strId];
                              if (tbl?.items?.some(it => it.qty > 0 && !it.isCancelled)) {
                                setPaxPrompt({
                                  show: true,
                                  tableId: strId,
                                  onConfirm: (pax) => {
                                    printCashMemo(strId, pax);
                                    setTableInput('');
                                    switchTable('');
                                    setMemoTableLoaded(null);
                                    focusTableInput();
                                  }
                                });
                              }
                            } else {
                              const tbl = tables[strId];
                              const staged = tbl?.items?.filter(it => it.isStaged && it.qty > 0) || [];
                              if (staged.length > 0) {
                                handleFireKOT(strId);
                              } else {
                                switchTable(strId);
                                setTableInput(strId);
                                focusCodeInput();
                              }
                            }
                          }}
                          title={`Click to view dishes for Family Table ${num}`}
                          style={{
                            cursor: 'pointer',
                            padding: '1px 5px',
                            fontWeight: 'bold',
                            background: isMatch ? '#0a246a' : '#e4ebf5',
                            color: isMatch ? '#ffffff' : '#000000',
                            border: '1px solid',
                            borderColor: isMatch ? '#001a4d' : '#b0c4de',
                            borderRadius: '2px',
                          }}
                        >
                          {num}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: '#888' }}>None</span>
                  )}
                </div>
              </div>

              {/* HOME DELIVERY Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                  HOME DELIVERY ({deliveryTableNums.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {deliveryTableNums.length > 0 ? (
                    deliveryTableNums.map(name => (
                      <div
                        key={`deliv-${name}`}
                        onClick={() => {
                          if (screenMode === 'CASH_MEMO') {
                            switchTable(name);
                            setTableInput(name);
                            setMemoTableLoaded(name);
                            focusTableInput();
                          } else {
                            switchTable(name);
                            setTableInput(name);
                            setShowSubTableMenu(false);
                            const tbl = tables[name];
                            const extracted = name.replace(/^00\s*-\s*/, '');
                            setCustomerName(tbl?.customerName || (extracted !== 'GUEST' ? extracted : ''));
                            setCustomerPhone(tbl?.customerPhone || '');
                          }
                        }}
                        onDoubleClick={() => {
                          if (screenMode === 'CASH_MEMO') {
                            const tbl = tables[name];
                            if (tbl?.items?.some(it => it.qty > 0 && !it.isCancelled)) {
                              setPaxPrompt({
                                show: true,
                                tableId: name,
                                onConfirm: (pax) => {
                                  printCashMemo(name, pax);
                                  setTableInput('');
                                  switchTable('');
                                  setMemoTableLoaded(null);
                                  focusTableInput();
                                }
                              });
                            }
                          } else {
                            const tbl = tables[name];
                            const staged = tbl?.items?.filter(it => it.isStaged && it.qty > 0) || [];
                            if (staged.length > 0) {
                              handleFireKOT(name);
                            } else {
                              switchTable(name);
                              setTableInput(name);
                              focusCodeInput();
                            }
                          }
                        }}
                        title={`Click to view dishes for ${name}`}
                        style={{
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontWeight: 'bold',
                          background: activeTableId === name ? '#0a246a' : '#ffffff',
                          color: activeTableId === name ? '#ffffff' : '#000000',
                          border: '1px solid',
                          borderColor: activeTableId === name ? '#001a4d' : '#cccccc',
                          borderRadius: '2px',
                        }}
                      >
                        {name}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>None</span>
                  )}
                </div>
              </div>

              {/* PARCEL Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                  PARCEL ({parcelTableNums.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', lineHeight: '1.4' }}>
                  {parcelTableNums.length > 0 ? (
                    parcelTableNums.map(num => (
                      <span
                        key={`parcel-${num}`}
                        onClick={() => {
                          if (screenMode === 'CASH_MEMO') {
                            switchTable(num);
                            setTableInput(num);
                            setMemoTableLoaded(num);
                            focusTableInput();
                          } else {
                            switchTable(num);
                            setTableInput(num);
                            setShowSubTableMenu(false);
                            const tbl = tables[num];
                            setCustomerName(tbl?.customerName || '');
                            setCustomerPhone(tbl?.customerPhone || '');
                          }
                        }}
                        onDoubleClick={() => {
                          const strId = String(num);
                          if (screenMode === 'CASH_MEMO') {
                            const tbl = tables[strId];
                            if (tbl?.items?.some(it => it.qty > 0 && !it.isCancelled)) {
                              setPaxPrompt({
                                show: true,
                                tableId: strId,
                                onConfirm: (pax) => {
                                  printCashMemo(strId, pax);
                                  setTableInput('');
                                  switchTable('');
                                  setMemoTableLoaded(null);
                                  focusTableInput();
                                }
                              });
                            }
                          } else {
                            const tbl = tables[strId];
                            const staged = tbl?.items?.filter(it => it.isStaged && it.qty > 0) || [];
                            if (staged.length > 0) {
                              handleFireKOT(strId);
                            } else {
                              switchTable(strId);
                              setTableInput(strId);
                              focusCodeInput();
                            }
                          }
                        }}
                        title={`Click to view dishes for Parcel ${num}`}
                        style={{
                          cursor: 'pointer',
                          padding: '1px 5px',
                          fontWeight: 'bold',
                          background: activeTableId === num ? '#0a246a' : '#f0f0f0',
                          color: activeTableId === num ? '#ffffff' : '#000000',
                          border: '1px solid',
                          borderColor: activeTableId === num ? '#001a4d' : '#cccccc',
                          borderRadius: '2px',
                        }}
                      >
                        {num}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>None</span>
                  )}
                </div>
              </div>

              {/* Unsettled Bills in Red */}
              <div style={{ padding: '4px 6px', background: '#fff', flex: 1, overflowY: 'auto' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#c00000', marginBottom: '3px' }}>
                  Unsettled Bills ({unsettledBills.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {unsettledBills.length > 0 ? (
                    unsettledBills.map((b, i) => (
                      <span
                        key={i}
                        onClick={() => {
                          openSettleModal(b.table, b.billNo);
                        }}
                        title={`Click to settle Bill #${b.billNo} on Table ${b.table} (₹${b.amount})`}
                        style={{
                          cursor: 'pointer',
                          padding: '2px 5px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: activeTableId === b.table ? '#c00000' : '#ffeaea',
                          color: activeTableId === b.table ? '#ffffff' : '#990000',
                          border: '1px solid',
                          borderColor: activeTableId === b.table ? '#800000' : '#ffb3b3',
                          borderRadius: '2px',
                        }}
                      >
                        {b.table}({b.billNo}, {b.amount})
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#888', fontStyle: 'italic', fontSize: '10px' }}>No unsettled bills</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar: Total Items, Qty, Net Amount, Action Buttons */}
          <div
            style={{
              height: '30px',
              background: '#d4d0c8',
              borderTop: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              marginTop: '3px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 'bold' }}>
              <span>Items: <b style={{ color: '#0a246a' }}>{totalItemsCount}</b></span>
              <span>Total Qty: <b style={{ color: '#0a246a' }}>{totalQtyCount}</b></span>
              <span>Net Amount: <b style={{ color: '#006600', fontSize: '13px' }}>₹{netAmount.toFixed(2)}</b></span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Cancel Button */}
              <button
                type="button"
                className="win-btn"
                onClick={() => openCancelModal(activeTableId)}
                title="Cancel selective items or entire table (-)"
                style={{ height: '24px', fontSize: '11px', color: '#aa0000' }}
              >
                Cancel (-)
              </button>

              {/* Fire KOT Button */}
              {screenMode === 'ORDER' && (
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => handleFireKOT(activeTableId)}
                  disabled={stagedCount === 0}
                  style={{
                    height: '24px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: stagedCount > 0 ? '#dcf5dc' : '#ece9d8',
                  }}
                >
                  Fire KOT (↵↵)
                </button>
              )}

              {/* Cash Memo Button */}
              {screenMode === 'CASH_MEMO' && (
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => {
                    if (activeTableId) {
                      setPaxPrompt({
                        show: true,
                        tableId: activeTableId,
                        onConfirm: (pax) => {
                          printCashMemo(activeTableId, pax);
                          setTableInput('');
                          switchTable('');
                          focusTableInput();
                        }
                      });
                    }
                  }}
                  style={{ height: '24px', fontSize: '11px', fontWeight: 'bold', background: '#dcf5dc' }}
                >
                  Print Bill (F6)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details Modal Prompt */}
      <CustomerDetailsModal
        show={showCustomerModal}
        tableId={pendingCustomerTable}
        initialName={customerName}
        initialPhone={customerPhone}
        onConfirm={handleCustomerConfirm}
        onCancel={handleCustomerCancel}
      />
    </div>
  );
}
