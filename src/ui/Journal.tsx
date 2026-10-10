import { useState } from 'react';
import { t } from '../i18n/fr';
import { Dialog } from './Dialog';
import { useGameState } from './useGame';

/**
 * Neighbourhood journal (docs/game-design.md §6, §10.1): the latest line under the scene, and
 * the whole notebook, newest first, on demand.
 */
export function Journal() {
  const state = useGameState();
  const [open, setOpen] = useState(false);
  const latest = state.journal[state.journal.length - 1];

  return (
    <div className="journal">
      <p className="journal-latest" aria-live="polite">
        {latest ? t.journal.entries[latest] : t.journal.empty}
      </p>
      {state.journal.length > 0 && (
        <button
          type="button"
          className="ghost journal-open"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {t.journal.title} <span aria-hidden="true">▸</span>
        </button>
      )}
      {open && (
        <Dialog
          title={t.journal.title}
          closeLabel={t.journal.close}
          onClose={() => setOpen(false)}
          className="journal-dialog"
        >
          <ol className="journal-list" reversed>
            {[...state.journal].reverse().map((id) => (
              <li key={id}>{t.journal.entries[id]}</li>
            ))}
          </ol>
        </Dialog>
      )}
    </div>
  );
}
