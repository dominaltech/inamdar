import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';

export default function RoomPostModal({ isOpen, onClose }) {
  const { setInfoDialog } = usePos();
  const [roomPostings, setRoomPostings] = useState([
    { roomNo: '101', guestName: 'Mr. Arvind Shinde', billNo: '14', amount: 980, time: 'Today, 01:20 PM', status: 'POSTED' },
    { roomNo: '204', guestName: 'Dr. Suresh Patil', billNo: '18', amount: 1450, time: 'Today, 01:50 PM', status: 'POSTED' },
    { roomNo: '305', guestName: 'Mrs. Neha Kulkarni', billNo: '21', amount: 620, time: 'Today, 02:15 PM', status: 'POSTED' },
  ]);

  const [newPost, setNewPost] = useState({ roomNo: '', guestName: '', billNo: '', amount: '' });

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPost.roomNo || !newPost.amount) return;

    const entry = {
      roomNo: newPost.roomNo.trim(),
      guestName: newPost.guestName.trim() || 'Hotel Guest',
      billNo: newPost.billNo.trim() || 'MANUAL',
      amount: Number(newPost.amount),
      time: 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'POSTED',
    };

    setRoomPostings([entry, ...roomPostings]);
    setNewPost({ roomNo: '', guestName: '', billNo: '', amount: '' });
    setInfoDialog({
      title: "Room Post Successful",
      message: `Bill posted to Room ${entry.roomNo} (${entry.guestName}) for ₹${entry.amount.toFixed(2)}.`,
    });
  };

  const totalPosted = roomPostings.reduce((s, r) => s + r.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="win-modal-backdrop" style={{ zIndex: 1500 }}>
      <div className="win-window" style={{ width: '750px', maxWidth: '96vw', height: '70vh', display: 'flex', flexDirection: 'column', background: '#ece9d8' }}>
        <div className="win-titlebar">
          <div className="win-titlebar-title">
            <span>🏨 Hotel Room Post Ledger &amp; Charge Transfer — Inamdar POS</span>
          </div>
          <button className="win-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Post Form */}
        <form onSubmit={handlePostSubmit} style={{ padding: '8px 12px', background: '#d4d0c8', borderBottom: '1px solid #808080', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            required
            placeholder="Room No (e.g. 201)"
            value={newPost.roomNo}
            onChange={(e) => setNewPost({ ...newPost, roomNo: e.target.value })}
            className="win-input"
            style={{ width: '120px', height: '22px', fontSize: '11px' }}
          />
          <input
            type="text"
            placeholder="Guest Name"
            value={newPost.guestName}
            onChange={(e) => setNewPost({ ...newPost, guestName: e.target.value })}
            className="win-input"
            style={{ width: '150px', height: '22px', fontSize: '11px' }}
          />
          <input
            type="text"
            placeholder="Bill No"
            value={newPost.billNo}
            onChange={(e) => setNewPost({ ...newPost, billNo: e.target.value })}
            className="win-input"
            style={{ width: '80px', height: '22px', fontSize: '11px' }}
          />
          <input
            type="number"
            required
            placeholder="Amount (₹)"
            value={newPost.amount}
            onChange={(e) => setNewPost({ ...newPost, amount: e.target.value })}
            className="win-input"
            style={{ width: '90px', height: '22px', fontSize: '11px' }}
          />
          <button type="submit" className="win-btn" style={{ fontWeight: 'bold', minWidth: '90px' }}>
            + Post to Room
          </button>
        </form>

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #808080' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#0a246a', color: '#ffffff', position: 'sticky', top: 0 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left', width: '80px' }}>Room #</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>Guest Name</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '70px' }}>Bill #</th>
                <th style={{ padding: '4px 8px', textAlign: 'right', width: '90px' }}>Amount (₹)</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '120px' }}>Posted Time</th>
                <th style={{ padding: '4px 8px', textAlign: 'center', width: '80px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {roomPostings.map((r, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{r.roomNo}</td>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{r.guestName}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>{r.billNo}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#002266' }}>
                    ₹{Number(r.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px', color: '#555' }}>{r.time}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <span style={{ padding: '1px 5px', borderRadius: '2px', background: '#e6f0fa', border: '1px solid #99c2ff', color: '#003399', fontSize: '10px' }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', background: '#d4d0c8', borderTop: '2px solid #808080', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
            Total Room Charges: <span style={{ color: '#002266' }}>₹{totalPosted.toFixed(2)}</span>
          </div>
          <button className="win-btn" onClick={onClose} style={{ minWidth: '80px', fontWeight: 'bold' }}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
