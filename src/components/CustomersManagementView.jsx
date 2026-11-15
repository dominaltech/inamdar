import React, { useState, useMemo, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import {
  IconUsers,
  IconUser,
  IconUserPlus,
  IconTrash,
  IconEdit,
  IconSearch,
  IconRefresh,
  IconClose,
  IconCloud,
  IconReceipt,
  IconPhone,
  IconWarning,
  IconStar,
  IconCalendar,
} from './common/Icons';

export default function CustomersManagementView() {
  const {
    customers = [],
    setScreenMode,
    saveCustomer,
    deleteCustomer,
    refreshCustomers,
  } = usePos();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // Modal State for Add / Edit Customer
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ phone: '', name: '' });
  const [isEditing, setIsEditing] = useState(false);

  // 2-Step Confirmation States for Deleting Customer
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);

  const showToast = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'info' }), 3500);
  };

  // Keyboard navigation & Esc hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteStep2) {
          setShowDeleteStep2(false);
          return;
        }
        if (showDeleteStep1) {
          setShowDeleteStep1(false);
          setCustomerToDelete(null);
          return;
        }
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
  }, [showModal, showDeleteStep1, showDeleteStep2, setScreenMode, refreshCustomers]);

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

  // Trigger Delete Step 1
  const initiateDelete = (cust) => {
    setCustomerToDelete(cust);
    setShowDeleteStep1(true);
  };

  // Proceed to Step 2
  const handleProceedToDeleteStep2 = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(true);
  };

  // Final Confirmation of Customer Deletion
  const handleConfirmFinalDelete = async () => {
    if (!customerToDelete) return;
    const phone = customerToDelete.phone;
    const name = customerToDelete.name || 'Customer';

    const success = await deleteCustomer?.(phone);
    setShowDeleteStep2(false);
    setCustomerToDelete(null);

    if (success) {
      showToast(`Customer ${name} (${phone}) deleted successfully!`, 'success');
      if (selectedPhone === phone) {
        setSelectedPhone('');
      }
    } else {
      showToast('Error deleting customer.', 'error');
    }
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
          <IconUsers size={16} color="#fff" />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
            Dominal's POS — Customer Management &amp; Repeat Tracker (Live Database Sync)
          </span>
          <span style={{ fontSize: '10px', background: '#006600', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconCloud size={12} color="#fff" /> Connected to Live Database
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              refreshCustomers?.();
              showToast('Refreshed customers list from database!', 'info');
            }}
            className="win-btn"
            style={{ fontSize: '11px', height: '22px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <IconRefresh size={12} /> Refresh Cloud (F5)
          </button>
          <button
            onClick={() => setScreenMode('ORDER')}
            className="win-btn"
            style={{ fontSize: '11px', height: '22px', fontWeight: 'bold', background: '#c00000', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <IconClose size={12} color="#fff" /> Back to POS (Esc)
          </button>
        </div>
      </div>

      {/* 2. Search & Action Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#e0ded0', borderBottom: '1px solid #7f9db9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0a246a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconSearch size={14} color="#0a246a" /> Search Customer:
          </span>
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
            style={{ height: '24px', fontSize: '11px', fontWeight: 'bold', background: '#0a246a', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <IconUserPlus size={14} color="#fff" /> + Add New Customer
          </button>
        </div>
      </div>

      {/* 3. Main Split Area: Left List + Right Purchase History Details */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '4px' }}>
        {/* Left Column: Customer Records Table */}
        <div style={{ width: '48%', display: 'flex', flexDirection: 'column', border: '1px solid #7f9db9', background: '#fff', marginRight: '4px' }}>
          <div style={{ padding: '4px 8px', background: '#d4d0c8', borderBottom: '1px solid #7f9db9', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer Directory ({filteredCustomers.length} records)</span>
            <span style={{ color: '#0a246a' }}>Click row to view profile &amp; history</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="order-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#ece9d8', borderBottom: '1px solid #7f9db9', position: 'sticky', top: 0 }}>
                  <th style={{ textAlign: 'left', padding: '4px 6px', width: '110px' }}>Phone (ID)</th>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>Customer Name</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', width: '70px' }}>Visits</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px', width: '85px' }}>Total Spend</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', width: '65px' }}>Action</th>
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
                            {visits >= 5 ? `${visits}x (VIP)` : (visits > 1 ? `${visits}x` : '1x')}
                          </span>
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                          ₹{spent.toFixed(2)}
                        </td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(cust);
                              }}
                              className="win-btn"
                              style={{ fontSize: '10px', padding: '1px 4px', height: '18px' }}
                              title="Edit Customer"
                            >
                              <IconEdit size={11} color="#0a246a" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                initiateDelete(cust);
                              }}
                              className="win-btn"
                              style={{ fontSize: '10px', padding: '1px 4px', height: '18px', background: '#fff0f0' }}
                              title="Delete Customer"
                            >
                              <IconTrash size={11} color="#c00000" />
                            </button>
                          </div>
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
                    <div style={{ fontSize: '12px', color: '#444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconPhone size={13} color="#444" />
                      Phone ID: <span style={{ fontFamily: 'monospace', color: '#000' }}>{activeCustomer.phone}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: (Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) >= 5 ? '#ffd700' : '#dcf5dc',
                      color: (Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) >= 5 ? '#774400' : '#006600',
                      border: '1px solid #999',
                    }}>
                      {(Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) >= 5 ? (
                        <><IconStar size={12} color="#774400" fill="#774400" /> VIP REPEAT GUEST</>
                      ) : ((Number(activeCustomer.visit_count ?? activeCustomer.visitCount) || 1) > 1 ? (
                        <><IconRefresh size={12} color="#006600" /> RETURNING CUSTOMER</>
                      ) : (
                        <><IconUser size={12} color="#006600" /> NEW GUEST</>
                      ))}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      <button
                        onClick={() => handleOpenEditModal(activeCustomer)}
                        className="win-btn"
                        style={{ fontSize: '10px', padding: '2px 6px', height: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <IconEdit size={11} /> Edit
                      </button>
                      <button
                        id="delete-customer-btn-inspector"
                        data-testid="delete-customer-btn-inspector"
                        onClick={() => initiateDelete(activeCustomer)}
                        className="win-btn"
                        style={{ fontSize: '10px', padding: '2px 6px', height: '20px', background: '#fff0f0', color: '#c00000', border: '1px solid #c00000', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <IconTrash size={11} color="#c00000" /> Delete
                      </button>
                    </div>
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
              <div style={{ padding: '4px 8px', background: '#d4d0c8', borderBottom: '1px solid #7f9db9', fontSize: '11px', fontWeight: 'bold', color: '#0a246a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconReceipt size={13} color="#0a246a" /> Detailed Purchase History &amp; Consumed Items
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
                          <span style={{ fontSize: '11px', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconCalendar size={12} color="#555" /> {entry.date || ''} {entry.time ? `• ${entry.time}` : ''} {entry.table ? `• Table ${entry.table}` : ''}
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
                          <div style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
                            Item details recorded as consolidated billing amount.
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              Select a customer from the directory to view details
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add / Edit Customer */}
      {showModal && (
        <div className="win-modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="win-window" style={{ width: '380px', background: '#ece9d8', boxShadow: '3px 3px 12px rgba(0,0,0,0.5)' }}>
            <div className="win-titlebar">
              <div className="win-titlebar-title">
                <span>{isEditing ? 'Edit Customer Details' : 'Register New Customer'}</span>
              </div>
              <button className="win-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSubmit} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                  Mobile Phone Number (Unique Customer ID):
                </label>
                <input
                  id="modal-customer-phone"
                  data-testid="modal-customer-phone"
                  type="text"
                  disabled={isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="e.g. 9876543210"
                  className="win-input"
                  style={{ width: '100%', height: '24px', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                  Customer Full Name:
                </label>
                <input
                  id="modal-customer-name"
                  data-testid="modal-customer-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vikram Malhotra"
                  className="win-input"
                  style={{ width: '100%', height: '24px', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" className="win-btn" onClick={() => setShowModal(false)}>
                  Cancel (Esc)
                </button>
                <button
                  id="btn-save-customer"
                  data-testid="btn-save-customer"
                  type="submit"
                  className="win-btn"
                  style={{ background: '#0a246a', color: '#fff', fontWeight: 'bold' }}
                >
                  Save to Database (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Step 1: Warning Dialog */}
      {showDeleteStep1 && customerToDelete && (
        <div className="win-modal-backdrop" style={{ zIndex: 1300 }}>
          <div className="win-window" style={{ width: '420px', background: '#ece9d8', boxShadow: '4px 4px 16px rgba(0,0,0,0.6)' }}>
            <div className="win-titlebar" style={{ background: '#c00000' }}>
              <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconWarning size={14} color="#fff" />
                <span>Step 1 of 2: Confirm Customer Deletion</span>
              </div>
              <button className="win-close-btn" onClick={() => { setShowDeleteStep1(false); setCustomerToDelete(null); }}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <IconWarning size={32} color="#c00000" />
                <div style={{ fontSize: '12px', color: '#222', lineHeight: '18px' }}>
                  Are you sure you want to delete customer <strong>{customerToDelete.name || 'Guest'}</strong> (Phone: <code>{customerToDelete.phone}</code>)?
                  <br />
                  This customer currently has <strong>{customerToDelete.visit_count || customerToDelete.visitCount || 1} visit(s)</strong> and <strong>₹{Number((customerToDelete.total_spent ?? customerToDelete.totalSpent) || 0).toFixed(2)}</strong> in total spend.
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#c00000', fontWeight: 'bold', background: '#fff0f0', padding: '6px 10px', border: '1px solid #ffcccc' }}>
                Warning: Associated visit logs and item history will be deleted.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="win-btn"
                  onClick={() => { setShowDeleteStep1(false); setCustomerToDelete(null); }}
                >
                  Cancel (Esc)
                </button>
                <button
                  id="confirm-delete-step1-btn"
                  data-testid="btn-delete-step1-proceed"
                  type="button"
                  className="win-btn"
                  onClick={handleProceedToDeleteStep2}
                  style={{ background: '#c00000', color: '#fff', fontWeight: 'bold' }}
                >
                  Proceed to Confirm Delete &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Step 2: Final Confirmation Modal */}
      {showDeleteStep2 && customerToDelete && (
        <div className="win-modal-backdrop" style={{ zIndex: 1400 }}>
          <div className="win-window" style={{ width: '400px', background: '#ece9d8', boxShadow: '5px 5px 20px rgba(0,0,0,0.7)' }}>
            <div className="win-titlebar" style={{ background: '#800000' }}>
              <div className="win-titlebar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconWarning size={14} color="#fff" />
                <span>Step 2 of 2: Final Warning — Permanent Deletion</span>
              </div>
              <button className="win-close-btn" onClick={() => { setShowDeleteStep2(false); setCustomerToDelete(null); }}>✕</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#c00000', textAlign: 'center' }}>
                THIS ACTION CANNOT BE UNDONE!
              </div>
              <div style={{ fontSize: '11px', color: '#333', textAlign: 'center' }}>
                Please confirm that you want to permanently remove <strong>{customerToDelete.name}</strong> ({customerToDelete.phone}) from both the software and database.
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="win-btn"
                  style={{ minWidth: '90px' }}
                  onClick={() => { setShowDeleteStep2(false); setCustomerToDelete(null); }}
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-step2-btn"
                  data-testid="btn-delete-step2-confirm"
                  type="button"
                  className="win-btn"
                  onClick={handleConfirmFinalDelete}
                  style={{ background: '#800000', color: '#fff', fontWeight: 'bold', minWidth: '160px' }}
                >
                  Permanently Delete Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
