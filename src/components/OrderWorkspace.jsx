import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { EMPLOYEES, CANCEL_REASONS } from '../data/initialData';
import { searchMenuItems, MENU_BY_CODE } from '../data/menuService';

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
    currentTableData,
    unsettledBills,
    switchTable,
    addItemToActiveTable,
    removeStagedItem,
    setShowCancelAuthModal,
    setPendingCancelDetails,
    printKOT,
    printCashMemo,
    openSettleModal,
    getNextParcelTable,
    setPaxPrompt,
  } = usePos();

  // Active entry row inputs
  const [tableInput, setTableInput] = useState(activeTableId);
  const [showSubTableMenu, setShowSubTableMenu] = useState(false);
  const [codeQuery, setCodeQuery] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [rateInput, setRateInput] = useState('');
  const [customizationInput, setCustomizationInput] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState(CANCEL_REASONS[0]);

  // Selected item object from search
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Field focus references for seamless Enter progression
  const tableInputRef = useRef(null);
  const employeeSelectRef = useRef(null);
  const codeInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const rateInputRef = useRef(null);
  const customInputRef = useRef(null);
  const cancelReasonRef = useRef(null);

  // Synchronize table input
  useEffect(() => {
    setTableInput(activeTableId);
  }, [activeTableId]);

  // Focus table input on mount, screen mode switch, or global focus event
  useEffect(() => {
    tableInputRef.current?.focus();
    tableInputRef.current?.select();
  }, [screenMode]);

  useEffect(() => {
    const handleFocusTable = () => {
      setTimeout(() => {
        tableInputRef.current?.focus();
        tableInputRef.current?.select();
      }, 50);
    };
    window.addEventListener('inamdar-focus-table', handleFocusTable);
    return () => window.removeEventListener('inamdar-focus-table', handleFocusTable);
  }, []);

  // Update search results when codeQuery changes
  useEffect(() => {
    if (!codeQuery.trim()) {
      // In Cancel Mode: show all active dishes on current table by default!
      if (isCancelMode) {
        const tableDishes = currentTableData.items.filter(it => it.qty > 0);
        setSearchResults(tableDishes);
        setHighlightedIndex(0);
      } else {
        setSearchResults([]);
        setSelectedItem(null);
      }
      return;
    }

    if (isCancelMode) {
      // Strictly filter to dishes ordered on this table (Rule 4 & cancel order video)
      const tableItems = currentTableData.items.filter(it => it.qty > 0);
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

  // Handle table field enter -> Steps to Employee dropdown or toggles screen or prompts Pax
  const handleTableKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tableInput.trim();
      
      // vid1 & vid2: Empty Table + Enter toggles between New Order and New Cash Memo!
      if (!val) {
        setScreenMode(prev => prev === 'ORDER' ? 'CASH_MEMO' : 'ORDER');
        return;
      }

      // vid1 & vid2: In Cash Memo mode, entering table triggers Number of Persons prompt
      if (screenMode === 'CASH_MEMO') {
        let targetTable = val;
        if (targetTable === '0') {
          targetTable = '0';
        }
        switchTable(targetTable);
        setPaxPrompt({
          show: true,
          tableId: targetTable,
          onConfirm: (pax) => {
            printCashMemo(targetTable, pax);
            setTableInput('');
            setTimeout(() => {
              tableInputRef.current?.focus();
            }, 60);
          }
        });
        return;
      }

      if (val === '0') {
        const nextParcel = getNextParcelTable();
        switchTable(nextParcel);
        setTableInput(nextParcel);
      } else if (val === '00') {
        const custName = prompt("Enter Home Delivery Customer Name:", "MOOSA") || "GUEST";
        const delivKey = `00 - ${custName.toUpperCase()}`;
        switchTable(delivKey);
        setTableInput(delivKey);
      } else {
        switchTable(val);
      }
      // Progression: Table ➔ Employee!
      employeeSelectRef.current?.focus();
    }
  };

  // Handle employee field enter -> Steps to Code input!
  const handleEmployeeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Progression: Employee ➔ Code!
      codeInputRef.current?.focus();
    }
  };

  // Handle item code field enter / navigation
  const handleCodeKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setHighlightedIndex(prev => (prev + 1) % searchResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setHighlightedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Double Enter on empty field fires KOT or Cash Memo!
      if (!codeQuery.trim()) {
        if (screenMode === 'ORDER') {
          printKOT(activeTableId);
          setTimeout(() => {
            tableInputRef.current?.focus();
            tableInputRef.current?.select();
          }, 60);
        } else {
          setPaxPrompt({
            show: true,
            tableId: activeTableId,
            onConfirm: (pax) => {
              printCashMemo(activeTableId, pax);
              setTimeout(() => {
                tableInputRef.current?.focus();
                tableInputRef.current?.select();
              }, 60);
            }
          });
        }
        return;
      }

      const chosen = searchResults[highlightedIndex] || MENU_BY_CODE.get(codeQuery.trim());
      if (chosen) {
        selectItem(chosen);
      }
    } else if (e.key === 'Escape') {
      if (!codeQuery.trim()) {
        tableInputRef.current?.focus();
        tableInputRef.current?.select();
      } else {
        setCodeQuery('');
        setSearchResults([]);
      }
    }
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setCodeQuery(item.code);
    const applicableRate = currentTableData.section.includes('AC') ? (item.acRate || item.rate) : (item.hallRate || item.rate);
    setRateInput(String(applicableRate));
    setSearchResults([]);

    // Set default Qty and advance focus: Code ➔ Qty!
    setQtyInput('1');
    qtyInputRef.current?.focus();
    qtyInputRef.current?.select();
  };

  // Qty enter -> Progression: Qty ➔ Rate!
  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      rateInputRef.current?.focus();
    }
  };

  // Rate enter -> Progression: Rate ➔ Customization (or Reason in cancel mode)!
  const handleRateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCancelMode) {
        cancelReasonRef.current?.focus();
      } else {
        customInputRef.current?.focus();
      }
    }
  };

  // Customization enter -> Commits row and loops back: Customization ➔ Code!
  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitItemRow();
    }
  };

  const commitItemRow = () => {
    if (!selectedItem) return;

    addItemToActiveTable({
      ...selectedItem,
      qty: Number(qtyInput) || 1,
      rate: Number(rateInput) || selectedItem.acRate,
      customization: customizationInput,
    });

    setCodeQuery('');
    setSelectedItem(null);
    setQtyInput('1');
    setRateInput('');
    setCustomizationInput('');
    // Continuous blind entry: loops focus back to Code input!
    codeInputRef.current?.focus();
  };

  const handleCancelReasonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!selectedItem) return;

      setPendingCancelDetails({
        tableId: activeTableId,
        itemCode: selectedItem.code,
        qty: Number(qtyInput) || 1,
        reason: cancelReasonInput,
      });
      setShowCancelAuthModal(true);
    }
  };

  // Calculations
  const totalItemsCount = currentTableData.items.filter(it => it.qty > 0).length;
  const totalQtyCount = currentTableData.items.reduce((s, it) => s + (it.qty > 0 ? it.qty : 0), 0);
  const netAmount = currentTableData.items.reduce((sum, it) => sum + it.amount, 0);

  // Staged / unprinted items count
  const stagedCount = currentTableData.items.filter(it => it.isStaged && it.qty > 0).length;

  // Group active tables for the integrated right status pane
  const acTableNums = Object.values(tables)
    .filter(t => t.section === 'AC' && t.items && t.items.some(it => it.qty > 0) && !t.id.startsWith('0'))
    .map(t => t.id);

  const familyAcTableNums = Object.values(tables)
    .filter(t => t.section === 'FAMILY AC' && t.items && t.items.some(it => it.qty > 0))
    .map(t => t.id);

  const parcelTableNums = Object.values(tables)
    .filter(t => t.section === 'PARCEL' && t.items && t.items.some(it => it.qty > 0))
    .map(t => t.id);

  const deliveryTableNums = Object.values(tables)
    .filter(t => t.section === 'HOME DELIVERY' && t.items && t.items.some(it => it.qty > 0))
    .map(t => t.id);

  // Window title depending on state
  const windowTitle = isCancelMode 
    ? 'Cancel Order' 
    : (screenMode === 'ORDER' ? 'New Order' : 'New Cash Memo');

  return (
    <div style={{
      height: 'calc(100vh - 48px)',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#6c8fa8',
      padding: '10px'
    }}>
      {/* Centered, Authentic Sized Window Frame (Width ~850px, Height ~530px) */}
      <div className="win-window" style={{
        width: '850px',
        height: '530px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
        background: '#ece9d8'
      }}>
        {/* Title Bar */}
        <div className="win-titlebar" style={{
          background: isCancelMode 
            ? 'linear-gradient(90deg, #aa0000 0%, #dd4444 100%)' 
            : 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)',
          height: '24px',
          padding: '2px 8px'
        }}>
          <div className="win-titlebar-title" style={{ fontSize: '12px' }}>
            <span>{windowTitle}</span>
            {isCancelMode && <span style={{ color: '#ffff00', marginLeft: '10px' }}>[CANCELLATION MODE]</span>}
            {stagedCount > 0 && (
              <span style={{ color: '#ffff99', marginLeft: '10px', fontSize: '11px' }}>
                ({stagedCount} unprinted items staged - Press ↵↵ to Fire KOT)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
            <span style={{ cursor: 'pointer', color: '#fff', textDecoration: 'underline' }} onClick={() => setScreenMode(screenMode === 'ORDER' ? 'CASH_MEMO' : 'ORDER')}>
              [F5 {screenMode === 'ORDER' ? 'Memo' : 'Order'}]
            </span>
          </div>
        </div>

        {/* Window Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', background: '#ece9d8', overflow: 'hidden' }}>
          
          {/* Top Controls: Table, Employee, Terminal Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>Table</span>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    ref={tableInputRef}
                    id="pos-table-input"
                    placeholder="Table"
                    type="text"
                    value={tableInput}
                    onChange={(e) => {
                      setTableInput(e.target.value);
                      setShowSubTableMenu(false);
                    }}
                    onKeyDown={handleTableKeyDown}
                    className="win-input"
                    style={{ width: '80px', height: '24px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <div
                    style={{
                      marginLeft: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: '#0a246a',
                      color: '#ffffff',
                      width: '26px',
                      height: '24px',
                      cursor: 'pointer',
                      border: '1px solid #000000',
                      userSelect: 'none',
                    }}
                    onClick={() => setShowSubTableMenu(prev => !prev)}
                    title="Select Subtable (A, B, +)"
                  >
                    <span>{activeSubTable}</span>
                    <span style={{ fontSize: '7px', marginLeft: '2px' }}>▼</span>
                  </div>

                  {/* Vid 8: Subtable Dropdown Menu (A, B, +) */}
                  {showSubTableMenu && (
                    <div
                      className="win-bevel-outset"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '82px',
                        width: '46px',
                        background: '#ece9d8',
                        zIndex: 900,
                        border: '2px solid #808080',
                        boxShadow: '2px 2px 5px rgba(0,0,0,0.4)',
                      }}
                    >
                      {['A', 'B'].map(st => (
                        <div
                          key={st}
                          onClick={() => {
                            setActiveSubTable(st);
                            setShowSubTableMenu(false);
                            const base = tableInput.replace(/[A-Z]/g, '');
                            const full = st === 'A' ? base : `${base}${st}`;
                            switchTable(full);
                            setTableInput(full);
                          }}
                          style={{
                            padding: '3px 4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: activeSubTable === st ? '#0a246a' : 'transparent',
                            color: activeSubTable === st ? '#ffffff' : '#000000',
                            textAlign: 'center',
                          }}
                        >
                          {st}
                        </div>
                      ))}
                      <div
                        onClick={() => {
                          setShowSubTableMenu(false);
                          const base = tableInput.replace(/[A-Z]/g, '') || activeTableId.replace(/[A-Z]/g, '');
                          const letters = ['B', 'C', 'D', 'E'];
                          let nextLetter = 'B';
                          for (const l of letters) {
                            if (!tables[`${base}${l}`]) {
                              nextLetter = l;
                              break;
                            }
                          }
                          const newSubId = `${base}${nextLetter}`;
                          setActiveSubTable(nextLetter);
                          switchTable(newSubId);
                          setTableInput(newSubId);
                        }}
                        style={{
                          padding: '3px 4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#006600',
                          borderTop: '1px solid #aaa',
                          textAlign: 'center',
                          background: '#e0ffe0',
                        }}
                        title="Create new subtable (+)"
                      >
                        +
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>Employee</span>
                <select
                  ref={employeeSelectRef}
                  value={activeEmployee}
                  onChange={(e) => setActiveEmployee(e.target.value)}
                  onKeyDown={handleEmployeeKeyDown}
                  className="win-input"
                  style={{ width: '150px', height: '24px', fontSize: '12px' }}
                >
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '11px', marginTop: '14px', color: '#0033aa', fontWeight: 'bold' }}>
                Section: {currentTableData.section}
              </div>
            </div>

            {/* Terminal Printer Icon with black 'X' in Cancel Mode */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '6px' }}>
              <div style={{ fontSize: '28px' }}>🖨️</div>
              {isCancelMode && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '-4px',
                  color: '#000000',
                  fontSize: '38px',
                  fontWeight: '900',
                  lineHeight: '1',
                  userSelect: 'none',
                  textShadow: '0 0 3px #ff0000'
                }}>
                  ✕
                </div>
              )}
            </div>
          </div>

          {/* Quick Item Input Row: Strict progression Table ➔ Employee ➔ Code ➔ Qty ➔ Rate ➔ Customization */}
          <div style={{
            display: 'flex',
            gap: '3px',
            marginBottom: '4px',
            background: '#d4d0c8',
            padding: '3px 4px',
            border: '1px solid #999'
          }}>
            <div style={{ width: '80px', position: 'relative' }}>
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
              {/* Autocomplete dropdown */}
              {searchResults.length > 0 && (
                <div className="win-bevel-outset" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '340px',
                  maxHeight: '210px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  zIndex: 800,
                  padding: '2px',
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {searchResults.map((item, idx) => (
                    <div
                      key={item.code}
                      onClick={() => selectItem(item)}
                      style={{
                        padding: '3px 6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        background: idx === highlightedIndex ? '#0a246a' : 'transparent',
                        color: idx === highlightedIndex ? '#ffffff' : '#000000',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', width: '35px' }}>{item.code}</span>
                      <span style={{ flex: 1 }}>{item.name}</span>
                      <span style={{ width: '45px', textAlign: 'right' }}>₹{currentTableData.section.includes('AC') ? (item.acRate || item.rate) : (item.hallRate || item.rate)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <input
                type="text"
                readOnly
                value={selectedItem?.name || ''}
                placeholder="Dish name (Type Code, Acronym e.g. CTM/CB, or Text)"
                className="win-input"
                style={{ width: '100%', height: '22px', background: '#f4f4f4', fontSize: '11px' }}
              />
            </div>

            <div style={{ width: '45px' }}>
              <input
                ref={qtyInputRef}
                type="number"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onKeyDown={handleQtyKeyDown}
                placeholder="Qty"
                className="win-input"
                style={{ width: '100%', height: '22px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}
              />
            </div>

            <div style={{ width: '55px' }}>
              <input
                ref={rateInputRef}
                type="text"
                readOnly
                value={rateInput}
                onKeyDown={handleRateKeyDown}
                placeholder="Rate"
                className="win-input"
                style={{ width: '100%', height: '22px', textAlign: 'right', background: '#f4f4f4', fontSize: '11px', cursor: 'pointer' }}
                title="Press Enter to proceed to Customization"
              />
            </div>

            {isCancelMode ? (
              <div style={{ width: '170px' }}>
                <select
                  ref={cancelReasonRef}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  onKeyDown={handleCancelReasonKeyDown}
                  className="win-input"
                  style={{ width: '100%', height: '22px', fontSize: '10px', color: '#c00000', fontWeight: 'bold' }}
                >
                  {CANCEL_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ width: '120px' }}>
                <input
                  ref={customInputRef}
                  id="pos-custom-input"
                  type="text"
                  value={customizationInput}
                  onChange={(e) => setCustomizationInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="Custom / ↵"
                  className="win-input"
                  style={{ width: '100%', height: '22px', fontSize: '11px' }}
                />
              </div>
            )}
          </div>

          {/* Main Body Split: Left Items Grid + Right Live Tables Board */}
          <div style={{ flex: 1, display: 'flex', border: '1px solid #7f9db9', background: '#fff', overflow: 'hidden' }}>
            
            {/* Left: Ordered Items Grid */}
            <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #7f9db9' }}>
              <table className="order-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Code</th>
                    <th>Item Name</th>
                    <th style={{ width: '45px', textAlign: 'right' }}>Qty</th>
                    <th style={{ width: '55px', textAlign: 'right' }}>Rate</th>
                    <th style={{ width: '65px', textAlign: 'right' }}>Amount</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTableData.items.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px 10px', color: '#999999' }}>
                        No items for Table {activeTableId}. Type item code or acronym (e.g. CTM, CB, 1) and press Enter.
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
                            {row.name}
                            {row.customization && <span style={{ color: '#666', fontStyle: 'italic', marginLeft: '6px' }}>({row.customization})</span>}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.qty}</td>
                          <td style={{ textAlign: 'right' }}>{row.rate}</td>
                          <td style={{ textAlign: 'right' }}>{row.amount.toFixed(2)}</td>
                          <td style={{ textAlign: 'center', fontSize: '10px' }}>
                            {isCancelled ? (
                              <span style={{ color: '#c00000', fontWeight: 'bold' }}>CANCELLED</span>
                            ) : isStaged ? (
                              <span style={{
                                color: '#b45309',
                                background: '#fef3c7',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                [NEW]
                                <span
                                  onClick={() => removeStagedItem(idx)}
                                  style={{ cursor: 'pointer', color: '#aa0000', fontWeight: 'bold', marginLeft: '2px' }}
                                  title="Delete unstaged item"
                                >
                                  ✕
                                </span>
                              </span>
                            ) : (
                              <span style={{ color: '#006600', fontWeight: 'bold' }}>
                                KOT #{row.kotNo || '✓'}
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

            {/* Right: Real-time Live Section Panels */}
            <div style={{ width: '220px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', fontSize: '11px', borderLeft: '2px inset #ffffff' }}>
              {/* AC Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                  AC
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', lineHeight: '1.4' }}>
                  {acTableNums.length > 0 ? (
                    acTableNums.map(num => (
                      <span
                        key={`ac-${num}`}
                        onClick={() => switchTable(num)}
                        title={`Click to view dishes for Table ${num}`}
                        style={{
                          cursor: 'pointer',
                          padding: '1px 5px',
                          fontWeight: 'bold',
                          background: activeTableId === num ? '#0a246a' : '#e4ebf5',
                          color: activeTableId === num ? '#ffffff' : '#000000',
                          border: '1px solid',
                          borderColor: activeTableId === num ? '#001a4d' : '#b0c4de',
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

              {/* FAMILY AC Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                  FAMILY AC
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', lineHeight: '1.4' }}>
                  {familyAcTableNums.length > 0 ? (
                    familyAcTableNums.map(num => (
                      <span
                        key={`family-${num}`}
                        onClick={() => switchTable(num)}
                        title={`Click to view dishes for Family Table ${num}`}
                        style={{
                          cursor: 'pointer',
                          padding: '1px 5px',
                          fontWeight: 'bold',
                          background: activeTableId === num ? '#0a246a' : '#e4ebf5',
                          color: activeTableId === num ? '#ffffff' : '#000000',
                          border: '1px solid',
                          borderColor: activeTableId === num ? '#001a4d' : '#b0c4de',
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
                        onClick={() => switchTable(name)}
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
                        onClick={() => switchTable(num)}
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
                          switchTable(b.table);
                          openSettleModal(b.table);
                        }}
                        title={`Click to settle Table ${b.table} bill ${b.billNo} (₹${b.amount})`}
                        style={{
                          cursor: 'pointer',
                          padding: '2px 5px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          background: activeTableId === b.table ? '#c00000' : '#ffeaea',
                          color: activeTableId === b.table ? '#ffffff' : '#990000',
                          border: '1px solid',
                          borderColor: activeTableId === b.table ? '#660000' : '#ffb3b3',
                          borderRadius: '2px',
                        }}
                      >
                        {b.table}({b.billNo}, {b.amount})
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 8px',
            marginTop: '4px',
            background: '#ece9d8',
            borderTop: '1px solid #999',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>Items : <b>{totalItemsCount}</b></span>
              <span>Qty : <b>{totalQtyCount}</b></span>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <span>Net Amt : <b style={{ fontSize: '14px', color: '#000' }}>{netAmount.toFixed(2)}</b></span>
              <span>Tax : <b>0.00</b></span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="win-btn"
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: stagedCount > 0 ? '#ffea88' : '#e0dcc8',
                  borderColor: stagedCount > 0 ? '#b45309' : '#999'
                }}
                onClick={() => printKOT(activeTableId)}
              >
                KOT (↵↵){stagedCount > 0 ? ` (${stagedCount})` : ''}
              </button>
              <button
                className="win-btn"
                style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => printCashMemo(activeTableId)}
              >
                Bill (F6)
              </button>
              <button
                className="win-btn"
                style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', background: '#dcf5dc', color: '#006600' }}
                onClick={() => openSettleModal(activeTableId)}
                title="Settle bill via Cash, UPI, or Card"
              >
                Settle (F12)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
