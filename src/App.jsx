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
import SettlementModal from './components/SettlementModal';
import InfoModal from './components/InfoModal';
import PaxPromptModal from './components/PaxPromptModal';
import BillSettlementMenuModal from './components/BillSettlementMenuModal';
import BatchSettlementModal from './components/BatchSettlementModal';
import DetailsOfBillModal from './components/DetailsOfBillModal';
import DisplayOrderModal from './components/DisplayOrderModal';

// Zero-Dummy Top Menu Modals
import ItemSalesReportModal from './components/modals/ItemSalesReportModal';
import CancelledOrdersReportModal from './components/modals/CancelledOrdersReportModal';
import AuditTrailModal from './components/modals/AuditTrailModal';
import SalesRegisterModal from './components/modals/SalesRegisterModal';
import MenuMasterModal from './components/modals/MenuMasterModal';
import TableMasterModal from './components/modals/TableMasterModal';
import ReasonMasterModal from './components/modals/ReasonMasterModal';
import CreditLedgerModal from './components/modals/CreditLedgerModal';
import RoomPostModal from './components/modals/RoomPostModal';
import StaffMasterModal from './components/modals/StaffMasterModal';
import PrinterSetupModal from './components/modals/PrinterSetupModal';
import CloudConfigModal from './components/modals/CloudConfigModal';

function PosAppContent() {
  const { screenMode, activeModal, closeModal } = usePos();
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
      <SettlementModal />
      <InfoModal />
      <PaxPromptModal />
      <BillSettlementMenuModal />
      <BatchSettlementModal />
      <DetailsOfBillModal />
      <DisplayOrderModal />

      {/* Zero-Dummy Top Menu Modals (All Working!) */}
      <ItemSalesReportModal isOpen={activeModal === 'ITEM_SALES'} onClose={closeModal} />
      <CancelledOrdersReportModal isOpen={activeModal === 'CANCELLED_ORDERS'} onClose={closeModal} />
      <AuditTrailModal isOpen={activeModal === 'AUDIT_TRAIL'} onClose={closeModal} />
      <SalesRegisterModal isOpen={activeModal === 'SALES_REGISTER'} onClose={closeModal} />
      <MenuMasterModal isOpen={activeModal === 'MENU_MASTER'} onClose={closeModal} />
      <TableMasterModal isOpen={activeModal === 'TABLE_MASTER'} onClose={closeModal} />
      <ReasonMasterModal isOpen={activeModal === 'REASON_MASTER'} onClose={closeModal} />
      <CreditLedgerModal isOpen={activeModal === 'CREDIT_LEDGER'} onClose={closeModal} />
      <RoomPostModal isOpen={activeModal === 'ROOM_POST'} onClose={closeModal} />
      <StaffMasterModal isOpen={activeModal === 'STAFF_MASTER'} onClose={closeModal} />
      <PrinterSetupModal isOpen={activeModal === 'PRINTER_SETUP'} onClose={closeModal} />
      <CloudConfigModal isOpen={activeModal === 'CLOUD_CONFIG'} onClose={closeModal} />
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
