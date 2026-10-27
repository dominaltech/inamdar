import React from 'react';
import { usePos } from '../../context/PosContext';

export default function TableMasterModal({ isOpen, onClose }) {
  const { tables, switchTable, setScreenMode } = usePos();

  const handleTableClick = (tableId) => {
    switchTable(tableId);
    setScreenMode('ORDER');
    onClose();
  };

  const tableList = Object.values(tables || {});
  const acTables = tableList.filter(t => t.section === 'AC');
  const familyTables = tableList.filter(t => t.section === 'FAMILY AC');
  const parcelTables = tableList.filter(t => t.section === 'PARCEL');
  const deliveryTables = tableList.filter(t => t.section === 'HOME DELIVERY');

  const occupiedCount = tableList.filter(t => t.items && t.items.some(i => i.qty > 0)).length;

  if (!isOpen) return null;

  const renderTableCard = (tbl) => {
    const hasItems = tbl.items && tbl.items.some(i => i.qty > 0);
    const totalAmt = (tbl.items || []).reduce((s, it) => s + (it.amount || 0), 0);
    const isOccupied = hasItems || tbl.status === 'OCCUPIED';

    return (
      <div
        key={`${tbl.section || 'SEC'}-${tbl.id}`}
        onClick={() => handleTableClick(tbl.id)}
        style={{
          border: '2px solid',
          borderColor: isOccupied ? '#cc0000 #660000 #660000 #cc0000' : '#808080 #dfdfdf #dfdfdf #808080',
          background: isOccupied ? '#ffeaea' : '#f0f0f0',
          padding: '6px',
          cursor: 'pointer',
          borderRadius: '3px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '65px',
        }}
        title={`Click to open Table ${tbl.id}`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: isOccupied ? '#cc0000' : '#002266' }}>
            {tbl.id}
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 'bold',
            padding: '1px 4px',
            background: isOccupied ? '#cc0000' : '#008000',
            color: '#ffffff',
            borderRadius: '2px',
          }}>
            {isOccupied ? 'OCCUPIED' : 'VACANT'}
          </span>
        </div>

        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
          Waiter: {tbl.waiter || '1 COUNTER'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ color: '#666' }}>{tbl.items ? tbl.items.length : 0} Items</span>
          <span style={{ color: isOccupied ? '#cc0000' : '#888' }}>
            {isOccupied ? `₹${totalAmt.toFixed(0)}` : '-'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '950px', maxWidth: '96vw', height: '82vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>🍽️ Restaurant Tables Master &amp; Layout Inspector — Inamdar POS</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Header Stats */}
        <div style={{ padding: '6px 14px', background: '#d4d0c8', borderBottom: '1px solid #808080', display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          <span>Total Tables: {tableList.length}</span>
          <span style={{ color: '#cc0000' }}>Active Occupied: {occupiedCount}</span>
          <span style={{ color: '#008000' }}>Vacant: {tableList.length - occupiedCount}</span>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* AC Section */}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', color: '#002266', borderBottom: '1px solid #b0c4de', paddingBottom: '2px' }}>
              AC Section (Tables 1 to 20) — {acTables.length} Tables
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {acTables.map(renderTableCard)}
            </div>
          </div>

          {/* FAMILY AC Section */}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', color: '#002266', borderBottom: '1px solid #b0c4de', paddingBottom: '2px' }}>
              FAMILY AC Section (Tables 21 to 40) — {familyTables.length} Tables
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {familyTables.map(renderTableCard)}
            </div>
          </div>

          {/* Parcels and Delivery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', color: '#002266', borderBottom: '1px solid #b0c4de', paddingBottom: '2px' }}>
                PARCEL Section ({parcelTables.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                {parcelTables.map(renderTableCard)}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', color: '#002266', borderBottom: '1px solid #b0c4de', paddingBottom: '2px' }}>
                HOME DELIVERY Section ({deliveryTables.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                {deliveryTables.map(renderTableCard)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#333' }}>
            Tip: Click any table card to jump straight to its order billing workspace.
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
