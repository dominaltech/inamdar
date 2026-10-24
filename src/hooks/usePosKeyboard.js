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

      // F6: Billing
      if (e.key === 'F6') {
        e.preventDefault();
        setScreenMode('CASH_MEMO');
        setIsCancelMode(false);
        return;
      }

      // F12: Settle Bill (Opens Settlement Popup with Cash, UPI, Card)
      if (e.key === 'F12') {
        e.preventDefault();
        openSettleModal(activeTableId);
        return;
      }

      // 2. Escape:
      // If any sub-modal is open, close it. If on normal screen, Esc opens Login Page!
      if (e.key === 'Escape') {
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

        // When no dialog is open on main screen: Esc opens Login Page!
        e.preventDefault();
        setShowLoginModal(true);
        return;
      }

      // If a modal is open, don't execute background hotkeys
      const anyModalOpen = showLoginModal || showShiftModal || showCancelAuthModal || showSettleModal || printData || infoDialog;
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
  ]);
}

export { usePosKeyboard };
