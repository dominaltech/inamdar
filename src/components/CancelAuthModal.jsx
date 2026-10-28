import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

const MANAGERS = [
  { id: '1', name: 'SUSHANT', pin: '1234' },
  { id: '2', name: 'ADMIN / OWNER', pin: '9999' },
  { id: '3', name: 'MANAGER', pin: '1234' },
];

export default function CancelAuthModal() {
  const { 
    showCancelAuthModal, 
    setShowCancelAuthModal, 
    pendingCancelDetails, 
    cancelItemFromTable,
    triggerTableFocus,
  } = usePos();

  const [selectedManagerIndex, setSelectedManagerIndex] = useState(0);
  const [password, setPassword] = useState('');
  const [reasonRemark, setReasonRemark] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const passwordInputRef = useRef(null);
  const reasonInputRef = useRef(null);

  useEffect(() => {
    if (showCancelAuthModal) {
      setSelectedManagerIndex(0);
      setPassword('');
      setReasonRemark(pendingCancelDetails?.reason || 'CANCELLED BY GUEST');
      setErrorMsg('');
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }
  }, [showCancelAuthModal, pendingCancelDetails]);

  if (!showCancelAuthModal || !pendingCancelDetails) return null;

  const handleConfirm = () => {
    const manager = MANAGERS[selectedManagerIndex];
    if (manager.pin && password.trim() !== manager.pin) {
      setErrorMsg(`Invalid Password for ${manager.name}! (Hint: ${manager.pin})`);
      passwordInputRef.current?.focus();
      return;
    }

    const { tableId, itemCode, qty } = pendingCancelDetails;
    cancelItemFromTable(tableId, itemCode, qty, reasonRemark, manager.name);
    setShowCancelAuthModal(false);
    triggerTableFocus?.();
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      reasonInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setShowCancelAuthModal(false);
      triggerTableFocus?.();
    }
  };

  const handleReasonKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      setShowCancelAuthModal(false);
      triggerTableFocus?.();
    }
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="win-window" style={{ width: '420px', background: '#ece9d8' }}>
        <div className="win-titlebar" style={{ background: 'linear-gradient(90deg, #aa0000 0%, #dd4444 100%)' }}>
          <div className="win-titlebar-title">
            <span>Cancel KOT Authorization details</span>
          </div>
          <button className="win-close-btn" onClick={() => { setShowCancelAuthModal(false); triggerTableFocus?.(); }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Authorized By Manager Selector */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
              Authorized By
            </label>
            <div className="win-bevel-inset" style={{ height: '70px', overflowY: 'auto', padding: '3px', background: '#fff' }}>
              {MANAGERS.map((mgr, idx) => (
                <div
                  key={mgr.id}
                  onClick={() => setSelectedManagerIndex(idx)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: idx === selectedManagerIndex ? 'bold' : 'normal',
                    background: idx === selectedManagerIndex ? '#0a246a' : 'transparent',
                    color: idx === selectedManagerIndex ? '#ffffff' : '#000000',
                  }}
                >
                  {mgr.name}
                </div>
              ))}
            </div>
          </div>

          {/* Password / PIN Input */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
              Manager Password / PIN
            </label>
            <input
              ref={passwordInputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              className="win-input"
              style={{ width: '100%', height: '26px', background: '#d4ffff', fontSize: '12px' }}
              placeholder="Enter PIN (e.g. 1234)"
            />
          </div>

          {/* Reason / Remarks */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '11px', marginBottom: '4px' }}>
              Reason / Remark
            </label>
            <input
              ref={reasonInputRef}
              type="text"
              value={reasonRemark}
              onChange={(e) => setReasonRemark(e.target.value)}
              onKeyDown={handleReasonKeyDown}
              className="win-input"
              style={{ width: '100%', height: '26px', fontSize: '12px' }}
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{ color: '#c00000', fontSize: '11px', fontWeight: 'bold' }}>
              {errorMsg}
            </div>
          )}

          {/* Dialog Action Buttons */}
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
