import React, { useState, useEffect, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { fetchLiveAuditLogs } from '../../services/supabaseService';
import { IconShield } from '../common/Icons';

export default function AuditTrailModal({ isOpen, onClose }) {
  const { dailyTransactions, currentUser } = usePos();
  const [cloudLogs, setCloudLogs] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchLiveAuditLogs().then(logs => {
      if (isMounted && logs && logs.length > 0) {
        setCloudLogs(logs);
      }
    }).catch(err => {
      console.warn('Live audit fetch error:', err);
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  // Combine dynamic audit actions, settlements, and Supabase cloud logs
  const auditLogs = useMemo(() => {
    let savedLogs = [];
    try {
      const stored = localStorage.getItem('inamdar_audit_logs');
      if (stored) savedLogs = JSON.parse(stored);
    } catch (e) {
      console.warn('audit_logs parse error:', e);
    }

    const logs = [...savedLogs];

    // Merge Supabase audit logs
    cloudLogs.forEach(cl => {
      logs.push({
        timestamp: cl.created_at ? new Date(cl.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Today',
        action: cl.action_type || cl.action || 'AUDIT_EVENT',
        tableId: cl.table_id || cl.tableNo || '-',
        details: cl.details ? (typeof cl.details === 'object' ? JSON.stringify(cl.details) : cl.details) : 'Audit action recorded',
        operator: cl.operator || 'System',
      });
    });

    // Settlements from live dailyTransactions
    (dailyTransactions || []).forEach(tx => {
      // Check if already in logs to prevent duplicates
      const exists = logs.some(l => l.action === 'BILL_SETTLEMENT' && l.billNo === tx.billNo);
      if (!exists) {
        logs.push({
          timestamp: tx.time || 'Today',
          action: 'BILL_SETTLEMENT',
          billNo: tx.billNo,
          details: `Settled Bill #${tx.billNo} (Amount ₹${Number(tx.amount).toFixed(2)}) via ${tx.paymentMode}`,
          tableId: tx.tableId,
          operator: currentUser?.name || '1. Operator',
        });
      }
    });

    return logs.reverse();
  }, [dailyTransactions, currentUser, cloudLogs]);

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '850px', maxWidth: '96vw', height: '75vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconShield size={14} color="#ffffff" />
            <span>System Audit Trail &amp; Alteration Register — Inamdar POS</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '6px 12px', background: '#e4ebf5', borderBottom: '1px solid #7f9db9', fontSize: '11px', color: '#002266', fontWeight: 'bold' }}>
          Real-time Audit Log: All table transfers, supervisor cancellations, duplicate reprints, and payment settlements are tracked.
        </div>

        {/* Audit Table */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#2c3e50', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '130px' }}>Timestamp</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '140px' }}>Action</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '70px' }}>Table</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Details</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '130px' }}>Operator</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                    No audit records or alterations logged today.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    style={{
                      background: idx % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      borderBottom: '1px solid #e9ecef',
                    }}
                  >
                    <td style={{ padding: '4px 8px', color: '#555', fontSize: '11px' }}>{log.timestamp}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold', color: log.action === 'CANCEL_ITEM' ? '#cc0000' : '#002266' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>{log.tableId}</td>
                    <td style={{ padding: '4px 8px' }}>{log.details}</td>
                    <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '11px' }}>{log.operator}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#333' }}>
            Total Audit Records: <b>{auditLogs.length}</b> events logged today
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
