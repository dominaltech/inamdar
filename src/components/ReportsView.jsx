import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { isKitchenItem } from '../data/menuService';

export default function ReportsView() {
  const { setScreenMode, dailyTransactions, allBills, tables, triggerTableFocus } = usePos();
  const [reportDate, setReportDate] = useState('Today');

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

  // 1. Sales & Cashier Collections from live settled transactions
  const liveCash = (dailyTransactions || []).filter(t => t.paymentMode === 'Cash').reduce((s, t) => s + Number(t.amount || 0), 0);
  const liveUpi = (dailyTransactions || []).filter(t => t.paymentMode === 'UPI').reduce((s, t) => s + Number(t.amount || 0), 0);
  const liveCard = (dailyTransactions || []).filter(t => t.paymentMode === 'Card' || t.paymentMode === 'Debit Card').reduce((s, t) => s + Number(t.amount || 0), 0);
  const liveOthers = (dailyTransactions || []).filter(t => !['Cash', 'UPI', 'Card', 'Debit Card'].includes(t.paymentMode)).reduce((s, t) => s + Number(t.amount || 0), 0);
  const liveTotalSales = liveCash + liveUpi + liveCard + liveOthers;
  const liveTotalBills = (dailyTransactions || []).length;

  // 2. Hall Breakup (from settled bills)
  const hallData = useMemo(() => {
    let ac = 0;
    let familyAc = 0;
    let parcel = 0;
    let delivery = 0;

    (allBills || []).filter(b => b.isSettled).forEach(b => {
      const amt = Number(b.totalAmount || 0);
      const sec = (b.section || '').toUpperCase();
      if (sec === 'AC') ac += amt;
      else if (sec === 'FAMILY AC') familyAc += amt;
      else if (sec === 'PARCEL') parcel += amt;
      else if (sec === 'HOME DELIVERY') delivery += amt;
      else ac += amt;
    });

    const total = ac + familyAc + parcel + delivery || liveTotalSales || 1;
    return {
      ac: { amt: ac, pct: Math.round((ac / total) * 100) },
      familyAc: { amt: familyAc, pct: Math.round((familyAc / total) * 100) },
      parcel: { amt: parcel, pct: Math.round((parcel / total) * 100) },
      delivery: { amt: delivery, pct: Math.round((delivery / total) * 100) },
    };
  }, [allBills, liveTotalSales]);

  // 3. Department Breakup (Kitchen vs Pantry)
  const deptData = useMemo(() => {
    let kitchen = 0;
    let pantry = 0;

    (allBills || []).filter(b => b.isSettled).forEach(b => {
      (b.items || []).forEach(it => {
        const amt = Number(it.amount || it.qty * it.rate || 0);
        if (isKitchenItem(it)) kitchen += amt;
        else pantry += amt;
      });
    });

    const total = kitchen + pantry || 1;
    return {
      kitchen: { amt: kitchen, pct: Math.round((kitchen / total) * 100) },
      pantry: { amt: pantry, pct: Math.round((pantry / total) * 100) },
    };
  }, [allBills]);

  // 4. Category & Sub-Category Breakup
  const categoryData = useMemo(() => {
    const catMap = {};
    let chickenAmt = 0;
    let vegAmt = 0;
    let othersAmt = 0;

    (allBills || []).filter(b => b.isSettled).forEach(b => {
      (b.items || []).forEach(it => {
        const cat = it.category || 'UNCATEGORIZED';
        const amt = Number(it.amount || it.qty * it.rate || 0);
        catMap[cat] = (catMap[cat] || 0) + amt;

        const name = (it.name || '').toUpperCase();
        if (name.includes('CHICKEN') || name.includes('MUTTON') || name.includes('FISH') || name.includes('PRAWN')) {
          chickenAmt += amt;
        } else if (name.includes('PANEER') || name.includes('VEG') || name.includes('ROTI') || name.includes('DAL')) {
          vegAmt += amt;
        } else {
          othersAmt += amt;
        }
      });
    });

    const totalSold = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    const catList = Object.entries(catMap)
      .map(([name, amt]) => ({ name, amt, pct: Math.round((amt / totalSold) * 100) }))
      .sort((a, b) => b.amt - a.amt);

    const subTotal = chickenAmt + vegAmt + othersAmt || 1;
    return {
      categories: catList,
      subCategories: {
        chicken: { amt: chickenAmt, pct: Math.round((chickenAmt / subTotal) * 100) },
        veg: { amt: vegAmt, pct: Math.round((vegAmt / subTotal) * 100) },
        others: { amt: othersAmt, pct: Math.round((othersAmt / subTotal) * 100) },
      }
    };
  }, [allBills]);

  // 5. Anti-Theft & Alteration Metrics
  const auditMetrics = useMemo(() => {
    let cancelledCount = 0;
    let cancelledAmt = 0;

    // Check active tables for cancelled items
    Object.values(tables || {}).forEach(tbl => {
      (tbl.items || []).forEach(it => {
        if (it.isCancelled || it.qty < 0) {
          cancelledCount += Math.abs(Number(it.qty || 1));
          cancelledAmt += Math.abs(Number(it.amount || it.qty * it.rate || 0));
        }
      });
    });

    // Check saved audit logs for transfers & reprints
    let transferCount = 0;
    let reprintCount = 0;
    try {
      const logs = JSON.parse(localStorage.getItem('inamdar_audit_logs') || '[]');
      transferCount = logs.filter(l => l.action === 'TABLE_TRANSFER').length;
      reprintCount = logs.filter(l => l.action === 'DUPLICATE_REPRINT').length;
    } catch {
      // clean fallback
    }

    const voidCount = (allBills || []).filter(b => b.paymentMode === 'Void').length;
    const compCount = (allBills || []).filter(b => b.paymentMode === 'Complimentary').length;
    const staffCount = (allBills || []).filter(b => ['Staff', 'Guest'].includes(b.paymentMode)).length;
    const totalPax = (allBills || []).reduce((s, b) => s + Number(b.pax || 2), 0);

    return {
      cancelledCount,
      cancelledAmt,
      transferCount,
      reprintCount,
      voidCount,
      compCount,
      staffCount,
      totalPax,
      totalBills: (allBills || []).length,
    };
  }, [tables, allBills]);

  const handleClose = () => {
    setScreenMode('ORDER');
    triggerTableFocus?.();
  };

  return (
    <div style={{ padding: '8px', height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
      <div className="win-window" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title Bar */}
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>📊 Sales &amp; Dayclose Summary Report — INAMDAR RESTAURANT</span>
          </div>
          <button className="win-close-btn" onClick={handleClose}>✕</button>
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
                    <tr><td>Gross Sale</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{liveTotalSales.toFixed(2)}</td></tr>
                    <tr><td>Discount</td><td style={{ textAlign: 'right', color: '#c00000' }}>0.00</td></tr>
                    <tr style={{ borderTop: '1px solid #ddd' }}>
                      <td style={{ fontWeight: 'bold' }}>Today's Net Sale</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006600', fontSize: '13px' }}>₹{liveTotalSales.toFixed(2)}</td>
                    </tr>
                    <tr><td>Settled Bills Count</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{liveTotalBills}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Cashier Details */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Cashier Details (Today's Collections)
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Cash</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{liveCash.toFixed(2)}</td></tr>
                    <tr><td>UPI / QR</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{liveUpi.toFixed(2)}</td></tr>
                    <tr><td>Credit / Debit Card</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{liveCard.toFixed(2)}</td></tr>
                    {liveOthers > 0 && (
                      <tr><td>Other Modes</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{liveOthers.toFixed(2)}</td></tr>
                    )}
                    <tr style={{ borderTop: '1px solid #ddd' }}>
                      <td style={{ fontWeight: 'bold' }}>Total Collected</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006600' }}>₹{liveTotalSales.toFixed(2)}</td>
                    </tr>
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
                    <tr><td>Ac</td><td style={{ textAlign: 'right' }}>₹{hallData.ac.amt.toFixed(2)} ({hallData.ac.pct}%)</td></tr>
                    <tr><td>Family Ac</td><td style={{ textAlign: 'right' }}>₹{hallData.familyAc.amt.toFixed(2)} ({hallData.familyAc.pct}%)</td></tr>
                    <tr><td>Parcel</td><td style={{ textAlign: 'right' }}>₹{hallData.parcel.amt.toFixed(2)} ({hallData.parcel.pct}%)</td></tr>
                    <tr><td>Home Delivery</td><td style={{ textAlign: 'right' }}>₹{hallData.delivery.amt.toFixed(2)} ({hallData.delivery.pct}%)</td></tr>
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
                    <tr><td>Kitchen</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{deptData.kitchen.amt.toFixed(2)} ({deptData.kitchen.pct}%)</td></tr>
                    <tr><td>Pantry</td><td style={{ textAlign: 'right' }}>₹{deptData.pantry.amt.toFixed(2)} ({deptData.pantry.pct}%)</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Category Breakup */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff', maxHeight: '140px', overflowY: 'auto' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Category Breakup
                </div>
                {categoryData.categories.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', padding: '6px 0', textAlign: 'center' }}>
                    No settled categories recorded today
                  </div>
                ) : (
                  <table style={{ width: '100%', fontSize: '11px' }}>
                    <tbody>
                      {categoryData.categories.map((c, i) => (
                        <tr key={i}>
                          <td>{c.name}</td>
                          <td style={{ textAlign: 'right' }}>₹{c.amt.toFixed(2)} ({c.pct}%)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Sub Category */}
              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Sub Category
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Non-Veg / Chicken / Mutton</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{categoryData.subCategories.chicken.amt.toFixed(2)} ({categoryData.subCategories.chicken.pct}%)</td></tr>
                    <tr><td>Veg / Starters / Roti</td><td style={{ textAlign: 'right' }}>₹{categoryData.subCategories.veg.amt.toFixed(2)} ({categoryData.subCategories.veg.pct}%)</td></tr>
                    <tr><td>Others / Beverages</td><td style={{ textAlign: 'right' }}>₹{categoryData.subCategories.others.amt.toFixed(2)} ({categoryData.subCategories.others.pct}%)</td></tr>
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
                    <tr><td>Cancelled</td><td style={{ textAlign: 'right', color: '#c00000', fontWeight: 'bold' }}>{auditMetrics.cancelledCount} (₹{auditMetrics.cancelledAmt.toFixed(2)})</td></tr>
                    <tr><td>No Charge</td><td style={{ textAlign: 'right' }}>0</td></tr>
                    <tr><td>Transferred (Shift)</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{auditMetrics.transferCount}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Bills Altered
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Discounted</td><td style={{ textAlign: 'right' }}>0</td></tr>
                    <tr><td>Reprinted</td><td style={{ textAlign: 'right' }}>{auditMetrics.reprintCount}</td></tr>
                    <tr><td>Modified</td><td style={{ textAlign: 'right' }}>0</td></tr>
                    <tr><td>Void</td><td style={{ textAlign: 'right' }}>{auditMetrics.voidCount}</td></tr>
                    <tr><td>Complimentary</td><td style={{ textAlign: 'right' }}>{auditMetrics.compCount}</td></tr>
                    <tr><td>Staff / Guest</td><td style={{ textAlign: 'right' }}>{auditMetrics.staffCount}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="win-bevel-thin-inset" style={{ padding: '6px', background: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#0a246a', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '4px' }}>
                  Bill Statistics
                </div>
                <table style={{ width: '100%', fontSize: '11px' }}>
                  <tbody>
                    <tr><td>Total No Of Bills</td><td style={{ textAlign: 'right', fontWeight: 'bold' }}>{auditMetrics.totalBills}</td></tr>
                    <tr><td>Total PAX</td><td style={{ textAlign: 'right' }}>{auditMetrics.totalPax}</td></tr>
                    <tr><td>Items Altered / Cancelled</td><td style={{ textAlign: 'right' }}>{auditMetrics.cancelledCount}</td></tr>
                    <tr><td>Report Date</td><td style={{ textAlign: 'right', fontSize: '10px' }}>{new Date().toLocaleDateString('en-GB')}</td></tr>
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
            <button className="win-btn" style={{ minWidth: '80px', fontWeight: 'bold' }} onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
