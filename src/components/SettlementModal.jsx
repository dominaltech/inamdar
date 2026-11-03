import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

const PAYMENT_MODES = [
  { id: 'Cash', label: 'Cash', keyNum: '1', keyChar: 'C', icon: '💵' },
  { id: 'UPI', label: 'UPI / QR', keyNum: '2', keyChar: 'U', icon: '📱' },
  { id: 'Card', label: 'Credit / Debit Card', keyNum: '3', keyChar: 'D', icon: '💳' },
];

export default function SettlementModal() {
  const {
    showSettleModal,
    setShowSettleModal,
    settleTableId,
    settleBillData,
    tables,
    settleBillWithPayment,
    triggerTableFocus,
  } = usePos();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef(null);

  const cleanId = String(settleTableId || '').trim().toUpperCase();
  const baseId = cleanId.replace(/[A-Z]/g, '');
  const tableData = tables[cleanId] || (baseId && tables[baseId]) || (baseId && tables[`${baseId}A`]) || {
    id: settleTableId,
    section: 'GENERAL',
    items: [],
  };

  const billNo = settleBillData?.billNo || '';
  const billItems = (settleBillData?.items && settleBillData.items.length > 0)
    ? settleBillData.items
    : tableData.items;

  const totalAmount = Number(settleBillData?.amount ?? billItems.reduce((s, it) => s + (it.amount || it.qty * it.rate || 0), 0));
  const totalItems = billItems.filter(it => it.qty > 0).length;
  const sectionName = settleBillData?.section || tableData.section || 'GENERAL';

  useEffect(() => {
    if (showSettleModal) {
      setSelectedIndex(0);
    }
  }, [showSettleModal]);

  useEffect(() => {
    if (!showSettleModal) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowSettleModal(false);
        triggerTableFocus?.();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % PAYMENT_MODES.length);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + PAYMENT_MODES.length) % PAYMENT_MODES.length);
        return;
      }

      if (e.key === '1' || e.key.toUpperCase() === 'C') {
        e.preventDefault();
        setSelectedIndex(0);
        return;
      }

      if (e.key === '2' || e.key.toUpperCase() === 'U') {
        e.preventDefault();
        setSelectedIndex(1);
        return;
      }

      if (e.key === '3' || e.key.toUpperCase() === 'D' || e.key.toUpperCase() === 'K') {
        e.preventDefault();
        setSelectedIndex(2);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSettleConfirm(PAYMENT_MODES[selectedIndex].id);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showSettleModal, selectedIndex, settleTableId, totalAmount, settleBillData]);

  if (!showSettleModal) return null;

  const handleSettleConfirm = (modeId) => {
    settleBillWithPayment(settleTableId, modeId, settleBillData?.billNo);
    triggerTableFocus?.();
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1250 }}>
      <div ref={modalRef} className="win-window" style={{ width: '480px', background: '#ece9d8', boxShadow: '3px 3px 12px rgba(0,0,0,0.5)' }}>
        {/* Title Bar */}
        <div className="win-titlebar" style={{ background: 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)', height: '24px', padding: '2px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span>Bill Settlement — Bill #{billNo || 'New'} (Table {settleTableId}) [{sectionName}]</span>
          </div>
          <button className="win-close-btn" onClick={() => { setShowSettleModal(false); triggerTableFocus?.(); }}>✕</button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Bill Summary Box */}
          <div className="win-bevel-thin-inset" style={{ padding: '8px 12px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0a246a' }}>
                Table {settleTableId} &bull; {sectionName}
                {settleBillData?.customerName && (
                  <span style={{ marginLeft: '8px', color: '#555', fontWeight: 'normal', fontSize: '11px' }}>
                    ({settleBillData.customerName})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#555555', marginTop: '2px' }}>
                Total Items: {totalItems} dishes {billNo ? `• Bill #${billNo}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>Net Amount Due</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#006600' }}>
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Itemized Food List Preview */}
          {billItems.length > 0 && (
            <div style={{ maxHeight: '110px', overflowY: 'auto', border: '1px solid #7f9db9', background: '#ffffff' }}>
              <table className="order-table" style={{ width: '100%', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th style={{ width: '40px', textAlign: 'right' }}>Qty</th>
                    <th style={{ width: '50px', textAlign: 'right' }}>Rate</th>
                    <th style={{ width: '60px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.name}</td>
                      <td style={{ textAlign: 'right' }}>{it.qty}</td>
                      <td style={{ textAlign: 'right' }}>{Number(it.rate || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{Number(it.amount || it.qty * it.rate || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Options Label */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#222' }}>
              Select Payment Mode (Press 1, 2, 3 or use Arrow Keys &amp; Enter):
            </div>

            {/* 3 Selectable Payment Option Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PAYMENT_MODES.map((mode, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSettleConfirm(mode.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      backgroundColor: isSelected ? '#0a246a' : '#ece9d8',
                      color: isSelected ? '#ffffff' : '#000000',
                      borderTop: isSelected ? '2px solid #808080' : '2px solid #ffffff',
                      borderLeft: isSelected ? '2px solid #808080' : '2px solid #ffffff',
                      borderRight: isSelected ? '2px solid #ffffff' : '2px solid #808080',
                      borderBottom: isSelected ? '2px solid #ffffff' : '2px solid #808080',
                      boxShadow: isSelected ? 'none' : '1px 1px 0px #000000',
                      outline: isSelected ? '2px solid #ffcc00' : 'none',
                      outlineOffset: '-2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{mode.icon}</span>
                      <span style={{ fontSize: '13px' }}>{mode.label}</span>
                    </div>
                    <div style={{
                      background: isSelected ? '#ffffff' : '#0a246a',
                      color: isSelected ? '#0a246a' : '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}>
                      [{mode.keyNum}]
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cheatsheet / Instructions */}
          <div style={{ fontSize: '10px', color: '#444444', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
            Press <b>[Enter]</b> to settle with selected mode &bull; <b>[Esc]</b> to cancel
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              className="win-btn"
              style={{ minWidth: '90px', fontWeight: 'bold', background: '#dcf5dc', height: '24px', fontSize: '11px' }}
              onClick={() => handleSettleConfirm(PAYMENT_MODES[selectedIndex].id)}
            >
              ✓ Settle (Enter)
            </button>
            <button
              className="win-btn"
              style={{ minWidth: '70px', height: '24px', fontSize: '11px' }}
              onClick={() => setShowSettleModal(false)}
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
