import React, { useState } from 'react';
import { CANCEL_REASONS } from '../../data/initialData';

export default function ReasonMasterModal({ isOpen, onClose }) {
  const [reasons, setReasons] = useState(() => {
    const saved = localStorage.getItem('inamdar_cancel_reasons');
    return saved ? JSON.parse(saved) : CANCEL_REASONS;
  });
  const [newReason, setNewReason] = useState('');

  const handleAddReason = (e) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    const clean = newReason.trim().toUpperCase();
    if (reasons.includes(clean)) {
      alert("Reason already exists!");
      return;
    }
    const updated = [...reasons, clean];
    setReasons(updated);
    localStorage.setItem('inamdar_cancel_reasons', JSON.stringify(updated));
    setNewReason('');
  };

  const handleDeleteReason = (idx) => {
    if (reasons.length <= 1) {
      alert("At least one cancellation reason must exist!");
      return;
    }
    const updated = reasons.filter((_, i) => i !== idx);
    setReasons(updated);
    localStorage.setItem('inamdar_cancel_reasons', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '500px', maxWidth: '96vw', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>⚙️ Cancel KOT Reason Master</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '12px 16px' }}>
          {/* Add New Reason Form */}
          <form onSubmit={handleAddReason} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Enter new cancellation reason..."
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="win-input"
              style={{ flex: 1, height: '24px', fontSize: '11px', fontWeight: 'bold' }}
            />
            <button type="submit" className="win-btn" style={{ fontWeight: 'bold', minWidth: '70px' }}>
              + Add
            </button>
          </form>

          {/* List */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', background: '#ffffff', border: '2px solid', borderColor: '#7f9db9 #dfdfdf #dfdfdf #7f9db9' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#0a246a', color: '#ffffff' }}>
                  <th style={{ padding: '4px 8px', textAlign: 'left', width: '35px' }}>#</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left' }}>Cancellation Reason</th>
                  <th style={{ padding: '4px 8px', textAlign: 'center', width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reasons.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0', background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                    <td style={{ padding: '4px 8px', color: '#666' }}>{idx + 1}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{r}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <button
                        className="win-btn"
                        style={{ fontSize: '10px', padding: '1px 5px', color: '#cc0000' }}
                        onClick={() => handleDeleteReason(idx)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '1px solid #808080', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '70px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
