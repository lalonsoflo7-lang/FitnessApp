import { useEffect } from 'react';

const TEXT_INPUT = 'input:not([type="checkbox"]):not([type="radio"]), textarea';

/**
 * On touch devices the virtual keyboard shrinks the visible area; iOS keeps fixed elements
 * (the bottom nav) on screen, covering content. While a text field has focus we flag the body
 * so CSS can hide the nav.
 */
export function useTypingFlag() {
  useEffect(() => {
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as Element | null)?.matches?.(TEXT_INPUT)) document.body.dataset.typing = '';
    };
    const onFocusOut = () => {
      // Wait: focus may be moving straight to another field.
      window.setTimeout(() => {
        if (!document.activeElement?.matches?.(TEXT_INPUT)) delete document.body.dataset.typing;
      }, 50);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      delete document.body.dataset.typing;
    };
  }, []);
}

/**
 * Scrolls just enough so `el` sits above the virtual keyboard (uses the Visual Viewport API).
 * Used to keep "Registrar serie" reachable while typing weight/reps on a phone.
 */
export function revealAboveKeyboard(el: HTMLElement | null) {
  const vv = window.visualViewport;
  if (!el || !vv) return;
  const adjust = () => {
    const visibleBottom = vv.offsetTop + vv.height;
    const overflow = el.getBoundingClientRect().bottom + 12 - visibleBottom;
    if (overflow > 0) window.scrollBy({ top: overflow, behavior: 'smooth' });
  };
  // The keyboard animates in; measure once it has resized the visual viewport.
  vv.addEventListener('resize', adjust, { once: true });
  window.setTimeout(adjust, 350);
}
