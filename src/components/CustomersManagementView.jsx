import React, { useState, useMemo, useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function CustomersManagementView() {
  const {
    customers = [],
    setScreenMode,
    saveCustomer,
    refreshCustomers,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // Modal State for Add / Edit Customer
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ phone: '', name: '' });
  const [isEditing, setIsEditing] = useState(false);

  const showToast = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'info' }), 3500);
  };

  // Keyboard navigation & Esc hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showModal) {
          setShowModal(false);
          return;
        }
        setScreenMode('ORDER');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        refreshCustomers?.();
        showToast('Refreshing customers from database...', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, setScreenMode, refreshCustomers]);

  // Filter customers by phone or name
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Auto-select first customer if none selected
  useEffect(() => {
    if (filteredCustomers.length > 0 && !selectedPhone) {
      setSelectedPhone(filteredCustomers[0].phone);
    }
  }, [filteredCustomers, selectedPhone]);

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.phone === selectedPhone) || filteredCustomers[0] || null;
  }, [customers, selectedPhone, filteredCustomers]);

  const handleOpenAddModal = () => {
    setFormData({ phone: '', name: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (cust) => {
    setFormData({ phone: cust.phone, name: cust.name });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = formData.phone.trim();
    const cleanName = formData.name.trim();

    if (!cleanPhone) {
      alert('Please enter a valid Phone Number for the customer.');
      return;
    }
    if (!cleanName) {
      alert('Please enter the Customer Name.');
      return;
    }

    const existing = customers.find(c => c.phone === cleanPhone);
    const existingVisits = Number(existing?.visit_count ?? existing?.visitCount) || 1;
    const existingSpent = Number(existing?.total_spent ?? existing?.totalSpent) || 0;
    const existingLastVisit = existing?.last_visit || existing?.lastVisit || new Date().toISOString();
    const existingHistory = existing?.history || [];

    const updatedRecord = {
      phone: cleanPhone,
      name: cleanName,
      visit_count: existingVisits,
      total_spent: existingSpent,
      last_visit: existingLastVisit,
      visitCount: existingVisits,
      totalSpent: existingSpent,
      lastVisit: existingLastVisit,
      history: existingHistory,
    };

    const success = await saveCustomer(updatedRecord);
    if (success) {
      showToast(`Customer ${cleanName} (${cleanPhone}) saved successfully!`, 'success');
      setSelectedPhone(cleanPhone);
      setShowModal(false);
    } else {
      showToast('Error saving customer. Check connection.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ece9d8', fontFamily: 'Tahoma, sans-serif' }}>
      {/* 1. Header Toolbar */}
      <div className="win-titlebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', height: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
            👥 Dominal's POS — Customer Management &amp; Repeat Tracker (Live Database Sync)
          </span>
          <span style={{ fontSize: '10px', background: '#006600', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold' }}>
            ☁️ Connected to Live Database
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              refreshCustomers?.();
              showToast('Refreshed customers list from cloud!', 'info');
            }}
            className="win-btn"
            style={{ fontSize: '11px', height: '22px' }}
          >
            ↻ Refresh Cloud (F5)
          </button>
          <button
            onClick={() => setScreenMode('ORDER')}
            className="win-btn"
            style={{ fontSize: '11px', height: '22px', fontWeight: 'bold', background: '#c00000', color: '#fff' }}
          >
            ✕ Back to POS (Esc)
          </button>
        </div>
      </div>

      {/* 2. Search & Action Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#e0ded0', borderBottom: '1px solid #7f9db9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a' }}>Search Customer:</span>
          <input
            id="customer-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Phone Number (e.g. 9822...) or Customer Name..."
            className="win-input"
            style={{ width: '380px', height: '22px', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="win-btn" style={{ height: '22px', fontSize: '10px' }}>
              Clear
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusMessage.text && (
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: statusMessage.type === 'error' ? '#c00000' : '#006600',
              background: '#fff',
              padding: '2px 6px',
              border: '1px solid #aaa'
            }}>
              {statusMessage.text}
            </span>
          )}
          <button
            id="add-customer-btn"
            onClick={handleOpenAddModal}
            className="win-btn"
            style={{ height: '24px', fontSize: '11px', fontWeight: 'bold', background: '#0a246a', color: '#fff' }}
          >
            + Add New Customer
          </button>
        </div>
      </div>

      {/* 3. Main Split Area: Left List + Right Purchase History Details */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '4px' }}>
        {/* Left Column: Customer Records Table */}
        <div style={{ width: '48%', display: 'flex', flexDirection: 'column', border: '1px solid #7f9db9', background: '#fff', marginRight: '4px' }}>
          <div style={{ padding: '4px 8px', background: '#d4d0c8', borderBottom: '1px solid #7f9db9', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer Directory ({filteredCustomers.length} records)</span>
            <span style={{ color: '#0a246a' }}>Click row to view purchase history</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="order-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#ece9d8', borderBottom: '1px solid #7f9db9', position: 'sticky', top: 0 }}>
                  <th style={{ textAlign: 'left', padding: '4px 6px', width: '110px' }}>Phone (ID)</th>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>Customer Name</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', width: '70px' }}>Visits</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px', width: '85px' }}>Total Spend</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      No customers found. Enter customer details in New Order or click "+ Add New Customer" above.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => {
                    const isSelected = cust.phone === activeCustomer?.phone;
                    const visits = Number(cust.visit_count ?? cust.visitCount) || 1;
                    const spent = Number(cust.total_spent ?? cust.totalSpent) || 0;
                    const isRepeat = visits > 1;

                    return (
                      <tr
                        key={cust.phone}
                        onClick={() => setSelectedPhone(cust.phone)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? '#0a246a' : (isRepeat ? '#f0f9ff' : '#ffffff'),
                          color: isSelected ? '#ffffff' : '#000000',
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        <td style={{ padding: '4px 6px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {cust.phone}
                        </td>
                        <td style={{ padding: '4px 6px', fontWeight: isRepeat ? 'bold' : 'normal' }}>
                          {cust.name || 'Guest'}
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            background: isSelected ? '#ffffff' : (visits >= 5 ? '#e6f4ea' : (visits > 1 ? '#e8f0fe' : '#f1f3f4')),
                            color: isSelected ? '#0a246a' : (visits >= 5 ? '#137333' : (visits > 1 ? '#1a73e8' : '#5f6368')),
                          }}>
                            {visits >= 5 ? `★ ${visits}x (VIP)` : (visits > 1 ? `✓ ${visits}x` : '1x')}
                          </span>
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                          ₹{spent.toFixed(2)}
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(cust);
                            }}
                            className="win-btn"
                            style={{ fontSize: '10px', padding: '1px 4px', height: '18px' }}
                            title="Edit Customer"
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Customer Inspector & Purchase History Timeline */}
        <div style={{ width: '52%', display: 'flex', flexDirection: 'column', border: '1px solid #7f9db9', background: '#fff' }}>
          {activeCustomer ? (
            <>
              {/* Customer Profile Card */}
              <div style={{ padding: '10px 14px', background: '#ece9d8', borderBottom: '2px solid #808080' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 2px 0', fontSize: '16px', color: '#0a246a' }}>
                      {activeCustomer.name || 'Guest'}
                    </h2>
                    <div style={{ fontSize: '12px', color: '#444', fontWeight: 'bold' }}>
                      📞 Phone ID: <span style={{ fontFamily: 'monospace', color: '#000' }}>{activeCustomer.phone}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: (Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) >= 5 ? '#ffd700' : '#dcf5dc',
                      color: (Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) >= 5 ? '#774400' : '#006600',
                      border: '1px solid #999',
                    }}>
                      {(Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) >= 5 ? '👑 VIP REPEAT GUEST' : ((Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) > 1 ? '🔄 RETURNING CUSTOMER' : '⭐ NEW GUEST')}
                    </span>
                  </div>
                </div>

                {/* Metrics Summary Strip */}
                <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                  <div style={{ flex: 1, background: '#fff', border: '1px inset #808080', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>TOTAL VISITS</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0a246a' }}>
                      {Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: '#fff', border: '1px inset #808080', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>LIFETIME SPEND</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#006600' }}>
                      ₹{Number((activeCustomer.total_spent ?? activeCustomer.totalSpent) || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: '#fff', border: '1px inset #808080', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>AVERAGE ORDER</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      ₹{((Number((activeCustomer.total_spent ?? activeCustomer.totalSpent) || 0)) / Math.max(1, (Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1))).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase History Section Header */}
              <div style={{ padding: '4px 8px', background: '#d4d0c8', borderBottom: '1px solid #7f9db9', fontSize: '11px', fontWeight: 'bold', color: '#0a246a' }}>
                📋 Detailed Purchase History &amp; Consumed Items
              </div>

              {/* Detailed Purchase History Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px', background: '#f5f5f5' }}>
                {(!activeCustomer.history || activeCustomer.history.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: '#777' }}>
                    No recorded item history for this customer yet.<br />
                    Dishes will automatically appear here upon placing orders and settling bills.
                  </div>
                ) : (
                  activeCustomer.history.map((entry, vIdx) => {
                    return (
                      <div
                        key={vIdx}
                        className="win-bevel-thin-outset"
                        style={{
                          background: '#fff',
                          marginBottom: '10px',
                          border: '1px solid #aaa',
                          padding: '8px',
                          boxShadow: '1px 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        {/* Visit Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ccc', paddingBottom: '4px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#0a246a' }}>
                            Visit #{activeCustomer.history.length - vIdx} — Bill #{entry.billNo || '—'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#555' }}>
                            📅 {entry.date || ''} {entry.time ? `• ⏰ ${entry.time}` : ''} {entry.table ? `• Table ${entry.table}` : ''}
                          </span>
                          <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#006600' }}>
                            ₹{Number(entry.amount || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Items Consumed in this Order */}
                        {entry.items && entry.items.length > 0 ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                              <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
                                <th style={{ textAlign: 'left', padding: '2px 4px' }}>Item / Dish Name</th>
                                <th style={{ textAlign: 'right', padding: '2px 4px', width: '40px' }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '2px 4px', width: '60px' }}>Rate</th>
                                <th style={{ textAlign: 'right', padding: '2px 4px', width: '70px' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.items.map((it, itIdx) => (
                                <tr key={itIdx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                  <td style={{ padding: '3px 4px', color: '#222' }}>
                                    {it.code ? `[${it.code}] ` : ''}{it.name}
                                  </td>
                                  <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {it.qty || 1}
                                  </td>
                                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>
                                    ₹{Number(it.rate || 0).toFixed(2)}
                                  </td>
                                  <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 'bold', color: '#0a246a' }}>
                                    ₹{Number(it.amount || ((it.qty || 1) * (it.rate || 0))).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                            Total bill amount: ₹{Number(entry.amount || 0).toFixed(2)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              Select a customer from the directory to inspect their full visit frequency and order history.
            </div>
          )}
        </div>
      </div>

      {/* 4. Add / Edit Customer Modal */}
      {showModal && (
        <div className="win-modal-backdrop" style={{ zIndex: 1400 }}>
          <div className="win-window" style={{ width: '380px', background: '#ece9d8', boxShadow: '3px 3px 12px rgba(0,0,0,0.5)' }}>
            <div className="win-titlebar" style={{ background: '#0a246a' }}>
              <div className="win-titlebar-title">
                <span>{isEditing ? '✏️ Edit Customer Details' : '👤 Add New Customer (Unique Phone ID)'}</span>
              </div>
              <button className="win-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px', color: '#0a246a' }}>
                  Customer Phone Number (Unique ID):
                </label>
                <input
                  id="modal-customer-phone"
                  type="text"
                  required
                  disabled={isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. 9822334455"
                  className="win-input"
                  style={{ width: '100%', height: '24px', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}
                />
                <span style={{ fontSize: '10px', color: '#666' }}>
                  {isEditing ? 'Phone number is the unique primary key and cannot be altered.' : 'Every customer is uniquely identified by their mobile number.'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '3px', color: '#0a246a' }}>
                  Customer Full Name:
                </label>
                <input
                  id="modal-customer-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="win-input"
                  style={{ width: '100%', height: '24px', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel (Esc)
                </button>
                <button
                  id="btn-save-customer"
                  type="submit"
                  className="win-btn"
                  style={{ background: '#0a246a', color: '#fff', fontWeight: 'bold' }}
                >
                  Save Customer (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
