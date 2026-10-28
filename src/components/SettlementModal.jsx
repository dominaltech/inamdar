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
    tables,
    settleBillWithPayment,
    triggerTableFocus,
  } = usePos();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef(null);

  const tableData = tables[settleTableId] || {
    id: settleTableId,
    section: 'AC',
    items: [],
  };

  const totalAmount = tableData.items.reduce((s, it) => s + it.amount, 0);
  const totalItems = tableData.items.filter(it => it.qty > 0).length;

  useEffect(() => {
    if (showSettleModal) {
      setSelectedIndex(0);
    }
  }, [showSettleModal]);

  useEffect(() => {
    if (!showSettleModal) return;

    function handleKeyDown(e) {
      // Allow keyboard navigation: 1, 2, 3 or Arrow keys or Enter / Escape
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
  }, [showSettleModal, selectedIndex, settleTableId, totalAmount]);

  if (!showSettleModal) return null;

  const handleSettleConfirm = (modeId) => {
    settleBillWithPayment(settleTableId, modeId);
    triggerTableFocus?.();
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1250 }}>
      <div ref={modalRef} className="win-window" style={{ width: '440px', background: '#ece9d8' }}>
        {/* Title Bar */}
        <div className="win-titlebar" style={{ background: 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)' }}>
          <div className="win-titlebar-title">
            <span>Bill Settlement — Table {settleTableId} [{tableData.section || 'AC'}]</span>
          </div>
          <button className="win-close-btn" onClick={() => { setShowSettleModal(false); triggerTableFocus?.(); }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Bill Summary Box */}
          <div className="win-bevel-thin-inset" style={{ padding: '10px 14px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0a246a' }}>
                Table {settleTableId} &bull; {tableData.section || 'AC'}
              </div>
              <div style={{ fontSize: '11px', color: '#555555', marginTop: '2px' }}>
                Active Items : {totalItems} dishes
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>Net Amount Due</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#006600' }}>
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payment Options Label */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#222' }}>
              Select Payment Mode (Press 1, 2, 3 or use Arrow Keys &amp; Enter):
            </div>

            {/* 3 Selectable Payment Option Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '13px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{mode.icon}</span>
                      <span style={{ fontSize: '14px' }}>{mode.label}</span>
                    </div>
                    <div style={{
                      background: isSelected ? '#ffffff' : '#0a246a',
                      color: isSelected ? '#0a246a' : '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
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
          <div style={{ fontSize: '11px', color: '#444444', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
            Press <b>[Enter]</b> to settle with selected mode &bull; <b>[Esc]</b> to cancel
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="win-btn"
              style={{ minWidth: '100px', fontWeight: 'bold', background: '#dcf5dc' }}
              onClick={() => handleSettleConfirm(PAYMENT_MODES[selectedIndex].id)}
            >
              ✓ Settle (Enter)
            </button>
            <button
              className="win-btn"
              style={{ minWidth: '80px' }}
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
