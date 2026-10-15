import React, { useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function ThermalPrintModal() {
  const { printData, setPrintData } = usePos();

  useEffect(() => {
    function handleKeyDown(e) {
      if (!printData) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        setPrintData(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printData, setPrintData]);

  if (!printData) return null;

  const { type, data } = printData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="win-window" style={{ width: '380px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>Thermal Printer Output — {type === 'KOT' ? 'Kitchen Order Token' : 'Cash Memo'}</span>
          </div>
          <button className="win-close-btn" onClick={() => setPrintData(null)}>✕</button>
        </div>

        {/* Paper Preview Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#555555' }}>
          {type === 'KOT' ? (
            /* Kitchen Order Token (KOT) Layout */
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

              {/* Items in Course Order */}
              <div style={{ minHeight: '120px', lineHeight: '1.6' }}>
                {data.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                    <span style={{ width: '20px' }}>{it.qty}</span>
                    <span style={{ flex: 1 }}>{it.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', marginTop: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                Total Items : {data.totalItems}
              </div>

              <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                Ord: {data.ordNo}
              </div>
            </div>
          ) : (
            /* Customer Cash Memo Bill Layout */
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

              {/* Items Grid */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                <span style={{ flex: 1 }}>Particulars</span>
                <span style={{ width: '35px', textAlign: 'right' }}>Qty</span>
                <span style={{ width: '45px', textAlign: 'right' }}>Rate</span>
                <span style={{ width: '55px', textAlign: 'right' }}>Amount</span>
              </div>

              <div style={{ minHeight: '80px', lineHeight: '1.4' }}>
                {data.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{it.name}</span>
                    <span style={{ width: '35px', textAlign: 'right' }}>{it.qty}</span>
                    <span style={{ width: '45px', textAlign: 'right' }}>{it.rate}</span>
                    <span style={{ width: '55px', textAlign: 'right' }}>{it.amount}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', margin: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px' }}>{data.totalItems}/{data.totalQty}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', marginRight: '8px' }}>Total :</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{data.totalAmount}</span>
                </div>
              </div>

              {/* Footer Legal & Greetings */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px' }}>
                <span>TIN.</span>
                <span>({data.time})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span>E.&amp;O.E.</span>
                <span>Thank You &nbsp;&nbsp; Visit Again</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>
                TRY OUR JUICES
              </div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                {data.section || 'AC'}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ padding: '8px 12px', background: '#ece9d8', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #999' }}>
          <button className="win-btn" style={{ fontWeight: 'bold', width: '80px' }} onClick={handlePrint}>
            🖨️ Print
          </button>
          <button className="win-btn" style={{ width: '80px' }} onClick={() => setPrintData(null)}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
