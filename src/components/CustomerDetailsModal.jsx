import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { IconStar } from './common/Icons';

export default function CustomerDetailsModal({
  show,
  tableId,
  initialName = '',
  initialPhone = '',
  onConfirm,
  onCancel,
}) {
  const { customers = [] } = usePos?.() || {};
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  const wasShown = useRef(false);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (show) {
      if (!wasShown.current) {
        setName(initialName || '');
        setPhone(initialPhone || '');
        setMatchedCustomer(null);
        setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputRef.current?.select();
        }, 50);
      }

      const handleCaptureEscape = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onCancelRef.current?.();
        }
      };
      window.addEventListener('keydown', handleCaptureEscape, true);
      return () => window.removeEventListener('keydown', handleCaptureEscape, true);
    }
    wasShown.current = show;
  }, [show, initialName, initialPhone]);

  // Check for repeat customer when phone changes
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(raw);
    if (raw.length >= 7) {
      const match = customers.find(c => c.phone === raw);
      if (match) {
        setMatchedCustomer(match);
        if (!name || name === 'Guest') {
          setName(match.name || '');
        }
      } else {
        setMatchedCustomer(null);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  if (!show) return null;

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      phoneInputRef.current?.focus();
      phoneInputRef.current?.select();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
      onCancel?.();
    }
  };

  const handlePhoneKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm?.({
        name: name.trim() || '',
        phone: phone.trim(),
      });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
      onCancel?.();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm?.({
      name: name.trim() || '',
      phone: phone.trim(),
    });
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1200 }}>
      <div
        className="win-window"
        style={{
          width: '360px',
          background: '#ece9d8',
          boxShadow: '3px 3px 10px rgba(0,0,0,0.4)',
        }}
      >
        {/* Title Bar */}
        <div className="win-titlebar" style={{ height: '22px', padding: '1px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span>Customer Details - {String(tableId).startsWith('00') ? 'Home Delivery' : `Table ${tableId}`}</span>
          </div>
          <button
            className="win-close-btn"
            onClick={() => onCancel?.()}
            style={{ width: '16px', height: '14px', fontSize: '10px', lineHeight: '10px' }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '12px 16px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="cust-name-input"
              style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}
            >
              Customer Name:
            </label>
            <input
              id="cust-name-input"
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Rahul / Guest"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '12px', padding: '2px 6px' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="cust-phone-input"
              style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px' }}
            >
              Mobile / Phone Number:
            </label>
            <input
              id="cust-phone-input"
              ref={phoneInputRef}
              type="text"
              inputMode="numeric"
              placeholder="e.g. 9876543210 (Optional)"
              value={phone}
              onChange={handlePhoneChange}
              onKeyDown={handlePhoneKeyDown}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '12px', padding: '2px 6px' }}
            />
            {matchedCustomer && (
              <div style={{ marginTop: '5px', padding: '4px 6px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '3px', color: '#155724', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconStar size={12} color="#155724" fill="#155724" />
                  <span><strong>Repeat Guest:</strong> {matchedCustomer.visit_count} visits</span>
                </span>
                <span>Spent: ₹{Number(matchedCustomer.total_spent || 0).toFixed(0)}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="win-btn"
              onClick={() => onCancel?.()}
              style={{ minWidth: '75px', height: '24px', fontSize: '11px' }}
            >
              Skip (Esc)
            </button>
            <button
              type="submit"
              className="win-btn"
              style={{ minWidth: '75px', height: '24px', fontSize: '11px', fontWeight: 'bold' }}
            >
              OK (↵)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
