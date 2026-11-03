import React, { useState, useEffect, useRef } from 'react';

export default function CustomerDetailsModal({
  show,
  tableId,
  initialName = '',
  initialPhone = '',
  onConfirm,
  onCancel,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setName(initialName || '');
      setPhone(initialPhone || '');
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);

      const handleCaptureEscape = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          onCancel?.();
        }
      };
      window.addEventListener('keydown', handleCaptureEscape, true);
      return () => window.removeEventListener('keydown', handleCaptureEscape, true);
    }
  }, [show, initialName, initialPhone, onCancel]);

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
        name: name.trim() || 'Guest',
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
      name: name.trim() || 'Guest',
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
            <span>Customer Details - Table {tableId}</span>
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
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              onKeyDown={handlePhoneKeyDown}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '12px', padding: '2px 6px' }}
            />
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
