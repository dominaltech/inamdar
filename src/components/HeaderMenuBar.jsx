import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function HeaderMenuBar() {
  const { 
    setShowLoginModal, 
    setScreenMode, 
    currentUser, 
    setIsCancelMode,
    setShowShiftModal,
    printCashMemo,
    openSettleModal,
    settleBill,
    activeTableId
  } = usePos();

  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleAction = (action) => {
    setActiveMenu(null);
    switch (action) {
      case 'LOGIN':
        setShowLoginModal(true);
        break;
      case 'ORDER_MODE':
        setIsCancelMode(false);
        setScreenMode('ORDER');
        break;
      case 'BILLING':
        setIsCancelMode(false);
        setScreenMode('CASH_MEMO');
        break;
      case 'TABLE_SHIFT':
        setShowShiftModal(true);
        break;
      case 'SETTLEMENT':
        openSettleModal(activeTableId);
        break;
      case 'REPORTS':
        setScreenMode('REPORTS');
        break;
      case 'PRINT_BILL':
        printCashMemo(activeTableId);
        break;
      case 'EXIT':
        if (window.confirm("Do you really want to exit Dominal's POS?")) {
          window.location.reload();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={menuRef} style={{ userSelect: 'none', background: '#ece9d8' }}>
      {/* Application Title Bar without OS minimize/close buttons */}
      <div className="win-titlebar" style={{ height: '22px', padding: '1px 8px' }}>
        <div className="win-titlebar-title" style={{ fontSize: '11px', letterSpacing: '0.2px' }}>
          <span>Dominal's POS 9.99.451 - INAMDAR RESTAURANT &amp; TAKEAWAY, SOLAPUR [Terminal : Server] [Computer : SERVER]</span>
        </div>
      </div>

      {/* Classic Menu Bar */}
      <div className="win-menubar" style={{ borderBottom: '1px solid #7f9db9' }}>
        {/* 1. Transaction */}
        <div className={`win-menu-item ${activeMenu === 'Transaction' ? 'active' : ''}`} onClick={() => handleMenuClick('Transaction')}>
          <u>T</u>ransaction
          {activeMenu === 'Transaction' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('ORDER_MODE')}>
                <span>Touch Screen KOT</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('BILLING')}>
                <span>Billing</span>
                <span className="win-dropdown-hotkey">F6</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('PRINT_BILL')}>
                <span>Duplicate Bills</span>
              </div>
              <div className="win-dropdown-row">
                <span>Bill Splitting</span>
              </div>
              <div className="win-dropdown-row">
                <span>Import</span>
              </div>
              <div className="win-dropdown-row">
                <span>Export &gt;</span>
              </div>
              <div className="win-dropdown-row">
                <span>Pay In / Pay Out</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('SETTLEMENT')}>
                <span>Settlement</span>
                <span className="win-dropdown-hotkey">F11</span>
              </div>
              <div className="win-dropdown-row">
                <span>Item Not Available</span>
              </div>
              <div className="win-dropdown-row">
                <span>Todays Special</span>
              </div>
              <div className="win-dropdown-row">
                <span>Change Passwords</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('LOGIN')}>
                <span>Change User</span>
                <span className="win-dropdown-hotkey">Esc</span>
              </div>
              <div className="win-dropdown-row">
                <span>Upload Data</span>
              </div>
              <div className="win-dropdown-row">
                <span>Reset Admin Password</span>
              </div>
              <div className="win-dropdown-row">
                <span>Mail Dayclose Reports</span>
              </div>
              <div className="win-dropdown-row">
                <span>AppUpdate &gt;</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('REPORTS')}>
                <span>Close Day</span>
              </div>
              <div className="win-dropdown-row">
                <span>Upload Dashboard Data</span>
              </div>
              <div className="win-dropdown-row">
                <span>Launch Remote Support</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('EXIT')}>
                <span>Exit</span>
                <span className="win-dropdown-hotkey">F4</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Master */}
        <div className={`win-menu-item ${activeMenu === 'Master' ? 'active' : ''}`} onClick={() => handleMenuClick('Master')}>
          <u>M</u>aster
          {activeMenu === 'Master' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row"><span>Menu Card</span></div>
              <div className="win-dropdown-row"><span>Backup Menu</span></div>
              <div className="win-dropdown-row"><span>Discount Reason</span></div>
              <div className="win-dropdown-row"><span>Cancel KOT Reason</span></div>
              <div className="win-dropdown-row"><span>Counter Messages</span></div>
              <div className="win-dropdown-row"><span>Category</span></div>
              <div className="win-dropdown-row"><span>Payin/Payout Heads</span></div>
              <div className="win-dropdown-row"><span>Customers</span></div>
              <div className="win-dropdown-row"><span>Zones</span></div>
              <div className="win-dropdown-row"><span>Banks</span></div>
              <div className="win-dropdown-row"><span>Messages</span></div>
              <div className="win-dropdown-row"><span>Printer Setup</span></div>
              <div className="win-dropdown-row"><span>Preparations Master</span></div>
              <div className="win-dropdown-row"><span>Random Footnotes</span></div>
              <div className="win-dropdown-row"><span>Online Orders Master</span></div>
            </div>
          )}
        </div>

        {/* 3. Credits */}
        <div className={`win-menu-item ${activeMenu === 'Credits' ? 'active' : ''}`} onClick={() => handleMenuClick('Credits')}>
          <u>C</u>redits
          {activeMenu === 'Credits' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row"><span>CreditCard</span></div>
            </div>
          )}
        </div>

        {/* 4. Employee */}
        <div className={`win-menu-item ${activeMenu === 'Employee' ? 'active' : ''}`} onClick={() => handleMenuClick('Employee')}>
          <u>E</u>mployee
          {activeMenu === 'Employee' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row"><span>Details</span></div>
              <div className="win-dropdown-row">
                <span>Layout</span>
                <span className="win-dropdown-hotkey">F9</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Reports */}
        <div className={`win-menu-item ${activeMenu === 'Reports' ? 'active' : ''}`} onClick={() => handleMenuClick('Reports')}>
          <u>R</u>eports
          {activeMenu === 'Reports' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('REPORTS')}>
                <span>Day Summary / Dayclose</span>
              </div>
              <div className="win-dropdown-row"><span>Item Sales Report</span></div>
              <div className="win-dropdown-row"><span>Audit Alteration Report</span></div>
            </div>
          )}
        </div>

        {/* 6. Utilities */}
        <div className={`win-menu-item ${activeMenu === 'Utilities' ? 'active' : ''}`} onClick={() => handleMenuClick('Utilities')}>
          <u>U</u>tilities
          {activeMenu === 'Utilities' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row"><span>Terminal Master</span></div>
              <div className="win-dropdown-row"><span>Hall Master</span></div>
              <div className="win-dropdown-row"><span>Tables Master</span></div>
              <div className="win-dropdown-row"><span>Bill Levels</span></div>
              <div className="win-dropdown-row"><span>Rates Master</span></div>
              <div className="win-dropdown-row"><span>Counters Master</span></div>
              <div className="win-dropdown-row"><span>Time Slots</span></div>
              <div className="win-dropdown-row"><span>General Settings</span></div>
              <div className="win-dropdown-row"><span>Report Settings</span></div>
              <div className="win-dropdown-row"><span>Tax/Charges Master &gt;</span></div>
              <div className="win-dropdown-row"><span>Feedback Categories</span></div>
              <div className="win-dropdown-row"><span>Database &gt;</span></div>
              <div className="win-dropdown-row"><span>Dashboard Registration</span></div>
              <div className="win-dropdown-row"><span>Factory Settings</span></div>
              <div className="win-dropdown-row"><span>Patches &gt;</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
