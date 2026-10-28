import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function TableShiftModal() {
  const { showShiftModal, setShowShiftModal, tables, transferTable, activeTableId, setInfoDialog, triggerTableFocus } = usePos();
  const [sourceTable, setSourceTable] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const sourceInputRef = useRef(null);
  const targetInputRef = useRef(null);
  const yesButtonRef = useRef(null);

  useEffect(() => {
    if (showShiftModal) {
      setSourceTable(activeTableId || '5');
      setTargetTable('');
      setShowConfirm(false);
      setTimeout(() => {
        sourceInputRef.current?.focus();
        sourceInputRef.current?.select();
      }, 50);
    }
  }, [showShiftModal, activeTableId]);

  if (!showShiftModal) return null;

  const currentSourceData = tables[sourceTable] || {
    id: sourceTable,
    waiter: 'COUNTER',
    items: [],
    kotNos: [],
  };

  const isTargetOccupied = Boolean(
    targetTable.trim() &&
    tables[targetTable.trim()] &&
    tables[targetTable.trim()].items &&
    tables[targetTable.trim()].items.some(it => it.qty > 0)
  );

  const totalQty = currentSourceData.items.reduce((s, it) => s + (it.qty > 0 ? it.qty : 0), 0);
  const totalItems = currentSourceData.items.filter(it => it.qty > 0).length;

  const handleSourceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      targetInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setShowShiftModal(false);
      triggerTableFocus?.();
    }
  };

  const handleTargetKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tgt = targetTable.trim();
      if (!tgt) return;

      // Rule 8: If target table is occupied, error and do not merge!
      if (isTargetOccupied) {
        setInfoDialog({
          title: "Transfer Blocked",
          message: `Error: Table ${tgt} is already OCCUPIED! Merging is prohibited.`,
        });
        return;
      }

      // If available, open confirmation dialog
      setShowConfirm(true);
      setTimeout(() => {
        yesButtonRef.current?.focus();
      }, 50);
    } else if (e.key === 'Escape') {
      setShowShiftModal(false);
      triggerTableFocus?.();
    }
  };

  const handleConfirmYes = () => {
    setShowConfirm(false);
    const success = transferTable(sourceTable, targetTable);
    if (success) {
      setShowShiftModal(false);
      triggerTableFocus?.();
    }
  };

  return (
    <div className="win-modal-backdrop">
      {/* Previously Ordered Items Window */}
      <div className="win-window" style={{ width: '640px', minHeight: '360px' }}>
        <div className="win-titlebar" style={{ background: 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)' }}>
          <div className="win-titlebar-title">
            <span>Previously Ordered Items</span>
          </div>
          <button className="win-close-btn" onClick={() => { setShowShiftModal(false); triggerTableFocus?.(); }}>✕</button>
        </div>

        <div style={{ padding: '10px 14px', background: '#ece9d8' }}>
          {/* Top Selection Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Table No:</span>
              <input
                ref={sourceInputRef}
                type="text"
                value={sourceTable}
                onChange={(e) => setSourceTable(e.target.value)}
                onKeyDown={handleSourceKeyDown}
                className="win-input"
                style={{ width: '60px', textAlign: 'center' }}
              />
              <span style={{ fontWeight: 'bold', marginLeft: '12px' }}>Transfer To:</span>
              <input
                ref={targetInputRef}
                type="text"
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                onKeyDown={handleTargetKeyDown}
                className="win-input"
                style={{ width: '60px', textAlign: 'center' }}
              />
              {targetTable.trim() ? (
                isTargetOccupied ? (
                  <span style={{
                    background: '#c00000',
                    color: '#ffffff',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderRadius: '2px'
                  }}>
                    [Occupied - Blocked]
                  </span>
                ) : (
                  <span style={{
                    background: '#008000',
                    color: '#ffffff',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderRadius: '2px'
                  }}>
                    &lt;New&gt;
                  </span>
                )
              ) : null}
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <div>Waiter: <b>{currentSourceData.waiter || 'COUNTER'}</b></div>
              <div>Item: <b>{totalItems}</b>, Qty: <b>{totalQty}</b></div>
            </div>
          </div>

          {/* KOT Numbers Line */}
          <div style={{ fontSize: '11px', marginBottom: '6px', color: '#333333' }}>
            <b>KOT Nos:</b> {currentSourceData.kotNos?.join(', ') || 'None'}
          </div>

          {/* Ordered Items Grid */}
          <div className="win-bevel-inset" style={{ height: '210px', overflowY: 'auto', background: '#fff' }}>
            <table className="order-table">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Item Name</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '25%', textAlign: 'right' }}>Amt</th>
                </tr>
              </thead>
              <tbody>
                {currentSourceData.items.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#888', padding: '24px' }}>
                      No active items ordered on Table {sourceTable}
                    </td>
                  </tr>
                ) : (
                  currentSourceData.items.map((it, idx) => (
                    <tr key={idx} className={it.qty < 0 ? 'order-row-cancelled' : ''}>
                      <td>{it.name}</td>
                      <td style={{ textAlign: 'right' }}>{it.qty}</td>
                      <td style={{ textAlign: 'right' }}>{Math.abs(it.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Function Keys Reference */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            fontSize: '11px',
            color: '#222222'
          }}>
            <span>Press <b>&#123;D&#125;-Discount</b></span>
            <span><b>&#123;F7&#125;-Print</b></span>
            <span><b>&#123;F8&#125;-Add Guest</b></span>
            <span><b>&#123;S&#125;-Send Message</b></span>
          </div>
        </div>
      </div>

      {/* Retro Windows Confirm Transfer Prompt */}
      {showConfirm && (
        <div className="win-modal-backdrop" style={{ zIndex: 1050 }}>
          <div className="win-window" style={{ width: '330px', background: '#ece9d8' }}>
            <div className="win-titlebar">
              <div className="win-titlebar-title">
                <span>Confirm</span>
              </div>
              <button className="win-close-btn" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                Transfer Table {sourceTable} to {targetTable}?
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '10px 16px', background: '#e0dcc8' }}>
              <button
                ref={yesButtonRef}
                className="win-btn"
                style={{ width: '65px', fontWeight: 'bold' }}
                onClick={handleConfirmYes}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmYes();
                  if (e.key === 'Escape') setShowConfirm(false);
                }}
              >
                Yes
              </button>
              <button className="win-btn" style={{ width: '65px' }} onClick={() => setShowConfirm(false)}>
                No
              </button>
              <button className="win-btn" style={{ width: '65px' }} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
