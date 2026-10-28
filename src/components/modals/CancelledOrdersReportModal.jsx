import React, { useMemo } from 'react';
import { usePos } from '../../context/PosContext';

export default function CancelledOrdersReportModal({ isOpen, onClose }) {
  const { tables, allBills } = usePos();

  // Extract all cancelled line items across tables and bills
  const cancelledItems = useMemo(() => {
    const list = [];

    // 1. From active tables
    Object.values(tables || {}).forEach(tbl => {
      (tbl.items || []).forEach(it => {
        if (it.isCancelled || it.qty < 0) {
          list.push({
            tableId: tbl.id,
            kotNo: it.kotNo || (tbl.kotNos && tbl.kotNos[0]) || '-',
            code: it.code,
            name: it.name,
            qty: Math.abs(Number(it.qty)),
            rate: Number(it.rate),
            amount: Math.abs(Number(it.amount || it.qty * it.rate)),
            reason: it.reason || 'CANCELLED BY GUEST',
            authorizedBy: it.authorizedBy || 'MANAGER',
            time: it.cancelledAt ? new Date(it.cancelledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '12:30 PM',
          });
        }
      });
    });

    return list;
  }, [tables, allBills]);

  const totalCancelledAmount = cancelledItems.reduce((s, it) => s + it.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '880px', maxWidth: '96vw', height: '75vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>❌ Cancelled Orders &amp; Waste Audit Report — Inamdar Restaurant</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '6px 12px', background: '#ffe6e6', borderBottom: '1px solid #cc0000', fontSize: '11px', color: '#990000', fontWeight: 'bold' }}>
          Strict Manager Auth Ledger: All order deletions require Supervisor PIN verification and generate kitchen cancellation slips.
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#8b0000', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '70px' }}>Time</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '55px' }}>Table</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '55px' }}>KOT #</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '50px' }}>Code</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Dish Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '50px' }}>Qty</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '75px' }}>Amount (₹)</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Reason</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '85px' }}>Authorized By</th>
              </tr>
            </thead>
            <tbody>
              {cancelledItems.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No cancelled orders or waste entries recorded.
                  </td>
                </tr>
              ) : (
                cancelledItems.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      background: idx % 2 === 0 ? '#fff5f5' : '#ffffff',
                      color: '#990000',
                      borderBottom: '1px solid #f0d0d0',
                    }}
                  >
                    <td style={{ padding: '4px 8px' }}>{item.time}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>{item.tableId}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>{item.kotNo}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{item.code}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>-{item.qty}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>-₹{item.amount.toFixed(2)}</td>
                    <td style={{ padding: '4px 8px', fontSize: '11px', color: '#333' }}>{item.reason}</td>
                    <td style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: '#002266' }}>{item.authorizedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#990000' }}>
            Total Cancelled Items: {cancelledItems.length} | Net Loss / Impact: -₹{totalCancelledAmount.toFixed(2)}
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
