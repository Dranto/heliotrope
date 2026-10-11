import { useCallback, useEffect, useRef, useState } from 'react';
import { cycleWater, isBioregionOpen, waterPerSecond } from '../game/bioregion';
import { activeChallenge } from '../game/challenges';
import { activeCycleChallenge } from '../game/cycleChallenges';
import {
  canStartNewCycle,
  isCycleScreenUnlocked,
  sourceBonus,
  sourcesToGain,
} from '../game/cycles';
import type { CatchResult } from '../game/butterfly';
import { VISIT_EFFECTS, type WelcomeResult } from '../game/visits';
import { formatNumber, formatPercent, setNotation } from '../game/format';
import { phaseOf } from '../game/phases';
import { fleaMarketGenerator, lightPerSecond } from '../game/production';
import { NextGoal } from './Goals';
import {
  canStartNewSeason,
  isSeasonsScreenUnlocked,
  seedBonus,
  seedsToGain,
} from '../game/seasons';
import type { ParcelId } from '../game/parcels';
import type { GameState } from '../game/state';
import { availableSeeds, canSowInTree } from '../game/talents';
import {
  challengeRulesText,
  challengeTitle,
  cycleChallengeRulesText,
  cycleChallengeTitle,
  speciesName,
} from '../i18n/herbier';
import { setLanguage, t } from '../i18n';
import { Achievements } from './Achievements';
import { Bioregion, WaterIcon } from './Bioregion';
import { Cooperatives } from './Cooperatives';
import { Cycles } from './Cycles';
import { Generators } from './Generators';
import { Herbier } from './Herbier';
import { useLayoutPref } from './layoutPrefs';
import { MilestoneBloom } from './MilestoneBloom';
import { Options } from './Options';
import { Restoration } from './Restoration';
import { Garden } from './Garden';
import { GreatWorks } from './GreatWorks';
import { Orchard } from './Orchard';
import { harvest } from '../game/garden';
import { Scene } from './Scene';
import { Seasons } from './Seasons';
import { SeasonTree } from './SeasonTree';
import { SpeciesArt } from './SpeciesArt';
import { Stats } from './Stats';
import { Upgrades } from './Upgrades';
import { useGameState, useGameStore } from './useGame';
import { useSounds } from './useSounds';
import { useMusic } from './useMusic';
import { useReminders } from './useReminders';
import type { OfflineReport } from '../game/offline';
import { isRipe } from '../game/garden';

type Screen = 'achievements' | 'herbier' | 'seasons' | 'tree' | 'cycles' | 'stats' | 'options';
/** §10.3: mobile tab bar sections. */
type Tab = 'harvest' | 'build' | 'improve' | 'more';
const TABS: Tab[] = ['harvest', 'build', 'improve', 'more'];

interface Toast {
  id: number;
  text: string;
}

/** How long a notification stays on screen. */
const TOAST_MS = 5000;

/** The return in images (§9.1): what grew while away, with today's numbers only. */
function WelcomeReport({ report, state }: { report: OfflineReport; state: GameState }) {
  const ripe = state.garden.plots.filter(isRipe).length;
  const chips = [
    ...report.built.map((id) => `${t.generators[id].name} · ${formatNumber(state.generators[id])}`),
    ...(report.ripened.length > 0 && ripe > 0 ? [t.welcomeReport.crops(ripe)] : []),
    ...(report.seedsRipened ? [t.welcomeReport.seeds(formatNumber(seedsToGain(state)))] : []),
    ...(report.seasons > 0 ? [t.welcomeReport.seasons(report.seasons)] : []),
  ];
  if (chips.length === 0) return null;
  return (
    <ul className="welcome-report" aria-label={t.welcomeReport.label}>
      {chips.map((chip) => (
        <li key={chip}>{chip}</li>
      ))}
    </ul>
  );
}

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

