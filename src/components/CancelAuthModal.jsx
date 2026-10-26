import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { EMPLOYEES } from '../data/initialData';

export default function CancelAuthModal() {
  const { 
    showCancelAuthModal, 
    setShowCancelAuthModal, 
    pendingCancelDetails, 
    cancelItemFromTable,
    setInfoDialog
  } = usePos();

  const [authorizedBy, setAuthorizedBy] = useState('SUSHANT');
  const [authReason, setAuthReason] = useState('');
  const reasonInputRef = useRef(null);

  useEffect(() => {
    if (showCancelAuthModal) {
      setAuthorizedBy('SUSHANT');
      setAuthReason('');
      setTimeout(() => {
        reasonInputRef.current?.focus();
      }, 50);
    }
  }, [showCancelAuthModal]);

  if (!showCancelAuthModal || !pendingCancelDetails) return null;

  const handleConfirm = () => {
    const { tableId, itemCode, qty, reason } = pendingCancelDetails;
    cancelItemFromTable(tableId, itemCode, qty, reason, authorizedBy);
    setShowCancelAuthModal(false);
    setInfoDialog({
      title: "Dominal's POS",
      message: `Item cancellation authorized by ${authorizedBy}. Cancellation KOT sent to kitchen.`,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      setShowCancelAuthModal(false);
    }
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="win-window" style={{ width: '420px', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>Cancel KOT Authorization details</span>
          </div>
          <button className="win-close-btn" onClick={() => setShowCancelAuthModal(false)}>✕</button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Authorized By</label>
            <div className="win-bevel-inset" style={{ height: '80px', overflowY: 'auto', padding: '4px' }}>
              {EMPLOYEES.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setAuthorizedBy(emp.name)}
                  style={{
                    padding: '3px 8px',
                    cursor: 'pointer',
                    background: authorizedBy === emp.name ? '#0a246a' : 'transparent',
                    color: authorizedBy === emp.name ? '#ffffff' : '#000000',
                  }}
                >
                  {emp.name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Reason</label>
            <input
              ref={reasonInputRef}
              type="text"
              value={authReason}
              onChange={(e) => setAuthReason(e.target.value)}
              onKeyDown={handleKeyDown}
              className="win-input"
              style={{ width: '100%', height: '28px', background: '#d4ffff' }}
              placeholder="Enter authorization notes / PIN"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button className="win-btn" style={{ minWidth: '70px', fontWeight: 'bold' }} onClick={handleConfirm}>
              Ok
            </button>
            <button className="win-btn" style={{ minWidth: '70px' }} onClick={() => setShowCancelAuthModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
