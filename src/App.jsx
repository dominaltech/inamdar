import React from 'react';
import { PosProvider, usePos } from './context/PosContext';
import { usePosKeyboard } from './hooks/usePosKeyboard';
import HeaderMenuBar from './components/HeaderMenuBar';
import StatusBar from './components/StatusBar';
import OrderWorkspace from './components/OrderWorkspace';
import ReportsView from './components/ReportsView';
import LoginModal from './components/LoginModal';
import TableShiftModal from './components/TableShiftModal';
import CancelAuthModal from './components/CancelAuthModal';
import ThermalPrintModal from './components/ThermalPrintModal';
import InfoModal from './components/InfoModal';

function PosAppContent() {
  const { screenMode } = usePos();
  usePosKeyboard();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* OS & POS Top Menu Header */}
      <HeaderMenuBar />

      {/* Main Screen Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {screenMode === 'REPORTS' ? <ReportsView /> : <OrderWorkspace />}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals & Dialogs */}
      <LoginModal />
      <TableShiftModal />
      <CancelAuthModal />
      <ThermalPrintModal />
      <InfoModal />
    </div>
  );
}

export default function App() {
  return (
    <PosProvider>
      <PosAppContent />
    </PosProvider>
  );
}
