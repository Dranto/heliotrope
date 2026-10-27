import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { isBioregionOpen, waterPerSecond } from '../game/bioregion';
import {
  canStartNewCycle,
  isCycleScreenUnlocked,
  sourceBonus,
  sourcesToGain,
} from '../game/cycles';
import type { CatchResult } from '../game/butterfly';
import { VISIT_EFFECTS, type WelcomeResult } from '../game/visits';
import { ACHIEVEMENT_LIST } from '../game/achievements';
import { formatNumber, formatPercent, setNotation } from '../game/format';
import { SPECIES_LIST } from '../game/species';
import { arrivedFeature } from '../game/introductions';
import { isAchievementsScreenOpen, isHerbierOpen, isTreeOpen } from '../game/onboarding';
import { fleaMarketGenerator, lightPerSecond } from '../game/production';
import { NextGoal } from './Goals';
import {
  canStartNewSeason,
  isSeasonsScreenUnlocked,
  seedBonus,
  seedsToGain,
} from '../game/seasons';
import {
  markPanelSeen,
  PANEL_IDS,
  PANEL_LAYER,
  panelHasAction,
  shownLayers,
  shownPanels,
  unseenPanels,
  type LayerId,
  type PanelId,
} from '../game/panels';
import type { ParcelId } from '../game/parcels';
import type { GameState } from '../game/state';
import { availableSeeds, canSowInTree } from '../game/talents';
import { speciesName } from '../i18n/herbier';
import { setLanguage, shownLanguage, subscribeTexts, t, textsVersion } from '../i18n';
import { Bioregion, WaterIcon } from './Bioregion';
import { Cooperatives } from './Cooperatives';
import { Generators } from './Generators';
import { useLayoutPref } from './layoutPrefs';
import { MilestoneBloom } from './MilestoneBloom';
import { Options } from './Options';
import { Restoration } from './Restoration';
import { Garden } from './Garden';
import { areCitiesOpen, canSwarm } from '../game/cities';
import { harvest, harvestAll } from '../game/garden';
import { Scene } from './Scene';
import { Upgrades } from './Upgrades';
import { isPanelHidden, useScreen, type SleepingPanel } from './panelVisibility';
import { useGameState, useGameStore } from './useGame';
import { useSounds } from './useSounds';
import { useMusic } from './useMusic';
import { useReminders } from './useReminders';
import type { OfflineReport } from '../game/offline';
import { isRipe } from '../game/garden';

// The screens load on first opening (M25), so the map shows sooner on a phone.
const Achievements = lazy(() =>
  import('./Achievements').then((m) => ({ default: m.Achievements })),
);
const Herbier = lazy(() => import('./Herbier').then((m) => ({ default: m.Herbier })));
const Seasons = lazy(() => import('./Seasons').then((m) => ({ default: m.Seasons })));
const SeasonTree = lazy(() => import('./SeasonTree').then((m) => ({ default: m.SeasonTree })));
const Cycles = lazy(() => import('./Cycles').then((m) => ({ default: m.Cycles })));
const Cities = lazy(() => import('./Cities').then((m) => ({ default: m.Cities })));
const Stats = lazy(() => import('./Stats').then((m) => ({ default: m.Stats })));

type Screen =
  'achievements' | 'herbier' | 'seasons' | 'tree' | 'cycles' | 'cities' | 'stats' | 'options';
