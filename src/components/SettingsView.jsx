import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import {
  exportBothBackupFiles,
  parseAndValidateBackup,
  isElectronEnv,
  MAX_ANNUAL_REVENUE_LIMIT,
  getCalibratedBills,
} from '../services/localBackupService';

export default function SettingsView() {
  const {
    currentUser,
    setScreenMode,
    allBills = [],
    customers = [],
    tables = {},
    menuItems = [],
    categories = [],
    setAllBills,
    setDailyTransactions,
    setCustomers,
  } = usePos();

  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(
    currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER'
  );
  const [authError, setAuthError] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });
  const [showClearRevenueConfirm, setShowClearRevenueConfirm] = useState(false);
  const [clearPinInput, setClearPinInput] = useState('');
  const [clearPinError, setClearPinError] = useState('');

  const fileInputRef = useRef(null);

  const showToast = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'info' }), 4000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setScreenMode('ORDER');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setScreenMode]);

  const handleAdminAuth = (e) => {
    e.preventDefault();
    const pin = adminPin.trim();
    if (pin === '1234' || pin === '9999') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Admin PIN! (Default: 1234 or 9999)');
    }
  };

  // Calibrated statutory revenue (< 18 Lakhs)
  const { bills: calibratedBills, totalRevenue, isCalibrated } = useMemo(() => {
    return getCalibratedBills(allBills);
  }, [allBills]);

  const handleExportData = () => {
    try {
      const res = exportBothBackupFiles();
      if (res.wroteElectron) {
        showToast('Successfully exported backup and revenue files to C:\\InamdarPOS_Data and D:\\InamdarPOS_Data!', 'success');
      } else {
        showToast('Downloaded inamdar_backup_data.txt & inamdar_revenue_history.txt to your computer!', 'success');
      }
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = parseAndValidateBackup(content);
      if (!res.valid) {
        alert('Backup Import Failed: ' + res.error);
        return;
      }

      if (window.confirm(`Are you sure you want to restore data from ${file.name}? This will update local tables, bills, and customers.`)) {
        const data = res.data;
        if (Array.isArray(data.allBills)) {
          setAllBills(data.allBills);
        }
        if (Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
        showToast('Backup restored successfully!', 'success');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearRevenueSubmit = (e) => {
    e.preventDefault();
    if (clearPinInput.trim() === '1234' || clearPinInput.trim() === '9999') {
      setAllBills([]);
      setDailyTransactions([]);
      localStorage.removeItem('inamdar_revenue_history');
      setShowClearRevenueConfirm(false);
      setClearPinInput('');
      setClearPinError('');
      showToast('Settled bills revenue history has been safely cleared from local storage.', 'success');
    } else {
      setClearPinError('Invalid Admin PIN! Cannot clear revenue.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#ece9d8', fontFamily: 'Tahoma, sans-serif' }}>
        <div className="win-window" style={{ width: '360px', background: '#ece9d8', boxShadow: '3px 3px 12px rgba(0,0,0,0.5)' }}>
          <div className="win-titlebar" style={{ background: '#0a246a' }}>
            <div className="win-titlebar-title">
              <span>🔒 Admin Authentication Required — Settings</span>
            </div>
            <button className="win-close-btn" onClick={() => setScreenMode('ORDER')}>✕</button>
          </div>
          <form onSubmit={handleAdminAuth} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: '#333' }}>
              System Settings, Local Disk Backup, and Revenue controls are restricted to Management. Enter Admin PIN to proceed:
            </div>
            <input
              id="admin-settings-pin-input"
              type="password"
              autoFocus
              value={adminPin}
              onChange={(e) => {
                setAdminPin(e.target.value);
                setAuthError('');
              }}
              placeholder="Enter Admin PIN (1234)"
              style={{ padding: '6px', border: '2px inset #808080', fontSize: '15px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '4px' }}
            />
            {authError && (
              <div style={{ color: '#c00000', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                {authError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="win-btn" onClick={() => setScreenMode('ORDER')}>
                Cancel (Esc)
              </button>
              <button id="btn-unlock-settings" type="submit" className="win-btn" style={{ background: '#0a246a', color: '#fff', fontWeight: 'bold' }}>
                Unlock Settings (↵)
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ece9d8', fontFamily: 'Tahoma, sans-serif' }}>
      {/* 1. Header Toolbar */}
      <div className="win-titlebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', height: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
            ⚙️ Dominal's POS — System Settings &amp; Local Disk C/D Dual Backup Storage
          </span>
          <span style={{ fontSize: '10px', background: '#006600', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
            {isElectronEnv() ? '🖥️ Desktop Electron Mode' : '🌐 Web Local Storage Mode'}
          </span>
        </div>
        <button
          onClick={() => setScreenMode('ORDER')}
          className="win-btn"
          style={{ fontSize: '11px', height: '22px', fontWeight: 'bold', background: '#c00000', color: '#fff' }}
        >
          ✕ Back to POS (Esc)
        </button>
      </div>

      {/* Toast Notification */}
      {statusMessage.text && (
        <div style={{
          padding: '6px 12px',
          background: statusMessage.type === 'error' ? '#fce8e6' : '#e6f4ea',
          color: statusMessage.type === 'error' ? '#c5221f' : '#137333',
          borderBottom: '1px solid #aaa',
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* 2. Main Content Panels */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Section A: Dual Local Disk Backup System (C: and D:) */}
        <div className="win-bevel-outset" style={{ background: '#fff', padding: '14px', border: '1px solid #7f9db9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0a246a', paddingBottom: '6px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#0a246a' }}>
              📁 Local Disk Dual Folder Backup (C:\InamdarPOS_Data and D:\InamdarPOS_Data)
            </h3>
            <span style={{ fontSize: '11px', color: '#555', fontWeight: 'bold' }}>
              Auto-saves locally after every order entry &amp; settlement
            </span>
          </div>

          <p style={{ fontSize: '11px', color: '#444', lineHeight: '16px', margin: '0 0 12px 0' }}>
            In accordance with system policy, settled bills and revenue data are <strong>never uploaded to cloud Supabase</strong>.
            All transaction history is stored locally in text files on your computer. When running in Desktop Electron mode,
            files are automatically synchronized to both <code>C:\InamdarPOS_Data</code> and <code>D:\InamdarPOS_Data</code>.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1, padding: '8px', background: '#f5f5f5', border: '1px inset #808080' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a' }}>
                📁 Primary Path: C:\InamdarPOS_Data
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                • <code>inamdar_backup_data.txt</code> (Complete system state)<br />
                • <code>inamdar_revenue_history.txt</code> (Settled bills ledger)
              </div>
            </div>

            <div style={{ flex: 1, padding: '8px', background: '#f5f5f5', border: '1px inset #808080' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a' }}>
                📁 Mirror Path: D:\InamdarPOS_Data
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                • <code>inamdar_backup_data.txt</code> (Redundant backup)<br />
                • <code>inamdar_revenue_history.txt</code> (Redundant revenue)
              </div>
            </div>
          </div>

          {/* Export / Import Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              id="export-backup-btn"
              onClick={handleExportData}
              className="win-btn"
              style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', background: '#0a246a', color: '#fff' }}
            >
              💾 One-Click Export (Save to C: / D: &amp; Download)
            </button>

            <button
              id="import-backup-btn"
              onClick={() => fileInputRef.current?.click()}
              className="win-btn"
              style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 'bold' }}
            >
              📂 Import Data from Backup File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
          </div>
        </div>

        {/* Section B: Statutory Annual Revenue Management (< 18 Lakhs Rule) */}
        <div className="win-bevel-outset" style={{ background: '#fff', padding: '14px', border: '1px solid #7f9db9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #006600', paddingBottom: '6px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#006600' }}>
              📊 Statutory Annual Turnover &amp; Revenue Limits (Under ₹18 Lakhs)
            </h3>
            <span style={{ fontSize: '11px', background: '#dcf5dc', color: '#006600', padding: '2px 8px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #99cc99' }}>
              ✓ Statutorily Compliant: Strictly &lt; 18 Lakhs
            </span>
          </div>

          <p style={{ fontSize: '11px', color: '#444', lineHeight: '16px', margin: '0 0 12px 0' }}>
            Software configuration strictly guarantees that whenever revenue reports or registers are opened, the
            total displayed annual revenue stays below the 18 Lakhs threshold (<code>&lt; ₹18,00,000</code>).
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>STATUTORY REVENUE CEILING</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#c00000', marginTop: '2px' }}>
                &lt; ₹18,00,000.00
              </div>
              <div style={{ fontSize: '10px', color: '#777' }}>18 Lakhs Annual Limit</div>
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>REPORTED ANNUAL REVENUE</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#006600', marginTop: '2px' }}>
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: isCalibrated ? '#c00000' : '#006600', fontWeight: 'bold' }}>
                {isCalibrated ? '● Scaled strictly under 18L threshold' : '● Fully within safe turnover limit'}
              </div>
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>SETTLED BILLS COUNT</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0a246a', marginTop: '2px' }}>
                {calibratedBills.length} Bills
              </div>
              <div style={{ fontSize: '10px', color: '#777' }}>Locally registered bills</div>
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>REGISTERED CUSTOMERS</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0a246a', marginTop: '2px' }}>
                {customers.length} Guests
              </div>
              <div style={{ fontSize: '10px', color: '#777' }}>Unique phone IDs</div>
            </div>
          </div>
        </div>

        {/* Section C: Danger Zone — Clear Settled Bills & Revenue */}
        <div className="win-bevel-outset" style={{ background: '#fff', padding: '14px', border: '1px solid #c00000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c00000', paddingBottom: '6px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#c00000' }}>
              🗑️ Clear / Delete Settled Bills Revenue History
            </h3>
            <span style={{ fontSize: '10px', color: '#c00000', fontWeight: 'bold' }}>
              Admin Permission Required (PIN 1234)
            </span>
          </div>

          <p style={{ fontSize: '11px', color: '#555', lineHeight: '16px', margin: '0 0 10px 0' }}>
            Allows management to purge historical settled bills and reset revenue register in software. Physical dining tables, active running orders, menu items, and customer directories will remain intact.
          </p>

          <button
            id="clear-revenue-btn"
            onClick={() => setShowClearRevenueConfirm(true)}
            className="win-btn"
            style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', background: '#fff0f0', color: '#c00000', border: '1px solid #c00000' }}
          >
            ⚠️ Clear Settled Bills Revenue History...
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Revenue */}
      {showClearRevenueConfirm && (
        <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
          <div className="win-window" style={{ width: '360px', background: '#ece9d8' }}>
            <div className="win-titlebar" style={{ background: '#c00000' }}>
              <div className="win-titlebar-title">
                <span>⚠️ Confirm Clear Revenue History</span>
              </div>
              <button className="win-close-btn" onClick={() => setShowClearRevenueConfirm(false)}>✕</button>
            </div>
            <form onSubmit={handleClearRevenueSubmit} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: '#333' }}>
                Are you sure you want to delete settled bills revenue history? This action is permanent. Enter Admin PIN to proceed:
              </div>
              <input
                id="clear-revenue-pin-input"
                type="password"
                autoFocus
                value={clearPinInput}
                onChange={(e) => {
                  setClearPinInput(e.target.value);
                  setClearPinError('');
                }}
                placeholder="Enter PIN (1234)"
                style={{ padding: '5px', border: '2px inset #808080', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '3px' }}
              />
              {clearPinError && (
                <div style={{ color: '#c00000', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                  {clearPinError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="win-btn" onClick={() => setShowClearRevenueConfirm(false)}>
                  Cancel
                </button>
                <button type="submit" className="win-btn" style={{ background: '#c00000', color: '#fff', fontWeight: 'bold' }}>
                  Delete Revenue (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
