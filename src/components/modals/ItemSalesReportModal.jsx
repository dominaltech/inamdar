import React, { useState, useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { getAllMenuItems } from '../../data/menuService';

export default function ItemSalesReportModal({ isOpen, onClose }) {
  const { allBills } = usePos();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute item sales from all settled & unsettled bills
  const salesData = useMemo(() => {
    const map = {};
    (allBills || []).forEach(bill => {
      (bill.items || []).forEach(it => {
        const code = String(it.code);
        if (!map[code]) {
          map[code] = {
            code,
            name: it.name,
            category: it.category || 'UNCATEGORIZED',
            qtySold: 0,
            rate: it.rate,
            totalAmount: 0,
          };
        }
        map[code].qtySold += Number(it.qty || 0);
        map[code].totalAmount += Number(it.amount || 0);
      });
    });

    // Also include menu items with 0 sales for a complete ledger
    const allMenu = getAllMenuItems();
    allMenu.forEach(mi => {
      if (!map[mi.code]) {
        map[mi.code] = {
          code: mi.code,
          name: mi.name,
          category: mi.category,
          qtySold: 0,
          rate: mi.acRate,
          totalAmount: 0,
        };
      }
    });

    return Object.values(map);
  }, [allBills]);

  const categories = useMemo(() => {
    const set = new Set(salesData.map(d => d.category));
    return ['ALL', ...Array.from(set).sort()];
  }, [salesData]);

  const filteredSales = useMemo(() => {
    return salesData.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.trim().toUpperCase();
      const matchSearch = !q || item.code.includes(q) || item.name.includes(q);
      return matchCat && matchSearch;
    }).sort((a, b) => b.qtySold - a.qtySold || (Number(a.code) || 0) - (Number(b.code) || 0));
  }, [salesData, selectedCategory, searchQuery]);

  const totalQtySold = filteredSales.reduce((s, it) => s + it.qtySold, 0);
  const totalRevenue = filteredSales.reduce((s, it) => s + it.totalAmount, 0);

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '850px', maxWidth: '96vw', height: '80vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>📊 Item Sales Report — Inamdar Restaurant</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Filters Toolbar */}
        <div style={{ padding: '8px 12px', background: '#d4d0c8', borderBottom: '1px solid #808080', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', marginRight: '6px' }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="win-input"
              style={{ height: '22px', fontSize: '11px' }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', marginRight: '6px' }}>Search:</label>
            <input
              type="text"
              placeholder="Code or Dish Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win-input"
              style={{ width: '220px', height: '22px', fontSize: '11px' }}
            />
          </div>

          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#002266' }}>
            Showing {filteredSales.length} Dishes
          </div>
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '60px' }}>Code</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Dish Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '140px' }}>Category</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '70px' }}>Rate (₹)</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '80px' }}>Qty Sold</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '100px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((item, idx) => (
                <tr
                  key={`${item.code}-${item.category}-${idx}`}
                  style={{
                    background: item.qtySold > 0 ? (idx % 2 === 0 ? '#f0f7ff' : '#ffffff') : '#fafafa',
                    color: item.qtySold > 0 ? '#000000' : '#888888',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{item.code}</td>
                  <td style={{ padding: '4px 8px', fontWeight: item.qtySold > 0 ? 'bold' : 'normal' }}>{item.name}</td>
                  <td style={{ padding: '4px 8px' }}>{item.category}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{Number(item.rate).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold', color: item.qtySold > 0 ? '#006600' : '#888' }}>
                    {item.qtySold}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                    {Number(item.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 'bold' }}>
            <span>Total Quantity Sold: <span style={{ color: '#006600' }}>{totalQtySold}</span></span>
            <span>Total Sales Revenue: <span style={{ color: '#002266' }}>₹{totalRevenue.toFixed(2)}</span></span>
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
