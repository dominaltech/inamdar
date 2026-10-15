import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { EMPLOYEES, CANCEL_REASONS } from '../data/initialData';
import { searchMenuItems, MENU_BY_CODE } from '../data/menuService';

export default function OrderWorkspace() {
  const {
    screenMode,
    setScreenMode,
    isCancelMode,
    setIsCancelMode,
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
    setShowCancelAuthModal,
    setPendingCancelDetails,
    printKOT,
    printCashMemo,
  } = usePos();

  // Active entry row inputs
  const [tableInput, setTableInput] = useState(activeTableId);
  const [codeQuery, setCodeQuery] = useState('');
  const [qtyInput, setQtyInput] = useState('1');
  const [rateInput, setRateInput] = useState('');
  const [customizationInput, setCustomizationInput] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState(CANCEL_REASONS[0]);

  // Selected item object from search
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Field focus references
  const tableInputRef = useRef(null);
  const codeInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const rateInputRef = useRef(null);
  const customInputRef = useRef(null);
  const cancelReasonRef = useRef(null);

  // Synchronize table input
  useEffect(() => {
    setTableInput(activeTableId);
  }, [activeTableId]);

  // Focus table input on mount
  useEffect(() => {
    tableInputRef.current?.focus();
    tableInputRef.current?.select();
  }, []);

  // Update search results when codeQuery changes
  useEffect(() => {
    if (!codeQuery.trim()) {
      setSearchResults([]);
      setSelectedItem(null);
      return;
    }

    if (isCancelMode) {
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

  // Handle table field enter
  const handleTableKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tableInput.trim();
      if (!val) return;

      if (val === '0') {
        switchTable('0');
      } else if (val === '00') {
        switchTable('00 - MOOSA (22)');
      } else {
        switchTable(val);
      }
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
      // Double Enter on empty field triggers KOT or Cash Memo Print!
      if (!codeQuery.trim()) {
        if (screenMode === 'ORDER') {
          printKOT(activeTableId);
        } else {
          printCashMemo(activeTableId);
        }
        return;
      }

      const chosen = searchResults[highlightedIndex] || MENU_BY_CODE.get(codeQuery.trim());
      if (chosen) {
        selectItem(chosen);
      }
    } else if (e.key === 'Escape') {
      setCodeQuery('');
      setSearchResults([]);
    }
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setCodeQuery(item.code);
    const applicableRate = currentTableData.section.includes('AC') ? (item.acRate || item.rate) : (item.hallRate || item.rate);
    setRateInput(String(applicableRate));
    setSearchResults([]);

    if (isCancelMode) {
      qtyInputRef.current?.focus();
    } else {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCancelMode) {
        cancelReasonRef.current?.focus();
      } else {
        customInputRef.current?.focus();
      }
    }
  };

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

  // Group active tables for the integrated right status pane (matching Screenshot 2)
  const acTableNums = Object.values(tables)
    .filter(t => t.section === 'AC' && t.items.length > 0 && !t.id.startsWith('0'))
    .map(t => t.id);

  const familyAcTableNums = Object.values(tables)
    .filter(t => t.section === 'FAMILY AC' && t.items.length > 0)
    .map(t => t.id);

  const parcelTableNums = Object.values(tables)
    .filter(t => t.section === 'PARCEL' && t.items.length > 0)
    .map(t => t.id);

  const deliveryTableNums = Object.values(tables)
    .filter(t => t.section === 'HOME DELIVERY' && t.items.length > 0)
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
      background: '#6c8fa8', // Classic POS desktop background seen behind windows
      padding: '10px'
    }}>
      {/* Centered, Authentic Sized Window Frame (Width ~840px, Height ~540px) */}
      <div className="win-window" style={{
        width: '840px',
        height: '520px',
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    ref={tableInputRef}
                    type="text"
                    value={tableInput}
                    onChange={(e) => setTableInput(e.target.value)}
                    onKeyDown={handleTableKeyDown}
                    className="win-input"
                    style={{ width: '48px', height: '24px', textAlign: 'center', fontSize: '13px' }}
                  />
                  <div style={{
                    marginLeft: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '10px',
                    background: '#0a246a',
                    color: '#fff',
                    padding: '0 4px',
                    cursor: 'pointer'
                  }} onClick={() => setActiveSubTable(s => s === 'A' ? 'B' : 'A')}>
                    <span>{activeSubTable}</span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>Employee</span>
                <select
                  value={activeEmployee}
                  onChange={(e) => setActiveEmployee(e.target.value)}
                  className="win-input"
                  style={{ width: '150px', height: '24px', fontSize: '12px' }}
                >
                  {EMPLOYEES.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
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

          {/* Quick Item Input Row (Fast blind typing) */}
          <div style={{
            display: 'flex',
            gap: '3px',
            marginBottom: '4px',
            background: '#d4d0c8',
            padding: '3px 4px',
            border: '1px solid #999'
          }}>
            <div style={{ width: '70px', position: 'relative' }}>
              <input
                ref={codeInputRef}
                type="text"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                placeholder="Code/CTM"
                className="win-input"
                style={{ width: '100%', height: '22px', fontSize: '11px' }}
              />
              {/* Autocomplete dropdown */}
              {searchResults.length > 0 && (
                <div className="win-bevel-outset" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '320px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  zIndex: 800,
                  padding: '2px'
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
                      <span style={{ fontWeight: 'bold', width: '30px' }}>{item.code}</span>
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
                placeholder="Dish name (Type Code, Shortcode CTM/CB, or text)"
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
                style={{ width: '100%', height: '22px', textAlign: 'center', fontSize: '11px' }}
              />
            </div>

            <div style={{ width: '55px' }}>
              <input
                ref={rateInputRef}
                type="text"
                readOnly
                value={rateInput}
                placeholder="Rate"
                className="win-input"
                style={{ width: '100%', height: '22px', textAlign: 'right', background: '#f4f4f4', fontSize: '11px' }}
              />
            </div>

            {isCancelMode ? (
              <div style={{ width: '160px' }}>
                <select
                  ref={cancelReasonRef}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  onKeyDown={handleCancelReasonKeyDown}
                  className="win-input"
                  style={{ width: '100%', height: '22px', fontSize: '10px', color: '#c00000' }}
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
                  type="text"
                  value={customizationInput}
                  onChange={(e) => setCustomizationInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="Enter ↵"
                  className="win-input"
                  style={{ width: '100%', height: '22px', fontSize: '11px' }}
                />
              </div>
            )}
          </div>

          {/* Main Body Split: Left Items Grid + Right Live Tables Board (As in Screenshot 2) */}
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
                  </tr>
                </thead>
                <tbody>
                  {currentTableData.items.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px 10px', color: '#999999' }}>
                        No items for Table {activeTableId}. Type item code or acronym (e.g. CTM, CB, 1) and press Enter.
                      </td>
                    </tr>
                  ) : (
                    currentTableData.items.map((row, idx) => {
                      const isCancelled = row.qty < 0 || row.isCancelled;
                      return (
                        <tr key={idx} className={isCancelled ? 'order-row-cancelled' : ''}>
                          <td style={{ color: isCancelled ? '#c00000' : '#0033aa', fontWeight: 'bold' }}>
                            {row.code}
                          </td>
                          <td>{row.name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.qty}</td>
                          <td style={{ textAlign: 'right' }}>{row.rate}</td>
                          <td style={{ textAlign: 'right' }}>{row.amount.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Real-time Live Section Panels (Matching Screenshot 2 exactly!) */}
            <div style={{ width: '220px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', fontSize: '11px' }}>
              {/* AC Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                  AC
                </div>
                <div style={{ color: '#000', lineHeight: '1.4' }}>
                  {acTableNums.length > 0 ? acTableNums.join(', ') + ',' : 'None'}
                </div>
              </div>

              {/* FAMILY AC Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                  FAMILY AC
                </div>
                <div style={{ color: '#000', lineHeight: '1.4' }}>
                  {familyAcTableNums.length > 0 ? familyAcTableNums.join(', ') + ',' : 'None'}
                </div>
              </div>

              {/* HOME DELIVERY Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                  HOME DELIVERY ({deliveryTableNums.length})
                </div>
                <div style={{ color: '#000', lineHeight: '1.4' }}>
                  {deliveryTableNums.length > 0 ? deliveryTableNums.join(', ') : 'None'}
                </div>
              </div>

              {/* PARCEL Section */}
              <div style={{ borderBottom: '1px solid #ccc', padding: '4px 6px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                  PARCEL ({parcelTableNums.length})
                </div>
                <div style={{ color: '#000', lineHeight: '1.4' }}>
                  {parcelTableNums.length > 0 ? parcelTableNums.join(', ') : 'None'}
                </div>
              </div>

              {/* Unsettled Bills in Red (Matching Screenshot 2) */}
              <div style={{ padding: '4px 6px', background: '#fff' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#c00000', marginBottom: '2px' }}>
                  Unsettled Bills ({unsettledBills.length})
                </div>
                <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                  {unsettledBills.map(b => `${b.table}(${b.billNo}, ${b.amount})`).join(', ')}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar (Matching Screenshot 2: Items : Qty : Net Amt : Tax) */}
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
                style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => printKOT(activeTableId)}
              >
                KOT (↵↵)
              </button>
              <button
                className="win-btn"
                style={{ padding: '2px 8px', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => printCashMemo(activeTableId)}
              >
                Bill (F6)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
