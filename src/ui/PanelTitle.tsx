import type { ReactNode } from 'react';

/**
 * The title of a panel, which folds it away or unfolds it so the map gets more or less room.
 * The panel carries `data-open` and the stylesheet hides everything but its head when folded.
 */
export function PanelTitle({
  id,
  open,
  onToggle,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="panel-title">
      <button type="button" aria-expanded={open} onClick={onToggle}>
        {children}
        <svg viewBox="0 0 16 16" aria-hidden="true" className="fold">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
    </h2>
  );
}
