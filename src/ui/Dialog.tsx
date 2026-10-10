import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  /** Shown above the title, e.g. an ornament. */
  header?: ReactNode;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not([disabled]), textarea, input, select, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Modal panel over a blurred overlay; closes on Escape, the ✕ button or a click outside.
 * Keyboard focus stays inside while it is open and returns to the opener when it closes.
 */
export function Dialog({
  title,
  closeLabel,
  onClose,
  className = '',
  header,
  children,
}: DialogProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !panel.current) return;
    const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={panel}
        className={`panel dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={trapFocus}
      >
        {header}
        <div className="panel-head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="ghost icon"
            aria-label={closeLabel}
            onClick={onClose}
            autoFocus
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
