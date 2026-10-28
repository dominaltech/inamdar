import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function DisplayOrderModal() {
  const {
    screenMode,
    setScreenMode,
    tables,
    transferKot,
    setInfoDialog,
    triggerTableFocus,
  } = usePos();

  // Active KOTs derived from tables
  const [selectedKotIndex, setSelectedKotIndex] = useState(0);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferToTable, setTransferToTable] = useState('');
  const [confirmTransferData, setConfirmTransferData] = useState(null);
  const toTableInputRef = useRef(null);

  // Compute all live/active KOTs across all tables
  const liveKots = [];
  Object.values(tables).forEach(tbl => {
    if (!tbl.items || tbl.items.length === 0) return;
    
    // Group table items by kotNo
    const kotMap = {};
    tbl.items.forEach(it => {
      const kNo = it.kotNo || (tbl.kotNos && tbl.kotNos[0]) || '1';
      if (!kotMap[kNo]) {
        kotMap[kNo] = {
          kotNo: kNo,
          tableId: tbl.id,
          subTable: tbl.subTable || 'A',
          section: tbl.section || 'AC',
          waiter: tbl.waiter || '1. Operator',
          time: it.firedAt ? new Date(it.firedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : '12:00 pm',
          items: [],
          totalAmount: 0,
        };
      }
      kotMap[kNo].items.push(it);
      kotMap[kNo].totalAmount += it.amount;
    });

    Object.values(kotMap).forEach(k => liveKots.push(k));
  });

  // Sort descending by KOT number
  liveKots.sort((a, b) => Number(b.kotNo) - Number(a.kotNo));

  useEffect(() => {
    if (screenMode === 'DISPLAY_ORDER') {
      setSelectedKotIndex(0);
      setShowTransferDialog(false);
      setConfirmTransferData(null);
    }
  }, [screenMode]);

  useEffect(() => {
    if (showTransferDialog) {
      setTimeout(() => {
        toTableInputRef.current?.focus();
        toTableInputRef.current?.select();
      }, 50);
    }
  }, [showTransferDialog]);

  useEffect(() => {
    if (screenMode !== 'DISPLAY_ORDER') return;

    function handleKeyDown(e) {
      if (confirmTransferData) {
        if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
          e.preventDefault();
          executeTransfer();
        } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
          e.preventDefault();
          setConfirmTransferData(null);
        }
        return;
      }

      if (showTransferDialog) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowTransferDialog(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setScreenMode('ORDER');
        triggerTableFocus?.();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (liveKots.length > 0) {
          setSelectedKotIndex(prev => (prev + 1) % liveKots.length);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (liveKots.length > 0) {
          setSelectedKotIndex(prev => (prev - 1 + liveKots.length) % liveKots.length);
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (liveKots.length > 0) {
          openTransferDialog();
        }
        return;
      }

      // Quick number typing (0-9): selects matching KOT or table number and prevents background bleed
      if (/^[0-9]$/.test(e.key) && !showTransferDialog) {
        e.preventDefault();
        e.stopPropagation();
        const numKey = e.key;
        const foundIdx = liveKots.findIndex(k => String(k.kotNo) === numKey || String(k.kotNo).startsWith(numKey) || String(k.tableId) === numKey);
        if (foundIdx !== -1) {
          setSelectedKotIndex(foundIdx);
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenMode, showTransferDialog, confirmTransferData, liveKots, selectedKotIndex]);

  if (screenMode !== 'DISPLAY_ORDER') return null;

  const currentKot = liveKots[selectedKotIndex] || {
    kotNo: '-',
    tableId: '-',
    section: 'AC',
    waiter: '-',
    time: '-',
    items: [],
    totalAmount: 0,
  };

  const openTransferDialog = () => {
    if (!currentKot || currentKot.kotNo === '-') return;
    setTransferToTable('');
    setShowTransferDialog(true);
  };

  const handleTransferSubmit = (e) => {
    if (e) e.preventDefault();
    const to = transferToTable.trim().toUpperCase();
    if (!to) return;

    if (to === currentKot.tableId) {
      setInfoDialog({
        title: "Transfer Error",
        message: `Destination table cannot be the same as Table ${currentKot.tableId}!`,
      });
      return;
    }

    // Show authentic confirmation prompt: "Transfer KOTs from 1A to 2A?"
    setConfirmTransferData({
      kotNo: currentKot.kotNo,
      from: currentKot.tableId,
      to: to,
    });
  };

  const executeTransfer = () => {
    if (!confirmTransferData) return;
    const { kotNo, from, to } = confirmTransferData;
    const success = transferKot(kotNo, from, to);
    setConfirmTransferData(null);
    setShowTransferDialog(false);

    if (success) {
      setInfoDialog({
        title: "KOT Transfer",
        message: `KOT #${kotNo} successfully transferred from Table ${from} to Table ${to}.`,
      });
    }
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1200 }}>
      <div
        className="win-window"
        style={{
          width: '94vw',
          maxWidth: '1100px',
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ece9d8',
        }}
      >
        {/* Title bar */}
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>Display Order</span>
          </div>
          <button className="win-close-btn" onClick={() => { setScreenMode('ORDER'); triggerTableFocus?.(); }}>✕</button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', padding: '6px', gap: '8px', overflow: 'hidden' }}>
          
          {/* Left Pane: Items in Selected KOT */}
          <div
            style={{
              flex: 1.2,
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              border: '2px solid',
              borderColor: '#7f9db9 #dfdfdf #dfdfdf #7f9db9',
            }}
          >
            <div
              style={{
                background: '#e4ebf5',
                padding: '4px 8px',
                fontWeight: 'bold',
                fontSize: '12px',
                borderBottom: '1px solid #b0c4de',
                color: '#002266',
              }}
            >
              KOT Items: KOT #{currentKot.kotNo} (Table: {currentKot.tableId} - {currentKot.section})
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080' }}>
                    <th style={{ padding: '3px 6px', textAlign: 'left', width: '50px' }}>Code</th>
                    <th style={{ padding: '3px 6px', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '3px 6px', textAlign: 'center', width: '45px' }}>Qty</th>
                    <th style={{ padding: '3px 6px', textAlign: 'right', width: '65px' }}>Rate</th>
                    <th style={{ padding: '3px 6px', textAlign: 'right', width: '75px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentKot.items && currentKot.items.length > 0 ? (
                    currentKot.items.map((it, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e0e0e0',
                          background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                          color: it.isCancelled ? '#cc0000' : '#000000',
                          textDecoration: it.isCancelled ? 'line-through' : 'none',
                        }}
                      >
                        <td style={{ padding: '3px 6px' }}>{it.code}</td>
                        <td style={{ padding: '3px 6px', fontWeight: 'bold' }}>{it.name}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center' }}>{it.qty}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'right' }}>{Number(it.rate).toFixed(2)}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>{Number(it.amount).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        No items in this KOT
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: '6px 10px',
                background: '#eef2f8',
                borderTop: '1px solid #b0c4de',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '12px',
              }}
            >
              <span>Total Items: {currentKot.items ? currentKot.items.length : 0}</span>
              <span style={{ color: '#002266' }}>Amount: ₹{Number(currentKot.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Right Pane: Live KOTs list */}
          <div
            style={{
              flex: 1.5,
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              border: '2px solid',
              borderColor: '#7f9db9 #dfdfdf #dfdfdf #7f9db9',
            }}
          >
            <div
              style={{
                background: '#0a246a',
                color: '#ffffff',
                padding: '4px 8px',
                fontWeight: 'bold',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Live KOTs ({liveKots.length})</span>
              <span style={{ fontSize: '11px', fontWeight: 'normal' }}>Press [Enter] to Transfer KOT</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080' }}>
                    <th style={{ padding: '3px 6px', textAlign: 'left', width: '60px' }}>KOT No</th>
                    <th style={{ padding: '3px 6px', textAlign: 'center', width: '60px' }}>Table</th>
                    <th style={{ padding: '3px 6px', textAlign: 'left', width: '90px' }}>Section</th>
                    <th style={{ padding: '3px 6px', textAlign: 'left' }}>Waiter</th>
                    <th style={{ padding: '3px 6px', textAlign: 'center', width: '70px' }}>Time</th>
                    <th style={{ padding: '3px 6px', textAlign: 'right', width: '75px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {liveKots.length > 0 ? (
                    liveKots.map((k, idx) => {
                      const isSelected = idx === selectedKotIndex;
                      return (
                        <tr
                          key={k.kotNo + '-' + k.tableId}
                          onClick={() => setSelectedKotIndex(idx)}
                          onDoubleClick={openTransferDialog}
                          style={{
                            borderBottom: '1px solid #e8e8e8',
                            background: isSelected ? '#0a246a' : (idx % 2 === 0 ? '#ffffff' : '#f7f7f7'),
                            color: isSelected ? '#ffffff' : '#000000',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: '3px 6px', fontWeight: 'bold' }}>{k.kotNo}</td>
                          <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 'bold' }}>{k.tableId}</td>
                          <td style={{ padding: '3px 6px' }}>{k.section}</td>
                          <td style={{ padding: '3px 6px' }}>{k.waiter}</td>
                          <td style={{ padding: '3px 6px', textAlign: 'center' }}>{k.time}</td>
                          <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                            ₹{Number(k.totalAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                        No active KOTs currently found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 12px',
            background: '#d4d0c8',
            borderTop: '2px solid #808080',
          }}
        >
          <div style={{ fontSize: '11px', color: '#333' }}>
            Keys: <b>↑ / ↓</b> Select KOT | <b>Enter</b> Transfer KOT | <b>Esc</b> Return to Order
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="win-btn"
              disabled={liveKots.length === 0}
              onClick={openTransferDialog}
              style={{ fontWeight: 'bold', minWidth: '110px' }}
            >
              Transfer (Enter)
            </button>
            <button
              className="win-btn"
              onClick={() => setScreenMode('ORDER')}
              style={{ minWidth: '100px' }}
            >
              Close (Esc)
            </button>
          </div>
        </div>

        {/* Transfer KOT Modal */}
        {showTransferDialog && (
          <div className="win-modal-backdrop" style={{ zIndex: 1300 }}>
            <div className="win-window" style={{ width: '280px', background: '#ece9d8' }}>
              <div className="win-titlebar">
                <div className="win-titlebar-title">
                  <span>Transfer KOT</span>
                </div>
                <button className="win-close-btn" onClick={() => setShowTransferDialog(false)}>✕</button>
              </div>

              <form onSubmit={handleTransferSubmit} style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '60px', fontWeight: 'bold', fontSize: '12px' }}>From:</label>
                    <input
                      type="text"
                      readOnly
                      value={currentKot.tableId}
                      className="win-input"
                      style={{ flex: 1, background: '#e0e0e0', fontWeight: 'bold', textAlign: 'center' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '60px', fontWeight: 'bold', fontSize: '12px' }}>To:</label>
                    <input
                      ref={toTableInputRef}
                      type="text"
                      placeholder="e.g. 2A or 3"
                      value={transferToTable}
                      onChange={(e) => setTransferToTable(e.target.value)}
                      className="win-input"
                      style={{ flex: 1, fontWeight: 'bold', textAlign: 'center', background: '#d4ffff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                  <button type="submit" className="win-btn" style={{ fontWeight: 'bold', minWidth: '70px' }}>
                    OK
                  </button>
                  <button type="button" className="win-btn" onClick={() => setShowTransferDialog(false)} style={{ minWidth: '70px' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Dialog: "Transfer KOTs from 1A to 2A?" */}
        {confirmTransferData && (
          <div className="win-modal-backdrop" style={{ zIndex: 1400 }}>
            <div className="win-window" style={{ width: '320px', background: '#ece9d8' }}>
              <div className="win-titlebar">
                <div className="win-titlebar-title">
                  <span>Transfer KOTs</span>
                </div>
                <button className="win-close-btn" onClick={() => setConfirmTransferData(null)}>✕</button>
              </div>

              <div style={{ padding: '16px', fontSize: '12px', textAlign: 'center', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '10px', fontSize: '24px' }}>❓</div>
                <div>
                  Transfer KOT #{confirmTransferData.kotNo} from <b>Table {confirmTransferData.from}</b> to <b>Table {confirmTransferData.to}</b>?
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '10px', background: '#d4d0c8', borderTop: '1px solid #999' }}>
                <button className="win-btn" style={{ fontWeight: 'bold', minWidth: '65px' }} onClick={executeTransfer}>
                  Yes
                </button>
                <button className="win-btn" style={{ minWidth: '65px' }} onClick={() => setConfirmTransferData(null)}>
                  No
                </button>
                <button className="win-btn" style={{ minWidth: '65px' }} onClick={() => { setConfirmTransferData(null); setShowTransferDialog(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
