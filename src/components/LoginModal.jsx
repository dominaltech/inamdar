import React, { useState, useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { DEFAULT_USERS } from '../data/initialData';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, currentUser, setCurrentUser } = usePos();
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const userSelectRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (showLoginModal) {
      const idx = DEFAULT_USERS.findIndex(u => u.id === currentUser?.id);
      setSelectedUserIndex(idx >= 0 ? idx : 0);
      setPassword('');
      setErrorMessage('');
      setTimeout(() => {
        userSelectRef.current?.focus();
      }, 50);
    }
  }, [showLoginModal, currentUser]);

  if (!showLoginModal) return null;

  const handleUserKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedUserIndex(prev => (prev + 1) % DEFAULT_USERS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedUserIndex(prev => (prev - 1 + DEFAULT_USERS.length) % DEFAULT_USERS.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      passwordInputRef.current?.focus();
    } else if (e.key === 'Escape') {
      setShowLoginModal(false);
    }
  };

  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoginSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      userSelectRef.current?.focus();
    } else if (e.key === 'Escape') {
      setShowLoginModal(false);
    }
  };

  const handleLoginSubmit = () => {
    const user = DEFAULT_USERS[selectedUserIndex];
    // Simple PIN check (or allow any password if blank for easy testing)
    if (user.pin && password && password !== user.pin) {
      setErrorMessage('Invalid Password! (Hint: ' + user.pin + ')');
      return;
    }
    setCurrentUser(user);
    setShowLoginModal(false);
  };

  const handleKeypadPress = (val) => {
    if (val === 'Clear') {
      setPassword('');
    } else if (val === 'Enter') {
      handleLoginSubmit();
    } else {
      setPassword(prev => prev + val);
      passwordInputRef.current?.focus();
    }
  };

  return (
    <div className="win-modal-backdrop">
      <div className="win-window" style={{ width: '470px' }}>
        {/* Title bar */}
        <div className="win-titlebar" style={{ background: 'linear-gradient(90deg, #1b62b7 0%, #4a90e2 100%)' }}>
          <div className="win-titlebar-title">
            <span>Login/Logout</span>
            <span style={{ marginLeft: '12px', fontSize: '11px', opacity: 0.9 }}>[Terminal: Server]</span>
            <span style={{ marginLeft: '12px', fontSize: '11px', opacity: 0.9 }}>[Computer: SERVER]</span>
          </div>
          <button className="win-close-btn" onClick={() => setShowLoginModal(false)}>✕</button>
        </div>

        {/* Dialog Body */}
        <div style={{ padding: '16px', background: '#ece9d8' }}>
          {/* Header Row: Key Icon & Red Date Time */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔑</span>
            </div>
            <div style={{ color: '#d00000', fontWeight: 'bold', fontSize: '14px' }}>
              Thu, 08-Oct-26 &nbsp;&nbsp; 02:11 AM
            </div>
          </div>

          {/* Main Grid: Left inputs + Right on-screen touch numpad */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Left Column: User & Password */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>User</label>
                <select
                  ref={userSelectRef}
                  value={selectedUserIndex}
                  onChange={(e) => setSelectedUserIndex(Number(e.target.value))}
                  onKeyDown={handleUserKeyDown}
                  className="win-input"
                  style={{ width: '100%', height: '32px', fontSize: '15px', color: '#0033aa' }}
                >
                  {DEFAULT_USERS.map((u, i) => (
                    <option key={u.id} value={i}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Password</label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  className="win-input"
                  style={{ width: '100%', height: '32px', fontSize: '16px' }}
                  placeholder="Enter PIN"
                />
              </div>

              {errorMessage && (
                <div style={{ color: '#c00000', fontSize: '11px', fontWeight: 'bold' }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button className="win-btn" style={{ flex: 1, height: '30px', fontWeight: 'bold' }} onClick={handleLoginSubmit}>
                  Ok
                </button>
                <button className="win-btn" style={{ flex: 1, height: '30px' }} onClick={() => setShowLoginModal(false)}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Right Column: Retro Touch Numpad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 46px)',
              gridTemplateRows: 'repeat(4, 42px)',
              gap: '4px',
              padding: '6px',
              background: '#d4d0c8',
              border: '2px inset #ffffff'
            }}>
              <button className="win-btn" onClick={() => handleKeypadPress('7')}>7</button>
              <button className="win-btn" onClick={() => handleKeypadPress('8')}>8</button>
              <button className="win-btn" onClick={() => handleKeypadPress('9')}>9</button>
              <button className="win-btn" style={{ fontWeight: 'bold', color: '#880000' }} onClick={() => handleKeypadPress('Clear')}>Clear</button>

              <button className="win-btn" onClick={() => handleKeypadPress('4')}>4</button>
              <button className="win-btn" onClick={() => handleKeypadPress('5')}>5</button>
              <button className="win-btn" onClick={() => handleKeypadPress('6')}>6</button>
              <div />

              <button className="win-btn" onClick={() => handleKeypadPress('1')}>1</button>
              <button className="win-btn" onClick={() => handleKeypadPress('2')}>2</button>
              <button className="win-btn" onClick={() => handleKeypadPress('3')}>3</button>
              <button className="win-btn" style={{ gridRow: 'span 2', fontWeight: 'bold', background: '#e0e8f5' }} onClick={() => handleKeypadPress('Enter')}>
                Enter
              </button>

              <button className="win-btn" style={{ gridColumn: 'span 2' }} onClick={() => handleKeypadPress('0')}>0</button>
              <button className="win-btn" onClick={() => handleKeypadPress('.')}>.</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
