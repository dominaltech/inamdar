import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function PaxPromptModal() {
  const { paxPrompt, setPaxPrompt } = usePos();
  const [paxCount, setPaxCount] = useState('2');
  const inputRef = useRef(null);

  useEffect(() => {
    if (paxPrompt?.show) {
      setPaxCount('2');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [paxPrompt]);

  if (!paxPrompt?.show) return null;

  const handleConfirm = () => {
    const count = parseInt(paxCount, 10) || 1;
    if (paxPrompt.onConfirm) {
      paxPrompt.onConfirm(count);
    }
    setPaxPrompt(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      setPaxPrompt(null);
    }
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1400 }}>
      <div className="win-window" style={{ width: '220px', background: '#ece9d8' }}>
        <div className="win-titlebar" style={{ height: '22px', padding: '1px 6px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px' }}>
            <span>Number of Persons</span>
          </div>
          <button className="win-close-btn" onClick={() => setPaxPrompt(null)}>✕</button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Authentic Pax Graphic (People Icon) */}
          <div style={{ fontSize: '26px', userSelect: 'none' }}>
            👥
          </div>

          <div style={{ flex: 1 }}>
            <input
              ref={inputRef}
              id="pos-pax-input"
              type="number"
              min="1"
              max="99"
              value={paxCount}
              onChange={(e) => setPaxCount(e.target.value)}
              onKeyDown={handleKeyDown}
              className="win-input"
              style={{
                width: '60px',
                height: '26px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                background: '#d4ffff',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 12px', background: '#d4d0c8', borderTop: '1px solid #999' }}>
          <button className="win-btn" style={{ minWidth: '55px', fontWeight: 'bold', fontSize: '11px' }} onClick={handleConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
