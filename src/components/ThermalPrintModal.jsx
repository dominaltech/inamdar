import React, { useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function ThermalPrintModal() {
  const { printData, setPrintData, triggerTableFocus } = usePos();

  const handleClose = () => {
    setPrintData(null);
    triggerTableFocus?.();
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (!printData) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
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

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="win-window" style={{ width: '400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
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
          
          {/* 1. Cancellation KOT Slip */}
          {type === 'CANCEL_KOT' && (
            <div className="thermal-receipt thermal-receipt-printable" style={{ border: '2px solid #aa0000' }}>
              <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', color: '#aa0000' }}>
                *** CANCEL KOT ***
              </div>
              <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>
                DEPARTMENT: {data.department || 'KITCHEN'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>T No. {data.tableNo}</span>
                <span>E: {data.employee || 'COUNTER'}</span>
                <span>T:SERVER</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '10px' }}>
                <span>Ord No: {data.ordNo}</span>
                <span>Dt:{data.date}</span>
                <span>Time:{data.time}</span>
              </div>

              {/* Cancelled Item */}
              <div style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: '14px', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aa0000' }}>
                  <span>Qty: {data.cancelledItem.qty}</span>
                  <span style={{ flex: 1, marginLeft: '12px' }}>{data.cancelledItem.name}</span>
                </div>
              </div>

              {/* Reason & Auth */}
              <div style={{ marginTop: '10px', fontSize: '12px', lineHeight: '1.5' }}>
                <div><b>REASON:</b> {data.cancelledItem.reason}</div>
                <div><b>AUTH BY:</b> {data.cancelledItem.authorizedBy}</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '4px' }}>
                *** DO NOT PREPARE ***
              </div>
            </div>
          )}

          {/* 2. Standard KOT Slip (with Kitchen vs Bar/Pantry segregation) */}
          {type === 'KOT' && (
            <div className="thermal-receipt thermal-receipt-printable">
              <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                KITCHEN
              </div>
              <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                {data.section || 'AC'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>T No. {data.tableNo}</span>
                <span>E: {data.employee || 'COUNTER'}</span>
                <span>T:SERVER</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '10px' }}>
                <span>Ord No: {data.ordNo}</span>
                <span>Dt:{data.date}</span>
                <span>Time:{data.time}</span>
              </div>

              {/* Kitchen items section */}
              {data.kitchenItems && data.kitchenItems.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {data.pantryItems && data.pantryItems.length > 0 && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
                      [COOK / KITCHEN ORDERS]
                    </div>
                  )}
                  <div style={{ minHeight: '60px', lineHeight: '1.6' }}>
                    {data.kitchenItems.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span style={{ width: '20px' }}>{it.qty}</span>
                        <span style={{ flex: 1 }}>{it.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pantry / Bar items section (Sweets, Water, Soft drinks - Rule 18) */}
              {data.pantryItems && data.pantryItems.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '6px', borderTop: '1px dotted #000' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
                    [PANTRY / BAR / COUNTER ORDERS]
                  </div>
                  <div style={{ lineHeight: '1.6' }}>
                    {data.pantryItems.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span style={{ width: '20px' }}>{it.qty}</span>
                        <span style={{ flex: 1 }}>{it.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If no segregation provided */}
              {(!data.kitchenItems && !data.pantryItems) && (
                <div style={{ minHeight: '100px', lineHeight: '1.6' }}>
                  {data.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                      <span style={{ width: '20px' }}>{it.qty}</span>
                      <span style={{ flex: 1 }}>{it.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                Total Items : {data.totalItems}
              </div>

              <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                Ord: {data.ordNo}
              </div>
            </div>
          )}

          {/* 3. Customer Cash Memo Bill Slip */}
          {type === 'BILL' && (
            <div className="thermal-receipt thermal-receipt-printable">
              <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: 'bold', letterSpacing: '1px' }}>
                INAMDAR
              </div>
              <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                Restaurant &amp; Takeaway
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '2px' }}>
                Square One Apartment's, Near Civil Chowk
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '4px' }}>
                In Front of Court, Solapur 413001
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '2px 0', margin: '4px 0', fontSize: '12px', fontWeight: 'bold' }}>
                ----- Cash Memo -----
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Date : {data.date}</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Bill No. : {data.billNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '6px' }}>
                <span>T.No.: {data.tableNo}</span>
                <span>Emp. No. : {data.employeeNo || '1'}</span>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ padding: '2px 0' }}>Particulars</th>
                    <th style={{ textAlign: 'right', width: '30px' }}>Qty</th>
                    <th style={{ textAlign: 'right', width: '40px' }}>Rate</th>
                    <th style={{ textAlign: 'right', width: '50px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row, idx) => (
                    <tr key={idx} style={{ lineHeight: '1.4' }}>
                      <td style={{ padding: '2px 0' }}>{row.name}</td>
                      <td style={{ textAlign: 'right' }}>{row.qty}</td>
                      <td style={{ textAlign: 'right' }}>{row.rate}</td>
                      <td style={{ textAlign: 'right' }}>{row.amount.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', margin: '6px 0', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>{data.totalItems}/{data.totalQty}</span>
                <span>Total : {data.totalAmount.toFixed(0)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                <span>TIN.</span>
                <span>({data.time})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                <span>E.&amp;O.E.</span>
                <span>Thank You</span>
                <span>Visit Again</span>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', marginTop: '6px', letterSpacing: '1px' }}>
                TRY OUR JUICES
              </div>

              <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                {data.section || 'AC'}
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '8px 12px', background: '#ece9d8', borderTop: '1px solid #999' }}>
          <button className="win-btn" style={{ fontWeight: 'bold', padding: '3px 14px' }} onClick={handlePrint}>
            🖨️ Print Slip
          </button>
          <button className="win-btn" style={{ padding: '3px 14px' }} onClick={() => setPrintData(null)}>
            Close (Esc/↵)
          </button>
        </div>
      </div>
    </div>
  );
}
