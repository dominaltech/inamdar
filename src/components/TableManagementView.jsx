import React, { useState, useMemo, useEffect } from 'react';
import { usePos } from '../context/PosContext';

const SECTIONS = [
  { id: 'ALL', name: '🌐 ALL SECTIONS' },
  { id: 'AC', name: '❄️ AC (Normal Dine-In)' },
  { id: 'FAMILY AC', name: '👨‍👩‍👧‍👦 FAMILY AC' },
];

// Helper: Filter out temporary delivery, parcel orders, and dynamic sub-tables
const isPhysicalDineInTable = (t) => {
  if (!t || !t.id) return false;
  const idStr = String(t.id).trim();
  if (idStr.startsWith('0')) return false;
  if (t.section === 'PARCEL' || t.section === 'HOME DELIVERY') return false;
  if (/^[0-9]+[A-Z]$/i.test(idStr)) return false;
  return true;
};

export default function TableManagementView() {
  const {
    tables,
    setScreenMode,
    addOrUpdateTable,
    deleteTable,
    reassignTableRange,
    moveTableNumber,
  } = usePos();

  const [selectedSection, setSelectedSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // Modal States
  const [showTableModal, setShowTableModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tableFormData, setTableFormData] = useState({
    id: '',
    section: 'AC',
    pax: 2,
    waiter: '1 COUNTER',
  });
  const [editingOldId, setEditingOldId] = useState('');

  // Batch Range Reassign Modal State
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeFormData, setRangeFormData] = useState({
    startNum: '',
    endNum: '',
    targetSection: 'AC',
  });

  // Move Single Table Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveFormData, setMoveFormData] = useState({
    fromTable: '',
    toTable: '',
    targetSection: 'FAMILY AC',
  });

  const showToast = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage({ text: '', type: 'info' });
    }, 3500);
  };

  // Esc hotkey to close modals or exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showTableModal) {
          setShowTableModal(false);
          return;
        }
        if (showRangeModal) {
          setShowRangeModal(false);
          return;
        }
        if (showMoveModal) {
          setShowMoveModal(false);
          return;
        }
        setScreenMode('ORDER');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTableModal, showRangeModal, showMoveModal, setScreenMode]);

  // Physical Dine-In Table list array sorted naturally
  const sortedTableList = useMemo(() => {
    const list = Object.values(tables || {}).filter(isPhysicalDineInTable);
    return list.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [tables]);

  // Filtered tables (Matches AC / GENERAL seamlessly)
  const filteredTables = useMemo(() => {
    let list = sortedTableList;
    if (selectedSection === 'AC') {
      list = list.filter(t => t.section === 'AC' || t.section === 'GENERAL');
    } else if (selectedSection !== 'ALL') {
      list = list.filter(t => t.section === selectedSection);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(t => String(t.id).toUpperCase().includes(q) || String(t.section || '').toUpperCase().includes(q));
    }
    return list;
  }, [sortedTableList, selectedSection, searchQuery]);

  // Section Counts (Properly counts AC + GENERAL into AC Normal Dine-In)
  const sectionCounts = useMemo(() => {
    const counts = { ALL: sortedTableList.length, AC: 0, 'FAMILY AC': 0 };
    sortedTableList.forEach(t => {
      if (t.section === 'AC' || t.section === 'GENERAL') {
        counts.AC++;
      } else if (counts[t.section] !== undefined) {
        counts[t.section]++;
      }
    });
    return counts;
  }, [sortedTableList]);

  // Open Add Table Modal
  const handleOpenAdd = () => {
    // Suggest next available number
    const numericIds = sortedTableList.map(t => parseInt(t.id, 10)).filter(n => !isNaN(n));
    const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const defaultSec = selectedSection !== 'ALL' ? selectedSection : (nextNum > 20 ? 'FAMILY AC' : 'AC');

    setTableFormData({
      id: String(nextNum),
      section: defaultSec,
      pax: defaultSec.includes('FAMILY') ? 4 : 2,
      waiter: '1 COUNTER',
    });
    setIsEditing(false);
    setShowTableModal(true);
  };

  // Open Edit Table Modal
  const handleOpenEdit = (tbl) => {
    setTableFormData({
      id: String(tbl.id),
      section: tbl.section || 'AC',
      pax: tbl.pax || 2,
      waiter: tbl.waiter || '1 COUNTER',
    });
    setEditingOldId(String(tbl.id));
    setIsEditing(true);
    setShowTableModal(true);
  };

  // Submit Table Form
  const handleSubmitTable = async (e) => {
    e.preventDefault();
    const cleanId = String(tableFormData.id).trim().toUpperCase();
    if (!cleanId) return;

    setShowTableModal(false);

    if (isEditing && cleanId !== editingOldId) {
      // Renaming table
      showToast(`Moving Table ${editingOldId} to ${cleanId} in Database...`, 'info');
      await moveTableNumber(editingOldId, cleanId, tableFormData.section);
      showToast(`Table ${editingOldId} moved to ${cleanId}!`, 'success');
    } else {
      showToast(`Saving Table ${cleanId} to Database...`, 'info');
      await addOrUpdateTable({
        id: cleanId,
        section: tableFormData.section,
        pax: tableFormData.pax,
        waiter: tableFormData.waiter,
      });
      showToast(`Table ${cleanId} saved in Database!`, 'success');
    }
  };

  // Handle Delete Table
  const handleDelete = async (tbl) => {
    const hasItems = tbl.items && tbl.items.some(i => i.qty > 0);
    if (hasItems || tbl.status === 'OCCUPIED') {
      alert(`Cannot delete Table ${tbl.id}: Table is occupied with active orders!`);
      return;
    }
    if (!window.confirm(`Delete Table ${tbl.id} from Database?`)) return;

    showToast(`Deleting Table ${tbl.id} from Database...`, 'info');
    await deleteTable(tbl.id);
    showToast(`Table ${tbl.id} removed from Database!`, 'success');
  };

  // Handle Batch Reassign Range
  const handleBatchReassign = async (e) => {
    e.preventDefault();
    const s = parseInt(rangeFormData.startNum, 10);
    const end = parseInt(rangeFormData.endNum, 10);
    if (isNaN(s) || isNaN(end)) return;

    setShowRangeModal(false);
    showToast(`Reassigning Tables ${s} to ${end} to ${rangeFormData.targetSection}...`, 'info');
    await reassignTableRange(s, end, rangeFormData.targetSection);
    showToast(`Tables ${s} to ${end} successfully reassigned to ${rangeFormData.targetSection}!`, 'success');
  };

  // Handle Move Single Table
  const handleMoveSingle = async (e) => {
    e.preventDefault();
    const from = String(moveFormData.fromTable).trim().toUpperCase();
    const to = String(moveFormData.toTable).trim().toUpperCase();
    if (!from || !to) return;

    setShowMoveModal(false);
    showToast(`Moving Table ${from} to ${to}...`, 'info');
    const success = await moveTableNumber(from, to, moveFormData.targetSection);
    if (success) {
      showToast(`Table ${from} moved to ${to} (${moveFormData.targetSection})!`, 'success');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ece9d8',
      color: '#000000',
      fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
      fontSize: '12px',
      overflow: 'hidden'
    }}>
      {/* Top Retro Studio Bar */}
      <div style={{
        backgroundColor: '#0a246a',
        color: '#ffffff',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #808080',
        fontWeight: 'bold',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🍽️</span>
          <span>Dominal's POS — Restaurant Tables Studio (Live Database Management)</span>
          <span style={{
            fontSize: '11px',
            backgroundColor: '#008000',
            color: '#fff',
            padding: '1px 6px',
            borderRadius: '3px',
            marginLeft: '8px'
          }}>
            ☁️ Connected to Live Database
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setScreenMode('ORDER')}
            style={{
              padding: '3px 14px',
              backgroundColor: '#c00000',
              color: '#ffffff',
              border: '2px outset #ffffff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            ✕ Back to POS (Esc)
          </button>
        </div>
      </div>

      {/* Action / Notification Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: '#d4d0c8',
        borderBottom: '1px solid #808080',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, maxWidth: '350px' }}>
          <label htmlFor="table-search-input" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Table Search:</label>
          <input
            id="table-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Table # or Section..."
            style={{
              flex: 1,
              padding: '3px 6px',
              border: '2px inset #808080',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Toast Alert */}
        {statusMessage.text && (
          <div style={{
            padding: '3px 12px',
            backgroundColor: statusMessage.type === 'success' ? '#2e7d32' : '#0277bd',
            color: '#ffffff',
            fontWeight: 'bold',
            borderRadius: '3px',
            fontSize: '11px'
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* Fast Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setMoveFormData({ fromTable: '', toTable: '', targetSection: 'FAMILY AC' });
              setShowMoveModal(true);
            }}
            style={{
              padding: '4px 12px',
              backgroundColor: '#ece9d8',
              border: '2px outset #fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⇄</span> Move Table #
          </button>

          <button
            onClick={() => {
              setRangeFormData({ startNum: '1', endNum: '20', targetSection: 'AC' });
              setShowRangeModal(true);
            }}
            style={{
              padding: '4px 12px',
              backgroundColor: '#ece9d8',
              border: '2px outset #fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>⇄</span> Reassign Range
          </button>

          <button
            onClick={handleOpenAdd}
            style={{
              padding: '4px 14px',
              backgroundColor: '#0a246a',
              color: '#ffffff',
              border: '2px outset #fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>+</span> Add New Table
          </button>
        </div>
      </div>

      {/* Main Split Layout: Sections Rail (Left) vs Tables Grid (Right) */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* Left Rail: Sections */}
        <div style={{
          width: '240px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          borderRight: '2px solid #808080',
          backgroundColor: '#f5f4ef'
        }}>
          <div style={{
            backgroundColor: '#d4d0c8',
            padding: '6px 10px',
            borderBottom: '2px groove #fff',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            🏢 Restaurant Sections
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {SECTIONS.map(sec => {
              const isSelected = selectedSection === sec.id;
              const count = sectionCounts[sec.id] || 0;

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSection(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: isSelected ? '#0a246a' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#000000',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <span>{sec.name}</span>
                  <span style={{
                    fontSize: '11px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#ece9d8',
                    padding: '1px 6px',
                    borderRadius: '2px',
                    fontWeight: 'bold'
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '8px', backgroundColor: '#e8e4d9', borderTop: '1px solid #999', fontSize: '10.5px', color: '#555', lineHeight: '1.4' }}>
            💡 <b>Section Order:</b><br />
            1-20: AC Normal<br />
            21-42: FAMILY AC
          </div>
        </div>

        {/* Right Area: Tables Cards Grid */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflow: 'hidden' }}>
          {/* Header Stats */}
          <div style={{
            backgroundColor: '#d4d0c8',
            padding: '6px 12px',
            borderBottom: '2px groove #fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
              Tables in {selectedSection === 'ALL' ? 'All Sections' : `[${selectedSection}]`}
              <span style={{ fontWeight: 'normal', color: '#555', marginLeft: '8px' }}>
                ({filteredTables.length} tables found)
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#333' }}>
              💡 Click ✎ to rename or change section, ⇄ to batch reassign ranges
            </div>
          </div>

          {/* Cards Container */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px', paddingBottom: '80px' }}>
            {filteredTables.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                No tables found matching the criteria. Click "+ Add New Table" above.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '10px'
              }}>
                {filteredTables.map(tbl => {
                  const hasItems = tbl.items && tbl.items.some(i => i.qty > 0);
                  const isOccupied = hasItems || tbl.status === 'OCCUPIED';
                  const totalAmt = (tbl.items || []).reduce((s, it) => s + (it.amount || 0), 0);

                  return (
                    <div
                      key={`card-${tbl.id}`}
                      style={{
                        backgroundColor: isOccupied ? '#fff5f5' : '#fdfdfd',
                        border: '2px solid',
                        borderColor: isOccupied ? '#cc0000 #660000 #660000 #cc0000' : '#808080 #dfdfdf #dfdfdf #808080',
                        borderRadius: '3px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '90px'
                      }}
                    >
                      {/* Card Top: Number & Section Tag */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: isOccupied ? '#cc0000' : '#0a246a'
                          }}>
                            #{tbl.id}
                          </span>
                          <span style={{
                            marginLeft: '6px',
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            backgroundColor: tbl.section === 'FAMILY AC' ? '#f3e5f5' : '#e3f2fd',
                            color: tbl.section === 'FAMILY AC' ? '#7b1fa2' : '#0d47a1',
                            border: '1px solid #b0bec5'
                          }}>
                            {(tbl.section === 'AC' || tbl.section === 'GENERAL') ? 'AC' : tbl.section}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '9px',
                          fontWeight: 'bold',
                          padding: '1px 5px',
                          borderRadius: '2px',
                          backgroundColor: isOccupied ? '#cc0000' : '#2e7d32',
                          color: '#ffffff'
                        }}>
                          {isOccupied ? 'OCCUPIED' : 'VACANT'}
                        </span>
                      </div>

                      {/* Card Middle: Capacity & Waiter */}
                      <div style={{ fontSize: '11px', color: '#555', marginTop: '6px', lineHeight: '1.4' }}>
                        <div>Max Pax: <b>{tbl.pax || 2} seats</b></div>
                        <div>Staff: {tbl.waiter || '1 COUNTER'}</div>
                        {isOccupied && (
                          <div style={{ color: '#cc0000', fontWeight: 'bold' }}>
                            {tbl.items?.length || 0} items (₹{totalAmt.toFixed(0)})
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: Edit & Delete Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '8px', borderTop: '1px dotted #ccc', paddingTop: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(tbl)}
                          title="Edit Table"
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#ece9d8',
                            border: '1px outset #fff',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tbl)}
                          disabled={isOccupied}
                          title={isOccupied ? 'Cannot delete occupied table' : 'Delete Table'}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#ece9d8',
                            border: '1px outset #fff',
                            cursor: isOccupied ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            color: '#c00000',
                            fontWeight: 'bold',
                            opacity: isOccupied ? 0.4 : 1
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Add / Edit Table */}
      {showTableModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '380px',
            backgroundColor: '#ece9d8',
            border: '3px solid #0055ea',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#0055ea',
              color: '#ffffff',
              padding: '4px 8px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <span>{isEditing ? `Edit Table #${editingOldId}` : 'Add New Table to Database'}</span>
              <button
                onClick={() => setShowTableModal(false)}
                style={{ width: '18px', height: '18px', backgroundColor: '#ece9d8', border: '1px outset #fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTable} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Table Number / ID *:</label>
                <input
                  type="text"
                  required
                  value={tableFormData.id}
                  onChange={(e) => setTableFormData({ ...tableFormData, id: e.target.value })}
                  placeholder="e.g. 41 or 0A"
                  style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Section *:</label>
                <select
                  value={tableFormData.section}
                  onChange={(e) => {
                    const sec = e.target.value;
                    setTableFormData({
                      ...tableFormData,
                      section: sec,
                      pax: sec.includes('FAMILY') ? 4 : 2
                    });
                  }}
                  style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                >
                  <option value="AC">❄️ AC (Normal Dine-In)</option>
                  <option value="FAMILY AC">👨‍👩‍👧‍👦 FAMILY AC</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Max Pax (Capacity):</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={tableFormData.pax}
                    onChange={(e) => setTableFormData({ ...tableFormData, pax: parseInt(e.target.value, 10) || 2 })}
                    style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Default Staff:</label>
                  <select
                    value={tableFormData.waiter}
                    onChange={(e) => setTableFormData({ ...tableFormData, waiter: e.target.value })}
                    style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff' }}
                  >
                    <option value="1 COUNTER">1 COUNTER</option>
                    <option value="2 SUSHANT">2 SUSHANT</option>
                    <option value="3 AMIT">3 AMIT</option>
                    <option value="4 RAHUL">4 RAHUL</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  style={{ padding: '6px 14px', backgroundColor: '#ece9d8', border: '2px outset #fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 20px', backgroundColor: '#0a246a', color: '#fff', border: '2px outset #fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Table (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Reassign Table Range */}
      {showRangeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '400px',
            backgroundColor: '#ece9d8',
            border: '3px solid #0055ea',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#0055ea',
              color: '#ffffff',
              padding: '4px 8px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <span>Batch Reassign Table Range to Section</span>
              <button
                onClick={() => setShowRangeModal(false)}
                style={{ width: '18px', height: '18px', backgroundColor: '#ece9d8', border: '1px outset #fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchReassign} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', color: '#333', background: '#e4e0d4', padding: '6px', border: '1px solid #b0a89a' }}>
                Batch reassign consecutive table numbers to a specific section. E.g. Tables 1 to 20 to AC, or Tables 21 to 42 to FAMILY AC.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>From Table #:</label>
                  <input
                    type="number"
                    required
                    value={rangeFormData.startNum}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, startNum: e.target.value })}
                    placeholder="e.g. 1"
                    style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>To Table #:</label>
                  <input
                    type="number"
                    required
                    value={rangeFormData.endNum}
                    onChange={(e) => setRangeFormData({ ...rangeFormData, endNum: e.target.value })}
                    placeholder="e.g. 20"
                    style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Assign to Section *:</label>
                <select
                  value={rangeFormData.targetSection}
                  onChange={(e) => setRangeFormData({ ...rangeFormData, targetSection: e.target.value })}
                  style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                >
                  <option value="AC">❄️ AC (Normal Dine-In)</option>
                  <option value="FAMILY AC">👨‍👩‍👧‍👦 FAMILY AC</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRangeModal(false)}
                  style={{ padding: '6px 14px', backgroundColor: '#ece9d8', border: '2px outset #fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 20px', backgroundColor: '#0a246a', color: '#fff', border: '2px outset #fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Apply Range Reassignment (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Move Single Table Number (From -> To) */}
      {showMoveModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '380px',
            backgroundColor: '#ece9d8',
            border: '3px solid #0055ea',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#0055ea',
              color: '#ffffff',
              padding: '4px 8px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <span>Move Table Number (From → To)</span>
              <button
                onClick={() => setShowMoveModal(false)}
                style={{ width: '18px', height: '18px', backgroundColor: '#ece9d8', border: '1px outset #fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMoveSingle} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>From Table #:</label>
                  <input
                    type="text"
                    required
                    value={moveFormData.fromTable}
                    onChange={(e) => setMoveFormData({ ...moveFormData, fromTable: e.target.value })}
                    placeholder="e.g. 20"
                    style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>To Table #:</label>
                  <input
                    type="text"
                    required
                    value={moveFormData.toTable}
                    onChange={(e) => setMoveFormData({ ...moveFormData, toTable: e.target.value })}
                    placeholder="e.g. 21"
                    style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Target Section:</label>
                <select
                  value={moveFormData.targetSection}
                  onChange={(e) => setMoveFormData({ ...moveFormData, targetSection: e.target.value })}
                  style={{ width: '100%', padding: '4px 6px', border: '2px inset #808080', backgroundColor: '#ffffff', fontWeight: 'bold' }}
                >
                  <option value="AC">❄️ AC (Normal Dine-In)</option>
                  <option value="FAMILY AC">👨‍👩‍👧‍👦 FAMILY AC</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  style={{ padding: '6px 14px', backgroundColor: '#ece9d8', border: '2px outset #fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 20px', backgroundColor: '#0a246a', color: '#fff', border: '2px outset #fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Move Table (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

