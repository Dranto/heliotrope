import { createIntroState, type IntroState } from './introductions';
import type { AchievementId } from './achievements';
import { COLLECTOR_IDS, SITE_IDS, type CollectorId, type SiteId } from './bioregion';
import { createDeltaState, type DeltaState } from './delta';
import { createCityState, type CityState } from './cities';
import type { DistrictId } from './districts';
import { createCooperativesState, type CooperativesState } from './cooperatives';
import type { ActiveEffect } from './effects';
import type { Language, Notation } from './format';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { createGardenState, type GardenState } from './garden';
import { emptyCurve, type SeasonCurve } from './history';
import type { ParcelId } from './parcels';
import type { ProjectId } from './projects';
import { createFuturesState, type FuturesState } from './restoration';
import { nextRandom, seedFrom } from './random';
import { RESOURCE_IDS, type ResourceId } from './resources';
import type { SpeciesId } from './species';
import { createCanopyState, type CanopyState, type TalentId } from './talents';
import { createGrowthState, type GrowthState } from './growth';
import { createPollenState, type PollenState } from './pollen';
import { createWeatherState, type WeatherState } from './weather';
import type { PanelId } from './panels';
import type { UpgradeId } from './upgrades';
import { createVisitState, VISIT_KINDS, type VisitKind, type VisitState } from './visits';

/** Bump when the shape of GameState changes, and add a migration in save.ts. */
export const STATE_VERSION = 45;

/** §9.2: the Golden Butterfly flies by every 3 to 8 minutes. */
export const BUTTERFLY_MIN_INTERVAL = 3 * 60;
export const BUTTERFLY_MAX_INTERVAL = 8 * 60;

export interface ButterflyState {
  /** Seconds of play before the next butterfly appears. */
  nextIn: number;
  /** Seconds left to catch the butterfly on screen; 0 when there is none. */
  visible: number;
}

export interface Settings {
  /** §8: short suffixes ("1,23 M") or scientific notation everywhere ("1,23e6"). */
  notation: Notation;
  /** §10.4: slow or stop decorative animations, on top of prefers-reduced-motion. */
  reducedMotion: boolean;
  /** §10.2: volume of the sounds, from 0 to 1. */
  volume: number;
  /** §10.2: silence every sound without losing the volume. */
  muted: boolean;
  /** §14 Q1: language of the interface, French by default. */
  language: Language;
  /**
   * §6.3: volume of the music of the neighbourhood, from 0 to 1; null until the player sets it,
   * which plays it softly on a computer and keeps it off on a phone.
   */
  music: number | null;
  /** §10.6: notify when the Seeds are ripe or a crop is ready, off by default (decision D8). */
  reminders: boolean;
  /** §6.3 easter egg: a click on the tree cries like a monkey instead of its note, off by default. */
  monkeyCries: boolean;
}

