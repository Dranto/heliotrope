import { useEffect, useState } from 'react';
import { exportSave } from '../game/save';
import { t } from '../i18n/fr';
import { useGameStore } from './useGame';

type ResetStep = 'idle' | 'confirm' | 'final';

/** Options panel (docs/game-design.md §9.4, §10.2): manual save, export, import, full reset. */
export function Options({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const [exported] = useState(() => exportSave(store.getState()));
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [resetStep, setResetStep] = useState<ResetStep>('idle');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exported);
      setMessage(t.options.copied);
    } catch {
      // Clipboard can be unavailable (insecure context); the text stays selectable.
    }
  }

  function load() {
    if (store.importText(importText)) {
      setImportText('');
      setMessage(t.options.imported);
    } else {
      setMessage(t.options.importError);
    }
  }

  function reset() {
    store.reset();
    setResetStep('idle');
    setMessage(t.options.resetDone);
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="panel options"
        role="dialog"
        aria-modal="true"
        aria-labelledby="options-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-head">
          <h2 id="options-title">{t.options.title}</h2>
          <button
            type="button"
            className="ghost icon"
            aria-label={t.options.close}
            onClick={onClose}
            autoFocus
          >
            ✕
          </button>
        </div>

        <p className="options-message" role="status">
          {message}
        </p>

        <section>
          <h3>{t.options.saveTitle}</h3>
          <p className="hint">{t.options.saveHint}</p>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              store.save();
              setMessage(t.options.saved);
            }}
          >
            {t.options.saveNow}
          </button>
        </section>

        <section>
          <h3>{t.options.exportTitle}</h3>
          <p className="hint">{t.options.exportHint}</p>
          <textarea
            readOnly
            rows={3}
            value={exported}
            aria-label={t.options.exportLabel}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button type="button" className="ghost" onClick={copy}>
            {t.options.copy}
          </button>
        </section>

        <section>
          <h3>{t.options.importTitle}</h3>
          <p className="hint">{t.options.importHint}</p>
          <textarea
            rows={3}
            value={importText}
            aria-label={t.options.importLabel}
            onChange={(event) => setImportText(event.target.value)}
          />
          <button
            type="button"
            className="ghost"
            disabled={importText.trim() === ''}
            onClick={load}
          >
            {t.options.importAction}
          </button>
        </section>

        <section>
          <h3>{t.options.resetTitle}</h3>
          <p className="hint">{t.options.resetHint}</p>
          {resetStep === 'idle' && (
            <button type="button" className="ghost danger" onClick={() => setResetStep('confirm')}>
              {t.options.reset}
            </button>
          )}
          {resetStep !== 'idle' && (
            <div className="confirm-row">
              {resetStep === 'confirm' ? (
                <>
                  <span>{t.options.resetConfirm}</span>
                  <button
                    type="button"
                    className="ghost danger"
                    onClick={() => setResetStep('final')}
                  >
                    {t.options.resetYes}
                  </button>
                </>
              ) : (
                <button type="button" className="ghost danger solid" onClick={reset}>
                  {t.options.resetConfirmAgain}
                </button>
              )}
              <button type="button" className="ghost" onClick={() => setResetStep('idle')}>
                {t.options.cancel}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
