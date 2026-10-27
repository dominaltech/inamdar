import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';

export default function PrinterSetupModal({ isOpen, onClose }) {
  const { setInfoDialog, setPrintData } = usePos();
  const [billPrinter, setBillPrinter] = useState('Thermal Receipt 80mm (Counter POS - COM1/USB)');
  const [kitchenPrinter, setKitchenPrinter] = useState('Kitchen KOT 80mm LAN Printer (192.168.1.200)');
  const [pantryPrinter, setPantryPrinter] = useState('Pantry / Bar 58mm Thermal Printer (USB002)');
  const [paperWidth, setPaperWidth] = useState('80mm');
  const [autoCut, setAutoCut] = useState(true);

  const handleTestPrint = (type) => {
    if (type === 'BILL') {
      setPrintData({
        type: 'BILL',
        data: {
          billNo: 999,
          date: '27-10-26',
          time: '02:00 PM',
          tableNo: 'TEST',
          section: 'AC',
          employeeNo: '1',
          items: [
            { code: '82', name: 'CHICKEN BIRYANI 3 PIS (TEST)', qty: 1, rate: 160, amount: 160 },
            { code: '95', name: 'ROTI (TEST)', qty: 2, rate: 30, amount: 60 },
          ],
          totalItems: 2,
          totalQty: 3,
          totalAmount: 220,
        }
      });
    } else {
      setPrintData({
        type: 'KOT',
        data: {
          ordNo: 888,
          date: '27-10-26',
          time: '02:00 pm',
          tableNo: 'TEST-KITCHEN',
          section: 'AC',
          employee: '1 COUNTER',
          kitchenItems: [
            { code: '82', name: 'CHICKEN BIRYANI 3 PIS (TEST)', qty: 1, rate: 160, amount: 160 },
          ],
          pantryItems: [
            { code: '153', name: 'MASALA PAPAD (TEST)', qty: 1, rate: 30, amount: 30 },
          ],
          items: [
            { code: '82', name: 'CHICKEN BIRYANI 3 PIS (TEST)', qty: 1, rate: 160, amount: 160 },
            { code: '153', name: 'MASALA PAPAD (TEST)', qty: 1, rate: 30, amount: 30 },
          ],
          totalItems: 2,
        }
      });
    }
  };

  const handleSave = () => {
    localStorage.setItem('inamdar_printer_config', JSON.stringify({ billPrinter, kitchenPrinter, pantryPrinter, paperWidth, autoCut }));
    setInfoDialog({
      title: "Printer Setup",
      message: "Printer routing configuration saved successfully.",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '600px', maxWidth: '96vw', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>🖨️ Thermal Printer Setup &amp; Department Routing — Inamdar POS</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Bill Printer */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>
              Cashier Bill / Cash Memo Printer:
            </label>
            <input
              type="text"
              value={billPrinter}
              onChange={(e) => setBillPrinter(e.target.value)}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '11px' }}
            />
          </div>

          {/* Kitchen KOT Printer */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>
              Kitchen KDS Order Printer (LAN / Cook Station):
            </label>
            <input
              type="text"
              value={kitchenPrinter}
              onChange={(e) => setKitchenPrinter(e.target.value)}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '11px' }}
            />
          </div>

          {/* Pantry Printer */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>
              Pantry / Bar Slip Printer (Desserts &amp; Soft Drinks):
            </label>
            <input
              type="text"
              value={pantryPrinter}
              onChange={(e) => setPantryPrinter(e.target.value)}
              className="win-input"
              style={{ width: '100%', height: '24px', fontSize: '11px' }}
            />
          </div>

          {/* Paper and Autocut */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#d4d0c8', padding: '8px 10px', border: '1px solid #808080' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Paper Width:</span>
              <select
                value={paperWidth}
                onChange={(e) => setPaperWidth(e.target.value)}
                className="win-input"
                style={{ height: '22px', fontSize: '11px' }}
              >
                <option value="80mm">80mm (Standard POS)</option>
                <option value="58mm">58mm (Compact Mobile)</option>
              </select>
            </div>

            <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={autoCut} onChange={(e) => setAutoCut(e.target.checked)} />
              Send Auto-Paper Cut Command (GS V 0)
            </label>
          </div>

          {/* Test Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button className="win-btn" style={{ flex: 1, fontSize: '11px' }} onClick={() => handleTestPrint('BILL')}>
              Test Bill Thermal Slip
            </button>
            <button className="win-btn" style={{ flex: 1, fontSize: '11px' }} onClick={() => handleTestPrint('KOT')}>
              Test Kitchen KOT Slip
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '1px solid #808080', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="win-btn" onClick={handleSave} style={{ fontWeight: 'bold', minWidth: '75px' }}>
            Save
          </button>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '75px' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