export interface GameState {
  version: number;
  /** Amount of each resource in reserve. */
  resources: Record<ResourceId, number>;
  /** Units owned of each generator. */
  generators: Record<GeneratorId, number>;
  /** Upgrades bought this Season, in purchase order. */
  upgrades: UpgradeId[];
  /** Light earned during the current Season (clicks + production), never decreased by spending. */
  totalLight: number;
  /** Light earned over every Season, the current one included. */
  allTimeLight: number;
  /** All-time Light when the current Cycle of water began (§7.4): the Seeds count what follows. */
  lightBeforeCycle: number;
  /** Heliotrope Seeds obtained in this Cycle (§7): each adds +5% to production. */
  seeds: number;
  /** Seeds of the talents learnt before the last Cycle (§7.4), not asked for again. */
  rootedSeeds: number;
  /** Seasons completed, i.e. how many times the player started a new Season. */
  seasons: number;
  /** Number of clicks on the heliotrope, over all Seasons. */
  clicks: number;
  /** Seconds of play over all Seasons, offline progress included. */
  playSeconds: number;
  /** Seconds of play in the current Season, offline progress included. */
  seasonSeconds: number;
  /** Seconds since the last purchase this Season (hidden Milestone, §9.3). */
  idleSeconds: number;
  /** Milestones unlocked over all Seasons, in unlock order (§9.3): each adds +1% production. */
  achievements: AchievementId[];
  /** Milestones reached whose mechanic has left the game: they still count in the bonus. */
  retiredAchievements: number;
  /** Parcels restored, in order (§6.1). Kept across Seasons. */
  parcels: ParcelId[];
  /** Neighbouring districts restored, in order (§6.4). Kept across Seasons and Cycles. */
  districts: DistrictId[];
  /** The future chosen for each restored parcel (§6.5). Kept forever. */
  futures: FuturesState;
  /** Neighbourhood projects carried out this Season, in order (§6.2). */
  projects: ProjectId[];
  /** Talents of the Tree of Seasons learnt, in order (§7.1). Kept across Seasons. */
  talents: TalentId[];
  /** Levels of the Canopy above the tree and the sower's settings (§7.1). Kept forever. */
  canopy: CanopyState;
  /** Cooperatives' settings and purchases (§7.2). Kept across Seasons. */
  cooperatives: CooperativesState;
  /** Species of the Herbier back in the neighbourhood, in order (§9.5). Kept across Seasons. */
  species: SpeciesId[];
  /** Water collectors built (§7.4). Kept across Seasons, reset by a Cycle. */
  collectors: Record<CollectorId, number>;
  /** Level of each regional site (§7.4). Kept across Seasons, reset by a Cycle. */
  sites: Record<SiteId, number>;
  /** All-time Water when the current Cycle began (§7.4). */
  waterBeforeCycle: number;
  /** Water gathered over all Cycles (§7.4 Sources formula). */
  allTimeWater: number;
  /** Sources obtained over all Cycles of water (§7.4). */
  sources: number;
  /** Cycles of water completed (§7.4). */
  cycles: number;
  /** Arms of the delta opened with Sources and the lock keeper's settings (§7.5). Kept forever. */
  delta: DeltaState;
  /** The courtyard garden's beds, harvests and seed bank (§9.7). Kept forever. */
  garden: GardenState;
  /** The sister cities (§7.6, M23): the city lived in, the network, the Savoirs. */
  city: CityState;
  /** The paths picked as the buildings grow (§5.5, M26). Kept across Seasons and Cycles. */
  growth: GrowthState;
  /** The pollen gauge around the flower and the flights sent (§5.6, M27). */
  pollen: PollenState;
  /** The sky over the neighbourhood and its forecast (§9.10, M28). Kept across Seasons. */
  weather: WeatherState;
  /** Side menu panels the player has touched (§10.1, M25); the others glow until then. */
  seenPanels: PanelId[];
  /** The mechanics introduced so far, one at a time (§10.8). Kept across Seasons and Cycles. */
  intro: IntroState;
  /** Golden Butterflies caught over all Seasons (§9.2). */
  butterflies: number;
  butterfly: ButterflyState;
  /** The next visit to the neighbourhood, or the one on the map (§9.6). */
  visit: VisitState;
  /** Visits welcomed over all Seasons, by kind (§9.6). */
  visits: Record<VisitKind, number>;
  /** Golden Butterfly and visit effects running now. */
  effects: ActiveEffect[];
  /** Production curves of the last Seasons, the current one last (§10.5). */
  history: SeasonCurve[];
  /** Seed of the pseudo-random generator used by random events. */
  rngSeed: number;
  /** Seed of the heliotrope tree's shape (§10.4): each game grows its own tree. Kept forever. */
  treeSeed: number;
  settings: Settings;
  /** Epoch milliseconds of the last simulated moment. */
  lastUpdate: number;
}

function zeroes<K extends string>(ids: readonly K[]): Record<K, number> {
  return Object.fromEntries(ids.map((id) => [id, 0])) as Record<K, number>;
}

/** Seconds until the next butterfly, drawn uniformly in the §9.2 interval. */
export function butterflyDelay(random: number): number {
  return BUTTERFLY_MIN_INTERVAL + random * (BUTTERFLY_MAX_INTERVAL - BUTTERFLY_MIN_INTERVAL);
}

export const DEFAULT_SETTINGS: Settings = {
  notation: 'short',
  reducedMotion: false,
  volume: 0.5,
  muted: false,
  language: 'fr',
  music: null,
  reminders: false,
  monkeyCries: false,
};

export function createInitialState(now: number): GameState {
  const [random, rngSeed] = nextRandom(seedFrom(now));
  return {
    version: STATE_VERSION,
    resources: zeroes(RESOURCE_IDS),
    generators: zeroes(GENERATOR_IDS),
    upgrades: [],
    totalLight: 0,
    allTimeLight: 0,
    lightBeforeCycle: 0,
    seeds: 0,
    rootedSeeds: 0,
    seasons: 0,
    clicks: 0,
    playSeconds: 0,
    seasonSeconds: 0,
    idleSeconds: 0,
    achievements: [],
    retiredAchievements: 0,
    parcels: [],
    districts: [],
    futures: createFuturesState(),
    projects: [],
    talents: [],
    canopy: createCanopyState(),
    cooperatives: createCooperativesState(),
    species: [],
    collectors: zeroes(COLLECTOR_IDS),
    sites: zeroes(SITE_IDS),
    waterBeforeCycle: 0,
    allTimeWater: 0,
    sources: 0,
    cycles: 0,
    delta: createDeltaState(),
    garden: createGardenState(),
    city: createCityState(),
    growth: createGrowthState(),
    pollen: createPollenState(),
    // Its own seed, so the weather never changes what the butterfly gives.
    weather: createWeatherState((rngSeed ^ 0x5bd1e995) >>> 0),
    seenPanels: ['generators'],
    intro: createIntroState(),
    butterflies: 0,
    butterfly: { nextIn: butterflyDelay(random), visible: 0 },
    // Drawn from the same number as the butterfly, so a quick one comes with a slow visit.
    visit: createVisitState(1 - random),
    visits: zeroes(VISIT_KINDS),
    effects: [],
    history: [emptyCurve(1)],
    rngSeed,
    treeSeed: (rngSeed ^ 0x2545f491) >>> 0,
    settings: DEFAULT_SETTINGS,
    lastUpdate: now,
  };
}
