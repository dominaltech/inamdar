import React from 'react';
import { usePos } from '../../context/PosContext';
import { EMPLOYEES } from '../../data/initialData';

export default function StaffMasterModal({ isOpen, onClose }) {
  const { tables, setActiveEmployee } = usePos();

  const staffStats = EMPLOYEES.map(emp => {
    // Find active tables currently handled by this employee
    const activeTables = Object.values(tables || {}).filter(t => t.waiter === emp.name && t.items && t.items.some(i => i.qty > 0));
    const totalOrders = activeTables.length;
    const totalSales = activeTables.reduce((sum, tbl) => {
      return sum + (tbl.items || []).reduce((s, it) => s + (it.amount || 0), 0);
    }, 0);

    return {
      id: emp.id,
      name: emp.name,
      activeTables: activeTables.map(t => t.id),
      totalOrders,
      totalSales,
    };
  });

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '700px', maxWidth: '96vw', height: '65vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>👨‍🍳 Waiters &amp; Staff Master — Inamdar Restaurant</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '6px 12px', background: '#d4d0c8', borderBottom: '1px solid #808080', fontSize: '11px', color: '#002266', fontWeight: 'bold' }}>
          Registered Service Staff: Waiter assignment controls Captain App KOT routing and server performance tracking.
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '50px' }}>ID</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Staff Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '110px' }}>Active Tables</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '90px' }}>Active Orders</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '100px' }}>Running Sales</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((staff, idx) => (
                <tr key={staff.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{staff.id}</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{staff.name}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>
                    {staff.activeTables.length > 0 ? (
                      <span style={{ fontWeight: 'bold', color: '#cc0000' }}>
                        {staff.activeTables.join(', ')}
                      </span>
                    ) : (
                      <span style={{ color: '#888' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                    {staff.totalOrders}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#002266' }}>
                    ₹{staff.totalSales.toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <button
                      className="win-btn"
                      style={{ fontSize: '10px', padding: '1px 5px' }}
                      onClick={() => {
                        setActiveEmployee(staff.name);
                        onClose();
                      }}
                    >
                      Set Active
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
