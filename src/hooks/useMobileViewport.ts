import { useCallback, useEffect, useRef } from 'react';
import type { FocusEvent, RefObject } from 'react';

const KEYBOARD_THRESHOLD = 120;
const SCROLL_PADDING_TOP = 16;
const SCROLL_PADDING_BOTTOM = 4;
const EXTRA_VISIBLE_GAP = 0;
const RETRY_DELAYS = [0, 120, 260, 420];
const DEBUG_KEYBOARD_VAR = '--app-debug-keyboard-offset';
const FOCUS_SWITCH_GRACE_MS = 180;
let lastStableViewportHeight = 0;

const isTextualInput = (element: HTMLInputElement) => {
  const nonTextInputTypes = new Set([
    'range',
    'checkbox',
    'radio',
    'button',
    'submit',
    'reset',
    'file',
    'color',
    'date',
    'datetime-local',
    'month',
    'time',
    'week',
    'hidden',
    'image',
  ]);

  return !nonTextInputTypes.has(element.type);
};

const isEditableElement = (element: EventTarget | null): element is HTMLElement => {
  return (
    (element instanceof HTMLInputElement && isTextualInput(element)) ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  );
};

const isScrollableElement = (element: HTMLElement) => {
  const styles = window.getComputedStyle(element);
  const overflowY = styles.overflowY;
  return (
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    element.scrollHeight > element.clientHeight + 1
  );
};

