import React, { useEffect, useRef, useState } from 'react';
import { usePos } from '../context/PosContext';

export const SETTLEMENT_MODES = [
  { id: '1', name: 'Cash', keyNum: '1' },
  { id: '2', name: 'Digital Payments', keyNum: '2' },
  { id: '3', name: 'Online Payment', keyNum: '3' },
  { id: '4', name: 'Swiggy', keyNum: '4' },
  { id: '5', name: 'Zomato', keyNum: '5' },
  { id: '6', name: 'UPI', keyNum: '6' },
  { id: '7', name: 'Bill On Hold', keyNum: '7' },
  { id: '8', name: 'Debit Card', keyNum: '8' },
  { id: '9', name: 'Room Post', keyNum: '9' },
  { id: '10', name: 'Cheque', keyNum: '10' },
  { id: '11', name: 'Sodexo', keyNum: '11' },
  { id: '12', name: 'Ticket', keyNum: '12' },
  { id: '13', name: 'Bills Returned', keyNum: '13' },
  { id: '14', name: 'Void', keyNum: '14' },
  { id: '15', name: 'Guest', keyNum: '15' },
  { id: '16', name: 'Complimentary', keyNum: '16' },
  { id: '17', name: 'Staff', keyNum: '17' },
  { id: '18', name: 'No Charge KOTs', keyNum: '18' },
];

export default function BillSettlementMenuModal() {
  const { showSettlementMenu, setShowSettlementMenu, openBatchSettle } = usePos();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (showSettlementMenu) {
      setSelectedIndex(0);
    }
  }, [showSettlementMenu]);

  useEffect(() => {
    if (!showSettlementMenu) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSettlementMenu(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % SETTLEMENT_MODES.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + SETTLEMENT_MODES.length) % SETTLEMENT_MODES.length);
        return;
      }

      // Direct number shortcuts 1..9
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (idx < SETTLEMENT_MODES.length) {
          e.preventDefault();
          handleSelect(SETTLEMENT_MODES[idx]);
          return;
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(SETTLEMENT_MODES[selectedIndex]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettlementMenu, selectedIndex]);

  if (!showSettlementMenu) return null;

  const handleSelect = (mode) => {
    setShowSettlementMenu(false);
    openBatchSettle(mode.name);
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1350 }}>
      <div className="win-window" style={{ width: '380px', background: '#ece9d8' }}>
        <div className="win-titlebar" style={{ height: '22px', padding: '1px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px' }}>
            <span>Bill Settlement</span>
          </div>
          <button className="win-close-btn" onClick={() => setShowSettlementMenu(false)}>✕</button>
        </div>

        <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: '#ffffff', border: '1px solid #7f9db9', margin: '8px' }}>
          {SETTLEMENT_MODES.map((mode, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={mode.id}
                onClick={() => handleSelect(mode)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  border: isSelected ? '1px dotted #0a246a' : '1px solid transparent',
                  background: isSelected ? '#d4e6f1' : 'transparent',
                  color: isSelected ? '#0a246a' : '#000000',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '20px', color: '#666' }}>{mode.id}.</span>
                <span>{mode.name}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 12px', background: '#ece9d8' }}>
          <button className="win-btn" style={{ minWidth: '60px', fontSize: '11px' }} onClick={() => setShowSettlementMenu(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
