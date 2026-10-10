import { useCallback, useEffect, useRef, useState } from 'react';
import { ACHIEVEMENTS } from '../game/achievements';
import type { CatchResult } from '../game/butterfly';
import { formatNumber, formatPercent, setNotation } from '../game/format';
import { phaseOf } from '../game/phases';
import { lightPerSecond } from '../game/production';
import {
  canStartNewSeason,
  isSeasonsScreenUnlocked,
  seedBonus,
  seedsToGain,
} from '../game/seasons';
import type { GameState } from '../game/state';
import { achievementName } from '../i18n/achievements';
import { t } from '../i18n/fr';
import { Achievements } from './Achievements';
import { Flower } from './Flower';
import { Generators } from './Generators';
import { Options } from './Options';
import { Scene } from './Scene';
import { Seasons } from './Seasons';
import { Stats } from './Stats';
import { Upgrades } from './Upgrades';
import { useGameState, useGameStore } from './useGame';

type Screen = 'achievements' | 'seasons' | 'stats' | 'options';
/** §10.3: mobile tab bar sections. */
type Tab = 'harvest' | 'build' | 'improve' | 'more';
const TABS: Tab[] = ['harvest', 'build', 'improve', 'more'];

interface Toast {
  id: number;
  text: string;
}

/** How long a notification stays on screen. */
const TOAST_MS = 5000;

function SeedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21v-8M12 15c-4 0-6.5-2.5-7-6 4 0 6.5 2.5 7 6ZM12 13c3.2 0 5.3-2 5.8-5-3.3 0-5.3 2-5.8 5Z" />
    </svg>
  );
}

function TabIcon({ tab }: { tab: Tab }) {
  const paths: Record<Tab, string> = {
    harvest:
      'M12 21v-7M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM12 3v2M5 11H3M21 11h-2M6.5 5.5 8 7M17.5 5.5 16 7',
    build: 'M4 20V10l5-4 5 4v10M14 20V6l6-2v16M3 20h18',
    improve: 'M12 20V8M7 13l5-5 5 5M6 4h12',
    more: 'M5 11.2v1.6M12 11.2v1.6M19 11.2v1.6',
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[tab]} />
    </svg>
  );
}

/** The Milestones screen opens from phase 2 (§10.2), or as soon as one is unlocked. */
function achievementsUnlocked(state: GameState): boolean {
  return phaseOf(state) >= 2 || state.achievements.length > 0 || state.seasons > 0;
}

let nextToastId = 0;

export function App() {
  const store = useGameStore();
  const state = useGameState();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [tab, setTab] = useState<Tab>('harvest');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showWelcome, setShowWelcome] = useState(
    store.offlineSeconds >= 60 && store.offlineLight >= 1,
  );
  // Every number on screen follows the notation chosen in the Options (§8).
  setNotation(state.settings.notation);

  const closeScreen = useCallback(() => setScreen(null), []);
  const notify = useCallback((text: string) => {
    const id = nextToastId++;
    setToasts((list) => [...list.slice(-3), { id, text }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), TOAST_MS);
  }, []);

  // Announce Milestones as they unlock, but not the ones already earned when the game loads.
  const seenAchievements = useRef(state.achievements.length);
  useEffect(() => {
    const fresh = state.achievements.slice(seenAchievements.current);
    seenAchievements.current = state.achievements.length;
    if (fresh.length > 3) notify(t.achievements.unlockedMany(formatNumber(fresh.length)));
    else for (const id of fresh) notify(t.achievements.unlocked(achievementName(ACHIEVEMENTS[id])));
  }, [state.achievements, notify]);

  const onCatch = useCallback(
    ({ outcome, light }: CatchResult) => {
      notify(
        outcome === 'harvest'
          ? t.butterfly.harvest(formatNumber(Math.floor(light)))
          : t.butterfly[outcome],
      );
    },
    [notify],
  );

  const gain = seedsToGain(state);

  const menu = (
    <nav className="menu" aria-label={t.menu}>
      {achievementsUnlocked(state) && (
        <button
          type="button"
          className="ghost menu-button"
          aria-haspopup="dialog"
          onClick={() => setScreen('achievements')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="10" r="6" />
            <path d="M9 15.5 8 21l4-2 4 2-1-5.5" />
          </svg>
          {t.achievements.open}
          <span className="menu-count" aria-hidden="true">
            {state.achievements.length}
          </span>
        </button>
      )}
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
  );

  return (
    <div
      className="app"
      data-tab={tab}
      data-motion={state.settings.reducedMotion ? 'reduced' : undefined}
    >
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
          {state.effects.length > 0 && (
            <span className="effects" aria-label={t.butterfly.effects}>
              {state.effects.map((effect) => (
                <span key={effect.kind} className="effect-chip" data-kind={effect.kind}>
                  {t.butterfly.effect[effect.kind](t.duration(Math.ceil(effect.remaining)))}
                </span>
              ))}
            </span>
          )}
        </div>
        {menu}
      </header>
      <p className="tagline">{t.tagline}</p>

      {showWelcome && (
        <div className="notice" role="status">
          <div>
            <h2>{t.welcomeTitle}</h2>
            <p>
              {t.welcomeBack(
                formatNumber(Math.floor(store.offlineLight)),
                t.duration(store.offlineSeconds),
              )}
            </p>
          </div>
          <button type="button" className="ghost" onClick={() => setShowWelcome(false)}>
            {t.dismiss}
          </button>
        </div>
      )}

      <main className="layout">
        <Flower />
        <Scene onCatch={onCatch} />
        <div className="column">
          <Upgrades />
          <Generators />
        </div>
      </main>

      <nav className="tabbar" aria-label={t.tabs.label}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            <TabIcon tab={id} />
            {t.tabs[id]}
          </button>
        ))}
      </nav>

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className="toast">
            {toast.text}
          </p>
        ))}
        {state.butterfly.visible > 0 && (
          <span className="visually-hidden">{t.butterfly.arrives}</span>
        )}
      </div>

      {screen === 'achievements' && <Achievements onClose={closeScreen} />}
      {screen === 'seasons' && <Seasons onClose={closeScreen} />}
      {screen === 'stats' && <Stats onClose={closeScreen} />}
      {screen === 'options' && <Options onClose={closeScreen} />}
    </div>
  );
}