/** §10.1, §10.3: the sections of the side menu; the phone's tab bar shows each one. */
type Tab = 'build' | 'improve' | 'living' | 'region' | 'more';
const TABS: Tab[] = ['build', 'improve', 'living', 'region', 'more'];
/** The panels each section shows; on a wider screen, build and improve form the city. */
const TAB_PANELS: Record<Tab, PanelId[]> = {
  build: ['generators', 'cooperatives'],
  improve: ['upgrades', 'restoration'],
  living: ['garden'],
  region: ['bioregion'],
  more: [],
};
const TAB_LAYER: Record<Tab, LayerId> = {
  build: 'city',
  improve: 'city',
  living: 'living',
  region: 'region',
  more: 'city',
};
const LAYER_TAB: Record<LayerId, Tab> = { city: 'build', living: 'living', region: 'region' };
/** The class of each panel's section, to know which one the player touched. */
const PANEL_CLASS: Record<PanelId, string> = {
  upgrades: 'upgrades',
  generators: 'generators',
  restoration: 'restoration',
  cooperatives: 'cooperatives',
  garden: 'garden-panel',
  bioregion: 'bioregion',
};

/**
 * How many of a screen's entries are reached, on its menu button: "32/159", and to screen
 * readers "32 sur 159" after the button's name.
 */
function MenuCount({ count, total }: { count: number; total: number }) {
  const text = t.achievements.familyCount(formatNumber(count), formatNumber(total));
  return (
    <span className="menu-count">
      <span className="visually-hidden">, {text}</span>
      <span aria-hidden="true">
        {formatNumber(count)}
        <span className="menu-count-total">/{formatNumber(total)}</span>
      </span>
    </span>
  );
}

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
    // The sky changed while away (M33): what reigns now, and what comes.
    ...(report.weathers.length > 0
      ? [
          t.weather.forecast(
            t.weather.names[state.weather.current],
            state.weather.forecast.map((id) => t.weather.names[id]).join(', '),
          ),
        ]
      : []),
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

const SeedIcon = memo(function SeedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21v-8M12 15c-4 0-6.5-2.5-7-6 4 0 6.5 2.5 7 6ZM12 13c3.2 0 5.3-2 5.8-5-3.3 0-5.3 2-5.8 5Z" />
    </svg>
  );
});

const TAB_PATHS: Record<Tab | LayerId, string> = {
  build: 'M4 20V10l5-4 5 4v10M14 20V6l6-2v16M3 20h18',
  improve: 'M12 20V8M7 13l5-5 5 5M6 4h12',
  city: 'M4 20V10l5-4 5 4v10M14 20V6l6-2v16M3 20h18',
  living:
    'M12 21v-7M12 14c-4 0-6-2.5-6.5-6 4 0 6 2.5 6.5 6ZM12 12c3.5 0 5.5-2.2 6-5.5-3.5 0-5.5 2.2-6 5.5Z',
  region: 'M3 18c3-4 5-6 8-6s4 3 6 3 3-1 4-2M3 12l5-6 4 4 3-3 6 6M3 21h18',
  more: 'M5 11.2v1.6M12 11.2v1.6M19 11.2v1.6',
};

const TabIcon = memo(function TabIcon({ tab }: { tab: Tab | LayerId }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={TAB_PATHS[tab]} />
    </svg>
  );
});

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

function CitiesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 20v-6l3-2.4L9 14v6M15 20v-6l3-2.4 3 2.4v6M9 20V9l3-3 3 3v11M2 20h20" />
    </svg>
  );
}

/** A pressed leaf, the mark of the Herbier. */
function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14ZM5 19l9-9M9 15h3.5M12 12V8.5" />
    </svg>
  );
}

let nextToastId = 0;

/** Space kept above the first panel when a phone tab scrolls back to it, in CSS pixels. */
const TAB_SCROLL_MARGIN = 12;

