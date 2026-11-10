// ReportDetailModal.jsx - Retro Windows 98/2000 Detailed Analytics Viewer Modal
import React, { useState, useMemo, useEffect } from 'react';
import { generateReportDataset, REPORTS_BY_ID } from '../services/reportsService';

export default function ReportDetailModal({
  show,
  reportId,
  dataContext,
  fromDate,
  toDate,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [waiterFilter, setWaiterFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Close on Escape key with event capturing and stopPropagation
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [show, onClose]);

  const reportMeta = REPORTS_BY_ID[reportId] || { name: 'Report Details', code: reportId };

  // Compute dataset
  const dataset = useMemo(() => {
    if (!show || !reportId) return { columns: [], rows: [], summary: { totalCount: 0, netAmount: 0 } };
    return generateReportDataset(reportId, dataContext, {
      fromDate,
      toDate,
      search,
      sectionFilter,
      waiterFilter,
      paymentFilter,
    });
  }, [show, reportId, dataContext, fromDate, toDate, search, sectionFilter, waiterFilter, paymentFilter]);

  // Handle column sorting
  const sortedRows = useMemo(() => {
    if (!sortCol) return dataset.rows;
    return [...dataset.rows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''));
    });
  }, [dataset.rows, sortCol, sortAsc]);

  if (!show) return null;

  const handleSort = (key) => {
    if (sortCol === key) {
      setSortAsc(prev => !prev);
    } else {
      setSortCol(key);
      setSortAsc(true);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!dataset.columns.length || !sortedRows.length) return;
    const header = dataset.columns.map(c => `"${c.label}"`).join(',');
    const rows = sortedRows.map(r => dataset.columns.map(c => `"${r[c.key] ?? ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportMeta.name.replace(/[^a-zA-Z0-9]/g, '_')}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = (mode = 'graphic') => {
    window.print();
  };

  return (
    <div
      className="win-modal-backdrop"
      style={{
        zIndex: 1100,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="win-window"
        style={{
          width: '90vw',
          maxWidth: '1000px',
          height: '84vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ece9d8',
          boxShadow: '4px 4px 14px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title Bar */}
        <div className="win-titlebar" style={{ height: '24px', padding: '2px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span>
              📋 {reportMeta.code || reportMeta.sectionCode}: {reportMeta.name} — [Period: {fromDate || 'Any'} To: {toDate || 'Today'}]
            </span>
          </div>
          <button
            className="win-close-btn"
            onClick={onClose}
            style={{ width: '18px', height: '16px', fontSize: '10px', lineHeight: '10px' }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', overflow: 'hidden', minHeight: 0 }}>
          
          {/* Controls Bar: Filters & Search */}
          <div
            className="win-bevel-outset"
            style={{
              padding: '6px 10px',
              background: '#ece9d8',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Search:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name / code / table..."
                className="win-input"
                style={{ width: '220px', height: '22px', fontSize: '11px', padding: '0 4px' }}
              />
              {search && (
                <button
                  className="win-btn"
                  onClick={() => setSearch('')}
                  style={{ height: '22px', padding: '0 6px', fontSize: '10px' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Hall:</span>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="win-input"
                  style={{ height: '22px', fontSize: '11px' }}
                >
                  <option value="ALL">All Halls</option>
                  <option value="AC">AC / General</option>
                  <option value="FAMILY AC">Family AC</option>
                  <option value="PARCEL">Parcel</option>
                  <option value="HOME DELIVERY">Home Delivery</option>
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>Tender:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="win-input"
                  style={{ height: '22px', fontSize: '11px' }}
                >
                  <option value="ALL">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Credit">Credit</option>
                </select>
              </label>
            </div>
          </div>

          {/* Data Table */}
          <div
            className="win-bevel-inset"
            style={{
              flex: 1,
              background: '#fff',
              overflow: 'auto',
              border: '2px solid #7f9db9',
              minHeight: 0,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Tahoma, Arial, sans-serif' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#ece9d8', borderBottom: '2px solid #808080' }}>
                  {dataset.columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '5px 8px',
                        textAlign: col.align || 'left',
                        fontWeight: 'bold',
                        color: '#0a246a',
                        borderRight: '1px solid #c0c0c0',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: sortCol === col.key ? '#d4d0c8' : '#ece9d8',
                        whiteSpace: 'nowrap',
                      }}
                      title="Click to sort"
                    >
                      {col.label} {sortCol === col.key ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={dataset.columns.length || 1}
                      style={{ padding: '24px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}
                    >
                      No records found for the selected filters and date range ({fromDate} to {toDate}).
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#f5f4eb',
                        borderBottom: '1px solid #e8e8e8',
                      }}
                    >
                      {dataset.columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: '4px 8px',
                            textAlign: col.align || 'left',
                            whiteSpace: 'nowrap',
                            color: col.key === 'amount' || col.key === 'net' || col.key === 'total' ? '#006600' : '#000',
                            fontWeight: col.key === 'amount' || col.key === 'net' || col.key === 'total' ? 'bold' : 'normal',
                          }}
                        >
                          {col.key === 'amount' || col.key === 'net' || col.key === 'total'
                            ? (row[col.key] && !String(row[col.key]).startsWith('₹') && !isNaN(Number(row[col.key])) ? `₹${row[col.key]}` : row[col.key])
                            : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Totals Footer */}
          <div
            className="win-bevel-thin-inset"
            style={{
              padding: '6px 12px',
              background: '#d4d0c8',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '11px',
              flexShrink: 0,
            }}
          >
            <div>
              <span>Rows Displayed: {sortedRows.length}</span>
            </div>
            {dataset.summary?.netAmount !== undefined && dataset.summary?.netAmount > 0 && (
              <div style={{ color: '#006600', fontSize: '12px' }}>
                Total Net Value: ₹{dataset.summary.netAmount.toFixed(2)}
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '6px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="win-btn"
              onClick={() => handlePrint('pos')}
              style={{ minWidth: '90px', height: '24px', fontSize: '11px', fontWeight: 'bold' }}
            >
              🧾 POS Print
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={() => handlePrint('graphic')}
              style={{ minWidth: '95px', height: '24px', fontSize: '11px' }}
            >
              🖨️ Graphic Print
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={handleExportCSV}
              style={{ minWidth: '85px', height: '24px', fontSize: '11px' }}
            >
              📁 Export CSV
            </button>
            <button
              type="button"
              className="win-btn"
              onClick={onClose}
              style={{ minWidth: '80px', height: '24px', fontSize: '11px', fontWeight: 'bold' }}
            >
              Close (Esc)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