const getScrollContainer = (element: HTMLElement | null) => {
  if (!element) return null;

  let current = element.parentElement;
  while (current) {
    if (isScrollableElement(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
};

const getKeyboardMetrics = () => {
  const viewport = window.visualViewport;
  const visibleHeight = viewport ? viewport.height : window.innerHeight;
  const viewportOffsetTop = viewport ? viewport.offsetTop : 0;
  const keyboardHeight = viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;
  const debugOffset = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(DEBUG_KEYBOARD_VAR) || '0'
  ) || 0;
  const resolvedKeyboardHeight = Math.max(keyboardHeight, debugOffset);
  const keyboardOffset = resolvedKeyboardHeight > KEYBOARD_THRESHOLD ? resolvedKeyboardHeight : 0;

  if (keyboardOffset === 0) {
    lastStableViewportHeight = Math.max(lastStableViewportHeight, visibleHeight);
  } else if (lastStableViewportHeight === 0) {
    lastStableViewportHeight = Math.max(window.innerHeight, visibleHeight + keyboardOffset);
  }

  const layoutViewportHeight = lastStableViewportHeight || window.innerHeight || visibleHeight;
  const keyboardTop = layoutViewportHeight - keyboardOffset;

  return {
    viewport,
    visibleHeight,
    viewportOffsetTop,
    keyboardOffset,
    keyboardTop,
    layoutViewportHeight,
  };
};

const setRootViewportVars = () => {
  const root = document.documentElement;
  const safeAreaTop = 'env(safe-area-inset-top, 0px)';
  const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';
  const navSafeArea = safeAreaBottom;
  const { visibleHeight, viewportOffsetTop, keyboardOffset, layoutViewportHeight } = getKeyboardMetrics();
  const effectiveVisibleHeight = Math.max(0, visibleHeight);
  const composerOffset = keyboardOffset > 0
    ? `${Math.max(0, viewportOffsetTop)}px`
    : 'var(--mobile-bottom-nav-total-height)';
  const mobileBottomGap = keyboardOffset > 0
    ? '0px'
    : 'var(--mobile-bottom-nav-total-height)';

  root.style.setProperty('--app-safe-area-top', safeAreaTop);
  root.style.setProperty('--app-safe-area-bottom', safeAreaBottom);
  root.style.setProperty('--mobile-bottom-nav-safe-area', navSafeArea);
  root.style.setProperty('--mobile-bottom-nav-total-height', 'calc(var(--mobile-bottom-nav-height) + var(--mobile-bottom-nav-safe-area))');
  root.style.setProperty('--app-visible-viewport-height', `${effectiveVisibleHeight}px`);
  root.style.setProperty('--app-layout-viewport-height', `${Math.max(0, layoutViewportHeight)}px`);
  root.style.setProperty('--app-viewport-offset-top', `${viewportOffsetTop}px`);
  root.style.setProperty('--app-keyboard-offset', `${keyboardOffset}px`);
  root.style.setProperty('--app-composer-offset', composerOffset);
  root.style.setProperty('--app-mobile-bottom-gap', mobileBottomGap);
  root.dataset.keyboardOpen = keyboardOffset > 0 ? 'true' : 'false';
};

const scrollElementIntoKeyboardView = (element: HTMLElement | null, container?: HTMLElement | null) => {
  if (!element) return;

  const targetContainer = container ?? getScrollContainer(element);
  const { viewport, viewportOffsetTop, keyboardOffset, keyboardTop, visibleHeight } = getKeyboardMetrics();
  const fallbackKeyboardTop = Math.max(0, viewportOffsetTop + visibleHeight);
  const effectiveKeyboardTop = keyboardOffset > 0 ? keyboardTop : fallbackKeyboardTop;

  if (!targetContainer || targetContainer === document.body || targetContainer === document.documentElement) {
    const elementRect = element.getBoundingClientRect();
    const visibleTop = viewportOffsetTop + SCROLL_PADDING_TOP;
    const visibleBottom = effectiveKeyboardTop - SCROLL_PADDING_BOTTOM - EXTRA_VISIBLE_GAP;

    if (elementRect.top < visibleTop || elementRect.bottom > visibleBottom) {
      element.scrollIntoView({ behavior: 'auto', block: keyboardOffset > 0 ? 'center' : 'nearest' });
    }
    return;
  }

  const containerRect = targetContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const visibleTop = Math.max(containerRect.top + SCROLL_PADDING_TOP, viewportOffsetTop + SCROLL_PADDING_TOP);
  const visibleBottom = Math.min(containerRect.bottom, effectiveKeyboardTop) - SCROLL_PADDING_BOTTOM - EXTRA_VISIBLE_GAP;
  const currentScroll = targetContainer.scrollTop;

  if (elementRect.top < visibleTop) {
    targetContainer.scrollTo({
      top: Math.max(0, currentScroll - (visibleTop - elementRect.top) - 12),
      behavior: 'auto',
    });
    return;
  }

  if (elementRect.bottom > visibleBottom) {
    const delta = elementRect.bottom - visibleBottom;
    targetContainer.scrollTo({
      top: Math.max(0, currentScroll + delta + 8),
      behavior: 'auto',
    });
    return;
  }

  if (viewport && keyboardOffset > 0) {
    element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  }
};

export function useGlobalMobileViewportVars() {
  const scrollTimerRef = useRef<number | null>(null);
  const focusTransitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;

    const scheduleActiveElementVisibility = (delay = 0) => {
      const activeElement = document.activeElement;
      if (!isEditableElement(activeElement)) return;

      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }

      scrollTimerRef.current = window.setTimeout(() => {
        scrollElementIntoKeyboardView(activeElement);
      }, delay);
    };

    const updateViewportVars = () => {
      setRootViewportVars();
      scheduleActiveElementVisibility(0);
    };

    const handleFocusIn = (event: FocusEvent | Event) => {
      if (!isEditableElement(event.target)) return;

      if (focusTransitionTimerRef.current) {
        window.clearTimeout(focusTransitionTimerRef.current);
        focusTransitionTimerRef.current = null;
      }

      RETRY_DELAYS.forEach((delay) => {
        window.setTimeout(() => {
          setRootViewportVars();
          scrollElementIntoKeyboardView(event.target as HTMLElement);
        }, delay);
      });
    };

    const handleFocusOut = () => {
      if (focusTransitionTimerRef.current) {
        window.clearTimeout(focusTransitionTimerRef.current);
      }

      focusTransitionTimerRef.current = window.setTimeout(() => {
        const activeElement = document.activeElement;
        if (isEditableElement(activeElement)) {
          setRootViewportVars();
          scrollElementIntoKeyboardView(activeElement);
          return;
        }

        setRootViewportVars();
      }, FOCUS_SWITCH_GRACE_MS);
    };

    updateViewportVars();
    window.addEventListener('resize', updateViewportVars);
    window.addEventListener('orientationchange', updateViewportVars);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    if (viewport) {
      viewport.addEventListener('resize', updateViewportVars);
      viewport.addEventListener('scroll', updateViewportVars);
    }

    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }

      if (focusTransitionTimerRef.current) {
        window.clearTimeout(focusTransitionTimerRef.current);
      }

      window.removeEventListener('resize', updateViewportVars);
      window.removeEventListener('orientationchange', updateViewportVars);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);

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

    scrollTimerRef.current = window.setTimeout(() => {
      scrollElementIntoKeyboardView(element, containerRef.current);
    }, delay);
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
      scrollIntoSafeView(event.target, 0);
      RETRY_DELAYS.forEach((delay) => {
        window.setTimeout(() => {
          scrollElementIntoKeyboardView(event.target as HTMLElement, containerRef.current);
        }, delay);
      });
    }
  }, [containerRef, scrollIntoSafeView]);

  return {
    handleFocusCapture,
    scrollIntoSafeView,
  };
}

