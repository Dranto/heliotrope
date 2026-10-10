import { useState } from 'react';
import { LANGUAGES } from '../game/format';
import { exportSave } from '../game/save';
import type { Settings } from '../game/state';
import { t } from '../i18n';
import { Dialog } from './Dialog';
import { setMapRenderer, useMapRenderer } from './rendererPref';
import { useGameState, useGameStore } from './useGame';

type ResetStep = 'idle' | 'confirm' | 'final';

/**
 * Options panel (docs/game-design.md §8, §9.4, §10.2, §10.4, §14 Q1): language, number notation, reduced motion, enhanced map, sound, manual
 * save, export, import, full reset.
 */
export function Options({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const { settings } = useGameState();
  const renderer = useMapRenderer();
  const [exported] = useState(() => exportSave(store.getState()));
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [resetStep, setResetStep] = useState<ResetStep>('idle');

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

  function change(patch: Partial<Settings>) {
    store.dispatch((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    store.save();
  }

  function reset() {
    store.reset();
    setResetStep('idle');
    setMessage(t.options.resetDone);
  }

  return (
    <Dialog
      title={t.options.title}
      closeLabel={t.options.close}
      onClose={onClose}
      className="options"
    >
      <p className="options-message" role="status">
        {message}
      </p>

      <section>
        <h3>{t.options.displayTitle}</h3>
        <fieldset className="choice">
          <legend>{t.options.language}</legend>
          {LANGUAGES.map((language) => (
            <label key={language} lang={language}>
              <input
                type="radio"
                name="language"
                checked={settings.language === language}
                onChange={() => change({ language })}
              />
              {t.languageNames[language]}
            </label>
          ))}
        </fieldset>
        <fieldset className="choice">
          <legend>{t.options.notation}</legend>
          {(['short', 'scientific'] as const).map((notation) => (
            <label key={notation}>
              <input
                type="radio"
                name="notation"
                checked={settings.notation === notation}
                onChange={() => change({ notation })}
              />
              {notation === 'short' ? t.options.notationShort : t.options.notationScientific}
            </label>
          ))}
        </fieldset>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) => change({ reducedMotion: event.target.checked })}
          />
          {t.options.reducedMotion}
        </label>
        <p className="hint">{t.options.reducedMotionHint}</p>
        <label className="toggle">
          <input
            type="checkbox"
            checked={renderer === 'pixi'}
            onChange={(event) => setMapRenderer(event.target.checked ? 'pixi' : 'svg')}
          />
          {t.options.enhancedMap}
        </label>
        <p className="hint">{t.options.enhancedMapHint}</p>
      </section>

      <section>
        <h3>{t.options.soundTitle}</h3>
        <label className="range">
          {t.options.volume}
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(settings.volume * 100)}
            disabled={settings.muted}
            onChange={(event) => change({ volume: Number(event.target.value) / 100 })}
          />
          <span className="range-value" aria-hidden="true">
            {Math.round(settings.volume * 100)}
          </span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(event) => change({ muted: event.target.checked })}
          />
          {t.options.muted}
        </label>
        <p className="hint">{t.options.soundHint}</p>
      </section>

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
        <button type="button" className="ghost" disabled={importText.trim() === ''} onClick={load}>
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
    </Dialog>
  );
}
