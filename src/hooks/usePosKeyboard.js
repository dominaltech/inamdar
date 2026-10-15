import { useEffect } from 'react';
import { usePos } from '../context/PosContext';

export function usePosKeyboard() {
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
    printData,
    setPrintData,
    infoDialog,
    setInfoDialog,
    settleBill,
    activeTableId,
    printCashMemo,
  } = usePos();

  useEffect(() => {
    function handleKeyDown(e) {
      // Don't intercept when certain native inputs need specific keys, but function keys are always global:
      
      // F11: Change User / Login
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

      // F12: Settlement
      if (e.key === 'F12') {
        e.preventDefault();
        settleBill(activeTableId);
        return;
      }

      // If a modal is open, let modal handle Esc or Enter
      const anyModalOpen = showLoginModal || showShiftModal || showCancelAuthModal || printData || infoDialog;
      if (anyModalOpen) {
        if (e.key === 'Escape') {
          if (showLoginModal) setShowLoginModal(false);
          if (showShiftModal) setShowShiftModal(false);
          if (showCancelAuthModal) setShowCancelAuthModal(false);
          if (printData) setPrintData(null);
          if (infoDialog) setInfoDialog(null);
        }
        return;
      }

      // '*' key (Numpad Multiply / Star): Table Shift
      if (e.key === '*' || (e.key === '8' && e.shiftKey)) {
        // If not actively typing inside a text input or if user wants shift:
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

      // Escape key to reset cancel mode
      if (e.key === 'Escape') {
        if (isCancelMode) {
          e.preventDefault();
          setIsCancelMode(false);
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
    printData,
    setPrintData,
    infoDialog,
    setInfoDialog,
    settleBill,
    activeTableId,
  ]);
}
