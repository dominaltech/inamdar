import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { EMPLOYEES } from '../../data/initialData';
import { fetchLiveStaffUsers, saveStaffUserInSupabase } from '../../services/supabaseService';
import { IconUsers, IconUserPlus, IconCheck } from '../common/Icons';

export default function StaffMasterModal({ isOpen, onClose }) {
  const { tables, setActiveEmployee } = usePos();
  const [staffList, setStaffList] = useState(EMPLOYEES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ id: '', name: '', role: 'WAITER', pin: '1234' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchLiveStaffUsers().then(live => {
      if (isMounted && live && live.length > 0) {
        // Merge with defaults to ensure complete list
        const merged = [...live];
        EMPLOYEES.forEach(e => {
          if (!merged.some(m => String(m.id) === String(e.id))) {
            merged.push(e);
          }
        });
        setStaffList(merged);
      }
    }).catch(err => {
      console.warn('Live staff fetch error:', err);
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  const staffStats = staffList.map(emp => {
    // Find active tables currently handled by this employee
    const activeTables = Object.values(tables || {}).filter(t => t.waiter === emp.name && t.items && t.items.some(i => i.qty > 0));
    const totalOrders = activeTables.length;
    const totalSales = activeTables.reduce((sum, tbl) => {
      return sum + (tbl.items || []).reduce((s, it) => s + (it.amount || 0), 0);
    }, 0);

    return {
      id: emp.id,
      name: emp.name,
      role: emp.role || 'WAITER',
      activeTables: activeTables.map(t => t.id),
      totalOrders,
      totalSales,
    };
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newStaff.id.trim() || !newStaff.name.trim()) return;

    setIsSaving(true);
    const staffObj = {
      id: newStaff.id.trim(),
      name: newStaff.name.trim().toUpperCase(),
      role: newStaff.role || 'WAITER',
      pin: newStaff.pin.trim() || '1234',
      isActive: true,
    };

    await saveStaffUserInSupabase(staffObj);

    setStaffList(prev => [...prev.filter(s => String(s.id) !== staffObj.id), staffObj]);
    setNewStaff({ id: '', name: '', role: 'WAITER', pin: '1234' });
    setShowAddForm(false);
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '740px', maxWidth: '96vw', height: '70vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconUsers size={14} color="#ffffff" />
            <span>Waiters &amp; Staff Master — Inamdar Restaurant (Database Live)</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '6px 12px', background: '#d4d0c8', borderBottom: '1px solid #808080', fontSize: '11px', color: '#002266', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Registered Service Staff: Waiter assignment controls Captain App KOT routing and server performance tracking.</span>
          <button
            className="win-btn"
            style={{ fontWeight: 'bold', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <IconUserPlus size={12} />
            {showAddForm ? 'Cancel' : '+ Add Staff'}
          </button>
        </div>

        {/* Add Staff Inline Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} style={{ padding: '8px 12px', background: '#e8edf5', borderBottom: '1px solid #7f9db9', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              required
              placeholder="Staff ID (e.g. 5)"
              value={newStaff.id}
              onChange={(e) => setNewStaff({ ...newStaff, id: e.target.value })}
              className="win-input"
              style={{ width: '90px', height: '22px', fontSize: '11px' }}
            />
            <input
              type="text"
              required
              placeholder="Full Name (e.g. 5. VIKAS)"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="win-input"
              style={{ flex: 1, height: '22px', fontSize: '11px' }}
            />
            <select
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              className="win-input"
              style={{ width: '100px', height: '22px', fontSize: '11px' }}
            >
              <option value="WAITER">WAITER</option>
              <option value="CAPTAIN">CAPTAIN</option>
              <option value="CASHIER">CASHIER</option>
              <option value="MANAGER">MANAGER</option>
            </select>
            <input
              type="password"
              placeholder="PIN (1234)"
              value={newStaff.pin}
              onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value })}
              className="win-input"
              style={{ width: '70px', height: '22px', fontSize: '11px' }}
            />
            <button type="submit" disabled={isSaving} className="win-btn" style={{ fontWeight: 'bold', minWidth: '80px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <IconCheck size={12} color="#008000" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '50px' }}>ID</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Staff Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '90px' }}>Role</th>
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
                  <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px', color: '#555' }}>{staff.role}</td>
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
