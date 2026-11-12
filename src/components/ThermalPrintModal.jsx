import React, { useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function ThermalPrintModal() {
  const { printData, setPrintData, triggerTableFocus } = usePos();

  const handleClose = () => {
    setPrintData(null);
    triggerTableFocus?.();
  };

  useEffect(() => {
    const mountedAt = Date.now();
    function handleKeyDown(e) {
      if (!printData) return;
      // Prevent the triggering Enter key from immediately dismissing the receipt
      if (Date.now() - mountedAt < 200) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printData]);

  if (!printData) return null;

  const { type, data } = printData;

  const handlePrint = () => {
    window.print();
  };

  const titleText = type === 'CANCEL_KOT'
    ? 'Thermal Printer Output — Cancellation KOT'
    : (type === 'KOT' ? 'Thermal Printer Output — Kitchen Order Token' : 'Thermal Printer Output — Cash Memo');

  // Compute stations for multi-KOT split printing (Kitchen, Dessert, Beverage)
  const stationSlips = (() => {
    if (type !== 'KOT') return [];

    const slips = [];

    // 1. Kitchen Station
    if (data.kitchenItems && data.kitchenItems.length > 0) {
      slips.push({
        station: 'KITCHEN',
        items: data.kitchenItems,
        label: 'COOK / KITCHEN',
      });
    }

    // 2. Dessert Station
    if (data.dessertItems && data.dessertItems.length > 0) {
      slips.push({
        station: 'DESSERT',
        items: data.dessertItems,
        label: 'DESSERT / SWEETS',
      });
    }

    // 3. Beverage / Pantry Station
    if (data.beverageItems && data.beverageItems.length > 0) {
      slips.push({
        station: 'BEVERAGE',
        items: data.beverageItems,
        label: 'BEVERAGE / PANTRY',
      });
    }

    // Fallback if no categorized splits found
    if (slips.length === 0 && data.items && data.items.length > 0) {
      slips.push({
        station: 'KITCHEN',
        items: data.items,
        label: 'KITCHEN',
      });
    }

    return slips;
  })();

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="win-window" style={{ width: '420px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="win-titlebar" style={{
          background: type === 'CANCEL_KOT'
            ? 'linear-gradient(90deg, #aa0000 0%, #dd4444 100%)'
            : 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)'
        }}>
          <div className="win-titlebar-title">
            <span>{titleText}</span>
          </div>
          <button className="win-close-btn" onClick={handleClose}>✕</button>
        </div>

        {/* Paper Preview Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#555555' }}>
          <div className="thermal-receipt-container">
            
            {/* 1. Cancellation KOT Slip */}
            {type === 'CANCEL_KOT' && (
              <div className="thermal-receipt thermal-receipt-printable" style={{ border: '2px solid #aa0000' }}>
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', color: '#aa0000' }}>
                  *** CANCEL KOT ***
                </div>
                <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                  DEPARTMENT: {data.department || 'KITCHEN'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                  <span>T No. {data.tableNo}</span>
                  <span>E: {data.employee || 'COUNTER'}</span>
                  <span>T:SERVER</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
                  <span>Ord No: {data.ordNo}</span>
                  <span>Dt:{data.date}</span>
                  <span>Time:{data.time}</span>
                </div>

                {/* Cancelled Item */}
                <div style={{ padding: '6px 0', borderBottom: '1px dashed #000', fontSize: '12px', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aa0000' }}>
                    <span>Qty: {data.cancelledItem.qty}</span>
                    <span style={{ flex: 1, marginLeft: '8px' }}>{data.cancelledItem.name}</span>
                  </div>
                </div>

                {/* Reason & Auth */}
                <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: '1.4' }}>
                  <div><b>REASON:</b> {data.cancelledItem.reason}</div>
                  <div><b>AUTH BY:</b> {data.cancelledItem.authorizedBy}</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '3px' }}>
                  *** DO NOT PREPARE ***
                </div>
              </div>
            )}

            {/* 2. Standard Multi-Station KOT Slips (Kitchen, Dessert, Beverage) */}
            {type === 'KOT' && (
              <div>
                {stationSlips.map((stn, idx) => {
                  const totalStationQty = stn.items.reduce((s, it) => s + (it.qty || 1), 0);
                  const isLastSlip = idx === stationSlips.length - 1;

                  return (
                    <div
                      key={`kot-${stn.station}-${idx}`}
                      className={`thermal-receipt thermal-receipt-printable ${!isLastSlip ? 'thermal-slip-break' : ''}`}
                      style={{ marginBottom: '16px' }}
                    >
                      {/* On-screen visual badge for multi-slips */}
                      {stationSlips.length > 1 && (
                        <div style={{
                          fontSize: '9px',
                          color: '#0a246a',
                          background: '#e8f0fe',
                          padding: '1px 4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          border: '1px solid #b0c4de'
                        }}>
                          [SLIP {idx + 1} OF {stationSlips.length}: {stn.label}]
                        </div>
                      )}

                      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        {stn.station}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
                        {data.section || 'AC'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                        <span>T No. {data.tableNo}</span>
                        <span>E: {data.employee || 'COUNTER'}</span>
                        <span>T:SERVER</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
                        <span>Ord No: {data.ordNo}</span>
                        <span>Dt:{data.date}</span>
                        <span>Time:{data.time}</span>
                      </div>

                      {/* Station Items list */}
                      <div style={{ lineHeight: '1.4', marginBottom: '8px' }}>
                        {stn.items.map((it, itemIdx) => (
                          <div key={itemIdx} style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: 'bold', padding: '1px 0' }}>
                            <span style={{ width: '16px', textAlign: 'right' }}>{it.qty}</span>
                            <span style={{ flex: 1 }}>{it.name}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                        Total Items : {totalStationQty}
                      </div>

                      <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                        Ord: {data.ordNo}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Customer Cash Memo Bill Slip (Exact Replica of Image 2) */}
            {type === 'BILL' && (
              <div className="thermal-receipt thermal-receipt-printable">
                <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  INAMDAR
                </div>
                <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                  Restaurant &amp; Takeaway
                </div>
                <div style={{ textAlign: 'center', fontSize: '9.5px', marginTop: '2px' }}>
                  Square One Apartment's, Near Civil Chowk
                </div>
                <div style={{ textAlign: 'center', fontSize: '9.5px', marginBottom: '4px' }}>
                  In Front of Court, Solapur 413001
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2px 0', margin: '4px 0', fontSize: '11px', fontWeight: 'bold' }}>
                  ----- Cash Memo -----
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span>Date : {data.date}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>Bill No. : {data.billNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '5px' }}>
                  <span>T.No.: {data.tableNo}</span>
                  <span>Emp. No. : {data.employeeNo || '1'}</span>
                </div>

                {/* Items Table - Character-aligned for 58mm without clipping */}
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px dashed #000' }}>
                      <th style={{ padding: '2px 0', width: '50%', fontWeight: 'bold' }}>Particulars</th>
                      <th style={{ textAlign: 'right', width: '14%', fontWeight: 'bold' }}>Qty</th>
                      <th style={{ textAlign: 'right', width: '18%', fontWeight: 'bold' }}>Rate</th>
                      <th style={{ textAlign: 'right', width: '18%', fontWeight: 'bold' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row, idx) => {
                      const rowAmt = Number(row.amount ?? (row.qty * row.rate) ?? 0).toFixed(0);
                      const rowRate = Number(row.rate ?? 0).toFixed(0);
                      return (
                        <tr key={idx} style={{ lineHeight: '1.25' }}>
                          <td style={{ padding: '2px 0', wordBreak: 'break-word', fontWeight: 'bold', fontSize: '11px' }}>
                            {row.name}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '11px' }}>
                            {row.qty}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'top', fontSize: '11px' }}>
                            {rowRate}
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold', fontSize: '11px' }}>
                            {rowAmt}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Total Line: <TotalItems>/<TotalQty>/<Pax> Total : <TotalAmount> */}
                <div style={{
                  borderTop: '1px dashed #000',
                  borderBottom: '1px dashed #000',
                  padding: '3px 0',
                  margin: '4px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  <span>
                    {data.totalItems || data.items.length}/{data.totalQty || data.items.reduce((s, i) => s + (i.qty || 1), 0)}/{data.pax || 2}
                  </span>
                  <span style={{ fontSize: '13px' }}>
                    Total : {Number(data.totalAmount ?? data.netAmount ?? 0).toFixed(0)}
                  </span>
                </div>

                {/* Footer exact match */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '3px' }}>
                  <span>TIN.</span>
                  <span>({data.time})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                  <span>E.&amp;O.E.</span>
                  <span>Thank You</span>
                  <span>Visit Again</span>
                </div>

                <div style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 'bold', marginTop: '4px', letterSpacing: '0.5px' }}>
                  TRY OUR JUICES
                </div>

                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                  {data.section || 'AC'}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#ece9d8', borderTop: '1px solid #999' }}>
          <div style={{ fontSize: '11px', color: '#555' }}>
            {type === 'KOT' && stationSlips.length > 1
              ? `📄 Prints ${stationSlips.length} split slips simultaneously`
              : '📄 58mm / 80mm thermal receipt'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="win-btn" style={{ fontWeight: 'bold', padding: '3px 14px', background: '#0a246a', color: '#fff' }} onClick={handlePrint}>
              🖨️ Print Slip
            </button>
            <button className="win-btn" style={{ padding: '3px 14px' }} onClick={handleClose}>
              Close (Esc/↵)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
