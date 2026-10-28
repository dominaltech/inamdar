import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function DetailsOfBillModal() {
  const {
    screenMode,
    setScreenMode,
    allBills,
    setShowSettlementMenu,
    showSettlementMenu,
    batchSettleMode,
    triggerTableFocus,
  } = usePos();

  const [selectedBillIndex, setSelectedBillIndex] = useState(0);

  useEffect(() => {
    if (screenMode === 'DETAILS_OF_BILL') {
      setSelectedBillIndex(0);
    }
  }, [screenMode]);

  useEffect(() => {
    if (screenMode !== 'DETAILS_OF_BILL') return;

    function handleKeyDown(e) {
      // If settlement menu or batch settlement dialog is active, DO NOT intercept any keys so user can type freely!
      if (showSettlementMenu || batchSettleMode) return;

      // If typing inside an input element, do not intercept
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        setScreenMode('CASH_MEMO');
        triggerTableFocus?.();
        return;
      }

      if (e.key === 'F12') {
        e.preventDefault();
        setShowSettlementMenu(true);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (allBills.length > 0) {
          setSelectedBillIndex(prev => (prev + 1) % allBills.length);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (allBills.length > 0) {
          setSelectedBillIndex(prev => (prev - 1 + allBills.length) % allBills.length);
        }
        return;
      }

      // Quick number typing (0-9): selects matching bill number ONLY when settlement modal is not open
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        const numKey = e.key;
        const foundIdx = allBills.findIndex(b => {
          const bNo = String(b.billNo || '');
          const bTbl = String(b.table || b.tableNo || '');
          return bNo === numKey || bNo.startsWith(numKey) || bTbl === numKey;
        });
        if (foundIdx !== -1) {
          setSelectedBillIndex(foundIdx);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenMode, allBills, setScreenMode, setShowSettlementMenu, showSettlementMenu, batchSettleMode, triggerTableFocus]);

  if (screenMode !== 'DETAILS_OF_BILL') return null;

  const rawBill = allBills[selectedBillIndex] || {};
  const currentBill = {
    billNo: rawBill.billNo || 0,
    table: rawBill.table || rawBill.tableNo || '',
    waiter: rawBill.waiter || 'COUNTER',
    items: rawBill.items || [],
    amount: Number(rawBill.amount ?? rawBill.totalAmount ?? 0),
    disc: Number(rawBill.disc || 0),
    tax: Number(rawBill.tax || 0),
    isSettled: Boolean(rawBill.isSettled),
    hall: rawBill.hall || rawBill.section || 'AC',
  };

  const totalQty = (currentBill.items || []).reduce((s, it) => s + (it.qty > 0 ? it.qty : 0), 0);
  const totalItems = (currentBill.items || []).filter(it => it.qty > 0).length;

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
      <div className="win-window" style={{
        width: '840px',
        height: '520px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
        background: '#ece9d8'
      }}>
        {/* Title Bar */}
        <div className="win-titlebar" style={{ height: '24px', padding: '2px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '12px' }}>
            <span>Details of Bill No. {currentBill.billNo || ''}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
            <span
              style={{ cursor: 'pointer', color: '#fff', textDecoration: 'underline' }}
              onClick={() => setShowSettlementMenu(true)}
            >
              [F12 Settlement]
            </span>
            <span
              style={{ cursor: 'pointer', color: '#fff', textDecoration: 'underline' }}
              onClick={() => setScreenMode('CASH_MEMO')}
            >
              [Esc Back to Memo]
            </span>
          </div>
        </div>

        {/* Content Body: Split Left Dishes + Right Bills List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 10px', background: '#ece9d8', overflow: 'hidden' }}>
          
          {/* Top Row: Table & Waiter display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Table:</span>
              <div className="win-input" style={{ width: '45px', height: '22px', textAlign: 'center', fontWeight: 'bold', background: '#fff', lineHeight: '20px' }}>
                {currentBill.table}
              </div>
            </div>
            <div style={{ fontSize: '11px' }}>
              Waiter : <b>{currentBill.waiter || 'COUNTER'}</b>
            </div>
          </div>

          {/* Main Body Grid */}
          <div style={{ flex: 1, display: 'flex', border: '1px solid #7f9db9', background: '#fff', overflow: 'hidden' }}>
            
            {/* Left: Dishes of selected bill */}
            <div style={{ flex: '1.2', borderRight: '1px solid #7f9db9', overflowY: 'auto' }}>
              <table className="order-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th style={{ width: '45px', textAlign: 'right' }}>Qty</th>
                    <th style={{ width: '55px', textAlign: 'right' }}>Rate</th>
                    <th style={{ width: '65px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentBill.items || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        No items for Bill No. {currentBill.billNo}
                      </td>
                    </tr>
                  ) : (
                    currentBill.items.map((it, idx) => {
                      const itAmt = Number(it.amount ?? (it.qty * it.rate) ?? 0);
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 'bold' }}>{it.name}</td>
                          <td style={{ textAlign: 'right' }}>{it.qty}</td>
                          <td style={{ textAlign: 'right' }}>{Number(it.rate || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>{itAmt.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Right: Tabular Bills Grid (Every number text black, green highlight row for unsettled) */}
            <div style={{ flex: '1', overflowY: 'auto', background: '#fafafa' }}>
              <table className="order-table" style={{ width: '100%', fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '38px' }}>BillNo</th>
                    <th style={{ width: '32px' }}>Table</th>
                    <th style={{ width: '30px', textAlign: 'right' }}>Disc</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ width: '32px', textAlign: 'center' }}>Emp#</th>
                    <th style={{ width: '42px' }}>P.Type</th>
                    <th style={{ width: '30px' }}>Hall</th>
                  </tr>
                </thead>
                <tbody>
                  {allBills.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                        No bills recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allBills.map((b, idx) => {
                      const isSelected = idx === selectedBillIndex;
                      const isUnsettled = !b.isSettled;
                      const rowTable = b.table || b.tableNo || '';
                      const rowAmount = Number(b.amount ?? b.totalAmount ?? 0);
                      const rowColor = isSelected ? '#ffffff' : '#000000'; // Every number/text is strictly black (white only when selected)

                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedBillIndex(idx)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected 
                              ? '#0a246a' 
                              : (isUnsettled ? '#dcf5dc' : (idx % 2 === 0 ? '#ffffff' : '#f4f4f4')), // Green highlight ONLY for unsettled
                            color: rowColor,
                            fontWeight: isUnsettled ? 'bold' : 'normal',
                          }}
                        >
                          <td style={{ color: rowColor }}>{b.billNo}</td>
                          <td style={{ color: rowColor }}>{rowTable}</td>
                          <td style={{ textAlign: 'right', color: rowColor }}>{Number(b.disc || 0).toFixed(0)}</td>
                          <td style={{ textAlign: 'right', color: rowColor }}>{rowAmount.toFixed(0)}</td>
                          <td style={{ textAlign: 'center', color: rowColor }}>{b.employeeNo || 1}</td>
                          <td style={{ color: rowColor }}>{b.isSettled ? (b.paymentType || b.paymentMode || 'Cash') : 'Cash'}</td>
                          <td style={{ color: rowColor }}>{b.hall || b.section || 'AC'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Bottom Bar: Items, Qty, Net Amt, Tax, Mod, Time */}
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
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Items : <b>{totalItems}</b></span>
              <span>Qty : <b>{totalQty}</b></span>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span>Net Amt : <b style={{ fontSize: '14px', color: '#000000' }}>{currentBill.amount.toFixed(2)}</b></span>
              <span>Tax : <b>0</b></span>
              <span>Due: <b>0 min</b></span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="win-btn"
                style={{ padding: '2px 10px', fontWeight: 'bold', background: '#dcf5dc', color: '#006600' }}
                onClick={() => setShowSettlementMenu(true)}
              >
                F12 Settle
              </button>
              <button
                className="win-btn"
                style={{ padding: '2px 10px' }}
                onClick={() => setScreenMode('CASH_MEMO')}
              >
                Esc Back
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
