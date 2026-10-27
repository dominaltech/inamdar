import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured, saveSupabaseCredentials } from '../../supabaseClient';

export default function CloudConfigModal({ isOpen, onClose }) {
  const { isCloudConnected, setInfoDialog } = usePos();
  const [url, setUrl] = useState(SUPABASE_URL || '');
  const [anonKey, setAnonKey] = useState(SUPABASE_ANON_KEY || '');

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      alert("Please enter both Supabase URL and Anon Key!");
      return;
    }
    saveSupabaseCredentials(url.trim(), anonKey.trim());
    setInfoDialog({
      title: "Supabase Cloud Config",
      message: "Credentials saved. The page will reload to connect with your live database.",
    });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '560px', maxWidth: '96vw', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>☁️ Supabase Cloud Database Configuration — Inamdar POS</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status Badge */}
          <div style={{
            padding: '8px 12px',
            background: isCloudConnected ? '#e6ffe6' : '#fff0f0',
            border: isCloudConnected ? '1px solid #009900' : '1px solid #cc0000',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: isCloudConnected ? '#006600' : '#cc0000' }}>
              Status: {isCloudConnected ? '● CONNECTED TO SUPABASE REALTIME' : '○ OFFLINE (Local In-Memory Cache Active)'}
            </span>
            <span style={{ fontSize: '11px', color: '#555' }}>
              Latency: {isCloudConnected ? '0ms (Optimistic)' : 'N/A'}
            </span>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>
              Supabase Project URL:
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '11px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>
              Supabase Anon / Public Key:
            </label>
            <textarea
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="win-input"
              style={{ width: '100%', fontSize: '11px', resize: 'vertical' }}
            />
          </div>

          <div style={{ fontSize: '11px', color: '#555', background: '#eef2f8', padding: '6px 10px', border: '1px solid #c0d0e0' }}>
            ℹ️ When connected, menu items, table orders, and settlements synchronize in real-time between the Counter Desktop POS, Captain PWA, and Kitchen Display System.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '1px solid #808080', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="win-btn" onClick={handleSave} style={{ fontWeight: 'bold', minWidth: '75px' }}>
            Save &amp; Connect
          </button>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '75px' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
