import { useEffect, useId, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  /** Shown above the title, e.g. an ornament. */
  header?: ReactNode;
  children: ReactNode;
}

/** Modal panel over a blurred overlay; closes on Escape, the ✕ button or a click outside. */
export function Dialog({
  title,
  closeLabel,
  onClose,
  className = '',
  header,
  children,
}: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className={`panel dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
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
