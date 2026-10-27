import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';

export default function SalesRegisterModal({ isOpen, onClose }) {
  const { allBills, reprintBill } = usePos();
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, SETTLED, UNSETTLED

  const filteredBills = (allBills || []).filter(b => {
    if (filterMode === 'SETTLED') return b.isSettled;
    if (filterMode === 'UNSETTLED') return !b.isSettled;
    return true;
  });

  const totalSales = filteredBills.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '900px', maxWidth: '96vw', height: '80vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>📑 Sales Register &amp; Bill Settlement Ledger — Inamdar Restaurant</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '6px 12px', background: '#d4d0c8', borderBottom: '1px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Filter Bills:</span>
            <button
              className="win-btn"
              style={{ fontWeight: filterMode === 'ALL' ? 'bold' : 'normal', background: filterMode === 'ALL' ? '#e0ebf5' : undefined }}
              onClick={() => setFilterMode('ALL')}
            >
              All Bills ({allBills.length})
            </button>
            <button
              className="win-btn"
              style={{ fontWeight: filterMode === 'UNSETTLED' ? 'bold' : 'normal', color: '#008000' }}
              onClick={() => setFilterMode('UNSETTLED')}
            >
              Unsettled ({allBills.filter(b => !b.isSettled).length})
            </button>
            <button
              className="win-btn"
              style={{ fontWeight: filterMode === 'SETTLED' ? 'bold' : 'normal', color: '#000000' }}
              onClick={() => setFilterMode('SETTLED')}
            >
              Settled ({allBills.filter(b => b.isSettled).length})
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#555' }}>
            Double-click row to reprint duplicate receipt
          </div>
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '65px' }}>Bill #</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '60px' }}>Table</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '50px' }}>Pax</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '80px' }}>Section</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '75px' }}>Time</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '60px' }}>Items</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '90px' }}>Amount (₹)</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '90px' }}>Status</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '120px' }}>Payment Mode</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '80px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((b, idx) => {
                const isUnsettled = !b.isSettled;
                return (
                  <tr
                    key={b.billNo}
                    onDoubleClick={() => reprintBill(b.billNo)}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#f8f8f8',
                      color: isUnsettled ? '#008000' : '#000000',
                      fontWeight: isUnsettled ? 'bold' : 'normal',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{b.billNo}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>{b.tableNo}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{b.pax || 2}</td>
                    <td style={{ padding: '4px 8px' }}>{b.section}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>{b.time}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{b.totalItems || (b.items ? b.items.length : 0)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      ₹{Number(b.totalAmount).toFixed(2)}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '2px',
                          fontSize: '10px',
                          background: isUnsettled ? '#e6ffe6' : '#e0e0e0',
                          border: isUnsettled ? '1px solid #008000' : '1px solid #888',
                          color: isUnsettled ? '#008000' : '#333333',
                        }}
                      >
                        {isUnsettled ? 'UNSETTLED' : 'SETTLED'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 8px', fontSize: '11px' }}>{b.paymentMode || '-'}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <button
                        className="win-btn"
                        style={{ fontSize: '10px', padding: '1px 5px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          reprintBill(b.billNo);
                        }}
                      >
                        Reprint
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
            Bills: {filteredBills.length} | Total Value: <span style={{ color: '#002266' }}>₹{totalSales.toFixed(2)}</span>
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
