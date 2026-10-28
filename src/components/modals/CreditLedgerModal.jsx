import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { fetchLiveCreditAccounts } from '../../services/supabaseService';

export default function CreditLedgerModal({ isOpen, onClose }) {
  const { setInfoDialog } = usePos();
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('inamdar_credit_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync from Supabase if available
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchLiveCreditAccounts().then(cloudAccs => {
      if (cloudAccs && Array.isArray(cloudAccs) && isMounted) {
        setAccounts(cloudAccs);
        localStorage.setItem('inamdar_credit_accounts', JSON.stringify(cloudAccs));
      }
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  const handleAddAccount = () => {
    const name = window.prompt("Enter Customer / Company Name:");
    if (!name || !name.trim()) return;
    const phone = window.prompt("Enter Phone Number:", "98") || "";
    const limit = window.prompt("Enter Credit Limit (₹):", "10000") || "10000";

    const newAcc = {
      id: `CR-${String(accounts.length + 1).padStart(3, '0')}`,
      name: name.trim().toUpperCase(),
      phone: phone.trim(),
      balance: 0,
      creditLimit: Number(limit) || 10000,
      lastBill: 'None',
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem('inamdar_credit_accounts', JSON.stringify(updated));
    setInfoDialog({
      title: "Credit Account Created",
      message: `Account ${newAcc.id} created for ${newAcc.name} with limit ₹${newAcc.creditLimit}.`,
    });
  };

  const handleSettleCredit = (acc) => {
    const amount = window.prompt(`Enter settlement payment amount for ${acc.name} (Current Outstanding: ₹${acc.balance}):`, String(acc.balance));
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const payAmt = Number(amount);
    const updated = accounts.map(a => {
      if (a.id === acc.id) {
        return { ...a, balance: Math.max(0, a.balance - payAmt) };
      }
      return a;
    });
    setAccounts(updated);
    localStorage.setItem('inamdar_credit_accounts', JSON.stringify(updated));

    setInfoDialog({
      title: "Credit Payment Received",
      message: `Received ₹${payAmt} payment for ${acc.name}. Updated Balance: ₹${Math.max(0, acc.balance - payAmt)}`,
    });
  };

  const totalOutstanding = accounts.reduce((s, a) => s + a.balance, 0);

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '800px', maxWidth: '96vw', height: '75vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>💳 Customer Credit Accounts &amp; Ledger — Inamdar Restaurant</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '6px 14px', background: '#d4d0c8', borderBottom: '1px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#002266' }}>
              Registered Credit Accounts: {accounts.length}
            </span>
            <button
              className="win-btn"
              onClick={handleAddAccount}
              style={{ fontWeight: 'bold', fontSize: '11px', padding: '2px 8px' }}
            >
              + New Account
            </button>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#990000' }}>
            Total Outstanding Balance: ₹{totalOutstanding.toFixed(2)}
          </span>
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '80px' }}>Account ID</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Customer Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '100px' }}>Phone</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '100px' }}>Credit Limit</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '110px' }}>Outstanding</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '90px' }}>Last Bill</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '110px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No customer credit accounts registered yet. Click "+ New Account" to add one.
                  </td>
                </tr>
              ) : (
                accounts.map((acc, idx) => (
                  <tr
                    key={acc.id}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{acc.id}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{acc.name}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', color: '#555' }}>{acc.phone}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{acc.creditLimit.toFixed(2)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: acc.balance > 0 ? '#cc0000' : '#008000' }}>
                      ₹{acc.balance.toFixed(2)}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>{acc.lastBill}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <button
                        className="win-btn"
                        disabled={acc.balance <= 0}
                        onClick={() => handleSettleCredit(acc)}
                        style={{ fontSize: '11px', padding: '1px 6px', fontWeight: 'bold' }}
                      >
                        Receive Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
