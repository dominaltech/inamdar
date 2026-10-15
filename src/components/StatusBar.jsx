import React, { useState, useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function StatusBar() {
  const { currentUser } = usePos();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${day}/${month}/${year} ${hours}:${minutes}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="win-statusbar">
      <div className="win-status-pane" style={{ minWidth: '150px' }}>
        SERVER [1,2,3,4]
      </div>
      <div className="win-status-pane" style={{ minWidth: '120px', fontWeight: 'bold' }}>
        {currentUser?.name || '1. Operator'}
      </div>
      <div className="win-status-pane" style={{ flexGrow: 1, textAlign: 'right' }}>
        {timeStr}
      </div>
      <div className="win-status-pane" style={{ minWidth: '45px', textAlign: 'center', fontWeight: 'bold' }}>
        NUM
      </div>
      <div className="win-status-pane" style={{ minWidth: '45px', textAlign: 'center', fontWeight: 'bold' }}>
        ENG
      </div>
    </div>
  );
}
