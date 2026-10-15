import React, { useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function InfoModal() {
  const { infoDialog, setInfoDialog } = usePos();
  const okBtnRef = useRef(null);

  useEffect(() => {
    if (infoDialog) {
      setTimeout(() => {
        okBtnRef.current?.focus();
      }, 50);
    }
  }, [infoDialog]);

  if (!infoDialog) return null;

  const handleClose = () => {
    setInfoDialog(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1300 }}>
      <div className="win-window" style={{ width: '340px', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>{infoDialog.title || "Dominal's POS 9.99.451"}</span>
          </div>
          <button className="win-close-btn" onClick={handleClose}>✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#0055ea',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            i
          </div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
            {infoDialog.message}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 16px', background: '#e0dcc8' }}>
          <button
            ref={okBtnRef}
            className="win-btn"
            style={{ width: '80px', fontWeight: 'bold' }}
            onClick={handleClose}
            onKeyDown={handleKeyDown}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
