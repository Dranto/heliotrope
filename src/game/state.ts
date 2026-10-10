import type { AchievementId } from './achievements';
import type { ChallengeId } from './challenges';
import { createCooperativesState, type CooperativesState } from './cooperatives';
import type { ActiveEffect } from './effects';
import type { Language, Notation } from './format';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import type { ParcelId } from './parcels';
import type { ProjectId } from './projects';
import { nextRandom, seedFrom } from './random';
import { RESOURCE_IDS, type ResourceId } from './resources';
import type { SpeciesId } from './species';
import type { TalentId } from './talents';
import type { UpgradeId } from './upgrades';

/** Bump when the shape of GameState changes, and add a migration in save.ts. */
export const STATE_VERSION = 10;

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
  /** Light earned over every Season, the current one included (§7 Seeds formula). */
  allTimeLight: number;
  /** Heliotrope Seeds obtained over all Seasons (§7): each adds +5% to production. */
  seeds: number;
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
  /** Parcels restored, in order (§6.1). Kept across Seasons. */
  parcels: ParcelId[];
  /** Neighbourhood projects carried out this Season, in order (§6.2). */
  projects: ProjectId[];
  /** Talents of the Tree of Seasons learnt, in order (§7.1). Kept across Seasons. */
  talents: TalentId[];
  /** Cooperatives' settings and purchases (§7.2). Kept across Seasons. */
  cooperatives: CooperativesState;
  /** Challenge running this Season (§7.3), null once won or without one. */
  challenge: ChallengeId | null;
  /** Challenge Seasons won, in order (§7.3). Kept across Seasons. */
  challenges: ChallengeId[];
  /** Species of the Herbier back in the neighbourhood, in order (§9.5). Kept across Seasons. */
  species: SpeciesId[];
  /** Golden Butterflies caught over all Seasons (§9.2). */
  butterflies: number;
  butterfly: ButterflyState;
  /** Golden Butterfly effects running now. */
  effects: ActiveEffect[];
  /** Seed of the pseudo-random generator used by random events. */
  rngSeed: number;
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
    seeds: 0,
    seasons: 0,
    clicks: 0,
    playSeconds: 0,
    seasonSeconds: 0,
    idleSeconds: 0,
    achievements: [],
    parcels: [],
    projects: [],
    talents: [],
    cooperatives: createCooperativesState(),
    challenge: null,
    challenges: [],
    species: [],
    butterflies: 0,
    butterfly: { nextIn: butterflyDelay(random), visible: 0 },
    effects: [],
    rngSeed,
    settings: DEFAULT_SETTINGS,
    lastUpdate: now,
  };
}