/** A young tree with three branches, the mark of the Tree of Seasons. */
function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21v-9M12 15l-4-3M12 13l4-3M12 21c-2 0-3.5.6-4.5 1.5M12 21c2 0 3.5.6 4.5 1.5" />
      <circle cx="12" cy="7" r="3.2" />
      <circle cx="6.8" cy="10.6" r="2.2" />
      <circle cx="17.2" cy="9.6" r="2.2" />
    </svg>
  );
}

/** A spring and its rings, the mark of the Water Cycle (§7.4). */
function SpringIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c-2.4 3.4-4.4 5.8-4.4 8.2a4.4 4.4 0 0 0 8.8 0C16.4 8.8 14.4 6.4 12 3Z" />
      <path d="M4 19.5c2.6 1.4 5.2 1.4 8 0s5.4-1.4 8 0" />
    </svg>
  );
}

/** The Tree of Seasons opens with the first Seed (§7.1). */
function treeUnlocked(state: GameState): boolean {
  return state.seeds > 0;
}

/** The Herbier opens with the first species back (§9.5), or after the first Season. */
function herbierUnlocked(state: GameState): boolean {
  return state.species.length > 0 || state.seasons > 0;
}

/** A pressed leaf, the mark of the Herbier. */
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14ZM5 19l9-9M9 15h3.5M12 12V8.5" />
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
  const [highlight, setHighlight] = useState<ParcelId | null>(null);
  const [sideOpen, setSideOpen] = useLayoutPref('side', true);
  const [showWelcome, setShowWelcome] = useState(
    store.offlineSeconds >= 60 && store.offlineLight >= 1,
  );
  useSounds(state);
  useMusic(state);
  useReminders(state);
  // Every number on screen follows the notation chosen in the Options (§8), every text the
  // language (§14 Q1).
  setNotation(state.settings.notation);
  setLanguage(state.settings.language);
  const { language } = state.settings;
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const closeScreen = useCallback(() => setScreen(null), []);
  const notify = useCallback((text: string) => {
    const id = nextToastId++;
    setToasts((list) => [...list.slice(-3), { id, text }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), TOAST_MS);
  }, []);

  // Announce species as they come back (§9.5) and challenges as they are won (§7.3).
  const seenSpecies = useRef(state.species.length);
  useEffect(() => {
    const fresh = state.species.slice(seenSpecies.current);
    seenSpecies.current = state.species.length;
    if (fresh.length > 3) notify(t.herbier.returnedMany(formatNumber(fresh.length)));
    else for (const id of fresh) notify(t.herbier.returned(speciesName(id)));
  }, [state.species, notify]);
  const seenChallenges = useRef(state.challenges.length);
  useEffect(() => {
    const fresh = state.challenges.slice(seenChallenges.current);
    seenChallenges.current = state.challenges.length;
    for (const id of fresh) notify(t.challenges.won(challengeTitle(id)));
  }, [state.challenges, notify]);
  const seenCycleChallenges = useRef(state.cycleChallenges.length);
  useEffect(() => {
    const fresh = state.cycleChallenges.slice(seenCycleChallenges.current);
    seenCycleChallenges.current = state.cycleChallenges.length;
    for (const id of fresh) notify(t.cycleChallenges.won(cycleChallengeTitle(id)));
  }, [state.cycleChallenges, notify]);

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

  // §9.7: harvest a ripe bed of the courtyard garden, from the map or from its panel.
  const onHarvest = useCallback(
    (index: number) => {
      const result = harvest(store.getState(), index);
      if (!result) return;
      store.dispatch(() => result.state);
      const { gain } = result;
      if (gain.kind === 'butterfly') notify(t.garden.harvested.butterfly);
      else if (gain.kind === 'effect') {
        notify(t.garden.harvested.effect(t.duration(Math.ceil(gain.seconds))));
      } else if (gain.water > 0) {
        notify(
          t.garden.harvested.lightWater(
            formatNumber(Math.floor(gain.light)),
            formatNumber(Math.floor(gain.water)),
          ),
        );
      } else notify(t.garden.harvested.light(formatNumber(Math.floor(gain.light))));
      if (result.variety) notify(t.garden.variety(t.garden.varieties[result.variety]));
    },
    [store, notify],
  );

  const onVisit = useCallback(
    ({ state: next, kind, gift }: WelcomeResult) => {
      if (kind === 'cuttings') {
        if (gift) notify(t.visits.cuttings(gift.units, t.generators[gift.generator].name));
        return;
      }
      const effect = next.effects.find((e) => e.kind === VISIT_EFFECTS[kind]);
      const seconds = t.duration(Math.ceil(effect?.remaining ?? 0));
      if (kind === 'fleaMarket') {
        const generator = fleaMarketGenerator(next);
        if (generator) notify(t.visits.fleaMarket(t.generators[generator].name, seconds));
        return;
      }
      notify(t.visits[kind](seconds));
    },
    [notify],
  );

  const challenge = activeChallenge(state);
  const challengeProgress = challenge ? Math.min(1, state.totalLight / challenge.goal) : 0;
  const cycleChallenge = activeCycleChallenge(state);
  const cycleChallengeProgress = cycleChallenge
    ? Math.min(1, cycleWater(state) / cycleChallenge.goal)
    : 0;
  const gain = seedsToGain(state);
  const seedsToSow = availableSeeds(state);
  const canSow = canSowInTree(state);
  const sourceGain = sourcesToGain(state);

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
          {/* Re-mounted on each new Milestone, so the count glints once (§9.3). */}
          <span key={state.achievements.length} className="menu-count" aria-hidden="true">
            {state.achievements.length}
          </span>
        </button>
      )}
      {herbierUnlocked(state) && (
        <button
          type="button"
          className="ghost menu-button"
          aria-haspopup="dialog"
          onClick={() => setScreen('herbier')}
        >
          <LeafIcon />
          {t.herbier.open}
          <span className="menu-count" aria-hidden="true">
            {state.species.length}
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
      {treeUnlocked(state) && (
        <button
          type="button"
          className="ghost menu-button tree-button"
          aria-haspopup="dialog"
          aria-label={canSow ? t.tree.openWithSeeds(formatNumber(seedsToSow)) : undefined}
          data-ready={canSow}
          onClick={() => setScreen('tree')}
        >
          <TreeIcon />
          {t.tree.open}
          {canSow && (
            <span className="menu-badge" aria-hidden="true">
              {formatNumber(seedsToSow)}
            </span>
          )}
        </button>
      )}
      {isCycleScreenUnlocked(state) && (
        <button
          type="button"
          className="ghost menu-button seasons-button cycles-button"
          aria-haspopup="dialog"
          aria-label={sourceGain > 0 ? t.cycles.openWithGain(formatNumber(sourceGain)) : undefined}
          data-ready={canStartNewCycle(state)}
          onClick={() => setScreen('cycles')}
        >
          <SpringIcon />
          {t.cycles.open}
          {sourceGain > 0 && (
            <span className="menu-badge" aria-hidden="true">
              +{formatNumber(sourceGain)}
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
      data-side={sideOpen ? 'open' : 'closed'}
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
          <NextGoal />
          {state.seeds > 0 && (
            <span
              className="counter-seeds"
              data-testid="seeds-chip"
              title={t.seeds.chip(
                formatNumber(state.seeds),
                formatPercent(seedBonus(state.seeds, state.sources)),
              )}
            >
              <SeedIcon />
              {formatNumber(state.seeds)}
              <span className="visually-hidden">
                {' '}
                {t.seeds.chip(
                  formatNumber(state.seeds),
                  formatPercent(seedBonus(state.seeds, state.sources)),
                )}
              </span>
            </span>
          )}
          {isBioregionOpen(state) && (
            <span
              className="counter-water"
              data-testid="water-chip"
              title={t.bioregion.chip(
                formatNumber(Math.floor(state.resources.water)),
                formatNumber(waterPerSecond(state)),
              )}
            >
              <WaterIcon />
              {formatNumber(Math.floor(state.resources.water))}
              <span className="visually-hidden">
                {' '}
                {t.bioregion.chip(
                  formatNumber(Math.floor(state.resources.water)),
                  formatNumber(waterPerSecond(state)),
                )}
              </span>
            </span>
          )}
          {state.sources > 0 && (
            <span
              className="counter-seeds counter-sources"
              data-testid="sources-chip"
              title={t.cycles.chip(
                formatNumber(state.sources),
                formatPercent(sourceBonus(state.sources)),
              )}
            >
              <SpringIcon />
              {formatNumber(state.sources)}
              <span className="visually-hidden">
                {' '}
                {t.cycles.chip(
                  formatNumber(state.sources),
                  formatPercent(sourceBonus(state.sources)),
                )}
              </span>
            </span>
          )}
          {challenge && (
            <span
              className="challenge-chip"
              data-testid="challenge-chip"
              title={challengeRulesText(challenge)}
            >
              <SpeciesArt id={challenge.species} />
              {challengeTitle(challenge.id)}
              <span className="challenge-meter" aria-hidden="true">
                <span style={{ width: `${challengeProgress * 100}%` }} />
              </span>
              <span className="visually-hidden">
                {t.challenges.progress(
                  challengeTitle(challenge.id),
                  formatPercent(challengeProgress),
                )}
              </span>
            </span>
          )}
          {cycleChallenge && (
            <span
              className="challenge-chip"
              data-testid="cycle-challenge-chip"
              title={cycleChallengeRulesText(cycleChallenge)}
            >
              <SpeciesArt id={cycleChallenge.species} />
              {cycleChallengeTitle(cycleChallenge.id)}
              <span className="challenge-meter" aria-hidden="true">
                <span style={{ width: `${cycleChallengeProgress * 100}%` }} />
              </span>
              <span className="visually-hidden">
                {t.cycleChallenges.progress(
                  cycleChallengeTitle(cycleChallenge.id),
                  formatPercent(cycleChallengeProgress),
                )}
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
            <WelcomeReport report={store.offlineReport} state={state} />
          </div>
          <button type="button" className="ghost" onClick={() => setShowWelcome(false)}>
            {t.dismiss}
          </button>
        </div>
      )}

      {/* Memoised drawings keep their texts until their props change: redraw on a new language. */}
      <main className="layout" key={language}>
        <Scene onCatch={onCatch} onVisit={onVisit} onHarvest={onHarvest} highlight={highlight} />
        <aside className="side" aria-label={t.layout.panels}>
          <button
            type="button"
            className="ghost icon side-toggle"
            aria-expanded={sideOpen}
            aria-controls="side-panels"
            aria-label={sideOpen ? t.layout.hidePanels : t.layout.showPanels}
            title={sideOpen ? t.layout.hidePanels : t.layout.showPanels}
            onClick={() => setSideOpen(!sideOpen)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={sideOpen ? 'M10 7l5 5-5 5' : 'M14 7l-5 5 5 5'} />
            </svg>
          </button>
          <div className="side-panels" id="side-panels">
            <div className="side-column">
              <Upgrades />
              <Restoration onHighlight={setHighlight} />
              <Garden onHarvest={onHarvest} />
              <Orchard />
              <GreatWorks />
            </div>
            <div className="side-column">
              <Generators />
              <Bioregion />
              <Cooperatives />
            </div>
          </div>
        </aside>
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

      <MilestoneBloom />

      {screen === 'achievements' && <Achievements onClose={closeScreen} />}
      {screen === 'herbier' && <Herbier onClose={closeScreen} />}
      {screen === 'seasons' && (
        <Seasons onClose={closeScreen} onOpenTree={() => setScreen('tree')} />
      )}
      {screen === 'tree' && <SeasonTree onClose={closeScreen} />}
      {screen === 'cycles' && <Cycles onClose={closeScreen} />}
      {screen === 'stats' && <Stats onClose={closeScreen} />}
      {screen === 'options' && <Options onClose={closeScreen} />}
    </div>
  );
}
