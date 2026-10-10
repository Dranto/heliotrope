import { useState } from 'react';
import { formatNumber } from '../game/format';
import { lightPerSecond } from '../game/tick';
import { t } from '../i18n/fr';
import { Flower } from './Flower';
import { Generators } from './Generators';
import { Scene } from './Scene';
import { useGameState, useGameStore } from './useGame';

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? t.minutes(minutes) : t.hours(Math.floor(minutes / 60), minutes % 60);
}

export function App() {
  const store = useGameStore();
  const state = useGameState();
  const [showWelcome, setShowWelcome] = useState(
    store.offlineSeconds >= 60 && store.offlineLight >= 1,
  );

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
            <circle cx="16" cy="16" r="6" />
            <path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l3.5 3.5M21.5 21.5 25 25M7 25l3.5-3.5M21.5 10.5 25 7" />
          </svg>
          {t.title}
        </h1>
        <div className="counter" role="status" aria-live="off">
          <span className="counter-amount">
            <span aria-hidden="true">☀ </span>
            <span data-testid="light">{formatNumber(Math.floor(state.resources.light))}</span>{' '}
            <span className="counter-unit">{t.light}</span>
          </span>
          <span className="counter-rate" data-testid="light-rate">
            +{formatNumber(lightPerSecond(state))} {t.perSecond}
          </span>
        </div>
      </header>
      <p className="tagline">{t.tagline}</p>

      {showWelcome && (
        <div className="notice" role="status">
          <p>
            {t.welcomeBack(
              formatNumber(Math.floor(store.offlineLight)),
              formatDuration(store.offlineSeconds),
            )}
          </p>
          <button type="button" className="ghost" onClick={() => setShowWelcome(false)}>
            {t.dismiss}
          </button>
        </div>
      )}

      <main className="layout">
        <Flower />
        <Scene />
        <Generators />
      </main>
    </div>
  );
}
