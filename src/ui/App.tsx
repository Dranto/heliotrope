import { useCallback, useState } from 'react';
import { formatNumber, formatPercent } from '../game/format';
import { lightPerSecond } from '../game/production';
import {
  canStartNewSeason,
  isSeasonsScreenUnlocked,
  seedBonus,
  seedsToGain,
} from '../game/seasons';
import { t } from '../i18n/fr';
import { Flower } from './Flower';
import { Generators } from './Generators';
import { Options } from './Options';
import { Scene } from './Scene';
import { Seasons } from './Seasons';
import { Stats } from './Stats';
import { Upgrades } from './Upgrades';
import { useGameState, useGameStore } from './useGame';

type Screen = 'seasons' | 'stats' | 'options';

function SeedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21v-8M12 15c-4 0-6.5-2.5-7-6 4 0 6.5 2.5 7 6ZM12 13c3.2 0 5.3-2 5.8-5-3.3 0-5.3 2-5.8 5Z" />
    </svg>
  );
}

export function App() {
  const store = useGameStore();
  const state = useGameState();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [showWelcome, setShowWelcome] = useState(
    store.offlineSeconds >= 60 && store.offlineLight >= 1,
  );

  const closeScreen = useCallback(() => setScreen(null), []);
  const gain = seedsToGain(state);

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
          {state.seeds > 0 && (
            <span
              className="counter-seeds"
              data-testid="seeds-chip"
              title={t.seeds.chip(formatNumber(state.seeds), formatPercent(seedBonus(state.seeds)))}
            >
              <SeedIcon />
              {formatNumber(state.seeds)}
              <span className="visually-hidden">
                {' '}
                {t.seeds.chip(formatNumber(state.seeds), formatPercent(seedBonus(state.seeds)))}
              </span>
            </span>
          )}
        </div>
        <nav className="menu" aria-label={t.menu}>
          {isSeasonsScreenUnlocked(state) && (
            <button
              type="button"
              className="ghost menu-button seasons-button"
              aria-haspopup="dialog"
              aria-label={gain > 0 ? t.seeds.openWithGain(formatNumber(gain)) : undefined}
              data-ready={canStartNewSeason(state)}
              onClick={() => setScreen('seasons')}
            >
              <SeedIcon />
              {t.seeds.open}
              {gain > 0 && (
                <span className="menu-badge" aria-hidden="true">
                  +{formatNumber(gain)}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            className="ghost menu-button"
            aria-haspopup="dialog"
            onClick={() => setScreen('stats')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 20V11M12 20V5M19 20v-6" />
            </svg>
            {t.stats.open}
          </button>
          <button
            type="button"
            className="ghost menu-button"
            aria-haspopup="dialog"
            onClick={() => setScreen('options')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
            {t.options.open}
          </button>
        </nav>
      </header>
      <p className="tagline">{t.tagline}</p>

      {showWelcome && (
        <div className="notice" role="status">
          <p>
            {t.welcomeBack(
              formatNumber(Math.floor(store.offlineLight)),
              t.duration(store.offlineSeconds),
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
        <div className="column">
          <Upgrades />
          <Generators />
        </div>
      </main>

      {screen === 'seasons' && <Seasons onClose={closeScreen} />}
      {screen === 'stats' && <Stats onClose={closeScreen} />}
      {screen === 'options' && <Options onClose={closeScreen} />}
    </div>
  );
}
