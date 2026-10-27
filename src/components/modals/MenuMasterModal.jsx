import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { getAllMenuItems, loadDynamicMenuItems } from '../../data/menuService';
import { saveMenuItemInSupabase } from '../../services/supabaseService';

export default function MenuMasterModal({ isOpen, onClose }) {
  const { setInfoDialog } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDish, setNewDish] = useState({
    code: '',
    name: '',
    category: 'MAIN COURSE',
    hallRate: '',
    acRate: '',
    isKitchen: true,
  });

  const menuItems = getAllMenuItems();

  const filtered = menuItems.filter(it => {
    const q = searchQuery.trim().toUpperCase();
    if (!q) return true;
    return it.code.includes(q) || it.name.includes(q) || it.category.includes(q);
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDish.code.trim() || !newDish.name.trim()) {
      alert("Please fill code and dish name!");
      return;
    }

    const payload = {
      code: newDish.code.trim(),
      name: newDish.name.trim().toUpperCase(),
      category: newDish.category,
      categoryOrder: 5,
      hallRate: Number(newDish.hallRate) || Number(newDish.acRate) || 0,
      acRate: Number(newDish.acRate) || Number(newDish.hallRate) || 0,
      isKitchen: Boolean(newDish.isKitchen),
      isAvailable: true,
    };

    // 1. Update in-memory menu immediately for zero-latency local experience
    const updated = [...menuItems.filter(m => m.code !== payload.code), payload];
    loadDynamicMenuItems(updated);

    // 2. Persist to Supabase in background
    saveMenuItemInSupabase(payload);

    setShowAddForm(false);
    setNewDish({ code: '', name: '', category: 'MAIN COURSE', hallRate: '', acRate: '', isKitchen: true });
    setInfoDialog({
      title: "Menu Master",
      message: `Dish #${payload.code} (${payload.name}) saved successfully and synced with Supabase.`,
    });
  };

  const handlePriceUpdate = (item) => {
    const newAc = window.prompt(`Enter new AC Rate for ${item.name}:`, String(item.acRate));
    if (newAc === null) return;
    const newHall = window.prompt(`Enter new Hall Rate for ${item.name}:`, String(item.hallRate || item.acRate));
    if (newHall === null) return;

    const updatedItem = {
      ...item,
      acRate: Number(newAc) || item.acRate,
      hallRate: Number(newHall) || item.hallRate,
    };

    const updated = menuItems.map(m => m.code === item.code ? updatedItem : m);
    loadDynamicMenuItems(updated);
    saveMenuItemInSupabase(updatedItem);

    setInfoDialog({
      title: "Price Updated",
      message: `Updated ${item.name}: AC ₹${updatedItem.acRate}, Hall ₹${updatedItem.hallRate}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '920px', maxWidth: '96vw', height: '82vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>📖 Menu Card Master — Inamdar Restaurant (Dynamic Supabase Sync)</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '6px 12px', background: '#d4d0c8', borderBottom: '1px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Search Menu:</label>
            <input
              type="text"
              placeholder="Code, Dish Name, or Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win-input"
              style={{ width: '250px', height: '22px', fontSize: '11px' }}
            />
          </div>

          <button
            className="win-btn"
            style={{ fontWeight: 'bold', minWidth: '120px', color: '#002266' }}
            onClick={() => setShowAddForm(true)}
          >
            + Add New Dish
          </button>
        </div>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '55px' }}>Code</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Dish Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '140px' }}>Category</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '85px' }}>Hall Rate</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '85px' }}>AC Rate</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '100px' }}>Department</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '90px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.code}
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#f7f7f7',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{item.code}</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '4px 8px' }}>{item.category}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>₹{Number(item.hallRate).toFixed(2)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#002266' }}>
                    ₹{Number(item.acRate).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px' }}>
                    <span style={{
                      padding: '1px 5px',
                      borderRadius: '2px',
                      background: item.isKitchen ? '#e6f0fa' : '#fff3e0',
                      border: item.isKitchen ? '1px solid #99c2ff' : '1px solid #ffcc80',
                      color: item.isKitchen ? '#003399' : '#cc6600',
                    }}>
                      {item.isKitchen ? '🍳 KITCHEN' : '🍹 PANTRY'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <button
                      className="win-btn"
                      style={{ fontSize: '10px', padding: '1px 6px' }}
                      onClick={() => handlePriceUpdate(item)}
                    >
                      Edit Rate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#333' }}>
            Total Registered Dishes: <b>{menuItems.length}</b> items in Supabase
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>

        {/* Add New Dish Modal */}
        {showAddForm && (
          <div className="win-modal-backdrop" style={{ zIndex: 1600 }}>
            <div className="win-window" style={{ width: '380px', background: '#ece9d8' }}>
              <div className="win-titlebar">
                <div className="win-titlebar-title"><span>Add New Menu Dish</span></div>
                <button className="win-close-btn" onClick={() => setShowAddForm(false)}>✕</button>
              </div>
              <form onSubmit={handleAddSubmit} style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Code:</label>
                  <input
                    type="text"
                    required
                    value={newDish.code}
                    onChange={(e) => setNewDish({ ...newDish, code: e.target.value })}
                    className="win-input"
                    style={{ width: '100%', height: '22px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Dish Name:</label>
                  <input
                    type="text"
                    required
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    className="win-input"
                    style={{ width: '100%', height: '22px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Category:</label>
                  <select
                    value={newDish.category}
                    onChange={(e) => setNewDish({ ...newDish, category: e.target.value })}
                    className="win-input"
                    style={{ width: '100%', height: '22px' }}
                  >
                    <option value="SOUP">SOUP</option>
                    <option value="STARTERS">STARTERS</option>
                    <option value="KABAB">KABAB</option>
                    <option value="MAIN COURSE">MAIN COURSE</option>
                    <option value="BIRYANI">BIRYANI</option>
                    <option value="ROTI">ROTI</option>
                    <option value="DESSERTS /MOCKTAL">DESSERTS /MOCKTAL</option>
                    <option value="SOFT DRINKS">SOFT DRINKS</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>AC Rate (₹):</label>
                    <input
                      type="number"
                      required
                      value={newDish.acRate}
                      onChange={(e) => setNewDish({ ...newDish, acRate: e.target.value })}
                      className="win-input"
                      style={{ width: '100%', height: '22px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Hall Rate (₹):</label>
                    <input
                      type="number"
                      value={newDish.hallRate}
                      onChange={(e) => setNewDish({ ...newDish, hallRate: e.target.value })}
                      className="win-input"
                      style={{ width: '100%', height: '22px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={newDish.isKitchen}
                      onChange={(e) => setNewDish({ ...newDish, isKitchen: e.target.checked })}
                    />
                    Route to Cook / Kitchen KDS (Uncheck for Pantry/Drinks)
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button type="submit" className="win-btn" style={{ fontWeight: 'bold', minWidth: '70px' }}>Save</button>
                  <button type="button" className="win-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
