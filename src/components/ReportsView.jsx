// ReportsView.jsx - Complete Menson's Retro Reports Center (Sections A through K)
// Authentic replica of reports_section.jpeg with live Supabase data analytics
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { REPORT_SECTIONS, REPORTS_BY_ID } from '../services/reportsService';
import { fetchLiveReportsBundle } from '../services/supabaseService';
import ReportDetailModal from './ReportDetailModal';

export default function ReportsView() {
  const { setScreenMode, allBills: contextBills, dailyTransactions: contextTx, tables, triggerTableFocus } = usePos();

  // Selected report ID (defaults to 'A1' Detailed Sales Summary)
  const [selectedReportId, setSelectedReportId] = useState('A1');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Live data bundle fetched from Supabase
  const [liveBundle, setLiveBundle] = useState({
    bills: contextBills || [],
    dailyTransactions: contextTx || [],
    orderItems: [],
    kots: [],
    creditAccounts: [],
    menuItems: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Date filters (formatted DD/MM/YYYY matching Menson's POS screenshot)
  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [fromDate, setFromDate] = useState('01/10/2026'); // Broad range for demo/live data
  const [toDate, setToDate] = useState(getTodayFormatted);

  // Fetch live Supabase bundle on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const bundle = await fetchLiveReportsBundle();
        if (isMounted && bundle) {
          setLiveBundle(prev => ({
            ...prev,
            ...bundle,
            bills: bundle.bills?.length ? bundle.bills : prev.bills,
            dailyTransactions: bundle.dailyTransactions?.length ? bundle.dailyTransactions : prev.dailyTransactions,
          }));
        }
      } catch (err) {
        console.warn('ReportsView live fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Combined context for report calculation
  const dataContext = useMemo(() => ({
    allBills: liveBundle.bills.length ? liveBundle.bills : contextBills,
    dailyTransactions: liveBundle.dailyTransactions.length ? liveBundle.dailyTransactions : contextTx,
    orderItems: liveBundle.orderItems,
    kots: liveBundle.kots,
    creditAccounts: liveBundle.creditAccounts,
    menuItems: liveBundle.menuItems,
    tables
  }), [liveBundle, contextBills, contextTx, tables]);

  // Handle Exit / Close
  const handleClose = () => {
    setScreenMode('ORDER');
    triggerTableFocus?.();
  };

  const showDetailModalRef = useRef(showDetailModal);
  useEffect(() => {
    showDetailModalRef.current = showDetailModal;
  }, [showDetailModal]);

  // Keyboard navigation across sections
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showDetailModalRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setShowDetailModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open modal on double-click
  const handleItemDoubleClick = (repId) => {
    setSelectedReportId(repId);
    setShowDetailModal(true);
  };

  // Reset dates
  const handleReset = () => {
    setFromDate(getTodayFormatted());
    setToDate(getTodayFormatted());
    setSelectedReportId('A1');
  };

  // Quick POS Print
  const handlePosPrint = () => {
    setShowDetailModal(true);
  };

  return (
    <div
      style={{
        padding: '4px',
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        background: '#ece9d8',
      }}
    >
      <div
        className="win-window"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#ece9d8',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Title Bar (Authentic Windows 98/2000 Menson's Bar) */}
        <div className="win-titlebar" style={{ height: '22px', padding: '1px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px', letterSpacing: '0.2px' }}>
            <span>Menson's POS 9.08.431 INAMDAR RESTAURANT &amp; TAKEAWAY, SOLAPUR [ Terminal : SERVER ]</span>
          </div>
          <button
            className="win-close-btn"
            onClick={handleClose}
            title="Exit Reports"
            style={{ width: '16px', height: '14px', fontSize: '10px', lineHeight: '10px' }}
          >
            ✕
          </button>
        </div>

        {/* Section Heading Banner */}
        <div
          style={{
            background: '#ece9d8',
            padding: '2px 10px',
            borderBottom: '1px solid #7f9db9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0a246a' }}>
            REPORTS
          </div>
          <div style={{ fontSize: '10px', color: '#006600', fontWeight: 'bold' }}>
            {isLoading ? '⏳ Syncing Cloud Analytics...' : `☁️ SUPABASE LIVE: ${liveBundle.bills.length} Bills | ${liveBundle.orderItems.length} Items`}
          </div>
        </div>

        {/* 4-Column Main Grid matching reports_section.jpeg */}
        <div
          style={{
            flex: 1,
            padding: '4px 6px',
            background: '#ece9d8',
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr 1fr 1.15fr',
            gap: '6px',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {/* ===================== COLUMN 1: A, B, C ===================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
            {/* A: Revenue */}
            <ReportGroupBox
              section={REPORT_SECTIONS[0]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />

            {/* B: Payment Type */}
            <ReportGroupBox
              section={REPORT_SECTIONS[1]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />

            {/* C: Cash/Expense */}
            <ReportGroupBox
              section={REPORT_SECTIONS[2]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />
          </div>

          {/* ===================== COLUMN 2: D, E ===================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
            {/* D: Menu Item */}
            <ReportGroupBox
              section={REPORT_SECTIONS[3]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
              maxItemsVisible={24}
            />

            {/* E: Taxes / Misc Charges */}
            <ReportGroupBox
              section={REPORT_SECTIONS[4]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />
          </div>

          {/* ===================== COLUMN 3: F, G, H, I ===================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
            {/* F: Halls */}
            <ReportGroupBox
              section={REPORT_SECTIONS[5]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />

            {/* G: Employee */}
            <ReportGroupBox
              section={REPORT_SECTIONS[6]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />

            {/* H: Guest / Customer */}
            <ReportGroupBox
              section={REPORT_SECTIONS[7]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />

            {/* I: Master */}
            <ReportGroupBox
              section={REPORT_SECTIONS[8]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
            />
          </div>

          {/* ===================== COLUMN 4: J, K ===================== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: 0 }}>
            {/* J: Analysis */}
            <ReportGroupBox
              section={REPORT_SECTIONS[9]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
              maxItemsVisible={17}
            />

            {/* K: MMS */}
            <ReportGroupBox
              section={REPORT_SECTIONS[10]}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              onDoubleClick={handleItemDoubleClick}
              maxItemsVisible={12}
            />
          </div>
        </div>

        {/* Bottom Filter & Actions Control Bar (exact match of screenshot) */}
        <div
          className="win-bevel-thin-inset"
          style={{
            background: '#d4d0c8',
            padding: '5px 12px',
            borderTop: '1px solid #7f9db9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Date Range Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>From</span>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type="text"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="win-input"
                  style={{ width: '85px', height: '22px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>To</span>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type="text"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="win-input"
                  style={{ width: '85px', height: '22px', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="win-btn"
              onClick={() => setShowDetailModal(true)}
              style={{ minWidth: '85px', height: '25px', fontSize: '11px', fontWeight: 'bold' }}
            >
              View
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={handlePosPrint}
              style={{ minWidth: '85px', height: '25px', fontSize: '11px' }}
            >
              POS Print
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={() => setShowDetailModal(true)}
              style={{ minWidth: '95px', height: '25px', fontSize: '11px' }}
            >
              Graphic Print
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={handleReset}
              style={{ minWidth: '75px', height: '25px', fontSize: '11px' }}
            >
              Reset
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={handleClose}
              style={{ minWidth: '75px', height: '25px', fontSize: '11px', fontWeight: 'bold' }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Analysis / Report Data Viewer Modal */}
      <ReportDetailModal
        show={showDetailModal}
        reportId={selectedReportId}
        dataContext={dataContext}
        fromDate={fromDate}
        toDate={toDate}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}

// Sub-component: Classic Inset GroupBox with Checkbox/Radio options
function ReportGroupBox({ section, selectedId, onSelect, onDoubleClick, maxItemsVisible }) {
  if (!section) return null;

  return (
    <div
      style={{
        border: '1px solid #7f9db9',
        background: '#fff',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '4px',
        overflow: 'hidden',
      }}
    >
      {/* Group Title Header */}
      <div
        style={{
          background: '#d4d0c8',
          borderBottom: '1px solid #7f9db9',
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span style={{ color: '#c00000', fontSize: '10px' }}>■</span>
        <span>{section.code}</span>
      </div>

      {/* Items List */}
      <div
        style={{
          padding: '2px 4px',
          overflowY: 'auto',
          maxHeight: maxItemsVisible ? `${maxItemsVisible * 20 + 10}px` : 'auto',
        }}
      >
        {section.reports.map((rep) => {
          const isSelected = selectedId === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => onSelect(rep.id)}
              onDoubleClick={() => onDoubleClick(rep.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '1px 3px',
                fontSize: '11px',
                lineHeight: '16px',
                cursor: 'pointer',
                background: isSelected ? '#0a246a' : 'transparent',
                color: isSelected ? '#ffffff' : '#000000',
                borderRadius: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title="Click to select, double-click or press Enter to View"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(rep.id)}
                style={{
                  margin: 0,
                  width: '12px',
                  height: '12px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ letterSpacing: '-0.2px' }}>
                {rep.num}.{rep.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
