import { useCallback, useEffect, useRef } from 'react';
import type { FocusEvent, RefObject } from 'react';

const KEYBOARD_THRESHOLD = 120;

const isEditableElement = (element: EventTarget | null): element is HTMLElement => {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
};

const setRootViewportVars = () => {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  const safeAreaTop = 'env(safe-area-inset-top, 0px)';
  const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';

  const visibleHeight = viewport ? viewport.height : window.innerHeight;
  const viewportOffsetTop = viewport ? viewport.offsetTop : 0;
  const keyboardHeight = viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;
  const keyboardOffset = keyboardHeight > KEYBOARD_THRESHOLD ? keyboardHeight : 0;

  root.style.setProperty('--app-safe-area-top', safeAreaTop);
  root.style.setProperty('--app-safe-area-bottom', safeAreaBottom);
  root.style.setProperty('--app-visible-viewport-height', `${visibleHeight}px`);
  root.style.setProperty('--app-viewport-offset-top', `${viewportOffsetTop}px`);
  root.style.setProperty('--app-keyboard-offset', `${keyboardOffset}px`);
  root.dataset.keyboardOpen = keyboardOffset > 0 ? 'true' : 'false';
};

export function useGlobalMobileViewportVars() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const updateViewportVars = () => setRootViewportVars();

    updateViewportVars();
    window.addEventListener('resize', updateViewportVars);
    window.addEventListener('orientationchange', updateViewportVars);

    if (viewport) {
      viewport.addEventListener('resize', updateViewportVars);
      viewport.addEventListener('scroll', updateViewportVars);
    }

    return () => {
      window.removeEventListener('resize', updateViewportVars);
      window.removeEventListener('orientationchange', updateViewportVars);

      if (viewport) {
        viewport.removeEventListener('resize', updateViewportVars);
        viewport.removeEventListener('scroll', updateViewportVars);
      }
    };
  }, []);
}

export function useKeyboardAvoidance<T extends HTMLElement>(containerRef: RefObject<T>) {
  const scrollTimerRef = useRef<number | null>(null);

  const scrollIntoSafeView = useCallback((element: HTMLElement | null, delay = 80) => {
    if (!element) return;

    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }

    const run = () => {
      const container = containerRef.current;
      const viewport = window.visualViewport;
      const keyboardHeight = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      const keyboardOffset = keyboardHeight > KEYBOARD_THRESHOLD ? keyboardHeight : 0;

      if (!container) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const keyboardTop = viewport
        ? viewport.height + viewport.offsetTop - keyboardOffset
        : window.innerHeight - keyboardOffset;
      const visibleTop = Math.max(containerRect.top + 12, viewport ? viewport.offsetTop + 12 : 12);
      const visibleBottom = Math.min(containerRect.bottom, keyboardTop) - 12;
      const currentScroll = container.scrollTop;

      if (elementRect.top < visibleTop) {
        container.scrollTo({
          top: Math.max(0, currentScroll - (visibleTop - elementRect.top) - 24),
          behavior: 'smooth',
        });
      } else if (elementRect.bottom > visibleBottom) {
        container.scrollTo({
          top: currentScroll + (elementRect.bottom - visibleBottom) + 24,
          behavior: 'smooth',
        });
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    scrollTimerRef.current = window.setTimeout(run, delay);
  }, [containerRef]);

  useEffect(() => {
    const viewport = window.visualViewport;

    const keepActiveElementVisible = () => {
      setRootViewportVars();
      const activeElement = document.activeElement;
      if (isEditableElement(activeElement)) {
        scrollIntoSafeView(activeElement, 0);
      }
    };

    if (viewport) {
      viewport.addEventListener('resize', keepActiveElementVisible);
      viewport.addEventListener('scroll', keepActiveElementVisible);
    }

    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }

      if (viewport) {
        viewport.removeEventListener('resize', keepActiveElementVisible);
        viewport.removeEventListener('scroll', keepActiveElementVisible);
      }
    };
  }, [scrollIntoSafeView]);

  const handleFocusCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    if (isEditableElement(event.target)) {
      scrollIntoSafeView(event.target, 120);
    }
  }, [scrollIntoSafeView]);

  return {
    handleFocusCapture,
    scrollIntoSafeView,
  };
}

