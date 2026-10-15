import React, { useState } from 'react';
import { usePos } from '../context/PosContext';

export default function ReportsView() {
  const { setScreenMode } = usePos();
  const [reportDate, setReportDate] = useState('30/03/26');
  const [halls, setHalls] = useState({
    Ac: true,
    FamilyAc: true,
    HomeDelivery: true,
    Notac: true,
    Parcel: true,
    Zomato: true,
  });

  const toggleHall = (key) => {
    setHalls(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ padding: '8px', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <div className="win-window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title Bar */}
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>📊 Sales &amp; Dayclose Summary Report — INAMDAR RESTAURANT</span>
          </div>
          <button className="win-close-btn" onClick={() => setScreenMode('ORDER')}>✕</button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, padding: '10px 14px', background: '#ece9d8', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Top Controls: Date and Hall Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#d4d0c8', padding: '6px 12px', border: '1px solid #808080' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>To:</span>
              <input
                type="text"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="win-input"
                style={{ width: '90px', textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
              <span style={{ fontWeight: 'bold' }}>Halls:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={halls.Ac} onChange={() => toggleHall('Ac')} /> Ac
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={halls.FamilyAc} onChange={() => toggleHall('FamilyAc')} /> Family Ac
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={halls.HomeDelivery} onChange={() => toggleHall('HomeDelivery')} /> Home Delivery
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={halls.Notac} onChange={() => toggleHall('Notac')} /> Notac
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={halls.Parcel} onChange={() => toggleHall('Parcel')} /> Parcel
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" checked={halls.Zomato} onChange={() => toggleHall('Zomato')} /> Zomato
              </label>
            </div>

            <button className="win-btn" style={{ minWidth: '60px', fontWeight: 'bold' }}>
              Ok
            </button>
          </div>

          {/* Tab Header */}
          <div style={{ borderBottom: '2px solid #808080', padding: '2px 0' }}>
            <span style={{
              background: '#ece9d8',
              borderTop: '2px solid #fff',
              borderLeft: '2px solid #fff',
              borderRight: '2px solid #808080',
              padding: '4px 16px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ece9d8',
              position: 'relative',
              top: '2px'
            }}>
              Summary
            </span>
          </div>

          {/* Main 3-Column Report Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1.1fr', gap: '10px', flex: 1 }}>
            {/* Column 1: Sales Details, Tax Breakup, Cashier Tender Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Sales Details */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Sales Details
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Gross Sale</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>10,63,915.00</td></tr>
                    <tr><td>Discount</td><td style={{ textAlign: 'right', color: '#c00000' }}>1,521.00</td></tr>
                    <tr style={{ borderTop: '1px solid #ddd' }}>
                      <td style={{ fontWeight: 'bold' }}>Net Sale</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006600', fontSize: '13px' }}>10,62,394.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cashier Details */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Cashier Details
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Cash</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>10,38,763.00</td></tr>
                    <tr><td>Digital</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                    <tr><td>Online Payment</td><td style={{ textAlign: 'right' }}>14,731.00</td></tr>
                    <tr><td>UPI</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>8,900.00</td></tr>
                    <tr><td>Pay Out</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                    <tr><td>Pay In</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Tax Breakup */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Tax Breakup
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>CGST (2.5%)</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                    <tr><td>SGST (2.5%)</td><td style={{ textAlign: 'right' }}>0.00</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 2: Hall, Department, Category & Sub-Category Breakdowns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Hall Breakup */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Hall Breakup
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Ac</td><td style={{ textAlign: 'right' }}>3,51,800.00 (33%)</td></tr>
                    <tr><td>Family Ac</td><td style={{ textAlign: 'right' }}>3,27,265.00 (30%)</td></tr>
                    <tr><td>Parcel</td><td style={{ textAlign: 'right' }}>3,84,550.00 (36%)</td></tr>
                    <tr><td>Home Delivery</td><td style={{ textAlign: 'right' }}>0.00 (00%)</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Department Breakup */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Department Breakup
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Kitchen</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>10,12,340.00 (95%)</td></tr>
                    <tr><td>Pantry</td><td style={{ textAlign: 'right' }}>51,575.00 (04%)</td></tr>
                    <tr><td>Continental</td><td style={{ textAlign: 'right' }}>0.00 (00%)</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Category Sample */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff', maxHeight: '140px', overflowY: 'auto' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Category Breakup
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Biryani</td><td style={{ textAlign: 'right' }}>3,17,130.00 (29%)</td></tr>
                    <tr><td>Starters</td><td style={{ textAlign: 'right' }}>2,21,300.00 (20%)</td></tr>
                    <tr><td>Main Course</td><td style={{ textAlign: 'right' }}>1,87,390.00 (17%)</td></tr>
                    <tr><td>Kabab</td><td style={{ textAlign: 'right' }}>1,46,100.00 (13%)</td></tr>
                    <tr><td>Roti</td><td style={{ textAlign: 'right' }}>69,220.00 (06%)</td></tr>
                    <tr><td>Biryani And Pulao</td><td style={{ textAlign: 'right' }}>35,700.00 (03%)</td></tr>
                    <tr><td>Soft Drinks</td><td style={{ textAlign: 'right' }}>28,200.00 (02%)</td></tr>
                    <tr><td>Desserts / Mocktail</td><td style={{ textAlign: 'right' }}>23,290.00 (02%)</td></tr>
                    <tr><td>Rice And Noodles</td><td style={{ textAlign: 'right' }}>19,530.00 (01%)</td></tr>
                    <tr><td>Soup</td><td style={{ textAlign: 'right' }}>14,400.00 (01%)</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Sub Category */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Sub Category
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Chicken</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>6,11,490.00 (57%)</td></tr>
                    <tr><td>Veg</td><td style={{ textAlign: 'right' }}>2,02,995.00 (19%)</td></tr>
                    <tr><td>Others</td><td style={{ textAlign: 'right' }}>60.00 (00%)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Column 3: Audit Alterations & Anti-Theft Counters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#c00000', borderBottom: '1px solid #ffcccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Orders Altered (Anti-Theft)
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Cancelled</td><td style={{ textAlign: 'right', color: '#c00000', fontWeight: 'bold' }}>198 (₹49,305)</td></tr>
                    <tr><td>No Charge</td><td style={{ textAlign: 'right' }}>0</td></tr>
                    <tr><td>Transferred (Shift)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>44</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Bills Altered
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Discounted</td><td style={{ textAlign: 'right' }}>11 (₹1,521)</td></tr>
                    <tr><td>Reprinted</td><td style={{ textAlign: 'right' }}>6 (₹9,340)</td></tr>
                    <tr><td>Modified</td><td style={{ textAlign: 'right' }}>3 (₹4,000)</td></tr>
                    <tr><td>Void</td><td style={{ textAlign: 'right' }}>0</td></tr>
                    <tr><td>Complimentary</td><td style={{ textAlign: 'right' }}>0</td></tr>
                    <tr><td>Staff / Guest</td><td style={{ textAlign: 'right' }}>0</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Bill Statistics
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Total No Of Bills</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>1281</td></tr>
                    <tr><td>Total PAX</td><td style={{ textAlign: 'right' }}>1496 (580)</td></tr>
                    <tr><td>Items Added</td><td style={{ textAlign: 'right' }}>13</td></tr>
                    <tr><td>Items Altered</td><td style={{ textAlign: 'right' }}>4</td></tr>
                    <tr><td>Print Date / Time</td><td style={{ textAlign: 'right', fontSize: '10px' }}>12/10/26 02:51 pm</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px', borderTop: '1px solid #aaa' }}>
            <button className="win-btn" style={{ minWidth: '80px' }} onClick={() => window.print()}>
              🖨️ Print
            </button>
            <button className="win-btn" style={{ minWidth: '80px' }}>
              📁 Export
            </button>
            <button className="win-btn" style={{ minWidth: '80px', fontWeight: 'bold' }} onClick={() => setScreenMode('ORDER')}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
