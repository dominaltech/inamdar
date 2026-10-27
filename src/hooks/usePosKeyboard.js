import { useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function usePosKeyboard() {
  const {
    screenMode,
    setScreenMode,
    isCancelMode,
    setIsCancelMode,
    setShowLoginModal,
    showLoginModal,
    setShowShiftModal,
    showShiftModal,
    showCancelAuthModal,
    setShowCancelAuthModal,
    showSettleModal,
    setShowSettleModal,
    openSettleModal,
    printData,
    setPrintData,
    infoDialog,
    setInfoDialog,
    activeTableId,
    // New video modals
    showSettlementMenu,
    setShowSettlementMenu,
    batchSettleMode,
    setBatchSettleMode,
    paxPrompt,
    setPaxPrompt,
    activeModal,
    closeModal,
  } = usePos();

  useEffect(() => {
    function handleKeyDown(e) {
      // 1. F11: Login / Change User Screen
      if (e.key === 'F11') {
        e.preventDefault();
        setShowLoginModal(prev => !prev);
        return;
      }

      // F5: Toggle Order / Cash Memo
      if (e.key === 'F5') {
        e.preventDefault();
        setScreenMode(prev => prev === 'ORDER' ? 'CASH_MEMO' : 'ORDER');
        setIsCancelMode(false);
        return;
      }

      // F6: Billing / Cash Memo
      if (e.key === 'F6') {
        e.preventDefault();
        setScreenMode('CASH_MEMO');
        setIsCancelMode(false);
        return;
      }

      // F12: Settle Bill or Settlement Menu
      if (e.key === 'F12') {
        e.preventDefault();
        if (screenMode === 'DETAILS_OF_BILL') {
          setShowSettlementMenu(true);
        } else {
          openSettleModal(activeTableId);
        }
        return;
      }

      // 2. Escape:
      // If any sub-modal or popup is open, close it!
      if (e.key === 'Escape') {
        if (activeModal) {
          e.preventDefault();
          closeModal();
          return;
        }
        if (paxPrompt) {
          e.preventDefault();
          setPaxPrompt(null);
          return;
        }
        if (batchSettleMode) {
          e.preventDefault();
          setBatchSettleMode(null);
          return;
        }
        if (showSettlementMenu) {
          e.preventDefault();
          setShowSettlementMenu(false);
          return;
        }
        if (showSettleModal) {
          e.preventDefault();
          setShowSettleModal(false);
          return;
        }
        if (showShiftModal) {
          e.preventDefault();
          setShowShiftModal(false);
          return;
        }
        if (showCancelAuthModal) {
          e.preventDefault();
          setShowCancelAuthModal(false);
          return;
        }
        if (printData) {
          e.preventDefault();
          setPrintData(null);
          return;
        }
        if (infoDialog) {
          e.preventDefault();
          setInfoDialog(null);
          return;
        }
        if (isCancelMode) {
          e.preventDefault();
          setIsCancelMode(false);
          return;
        }
        if (showLoginModal) {
          e.preventDefault();
          setShowLoginModal(false);
          return;
        }

        // Authentic Retro Behavior (vid3 & vid4):
        // In ORDER mode: Esc opens "Display Order" (KOT list & KOT Transfer)
        if (screenMode === 'ORDER') {
          e.preventDefault();
          setScreenMode('DISPLAY_ORDER');
          return;
        }
        if (screenMode === 'DISPLAY_ORDER') {
          e.preventDefault();
          setScreenMode('ORDER');
          return;
        }

        // In CASH_MEMO mode: Esc opens "Details of Bill" (Green unsettled & Black settled ledger)
        if (screenMode === 'CASH_MEMO') {
          e.preventDefault();
          setScreenMode('DETAILS_OF_BILL');
          return;
        }
        if (screenMode === 'DETAILS_OF_BILL') {
          e.preventDefault();
          setScreenMode('CASH_MEMO');
          return;
        }

        if (screenMode === 'REPORTS') {
          e.preventDefault();
          setScreenMode('ORDER');
          return;
        }
      }

      // If any modal is open, don't execute background hotkeys
      const anyModalOpen =
        showLoginModal ||
        showShiftModal ||
        showCancelAuthModal ||
        showSettleModal ||
        showSettlementMenu ||
        batchSettleMode ||
        paxPrompt ||
        printData ||
        infoDialog ||
        screenMode === 'DISPLAY_ORDER' ||
        screenMode === 'DETAILS_OF_BILL' ||
        Boolean(activeModal);

      if (anyModalOpen) {
        return;
      }

      // '*' key (Numpad Multiply / Star): Table Shift
      if (e.key === '*' || (e.key === '8' && e.shiftKey)) {
        const target = e.target;
        const isTypingText = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT') && target.value.length > 0;
        if (!isTypingText) {
          e.preventDefault();
          setShowShiftModal(true);
          return;
        }
      }

      // '-' key (Numpad Subtract / Minus): Toggle Cancel Order mode
      if (e.key === '-') {
        const target = e.target;
        const isTypingText = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT') && target.value.length > 0;
        if (!isTypingText) {
          e.preventDefault();
          setIsCancelMode(prev => !prev);
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    screenMode,
    setScreenMode,
    isCancelMode,
    setIsCancelMode,
    setShowLoginModal,
    showLoginModal,
    setShowShiftModal,
    showShiftModal,
    showCancelAuthModal,
    setShowCancelAuthModal,
    showSettleModal,
    setShowSettleModal,
    openSettleModal,
    printData,
    setPrintData,
    infoDialog,
    setInfoDialog,
    activeTableId,
    showSettlementMenu,
    setShowSettlementMenu,
    batchSettleMode,
    setBatchSettleMode,
    paxPrompt,
    setPaxPrompt,
    activeModal,
    closeModal,
  ]);
}

export { usePosKeyboard };
