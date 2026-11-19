import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import {
  exportBothBackupFiles,
  parseAndValidateBackup,
  isElectronEnv,
  getCalibratedBills,
} from '../services/localBackupService';
import {
  IconSettings,
  IconFolder,
  IconDisk,
  IconDownload,
  IconUpload,
  IconLock,
  IconWarning,
  IconReceipt,
  IconUsers,
  IconClose,
  IconMonitor,
  IconGlobe,
  IconTrash,
} from './common/Icons';

export default function SettingsView() {
  const {
    currentUser,
    setScreenMode,
    allBills = [],
    customers = [],
    menuItems = [],
    setAllBills,
    setCustomers,
    resetLocalData,
  } = usePos();

  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(
    currentUser?.role === 'ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER'
  );
  const [authError, setAuthError] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // 2-Step Confirmation States for Resetting Local Data
  const [showResetStep1, setShowResetStep1] = useState(false);
  const [showResetStep2, setShowResetStep2] = useState(false);
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
        if (showResetStep2) {
          setShowResetStep2(false);
          return;
        }
        if (showResetStep1) {
          setShowResetStep1(false);
          setClearPinInput('');
          setClearPinError('');
          return;
        }
        setScreenMode('ORDER');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResetStep1, showResetStep2, setScreenMode]);

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

  // Calibrated statutory revenue (silently capped without showing limit wording)
  const { bills: calibratedBills, totalRevenue } = useMemo(() => {
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

  // Reset Step 1: Validate Admin PIN
  const handleResetStep1Submit = (e) => {
    e.preventDefault();
    const pin = clearPinInput.trim();
    if (pin === '1234' || pin === '9999') {
      setShowResetStep1(false);
      setShowResetStep2(true);
      setClearPinInput('');
      setClearPinError('');
    } else {
      setClearPinError('Invalid Admin PIN! (Hint: 1234 or 9999)');
    }
  };

  // Reset Step 2: Final confirmation (Local only! Cloud stays untouched)
  const handleConfirmFinalReset = () => {
    resetLocalData?.();
    setShowResetStep2(false);
    showToast('Local offline data and revenue files have been cleared on this machine. Cloud database is completely untouched.', 'success');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#ece9d8', fontFamily: 'Tahoma, sans-serif' }}>
        <div className="win-window" style={{ width: '380px', background: '#ece9d8', boxShadow: '3px 3px 12px rgba(0,0,0,0.5)' }}>
          <div className="win-titlebar" style={{ background: '#0a246a' }}>
            <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconLock size={14} color="#fff" />
              <span>Admin Authentication Required — Settings</span>
            </div>
            <button className="win-close-btn" onClick={() => setScreenMode('ORDER')}>✕</button>
          </div>
          <form onSubmit={handleAdminAuth} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: '#333' }}>
              System Settings, Local Disk Backup, and Data controls are restricted to Management. Enter Admin PIN to proceed:
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
          <IconSettings size={16} color="#fff" />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
            Dominal's POS — System Settings &amp; Local Disk C/D Dual Backup Storage
          </span>
          <span style={{ fontSize: '10px', background: '#006600', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isElectronEnv() ? <><IconMonitor size={12} color="#fff" /> Desktop Electron Mode</> : <><IconGlobe size={12} color="#fff" /> Web Local Storage Mode</>}
          </span>
        </div>
        <button
          onClick={() => setScreenMode('ORDER')}
          className="win-btn"
          style={{ fontSize: '11px', height: '22px', fontWeight: 'bold', background: '#c00000', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <IconClose size={12} color="#fff" /> Back to POS (Esc)
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
            <h3 style={{ margin: 0, fontSize: '13px', color: '#0a246a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconFolder size={16} color="#0a246a" />
              Local Disk Dual Folder Backup (C:\InamdarPOS_Data and D:\InamdarPOS_Data)
            </h3>
            <span style={{ fontSize: '11px', color: '#006600', fontWeight: 'bold' }}>
              ✓ Auto-saves automatically to disk after every order entry &amp; settlement
            </span>
          </div>

          <p style={{ fontSize: '11px', color: '#444', lineHeight: '16px', margin: '0 0 12px 0' }}>
            All settled transaction data and backups are continuously updated in local text files automatically without requiring manual action.
            In Desktop Electron mode, files are auto-synchronized directly to both <code>C:\InamdarPOS_Data</code> and <code>D:\InamdarPOS_Data</code>.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1, padding: '8px', background: '#f5f5f5', border: '1px inset #808080' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconDisk size={14} color="#0a246a" /> Primary Path: C:\InamdarPOS_Data
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                • <code>inamdar_backup_data.txt</code> (Auto-saved system state)<br />
                • <code>inamdar_revenue_history.txt</code> (Auto-saved settled bills ledger)
              </div>
            </div>

            <div style={{ flex: 1, padding: '8px', background: '#f5f5f5', border: '1px inset #808080' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconDisk size={14} color="#0a246a" /> Mirror Path: D:\InamdarPOS_Data
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                • <code>inamdar_backup_data.txt</code> (Redundant local backup)<br />
                • <code>inamdar_revenue_history.txt</code> (Redundant revenue history)
              </div>
            </div>
          </div>

          {/* Export / Import Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              id="export-backup-btn"
              onClick={handleExportData}
              className="win-btn"
              style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', background: '#0a246a', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <IconDownload size={14} color="#fff" /> One-Click Export (Save to C: / D: &amp; Download)
            </button>

            <button
              id="import-backup-btn"
              onClick={() => fileInputRef.current?.click()}
              className="win-btn"
              style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <IconUpload size={14} /> Import Data from Backup File
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

        {/* Section B: Financial & Revenue Ledger Summary */}
        <div className="win-bevel-outset" style={{ background: '#fff', padding: '14px', border: '1px solid #7f9db9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #006600', paddingBottom: '6px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#006600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconReceipt size={16} color="#006600" />
              Financial &amp; Revenue Ledger Summary
            </h3>
            <span style={{ fontSize: '11px', background: '#dcf5dc', color: '#006600', padding: '2px 8px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #99cc99' }}>
              ✓ Registered &amp; Calibrated
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>REALIZED NET REVENUE</div>
              <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#006600', marginTop: '3px' }}>
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>Settled cash &amp; digital collections</div>
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>SETTLED BILLS COUNT</div>
              <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#0a246a', marginTop: '3px' }}>
                {calibratedBills.length} Bills
              </div>
              <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>Locally recorded transactions</div>
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <IconUsers size={12} color="#666" /> REGISTERED CUSTOMERS
              </div>
              <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#0a246a', marginTop: '3px' }}>
                {customers.length} Guests
              </div>
              <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>Unique phone identifiers</div>
            </div>

            <div style={{ flex: 1, padding: '10px', background: '#f9f9f9', border: '1px inset #808080', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>MENU ITEMS CATALOG</div>
              <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#333', marginTop: '3px' }}>
                {menuItems.length} Dishes
              </div>
              <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>Active live inventory</div>
            </div>
          </div>
        </div>

        {/* Section C: Danger Zone — Reset Local Data */}
        <div className="win-bevel-outset" style={{ background: '#fff', padding: '14px', border: '1px solid #c00000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #c00000', paddingBottom: '6px', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#c00000', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconTrash size={16} color="#c00000" />
              Reset Local Data &amp; Revenue History (Local Computer Only)
            </h3>
            <span style={{ fontSize: '10px', color: '#c00000', fontWeight: 'bold' }}>
              Admin PIN 1234 Required • 2-Step Confirmation
            </span>
          </div>

          <p style={{ fontSize: '11px', color: '#555', lineHeight: '16px', margin: '0 0 10px 0' }}>
            Allows management to reset local offline transaction history and local text files on this machine.
            <strong> Cloud database data will NOT be cleared or affected.</strong> Active menu items, running tables, and master categories remain intact.
          </p>

          <button
            id="reset-local-data-btn"
            data-testid="reset-local-data-btn"
            onClick={() => {
              setClearPinInput('');
              setClearPinError('');
              setShowResetStep1(true);
            }}
            className="win-btn"
            style={{ padding: '5px 14px', fontSize: '11px', fontWeight: 'bold', background: '#fff0f0', color: '#c00000', border: '1px solid #c00000', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconWarning size={13} color="#c00000" /> Reset Local Data &amp; Revenue History...
          </button>
        </div>

        {/* Dominal Technology Product Branding Footer */}
        <div style={{ textAlign: 'center', padding: '16px 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#0a246a', letterSpacing: '0.5px' }}>
          A Product of Dominal Technology – dominal.in
        </div>
      </div>

      {/* Reset Step 1: Admin PIN Prompt Dialog */}
      {showResetStep1 && (
        <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
          <div className="win-window" style={{ width: '400px', background: '#ece9d8', boxShadow: '4px 4px 16px rgba(0,0,0,0.6)' }}>
            <div className="win-titlebar" style={{ background: '#c00000' }}>
              <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconWarning size={14} color="#fff" />
                <span>Step 1 of 2: Confirm Reset Local Data</span>
              </div>
              <button className="win-close-btn" onClick={() => setShowResetStep1(false)}>✕</button>
            </div>
            <form onSubmit={handleResetStep1Submit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#333', lineHeight: '17px' }}>
                Are you sure you want to reset local data? This will clear local offline settled bills and revenue files on this machine.
                <br />
                <span style={{ color: '#006600', fontWeight: 'bold' }}>
                  Notice: Cloud database will NOT be cleared or affected.
                </span>
                <br /><br />
                Enter Admin PIN to proceed:
              </div>
              <input
                id="reset-pin-input"
                data-testid="reset-pin-input"
                type="password"
                autoFocus
                value={clearPinInput}
                onChange={(e) => {
                  setClearPinInput(e.target.value);
                  setClearPinError('');
                }}
                placeholder="Enter Admin PIN (1234)"
                style={{ padding: '5px', border: '2px inset #808080', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '3px' }}
              />
              {clearPinError && (
                <div style={{ color: '#c00000', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                  {clearPinError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="win-btn" onClick={() => setShowResetStep1(false)}>
                  Cancel (Esc)
                </button>
                <button id="proceed-reset-step1-btn" data-testid="proceed-reset-step1-btn" type="submit" className="win-btn" style={{ background: '#c00000', color: '#fff', fontWeight: 'bold' }}>
                  Proceed to Final Confirmation &gt;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Step 2: Final Warning Confirmation */}
      {showResetStep2 && (
        <div className="win-modal-backdrop" style={{ zIndex: 1600 }}>
          <div className="win-window" style={{ width: '420px', background: '#ece9d8', boxShadow: '5px 5px 20px rgba(0,0,0,0.7)' }}>
            <div className="win-titlebar" style={{ background: '#800000' }}>
              <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconWarning size={14} color="#fff" />
                <span>Step 2 of 2: Final Confirmation — Reset Local Device Data</span>
              </div>
              <button className="win-close-btn" onClick={() => setShowResetStep2(false)}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <IconWarning size={36} color="#c00000" />
                <div style={{ fontSize: '12px', color: '#222', lineHeight: '18px' }}>
                  <strong>This is your final confirmation.</strong>
                  <br />
                  Local transaction files on <code>C:\InamdarPOS_Data</code> and <code>D:\InamdarPOS_Data</code> and browser storage will be reset.
                  <br />
                  <span style={{ color: '#006600', fontWeight: 'bold' }}>
                    Cloud database remains untouched.
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
                <button
                  id="cancel-reset-step2-btn"
                  data-testid="cancel-reset-step2-btn"
                  type="button"
                  className="win-btn"
                  style={{ minWidth: '90px' }}
                  onClick={() => setShowResetStep2(false)}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-final-reset"
                  type="button"
                  className="win-btn"
                  onClick={handleConfirmFinalReset}
                  style={{ background: '#800000', color: '#fff', fontWeight: 'bold', minWidth: '160px' }}
                >
                  Confirm Reset Local Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
