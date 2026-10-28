import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export default function BatchSettlementModal() {
  const {
    batchSettleMode,
    setBatchSettleMode,
    unsettledBills,
    settleBillsBatch,
    setInfoDialog,
    triggerTableFocus,
  } = usePos();

  const [billInput, setBillInput] = useState('');
  const [enteredBills, setEnteredBills] = useState([]);
  const [errorDialog, setErrorDialog] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (batchSettleMode) {
      setBillInput('');
      setEnteredBills([]);
      setErrorDialog(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [batchSettleMode]);

  if (!batchSettleMode) return null;

  const totalAmount = enteredBills.reduce((s, b) => s + b.amount, 0);

  const handleBillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const num = billInput.trim();

      // If input is empty and we have entered bills -> finalize settlement!
      if (!num) {
        if (enteredBills.length === 0) {
          // If no bills entered, check if there's any active unsettled bill to suggest
          if (unsettledBills.length > 0) {
            setBillInput(unsettledBills[0].billNo);
          }
          return;
        }

        // Execute batch settlement
        const billNos = enteredBills.map(b => b.billNo);
        const settledCount = settleBillsBatch(billNos, batchSettleMode);
        setBatchSettleMode(null);
        triggerTableFocus?.();

        // Show authentic success dialog: "i [N] Bills Settled [OK]"
        setInfoDialog({
          title: "Bill Settlement",
          message: `${settledCount} Bills Settled`,
        });
        return;
      }

      // Check if bill exists in unsettled bills
      const matching = unsettledBills.find(b => String(b.billNo) === String(num));
      if (!matching) {
        // Show authentic error dialog: "X Bill No. [X] Does Not Exist"
        setErrorDialog(`Bill No. ${num} Does Not Exist`);
        return;
      }

      // Check if already in enteredBills
      if (enteredBills.some(b => String(b.billNo) === String(num))) {
        setBillInput('');
        return;
      }

      // Add to batch list
      setEnteredBills(prev => [...prev, matching]);
      setBillInput('');
    } else if (e.key === 'Escape') {
      if (errorDialog) {
        setErrorDialog(null);
      } else {
        setBatchSettleMode(null);
        triggerTableFocus?.();
      }
    }
  };

  const handleRecallBills = () => {
    // Adds all currently unsettled bills directly into the batch!
    setEnteredBills([...unsettledBills]);
    inputRef.current?.focus();
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1400 }}>
      {/* Main Settlement Window (Width ~360px) */}
      <div className="win-window" style={{ width: '360px', background: '#ece9d8' }}>
        <div className="win-titlebar" style={{ height: '22px', padding: '1px 8px' }}>
          <div className="win-titlebar-title" style={{ fontSize: '11px' }}>
            <span>{batchSettleMode}</span>
          </div>
          <button className="win-close-btn" onClick={() => { setBatchSettleMode(null); triggerTableFocus?.(); }}>✕</button>
        </div>

        <div style={{ padding: '12px 14px', background: '#ece9d8' }}>
          {/* Top Bill Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Bill No:</span>
            <input
              ref={inputRef}
              id="batch-settle-bill-input"
              type="text"
              value={billInput}
              onChange={(e) => setBillInput(e.target.value)}
              onKeyDown={handleBillKeyDown}
              className="win-input"
              style={{ width: '90px', height: '24px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: '#fff' }}
              placeholder="Bill No"
            />
            <span style={{ fontSize: '10px', color: '#666' }}>↵ to Add / Settle</span>
          </div>

          {/* Settling Bills Table */}
          <div className="win-bevel-inset" style={{ height: '140px', overflowY: 'auto', background: '#fff' }}>
            <table className="order-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Bill No</th>
                  <th style={{ width: '50%', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {enteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '30px 10px', color: '#999', fontSize: '11px' }}>
                      Type Bill No and press Enter.<br />(Press Enter again to Settle)
                    </td>
                  </tr>
                ) : (
                  enteredBills.map((b, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold', color: '#0a246a' }}>{b.billNo}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{b.amount.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary & Recall Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button
              className="win-btn"
              style={{ padding: '3px 10px', fontSize: '11px' }}
              onClick={handleRecallBills}
            >
              Recall Bills
            </button>

            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              <span>{enteredBills.length}</span> ( <span>{totalAmount.toFixed(0)}</span> )
            </div>
          </div>
        </div>
      </div>

      {/* Retro Windows Error Box: "X Bill No. [X] Does Not Exist [OK]" */}
      {errorDialog && (
        <div className="win-modal-backdrop" style={{ zIndex: 1450 }}>
          <div className="win-window" style={{ width: '310px', background: '#ece9d8' }}>
            <div className="win-titlebar" style={{ height: '22px' }}>
              <div className="win-titlebar-title" style={{ fontSize: '11px' }}>
                <span>Dominal's POS</span>
              </div>
              <button className="win-close-btn" onClick={() => { setErrorDialog(null); inputRef.current?.focus(); }}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#cc0000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                ✕
              </div>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{errorDialog}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 12px', background: '#e0dcc8' }}>
              <button
                className="win-btn"
                style={{ width: '70px', fontWeight: 'bold' }}
                autoFocus
                onClick={() => { setErrorDialog(null); inputRef.current?.focus(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    setErrorDialog(null);
                    inputRef.current?.focus();
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
