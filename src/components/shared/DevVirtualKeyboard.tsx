import { useEffect, useMemo, useState } from 'react';

const DEV_KEYBOARD_HEIGHT = 320;
const KEY_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

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

const isEditableElement = (element: Element | null): element is HTMLInputElement | HTMLTextAreaElement => {
  return (element instanceof HTMLInputElement && isTextualInput(element)) || element instanceof HTMLTextAreaElement;
};

const isDesktopDebugMode = () => {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
};

export default function DevVirtualKeyboard() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeElement, setActiveElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const showPanel = useMemo(() => isDesktopDebugMode(), []);

  useEffect(() => {
    if (!showPanel) return;

    const stored = window.localStorage.getItem('dev-virtual-keyboard-enabled');
    setEnabled(stored === 'true');
  }, [showPanel]);

  useEffect(() => {
    if (!showPanel) return;

    if (enabled && visible && activeElement) {
      document.documentElement.style.setProperty('--app-debug-keyboard-offset', `${DEV_KEYBOARD_HEIGHT}px`);
      document.documentElement.dataset.debugKeyboard = 'true';
      return;
    }

    document.documentElement.style.setProperty('--app-debug-keyboard-offset', '0px');
    delete document.documentElement.dataset.debugKeyboard;
  }, [activeElement, enabled, showPanel, visible]);

  useEffect(() => {
    if (!showPanel || !enabled) {
      setVisible(false);
      setActiveElement(null);
      return;
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Element && isEditableElement(target)) {
        setActiveElement(target);
        setVisible(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const current = document.activeElement;
        if (current instanceof Element && isEditableElement(current)) {
          setActiveElement(current);
          setVisible(true);
          return;
        }

        setVisible(false);
        setActiveElement(null);
      }, 180);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [enabled, showPanel]);

  if (!showPanel) return null;

  const syncValue = (nextValue: string, cursorStart?: number, cursorEnd?: number) => {
    if (!activeElement) return;

    const nativeSetter = Object.getOwnPropertyDescriptor(activeElement.constructor.prototype, 'value')?.set;
    nativeSetter?.call(activeElement, nextValue);

    activeElement.dispatchEvent(new Event('input', { bubbles: true }));

    if (typeof cursorStart === 'number' && typeof cursorEnd === 'number') {
      activeElement.setSelectionRange(cursorStart, cursorEnd);
    }

    activeElement.focus();
  };

  const insertText = (text: string) => {
    if (!activeElement) return;

    const start = activeElement.selectionStart ?? activeElement.value.length;
    const end = activeElement.selectionEnd ?? activeElement.value.length;
    const nextValue = `${activeElement.value.slice(0, start)}${text}${activeElement.value.slice(end)}`;
    const nextCursor = start + text.length;

    syncValue(nextValue, nextCursor, nextCursor);
  };

  const handleBackspace = () => {
    if (!activeElement) return;

    const start = activeElement.selectionStart ?? activeElement.value.length;
    const end = activeElement.selectionEnd ?? activeElement.value.length;

    if (start !== end) {
      const nextValue = `${activeElement.value.slice(0, start)}${activeElement.value.slice(end)}`;
      syncValue(nextValue, start, start);
      return;
    }

    if (start === 0) return;

    const nextValue = `${activeElement.value.slice(0, start - 1)}${activeElement.value.slice(end)}`;
    const nextCursor = start - 1;
    syncValue(nextValue, nextCursor, nextCursor);
  };

  const handleEnter = () => {
    if (!activeElement) return;

    if (activeElement instanceof HTMLTextAreaElement) {
      insertText('\n');
      return;
    }

    activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    activeElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    activeElement.blur();
  };

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem('dev-virtual-keyboard-enabled', String(next));
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleEnabled}
        className="fixed right-4 z-[9998] rounded-full px-4 py-2 text-xs font-black tracking-[0.18em] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:scale-[1.02] active:scale-95"
        style={{
          bottom: visible && enabled ? `calc(${DEV_KEYBOARD_HEIGHT}px + 16px)` : '16px',
          background: enabled ? '#542916' : 'rgba(84, 41, 22, 0.78)',
          color: '#fff7ed',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {enabled ? '测试键盘 开' : '测试键盘 关'}
      </button>

      {enabled && visible && (
        <div
          className="fixed inset-x-0 bottom-0 z-[9997] border-t px-3 pb-3 pt-3"
          style={{
            height: `${DEV_KEYBOARD_HEIGHT}px`,
            background: 'linear-gradient(180deg, rgba(255,250,240,0.98), rgba(245,231,214,0.98))',
            borderColor: 'rgba(84, 41, 22, 0.12)',
            boxShadow: '0 -12px 40px rgba(84, 41, 22, 0.12)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <div className="text-[10px] font-black tracking-[0.22em]" style={{ color: '#9a6b37' }}>
                  DESKTOP MOBILE KEYBOARD
                </div>
                <div className="mt-1 text-sm font-semibold" style={{ color: '#542916' }}>
                  仅本地开发测试使用，线上和手机真机不会出现
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  setActiveElement(null);
                  (document.activeElement as HTMLElement | null)?.blur?.();
                }}
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'rgba(84,41,22,0.08)', color: '#542916' }}
              >
                收起
              </button>
            </div>

            {KEY_LAYOUT.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center gap-2">
                {row.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insertText(key)}
                    className="flex h-11 min-w-[2.6rem] flex-1 items-center justify-center rounded-2xl text-base font-bold shadow-[0_4px_12px_rgba(84,41,22,0.08)]"
                    style={{
                      background: '#fffaf0',
                      color: '#542916',
                      border: '1px solid rgba(84,41,22,0.08)',
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleBackspace}
                className="h-11 rounded-2xl px-4 text-sm font-bold"
                style={{ background: '#f3e2cf', color: '#542916' }}
              >
                删除
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertText(' ')}
                className="h-11 flex-1 rounded-2xl px-4 text-sm font-bold"
                style={{ background: '#fffaf0', color: '#542916', border: '1px solid rgba(84,41,22,0.08)' }}
              >
                空格
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleEnter}
                className="h-11 rounded-2xl px-4 text-sm font-bold"
                style={{ background: '#542916', color: '#fff7ed' }}
              >
                回车
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

