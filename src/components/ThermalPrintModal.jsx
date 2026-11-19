import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { usePos } from '../context/PosContext';

export default function ThermalPrintModal() {
  const { printData, setPrintData, triggerTableFocus } = usePos();
  const [activeSlipIndex, setActiveSlipIndex] = useState(null);
  const receiptRef = useRef(null);

  // Compute stations for multi-KOT split printing (Kitchen, Dessert, Beverage)
  const stationSlips = (() => {
    if (!printData || printData.type !== 'KOT') return [];
    const { data } = printData;
    const slips = [];

    // 1. Kitchen Station (normal food dishes, soups, starters, mains, breads, rice)
    if (data.kitchenItems && data.kitchenItems.length > 0) {
      slips.push({
        station: 'KITCHEN',
        items: data.kitchenItems,
        label: 'COOK / KITCHEN',
      });
    }

    // 2. Dessert Station (Halwa, Ice Cream, Sweets, etc.)
    if (data.dessertItems && data.dessertItems.length > 0) {
      slips.push({
        station: 'DESSERT',
        items: data.dessertItems,
        label: 'DESSERT / SWEETS',
      });
    }

    // 3. Beverage / Pantry Station (Juices, Mocktails, Cold drinks, Soda, Water)
    if (data.beverageItems && data.beverageItems.length > 0) {
      slips.push({
        station: 'BEVERAGE',
        items: data.beverageItems,
        label: 'BEVERAGE / PANTRY',
      });
    }

    // Fallback if items were not pre-split
    if (slips.length === 0 && data.items && data.items.length > 0) {
      slips.push({
        station: 'KITCHEN',
        items: data.items,
        label: 'KITCHEN',
      });
    }

    return slips;
  })();

  useEffect(() => {
    if (!printData) {
      setActiveSlipIndex(null);
      return;
    }

    // Record last print snapshot on window for audit & automated verification
    if (typeof window !== 'undefined') {
      window.__INAMDAR_LAST_PRINT__ = {
        type: printData.type,
        data: printData.data,
        stationSlips,
        slipCount: printData.type === 'KOT' ? Math.max(1, stationSlips.length) : 1,
        width: '7.6cm',
        timestamp: Date.now(),
      };
    }

    let isCancelled = false;

    async function executeSilentPrintSequence() {
      try {
        const isElectron = typeof window !== 'undefined' &&
          window.electronAPI &&
          typeof window.electronAPI.directPrint === 'function';

        if (isElectron && printData.type === 'KOT' && stationSlips.length > 1) {
          // Multi-Station KOT: Print each station slip sequentially so the thermal printer cuts each independent physical slip!
          for (let i = 0; i < stationSlips.length; i++) {
            if (isCancelled) return;
            setActiveSlipIndex(i);
            // Brief tick for DOM to render the active station slip
            await new Promise(res => setTimeout(res, 45));

            const slip = stationSlips[i];
            let heightMicrons = 0;
            if (receiptRef.current) {
              const rect = receiptRef.current.getBoundingClientRect();
              if (rect && rect.height > 10) {
                // 1 px = 264.58 microns. Add 8mm (8000 microns) cutter buffer
                heightMicrons = Math.round((rect.height * 264.58) + 8000);
              }
            }
            if (!heightMicrons) {
              const itemCount = slip.items ? slip.items.length : 1;
              heightMicrons = Math.max(45000, 38000 + (itemCount * 6500));
            }

            await window.electronAPI.directPrint({
              silent: true,
              width: 76000, // Exact 7.6cm thermal receipt width
              height: heightMicrons,
              station: slip.station,
            });
          }
        } else if (isElectron) {
          // Single Unified Bill (Cash Memo), Cancellation KOT, or single-station KOT
          await new Promise(res => setTimeout(res, 45));

          let heightMicrons = 0;
          if (receiptRef.current) {
            const rect = receiptRef.current.getBoundingClientRect();
            if (rect && rect.height > 10) {
              // Exact measured rendered DOM height in microns + 8mm buffer
              heightMicrons = Math.round((rect.height * 264.58) + 8000);
            }
          }
          if (!heightMicrons) {
            const itemCount = printData.type === 'BILL'
              ? (printData.data.items?.length || 1)
              : (printData.data.cancelledItem ? 1 : (stationSlips[0]?.items?.length || printData.data.items?.length || 1));
            heightMicrons = Math.max(50000, 42000 + (itemCount * 6500));
          }

          await window.electronAPI.directPrint({
            silent: true,
            width: 76000, // Exact 7.6cm thermal receipt width
            height: heightMicrons,
          });
        } else if (typeof window !== 'undefined' && window.__INAMDAR_FORCE_BROWSER_PRINT__) {
          window.print();
        }
      } catch {
        // Silent exception handling to guarantee no console noise or blocking alerts
      }

      if (!isCancelled) {
        // Immediate clean reset: never show printing console or blocking dialog
        setPrintData(null);
        setActiveSlipIndex(null);
        triggerTableFocus?.();
      }
    }

    const timer = setTimeout(() => {
      executeSilentPrintSequence();
    }, 30);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [printData, setPrintData, triggerTableFocus]);

  if (!printData) return null;

  const { type, data } = printData;

  // For multi-station KOT during sequential Electron printing, render only the active slip;
  // otherwise (or in browser/PDF print), render all slips with page breaks
  const renderedStationSlips = (activeSlipIndex !== null && stationSlips[activeSlipIndex])
    ? [stationSlips[activeSlipIndex]]
    : stationSlips;

  const modalContent = (
    <div
      className="thermal-direct-print-wrapper"
      id="thermal-direct-print-target"
      ref={receiptRef}
      data-testid="thermal-direct-print-target"
      data-print-type={type}
      aria-hidden="true"
    >
      <div className="thermal-receipt-container">
        {/* 1. Cancellation KOT Slip */}
        {type === 'CANCEL_KOT' && (
          <div className="thermal-receipt thermal-receipt-printable" style={{ border: '2px solid #aa0000' }}>
            <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', color: '#aa0000' }}>
              *** CANCEL KOT ***
            </div>
            <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000' }}>
              DEPARTMENT: {data.department || 'KITCHEN'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
              <span>T No. {data.tableNo}</span>
              <span>E: {data.employee || 'COUNTER'}</span>
              <span>T:SERVER</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#000000', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
              <span>Ord No: {data.ordNo}</span>
              <span>Dt:{data.date}</span>
              <span>Time:{data.time}</span>
            </div>

            {/* Cancelled Item */}
            <div style={{ padding: '6px 0', borderBottom: '1px dashed #000', fontSize: '13px', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aa0000' }}>
                <span>Qty: {data.cancelledItem?.qty || 1}</span>
                <span style={{ flex: 1, marginLeft: '8px' }}>{data.cancelledItem?.name || ''}</span>
              </div>
            </div>

            {/* Reason & Auth */}
            <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: '#000000', lineHeight: '1.4' }}>
              <div><b>REASON:</b> {data.cancelledItem?.reason || ''}</div>
              <div><b>AUTH BY:</b> {data.cancelledItem?.authorizedBy || ''}</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '3px' }}>
              *** DO NOT PREPARE ***
            </div>
          </div>
        )}

        {/* 2. Standard Multi-Station KOT Slips (Kitchen, Dessert, Beverage) */}
        {type === 'KOT' && (
          <div>
            {renderedStationSlips.map((stn, idx) => {
              const totalStationQty = stn.items.reduce((s, it) => s + (it.qty || 1), 0);
              const isLastSlip = idx === renderedStationSlips.length - 1;

              return (
                <div
                  key={`kot-${stn.station}-${idx}`}
                  className={`thermal-receipt thermal-receipt-printable ${!isLastSlip ? 'thermal-slip-break' : ''}`}
                  style={{ marginBottom: '16px' }}
                  data-station={stn.station}
                >
                  <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1.5px', color: '#000000' }}>
                    {stn.station === 'KITCHEN' ? 'KITCHEN' : stn.station === 'DESSERT' ? 'DESSERTS / PANTRY' : 'BEVERAGES / PANTRY'}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#000000' }}>
                    {data.section || 'AC'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
                    <span>T No. {data.tableNo}</span>
                    <span>E: {data.employee || 'COUNTER'}</span>
                    <span>T:SERVER</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#000000', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '8px' }}>
                    <span>Ord No: {data.ordNo}</span>
                    <span>Dt:{data.date}</span>
                    <span>Time:{data.time}</span>
                  </div>

                  {/* Station Items list */}
                  <div style={{ lineHeight: '1.35', marginBottom: '8px' }}>
                    {stn.items.map((it, itemIdx) => (
                      <div key={itemIdx} style={{ display: 'flex', gap: '10px', fontSize: '13px', fontWeight: 'bold', color: '#000000', padding: '2px 0' }}>
                        <span style={{ width: '22px', textAlign: 'right', fontWeight: 'bold', color: '#000000' }}>{it.qty}</span>
                        <span style={{ flex: 1, fontWeight: 'bold', color: '#000000' }}>{it.name}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '6px', fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>
                    Total Items : {totalStationQty}
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '15px', fontWeight: 'bold', color: '#000000' }}>
                    Ord: {data.ordNo}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Customer Cash Memo Bill Slip - Single Unified Bill (Strict Category Ordering, Centered 7.6cm Width, Crisp Dark Black) */}
        {type === 'BILL' && (
          <div className="thermal-receipt thermal-receipt-printable">
            <div style={{ textAlign: 'center', fontSize: '19px', fontWeight: 'bold', letterSpacing: '1px', color: '#000000' }}>
              INAMDAR
            </div>
            <div style={{ textAlign: 'center', fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>
              Restaurant &amp; Takeaway
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginTop: '2px' }}>
              Square One Apartment's, Near Civil Chowk
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
              In Front of Court, Solapur 413001
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '3px 0', margin: '4px 0', fontSize: '12.5px', fontWeight: 'bold', color: '#000000' }}>
              ----- Cash Memo -----
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
              <span>Date : {data.date}</span>
              <span style={{ fontSize: '12.5px' }}>Bill No. : {data.billNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#000000', borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '5px' }}>
              <span>T.No.: {data.tableNo}</span>
              <span>Emp. No. : {data.employeeNo || '1'}</span>
            </div>

            {/* Items Table - Centered 7.6cm Layout */}
            <table style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#000000', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000', fontWeight: 'bold', color: '#000000' }}>
                  <th style={{ padding: '3px 0', width: '48%', fontWeight: 'bold', color: '#000000' }}>Particulars</th>
                  <th style={{ textAlign: 'right', width: '14%', fontWeight: 'bold', color: '#000000' }}>Qty</th>
                  <th style={{ textAlign: 'right', width: '19%', fontWeight: 'bold', color: '#000000' }}>Rate</th>
                  <th style={{ textAlign: 'right', width: '19%', fontWeight: 'bold', color: '#000000' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data.items || []).map((row, idx) => {
                  const rowAmt = Number(row.amount !== undefined ? row.amount : ((row.qty || 1) * (row.rate || 0))).toFixed(0);
                  const rowRate = Number(row.rate ?? 0).toFixed(0);
                  return (
                    <tr key={idx} style={{ lineHeight: '1.3', fontWeight: 'bold', color: '#000000' }}>
                      <td style={{ padding: '2px 0', wordBreak: 'break-word', fontWeight: 'bold', color: '#000000', fontSize: '12px' }}>
                        {row.name}
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold', color: '#000000', fontSize: '12px' }}>
                        {row.qty}
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold', color: '#000000', fontSize: '12px' }}>
                        {rowRate}
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold', color: '#000000', fontSize: '12px' }}>
                        {rowAmt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total Line: <TotalItems>/<TotalQty>/<Pax> Total : <TotalAmount> (Tightly Connected) */}
            <div style={{
              borderTop: '1px dashed #000',
              borderBottom: '1px dashed #000',
              padding: '4px 0',
              margin: '5px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#000000'
            }}>
              <span>
                {data.totalItems || (data.items || []).length}/{data.totalQty || (data.items || []).reduce((s, i) => s + (i.qty || 1), 0)}/{data.pax || 2}
              </span>
              <span style={{ fontSize: '14.5px', fontWeight: 'bold', color: '#000000' }}>
                Total : {Number(data.totalAmount ?? data.netAmount ?? 0).toFixed(0)}
              </span>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginTop: '3px' }}>
              <span>TIN.</span>
              <span>({data.time})</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginTop: '2px' }}>
              <span>E.&amp;O.E.</span>
              <span>Thank You</span>
              <span>Visit Again</span>
            </div>

            <div style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', color: '#000000', marginTop: '4px', letterSpacing: '0.5px' }}>
              TRY OUR JUICES
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#000000', marginTop: '2px' }}>
              {data.section || 'AC'}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body);
  }
  return modalContent;
}
