import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

const CANCEL_REASONS = [
  'Customer Changed Mind',
  'Late Preparation',
  'Quality / Taste Issue',
  'Wrong Item Punched',
  'Guest Left / Walkout',
  'Table Shift Alteration',
];

export default function CancelOrderModal({
  show,
  tableId,
  onClose,
}) {
  const {
    tables,
    cancelItemFromTable,
    setInfoDialog,
    setTables,
    triggerTableFocus,
  } = usePos();

  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [cancelQty, setCancelQty] = useState('1');
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [showEntireTableConfirm, setShowEntireTableConfirm] = useState(false);
  const qtyInputRef = useRef(null);

  const cleanId = String(tableId || '').trim().toUpperCase();
  const baseId = cleanId.replace(/[A-Z]/g, '');
  const tableData = tables[cleanId] || (baseId && tables[baseId]) || (baseId && tables[`${baseId}A`]) || {
    id: tableId,
    section: 'GENERAL',
    items: [],
  };

  const activeItems = (tableData.items || []).filter(it => it.qty > 0 && !it.isCancelled);

  useEffect(() => {
    if (show) {
      setSelectedItemIdx(0);
      setCancelQty('1');
      setShowEntireTableConfirm(false);
      setSelectedReason(CANCEL_REASONS[0]);
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 50);

      const handleGlobalKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          triggerTableFocus?.();
        }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [show, tableId, onClose, triggerTableFocus]);

  useEffect(() => {
    if (activeItems.length > 0 && selectedItemIdx < activeItems.length) {
      const curItem = activeItems[selectedItemIdx];
      // Default cancel qty to 1 or item qty
      setCancelQty(String(Math.min(1, curItem.qty)));
    }
  }, [selectedItemIdx, activeItems]);

  if (!show) return null;

  const currentSelectedItem = activeItems[selectedItemIdx] || null;

  const handleCancelItem = () => {
    if (!currentSelectedItem) return;
    const qtyNum = Number(cancelQty) || 1;
    if (qtyNum <= 0) return;

    cancelItemFromTable(
      tableData.id || cleanId,
      currentSelectedItem.code,
      qtyNum,
      selectedReason,
      '1. Operator'
    );

    // If more items exist, stay in modal or close if all items removed
    if (activeItems.length <= 1) {
      onClose();
      triggerTableFocus?.();
    } else {
      setSelectedItemIdx(0);
    }
  };

  const handleCancelEntireTable = () => {
    if (activeItems.length === 0) {
      onClose();
      return;
    }

    // Cancel each item sequentially
    activeItems.forEach(it => {
      cancelItemFromTable(
        tableData.id || cleanId,
        it.code,
        it.qty,
        selectedReason,
        '1. Operator'
      );
    });

    setInfoDialog({
      title: "Table Cancelled",
      message: `Table ${tableData.id || cleanId} has been fully cancelled.`,
    });

    onClose();
    triggerTableFocus?.();
  };

  const handleKeyDown = (e) => {
    if (showEntireTableConfirm) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCancelEntireTable();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowEntireTableConfirm(false);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      triggerTableFocus?.();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeItems.length > 0) {
        setSelectedItemIdx(prev => (prev + 1) % activeItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeItems.length > 0) {
        setSelectedItemIdx(prev => (prev - 1 + activeItems.length) % activeItems.length);
      }
      return;
    }

    if (e.key === 'Enter' && e.target === qtyInputRef.current) {
      e.preventDefault();
      handleCancelItem();
      return;
    }
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1300 }} onKeyDown={handleKeyDown}>
      <div
        className="win-window"
        style={{
          width: '560px',
          background: '#ece9d8',
          boxShadow: '3px 3px 12px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title Bar */}
        <div
          className="win-titlebar"
          style={{
            background: 'linear-gradient(90deg, #aa0000 0%, #dd3333 100%)',
            height: '24px',
            padding: '2px 8px',
          }}
        >
          <div className="win-titlebar-title" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span>Cancel Order / Remove Items - Table {tableData.id || cleanId}</span>
          </div>
          <button
            className="win-close-btn"
            onClick={onClose}
            style={{ width: '16px', height: '14px', fontSize: '10px', lineHeight: '10px' }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '10px' }}>
          {activeItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#666' }}>
              No active items found on Table {tableData.id || cleanId} to cancel.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                Select dish to cancel (Use ↑ / ↓ arrow keys to select item):
              </div>

              {/* Items Table */}
              <div
                style={{
                  height: '160px',
                  overflowY: 'auto',
                  border: '1px solid #7f9db9',
                  background: '#ffffff',
                  marginBottom: '10px',
                }}
              >
                <table className="order-table" style={{ width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '30px' }}>#</th>
                      <th style={{ width: '45px' }}>Code</th>
                      <th>Item Name</th>
                      <th style={{ width: '45px', textAlign: 'right' }}>Qty</th>
                      <th style={{ width: '55px', textAlign: 'right' }}>Rate</th>
                      <th style={{ width: '65px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItems.map((it, idx) => {
                      const isSel = idx === selectedItemIdx;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedItemIdx(idx)}
                          style={{
                            cursor: 'pointer',
                            background: isSel ? '#0a246a' : 'transparent',
                            color: isSel ? '#ffffff' : '#000000',
                            fontWeight: isSel ? 'bold' : 'normal',
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>{isSel ? '►' : ''}</td>
                          <td>{it.code}</td>
                          <td>{it.name}</td>
                          <td style={{ textAlign: 'right' }}>{it.qty}</td>
                          <td style={{ textAlign: 'right' }}>{Number(it.rate || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>{Number(it.amount || it.qty * it.rate || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cancellation Controls */}
              {currentSelectedItem && (
                <div
                  style={{
                    background: '#f4f0e6',
                    border: '1px solid #c0b8a8',
                    padding: '8px 10px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#666' }}>
                      Selected Dish:
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#aa0000' }}>
                      [{currentSelectedItem.code}] {currentSelectedItem.name}
                    </span>
                  </div>

                  <div style={{ width: '70px' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold' }}>Qty to Cancel:</span>
                    <input
                      ref={qtyInputRef}
                      type="text"
                      inputMode="numeric"
                      value={cancelQty}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const maxVal = currentSelectedItem.qty;
                        if (Number(val) > maxVal) {
                          setCancelQty(String(maxVal));
                        } else {
                          setCancelQty(val);
                        }
                      }}
                      className="win-input"
                      style={{ width: '100%', height: '22px', textAlign: 'center', fontWeight: 'bold' }}
                    />
                  </div>

                  <div style={{ width: '180px' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold' }}>Reason:</span>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="win-input"
                      style={{ width: '100%', height: '22px', fontSize: '10px' }}
                    >
                      {CANCEL_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Whole table confirmation prompt */}
          {showEntireTableConfirm && (
            <div
              style={{
                background: '#ffeedd',
                border: '1px solid #cc4400',
                padding: '8px 10px',
                marginBottom: '10px',
                fontSize: '11px',
                color: '#880000',
              }}
            >
              <b>Confirm Full Table Cancellation:</b> Are you sure you want to cancel all {activeItems.length} items and clear Table {tableData.id || cleanId}?
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="win-btn"
                  onClick={handleCancelEntireTable}
                  style={{ fontWeight: 'bold', color: '#aa0000', padding: '2px 10px' }}
                >
                  Yes, Cancel Entire Table (↵)
                </button>
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => setShowEntireTableConfirm(false)}
                  style={{ padding: '2px 10px' }}
                >
                  No, Keep (Esc)
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div>
              {activeItems.length > 0 && !showEntireTableConfirm && (
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => setShowEntireTableConfirm(true)}
                  style={{ color: '#880000', fontSize: '11px', height: '24px' }}
                >
                  Cancel Entire Table...
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="win-btn"
                onClick={onClose}
                style={{ minWidth: '70px', height: '24px', fontSize: '11px' }}
              >
                Close (Esc)
              </button>
              {activeItems.length > 0 && !showEntireTableConfirm && (
                <button
                  type="button"
                  className="win-btn"
                  onClick={handleCancelItem}
                  style={{ minWidth: '120px', height: '24px', fontSize: '11px', fontWeight: 'bold', color: '#aa0000' }}
                >
                  Cancel Item (↵)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
