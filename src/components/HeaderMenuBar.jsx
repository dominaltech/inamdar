import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function HeaderMenuBar() {
  const { 
    setShowLoginModal, 
    setScreenMode, 
    setIsCancelMode,
    setShowShiftModal,
    setShowSettlementMenu,
    closeDay,
    openModal,
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
      // Transaction
      case 'ORDER_MODE':
        setIsCancelMode(false);
        setScreenMode('ORDER');
        break;
      case 'BILLING':
        setIsCancelMode(false);
        setScreenMode('CASH_MEMO');
        break;
      case 'DISPLAY_ORDER':
        setScreenMode('DISPLAY_ORDER');
        break;
      case 'DETAILS_OF_BILL':
        setScreenMode('DETAILS_OF_BILL');
        break;
      case 'TABLE_SHIFT':
        setShowShiftModal(true);
        break;
      case 'SETTLEMENT':
        setShowSettlementMenu(true);
        break;
      case 'DUPLICATE_BILL':
        openModal('SALES_REGISTER');
        break;
      case 'REPORTS_DAY_SUMMARY':
        setScreenMode('REPORTS');
        break;
      case 'CLOSE_DAY':
        closeDay();
        break;
      case 'LOGIN':
        setShowLoginModal(true);
        break;
      case 'EXIT':
        if (window.confirm("Do you really want to exit Inamdar POS?")) {
          window.location.reload();
        }
        break;

      // Master
      case 'MENU_MASTER':
        openModal('MENU_MASTER');
        break;
      case 'TABLE_MASTER':
        openModal('TABLE_MASTER');
        break;
      case 'REASON_MASTER':
        openModal('REASON_MASTER');
        break;
      case 'PRINTER_SETUP':
        openModal('PRINTER_SETUP');
        break;
      case 'CREDIT_LEDGER':
        openModal('CREDIT_LEDGER');
        break;
      case 'STAFF_MASTER':
        openModal('STAFF_MASTER');
        break;

      // Credits
      case 'ROOM_POST':
        openModal('ROOM_POST');
        break;

      // Reports
      case 'ITEM_SALES':
        openModal('ITEM_SALES');
        break;
      case 'CANCELLED_ORDERS':
        openModal('CANCELLED_ORDERS');
        break;
      case 'AUDIT_TRAIL':
        openModal('AUDIT_TRAIL');
        break;
      case 'SALES_REGISTER':
        openModal('SALES_REGISTER');
        break;

      // Utilities
      case 'CLOUD_CONFIG':
        openModal('CLOUD_CONFIG');
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
          <span>Dominal's POS - INAMDAR RESTAURANT &amp; TAKEAWAY, SOLAPUR [Terminal : Server] [Computer : SERVER]</span>
        </div>
      </div>

      {/* Classic Menu Bar (Zero Dummy Elements - All Working!) */}
      <div className="win-menubar" style={{ borderBottom: '1px solid #7f9db9' }}>
        {/* 1. Transaction */}
        <div className={`win-menu-item ${activeMenu === 'Transaction' ? 'active' : ''}`} onClick={() => handleMenuClick('Transaction')}>
          <u>T</u>ransaction
          {activeMenu === 'Transaction' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('ORDER_MODE')}>
                <span>New Order (Touch Screen KOT)</span>
                <span className="win-dropdown-hotkey">F5</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('BILLING')}>
                <span>Billing (Cash Memo)</span>
                <span className="win-dropdown-hotkey">F6</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('DISPLAY_ORDER')}>
                <span>Display Order (KOT Transfer)</span>
                <span className="win-dropdown-hotkey">Esc</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('DETAILS_OF_BILL')}>
                <span>Details of Bill</span>
                <span className="win-dropdown-hotkey">Esc</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('DUPLICATE_BILL')}>
                <span>Duplicate Bills Register</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('TABLE_SHIFT')}>
                <span>Table Shift</span>
                <span className="win-dropdown-hotkey">*</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('SETTLEMENT')}>
                <span>Settlement Menu</span>
                <span className="win-dropdown-hotkey">F12</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('LOGIN')}>
                <span>Change User / Login</span>
                <span className="win-dropdown-hotkey">F11</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('REPORTS_DAY_SUMMARY')}>
                <span>Dayclose Summary Reports</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('CLOSE_DAY')}>
                <span style={{ fontWeight: 'bold', color: '#c00000' }}>Close Day</span>
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
              <div className="win-dropdown-row" onClick={() => handleAction('MENU_MASTER')}>
                <span>Menu Card Master (Supabase Sync)</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('TABLE_MASTER')}>
                <span>Tables Master &amp; Layout Inspector</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('REASON_MASTER')}>
                <span>Cancel KOT Reason Master</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('CREDIT_LEDGER')}>
                <span>Customers Credit Master</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('STAFF_MASTER')}>
                <span>Waiters &amp; Staff Master</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('PRINTER_SETUP')}>
                <span>Thermal Printer Setup</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Credits */}
        <div className={`win-menu-item ${activeMenu === 'Credits' ? 'active' : ''}`} onClick={() => handleMenuClick('Credits')}>
          <u>C</u>redits
          {activeMenu === 'Credits' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('CREDIT_LEDGER')}>
                <span>Customer Credit Ledger &amp; Payments</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('ROOM_POST')}>
                <span>Hotel Room Post Charges</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Employee */}
        <div className={`win-menu-item ${activeMenu === 'Employee' ? 'active' : ''}`} onClick={() => handleMenuClick('Employee')}>
          <u>E</u>mployee
          {activeMenu === 'Employee' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('STAFF_MASTER')}>
                <span>Waiters &amp; Staff Performance</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('LOGIN')}>
                <span>Change Operator / Shift PIN</span>
                <span className="win-dropdown-hotkey">F11</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Reports */}
        <div className={`win-menu-item ${activeMenu === 'Reports' ? 'active' : ''}`} onClick={() => handleMenuClick('Reports')}>
          <u>R</u>eports
          {activeMenu === 'Reports' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('REPORTS_DAY_SUMMARY')}>
                <span>Day Summary / Dayclose Report</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('ITEM_SALES')}>
                <span>Item Sales Report</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('CANCELLED_ORDERS')}>
                <span>Cancelled Orders &amp; Waste Report</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('AUDIT_TRAIL')}>
                <span>Audit Alteration Report &amp; System Log</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('SALES_REGISTER')}>
                <span>Sales Register &amp; Bills Ledger</span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Utilities */}
        <div className={`win-menu-item ${activeMenu === 'Utilities' ? 'active' : ''}`} onClick={() => handleMenuClick('Utilities')}>
          <u>U</u>tilities
          {activeMenu === 'Utilities' && (
            <div className="win-dropdown">
              <div className="win-dropdown-row" onClick={() => handleAction('TABLE_MASTER')}>
                <span>Tables Master &amp; Occupancy</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('CLOUD_CONFIG')}>
                <span>Supabase Cloud Database Config</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('PRINTER_SETUP')}>
                <span>Thermal Printer Routing Setup</span>
              </div>
              <div className="win-dropdown-row" onClick={() => handleAction('CLOSE_DAY')}>
                <span style={{ fontWeight: 'bold', color: '#c00000' }}>End of Day Finalize</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