export function App() {
  const store = useGameStore();
  const state = useGameState();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [savedTab, setTab] = useLayoutPref<Tab>('tab', 'build');
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
  // English arrives after a first choice of it (lot 4): render again when it does.
  useSyncExternalStore(subscribeTexts, textsVersion);
  setLanguage(state.settings.language);
  const language = shownLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const closeScreen = useCallback(() => setScreen(null), []);
  const notify = useCallback((text: string) => {
    const id = nextToastId++;
    setToasts((list) => [...list.slice(-3), { id, text }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), TOAST_MS);
  }, []);

  // Announce species as they come back (§9.5).
  const seenSpecies = useRef(state.species.length);
  useEffect(() => {
    const fresh = state.species.slice(seenSpecies.current);
    seenSpecies.current = state.species.length;
    if (fresh.length > 3) notify(t.herbier.returnedMany(formatNumber(fresh.length)));
    else for (const id of fresh) notify(t.herbier.returned(speciesName(id)));
  }, [state.species, notify]);

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
      else if (gain.kind === 'pollen') notify(t.garden.harvested.pollen);
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

  // M32: harvest everything ripe in the garden, and sow the same crops again.
  const onHarvestAll = useCallback(() => {
    const result = harvestAll(store.getState());
    if (!result) return;
    store.dispatch(() => result.state);
    notify(t.garden.harvested.all(result.crops.length));
    for (const { variety } of result.crops) {
      if (variety) notify(t.garden.variety(t.garden.varieties[variety]));
    }
  }, [store, notify]);

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

  const gain = seedsToGain(state);
  const seedsToSow = availableSeeds(state);
  const canSow = canSowInTree(state);
  const sourceGain = sourcesToGain(state);

  // §10.1 (M25): the side menu by layers, opened as the player reaches them. A panel the player
  // has not touched yet glows, and its section's tab carries a gold dot until it is opened.
  const layers = shownLayers(state);
  const isTabShown = (id: Tab) => TAB_LAYER[id] === 'city' || layers.includes(TAB_LAYER[id]);
  const tab: Tab = isTabShown(savedTab) ? savedTab : 'build';
  const layer = TAB_LAYER[tab];
  const unseen = unseenPanels(state);
  const withAction = shownPanels(state).filter((id) => panelHasAction(state, id));
  const isFresh = (panels: readonly PanelId[]) => panels.some((id) => unseen.includes(id));
  const screenSize = useScreen();
  // A screen covers the map, or the phone shows the "more" tab without it: the map rests
  // (docs/performance-plan.md, lot 3).
  // On the phone "Plus" tab the screen tiles are the page's content, so they move into <main>.
  const menuInMain = screenSize === 'phone' && tab === 'more';
  const mapPaused = screen !== null || menuInMain;
  const awake = (panel: SleepingPanel) => !isPanelHidden(panel, screenSize, tab);
  // On a phone the tabs share one page: a tab picked from far down opens at its first panel,
  // not wherever the previous, longer tab had been scrolled to.
  const tabPicked = useRef(false);
  useLayoutEffect(() => {
    if (!tabPicked.current) return;
    tabPicked.current = false;
    const panels = document.getElementById('side-panels');
    if (!panels || tab === 'more') return;
    const top = Math.max(
      0,
      panels.getBoundingClientRect().top + window.scrollY - TAB_SCROLL_MARGIN,
    );
    if (window.scrollY > top) window.scrollTo({ top });
  }, [tab]);
  const layerPanels = (id: LayerId) => PANEL_IDS.filter((panel) => PANEL_LAYER[panel] === id);
  const touchPanel = (target: EventTarget) => {
    const section = target instanceof Element ? target.closest('section.panel') : null;
    const id = unseen.find((panel) => section?.classList.contains(PANEL_CLASS[panel]));
    if (id) store.dispatch((s) => markPanelSeen(s, id));
  };

  const menu = (
    <nav className="menu" aria-label={t.menu}>
      {isAchievementsScreenOpen(state) && (
        <button
          type="button"
          className="ghost menu-button achievements-button"
          aria-haspopup="dialog"
          onClick={() => setScreen('achievements')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="10" r="6" />
            <path d="M9 15.5 8 21l4-2 4 2-1-5.5" />
          </svg>
          {t.achievements.open}
          {/* Re-mounted on each new Milestone, so the count glints once (§9.3). */}
          <MenuCount
            key={state.achievements.length}
            count={state.achievements.length}
            total={ACHIEVEMENT_LIST.length}
          />
        </button>
      )}
      {isHerbierOpen(state) && (
        <button
          type="button"
          className="ghost menu-button herbier-button"
          aria-haspopup="dialog"
          onClick={() => setScreen('herbier')}
        >
          <LeafIcon />
          {t.herbier.open}
          <MenuCount count={state.species.length} total={SPECIES_LIST.length} />
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
      {isTreeOpen(state) && (
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
      {areCitiesOpen(state) && (
        <button
          type="button"
          className="ghost menu-button cities-button"
          aria-haspopup="dialog"
          data-ready={canSwarm(state)}
          onClick={() => setScreen('cities')}
        >
          <CitiesIcon />
          {t.cities.open}
        </button>
      )}
      <button
        type="button"
        className="ghost menu-button stats-button"
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
        className="ghost menu-button options-button"
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
      data-layer={layer}
      data-side={sideOpen ? 'open' : 'closed'}
      data-motion={state.settings.reducedMotion ? 'reduced' : undefined}
      data-map-paused={mapPaused || undefined}
      data-arrived={arrivedFeature(state) ?? undefined}
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
        {!menuInMain && menu}
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
        {menuInMain && menu}
        <Scene
          onCatch={onCatch}
          onVisit={onVisit}
          onHarvest={onHarvest}
          highlight={highlight}
          paused={mapPaused}
        />
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
          <div
            className="side-panels"
            id="side-panels"
            data-new={unseen.join(' ')}
            data-action={withAction.join(' ')}
            onPointerDown={(event) => touchPanel(event.target)}
            onFocus={(event) => touchPanel(event.target)}
          >
            {layers.length > 1 && (
              <nav className="layerbar" aria-label={t.layers.label}>
                {layers.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-current={layer === id ? 'page' : undefined}
                    data-new={layer !== id && isFresh(layerPanels(id))}
                    onClick={() => layer !== id && setTab(LAYER_TAB[id])}
                  >
                    <TabIcon tab={id} />
                    {t.layers[id]}
                    {layer !== id && isFresh(layerPanels(id)) && (
                      <span className="visually-hidden"> ({t.tabs.fresh})</span>
                    )}
                  </button>
                ))}
              </nav>
            )}
            {/* Hidden panels sleep (docs/performance-plan.md, lot 1); the two with keyboard
                shortcuts always stay. */}
            <div className="side-column">
              <Upgrades />
              {awake('restoration') && <Restoration onHighlight={setHighlight} />}
              {awake('garden') && <Garden onHarvest={onHarvest} onHarvestAll={onHarvestAll} />}
            </div>
            <div className="side-column">
              <Generators />
              {awake('bioregion') && <Bioregion />}
              {awake('cooperatives') && <Cooperatives />}
            </div>
          </div>
        </aside>
      </main>

      <nav className="tabbar" aria-label={t.tabs.label}>
        {TABS.filter(isTabShown).map((id) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            data-new={tab !== id && isFresh(TAB_PANELS[id])}
            onClick={() => {
              tabPicked.current = id !== tab;
              setTab(id);
            }}
          >
            <TabIcon tab={id} />
            {t.tabs[id]}
            {tab !== id && isFresh(TAB_PANELS[id]) && (
              <span className="visually-hidden"> ({t.tabs.fresh})</span>
            )}
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

      <Suspense fallback={null}>
        {screen === 'achievements' && <Achievements onClose={closeScreen} />}
        {screen === 'herbier' && <Herbier onClose={closeScreen} />}
        {screen === 'seasons' && (
          <Seasons onClose={closeScreen} onOpenTree={() => setScreen('tree')} />
        )}
        {screen === 'tree' && <SeasonTree onClose={closeScreen} />}
        {screen === 'cycles' && <Cycles onClose={closeScreen} />}
        {screen === 'cities' && <Cities onClose={closeScreen} />}
        {screen === 'stats' && <Stats onClose={closeScreen} />}
      </Suspense>
      {screen === 'options' && <Options onClose={closeScreen} />}
    </div>
  );
}
