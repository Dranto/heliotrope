import { isAchievementId, type AchievementId } from './achievements';
import { EFFECT_KINDS, type ActiveEffect, type EffectKind } from './effects';
import { LANGUAGES, type Language } from './format';
import { GENERATOR_IDS } from './generators';
import { COLLECTOR_IDS, SITE_IDS } from './bioregion';
import { RESOURCE_IDS } from './resources';
import { isUpgradeId, type UpgradeId } from './upgrades';
import { BUTTERFLY_MAX_INTERVAL, createInitialState, STATE_VERSION, type GameState } from './state';
import { BUTTERFLY_VISIBLE_SECONDS, effectSeconds } from './butterfly';
import { isParcelId, type ParcelId } from './parcels';
import { isDistrictId, type DistrictId } from './districts';
import { isProjectId, type ProjectId } from './projects';
import { validPlots } from './garden';
import { isFlowerColour, validDecorSlots } from './decor';
import { isCycleChallengeId, type CycleChallengeId } from './cycleChallenges';
import { deltaSourcesSpent, LOCK_FACTORS, validDeltaLevels } from './delta';
import { isVarietyId, type VarietyId } from './seedBank';
import { SOWER_FACTORS, validCanopyLevels, validTalents } from './talents';
import { COOPERATIVE_IDS, isCooperativeId } from './cooperatives';
import { isChallengeId, type ChallengeId } from './challenges';
import { isSpeciesId, type SpeciesId } from './species';
import { emptyCurve, validHistory } from './history';
import { VISIT_KINDS, VISIT_MAX_INTERVAL, VISIT_VISIBLE_SECONDS, type VisitKind } from './visits';

function isVisitKind(value: string): value is VisitKind {
  return (VISIT_KINDS as readonly string[]).includes(value);
}

export const SAVE_KEY = 'heliotrope.save';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a save from version n to n + 1. */
const migrations: Record<number, Migration> = {
  // v1 only had the placeholder "sunlight" resource, which was free and has no equivalent in
  // the real game. Drop it so players start the real game fresh.
  1: ({ resources: _placeholder, ...rest }) => ({ ...rest, version: 2 }),
  // v3 adds bought upgrades; v2 players had none.
  2: (raw) => ({ ...raw, upgrades: [], version: 3 }),
  // v4 adds the Seasons (§7) and statistics. Before it, all Light was earned in the first Season.
  3: (raw) => ({
    ...raw,
    allTimeLight: raw.totalLight,
    seeds: 0,
    seasons: 0,
    playSeconds: 0,
    seasonSeconds: 0,
    version: 4,
  }),
  // v5 adds Milestones, the journal, the Golden Butterfly and options (milestone 4). Their
  // defaults come from the fresh state in deserialize; Milestones already earned unlock on the
  // first tick.
  4: (raw) => ({ ...raw, version: 5 }),
  // v6 removes the neighbourhood journal: the story is told through gameplay only (§6).
  5: ({ journal: _journal, ...rest }) => ({ ...rest, version: 6 }),
  // v7 adds restored parcels, neighbourhood projects and the sound settings (§6.1, §6.2,
  // §10.2). Their defaults come from the fresh state: nothing restored, sound on.
  6: (raw) => ({ ...raw, version: 7 }),
  // v8 adds the Tree of Seasons and the Cooperatives (§7.1, §7.2). Defaults from the fresh
  // state: no talent learnt, every Seed still to spend.
  7: (raw) => ({ ...raw, version: 8 }),
  // v9 adds the language setting (§14 Q1); older saves keep the French interface.
  8: (raw) => ({ ...raw, version: 9 }),
  // v10 adds challenge Seasons and the Herbier (§7.3, §9.5). Defaults from the fresh state: no
  // challenge, no species yet; species already deserved return on the first tick.
  9: (raw) => ({ ...raw, version: 10 }),
  // v11 adds the Bioregion and the Cycle of water (§7.4). Before it, every Season belonged to the
  // first Cycle: the defaults of the fresh state (no Water, no collector, no Source) fit.
  10: (raw) => ({ ...raw, version: 11 }),
  // v12 adds the production curves of the Statistics (§10.5). Older saves start drawing from the
  // current Season on, with the default of the fresh state.
  11: (raw) => ({ ...raw, version: 12 }),
  // v13 adds the visits to the neighbourhood (§9.6). Defaults from the fresh state: none welcomed
  // yet, the first one on its way.
  12: (raw) => ({ ...raw, version: 13 }),
  // v14 adds the neighbouring districts (§6.4): none restored yet.
  13: (raw) => ({ ...raw, version: 14 }),
  // v15 adds the Canopy above the Tree of Seasons and its sower (§7.1, M13), and the fountaineers'
  // purchases: nothing sown yet, the sower off.
  14: (raw) => ({ ...raw, version: 15 }),
  // v16 adds the courtyard garden (§9.7, M14): every bed bare, no variety yet.
  15: (raw) => ({ ...raw, version: 16 }),
  // v17 adds the delta of the Sources and the challenge Cycles (§7.5, M15): every arm closed.
  16: (raw) => ({ ...raw, version: 17 }),
  // v18 adds the futures of the parcels and the decor (§6.5, M16): first futures, no decor.
  17: (raw) => ({ ...raw, version: 18 }),
  // v19 adds the music volume and the reminders (§6.3, §10.6, M17): music by default, no reminder.
  18: (raw) => ({ ...raw, version: 19 }),
  // v20 adds the visits of the city (§9.6, M18): none welcomed yet.
  19: (raw) => ({ ...raw, version: 20 }),
};

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

/** A running effect, no longer than the parcels and projects of `state` allow. */
function isEffect(value: unknown, state: GameState): value is ActiveEffect {
  if (typeof value !== 'object' || value === null) return false;
  const { kind, remaining } = value as Record<string, unknown>;
  return (
    typeof kind === 'string' &&
    (EFFECT_KINDS as readonly string[]).includes(kind) &&
    isFiniteNumber(remaining) &&
    remaining > 0 &&
    remaining <= effectSeconds(state, kind as EffectKind)
  );
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/** Parse a save string. Returns null when it is unreadable. */
export function deserialize(json: string, now: number): GameState | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  let data = raw as Record<string, unknown>;
  let version = typeof data.version === 'number' ? data.version : 0;
  if (version > STATE_VERSION) return null;
  while (version < STATE_VERSION) {
    const migrate = migrations[version];
    if (!migrate) return null;
    data = migrate(data);
    version += 1;
  }

  // Start from a fresh state so new fields always have defaults.
  const state = createInitialState(now);
  const resources = data.resources as Record<string, unknown> | undefined;
  for (const id of RESOURCE_IDS) {
    const value = resources?.[id];
    if (isFiniteNumber(value) && value >= 0) state.resources[id] = value;
  }
  const generators = data.generators as Record<string, unknown> | undefined;
  for (const id of GENERATOR_IDS) {
    const value = generators?.[id];
    if (isCount(value)) state.generators[id] = value;
  }
  if (Array.isArray(data.upgrades)) {
    state.upgrades = [...new Set<UpgradeId>(data.upgrades.filter(isUpgradeId))];
  }
  if (isFiniteNumber(data.totalLight) && data.totalLight >= 0) state.totalLight = data.totalLight;
  // The all-time total includes the current Season, so it can never be below it.
  if (isFiniteNumber(data.allTimeLight) && data.allTimeLight >= state.totalLight) {
    state.allTimeLight = data.allTimeLight;
  } else {
    state.allTimeLight = state.totalLight;
  }
  // The current Season belongs to the current Cycle.
  if (
    isFiniteNumber(data.lightBeforeCycle) &&
    data.lightBeforeCycle >= 0 &&
    data.lightBeforeCycle <= state.allTimeLight - state.totalLight
  ) {
    state.lightBeforeCycle = data.lightBeforeCycle;
  }
  if (isCount(data.seeds)) state.seeds = data.seeds;
  if (isCount(data.rootedSeeds)) state.rootedSeeds = data.rootedSeeds;
  if (isCount(data.seasons)) state.seasons = data.seasons;
  if (isCount(data.clicks)) state.clicks = data.clicks;
  if (isFiniteNumber(data.playSeconds) && data.playSeconds >= 0) {
    state.playSeconds = data.playSeconds;
  }
  if (isFiniteNumber(data.seasonSeconds) && data.seasonSeconds >= 0) {
    state.seasonSeconds = Math.min(data.seasonSeconds, state.playSeconds);
  }
  if (isFiniteNumber(data.idleSeconds) && data.idleSeconds >= 0) {
    state.idleSeconds = Math.min(data.idleSeconds, state.seasonSeconds);
  }
  if (Array.isArray(data.achievements)) {
    state.achievements = [...new Set<AchievementId>(data.achievements.filter(isAchievementId))];
  }
  if (Array.isArray(data.parcels)) {
    state.parcels = [...new Set<ParcelId>(data.parcels.filter(isParcelId))];
  }
  const futures = data.futures as Record<string, unknown> | undefined;
  const chosen = futures?.chosen as Record<string, unknown> | undefined;
  const changed = futures?.changed as Record<string, unknown> | undefined;
  for (const id of state.parcels) {
    if (chosen?.[id] === 1) state.futures.chosen[id] = 1;
    const cycle = changed?.[id];
    if (isCount(cycle)) state.futures.changed[id] = cycle;
  }
  const decor = data.decor as Record<string, unknown> | undefined;
  state.decor = {
    slots: validDecorSlots(decor?.slots),
    flower: isFlowerColour(decor?.flower) ? decor.flower : 'lilac',
  };
  if (Array.isArray(data.districts)) {
    state.districts = [...new Set<DistrictId>(data.districts.filter(isDistrictId))];
  }
  if (Array.isArray(data.projects)) {
    state.projects = [...new Set<ProjectId>(data.projects.filter(isProjectId))];
  }
  if (Array.isArray(data.talents)) {
    state.talents = validTalents(data.talents, state.seeds + state.rootedSeeds);
  }
  const canopy = data.canopy as Record<string, unknown> | undefined;
  state.canopy = {
    levels: validCanopyLevels(canopy?.levels, state.talents, state.seeds + state.rootedSeeds),
    sowerFactor: (SOWER_FACTORS as readonly unknown[]).includes(canopy?.sowerFactor)
      ? (canopy!.sowerFactor as number)
      : 0,
    sowerSeasons: isCount(canopy?.sowerSeasons) ? canopy.sowerSeasons : 0,
  };
  const cooperatives = data.cooperatives as Record<string, unknown> | undefined;
  if (Array.isArray(cooperatives?.paused)) {
    state.cooperatives.paused = [...new Set(cooperatives.paused.filter(isCooperativeId))];
  }
  if (typeof cooperatives?.thrifty === 'boolean') state.cooperatives.thrifty = cooperatives.thrifty;
  const purchases = cooperatives?.purchases as Record<string, unknown> | undefined;
  for (const id of COOPERATIVE_IDS) {
    const value = purchases?.[id];
    if (isCount(value)) state.cooperatives.purchases[id] = value;
  }
  if (Array.isArray(data.challenges)) {
    state.challenges = [...new Set<ChallengeId>(data.challenges.filter(isChallengeId))];
  }
  if (isChallengeId(data.challenge) && !state.challenges.includes(data.challenge)) {
    state.challenge = data.challenge;
  }
  if (Array.isArray(data.species)) {
    state.species = [...new Set<SpeciesId>(data.species.filter(isSpeciesId))];
  }
  // The last curve is the current Season's; start it afresh when the save disagrees.
  const history = validHistory(data.history);
  const current = state.seasons + 1;
  state.history =
    history && history[history.length - 1]!.season === current ? history : [emptyCurve(current)];
  const collectors = data.collectors as Record<string, unknown> | undefined;
  for (const id of COLLECTOR_IDS) {
    const value = collectors?.[id];
    if (isCount(value)) state.collectors[id] = value;
  }
  const sites = data.sites as Record<string, unknown> | undefined;
  for (const id of SITE_IDS) {
    const value = sites?.[id];
    if (isCount(value)) state.sites[id] = value;
  }
  // The all-time Water includes the reserve, which belongs to the current Cycle.
  if (isFiniteNumber(data.allTimeWater) && data.allTimeWater >= state.resources.water) {
    state.allTimeWater = data.allTimeWater;
  } else {
    state.allTimeWater = state.resources.water;
  }
  if (
    isFiniteNumber(data.waterBeforeCycle) &&
    data.waterBeforeCycle >= 0 &&
    data.waterBeforeCycle <= state.allTimeWater - state.resources.water
  ) {
    state.waterBeforeCycle = data.waterBeforeCycle;
  }
  if (isCount(data.sources)) state.sources = data.sources;
  if (isCount(data.cycles)) state.cycles = data.cycles;
  const delta = data.delta as Record<string, unknown> | undefined;
  const armLevels = validDeltaLevels(delta?.levels);
  state.delta = {
    // Arms are paid with the Sources obtained: a save cannot hold more than they buy.
    levels: deltaSourcesSpent(armLevels) <= state.sources ? armLevels : state.delta.levels,
    lockFactor: (LOCK_FACTORS as readonly unknown[]).includes(delta?.lockFactor)
      ? (delta!.lockFactor as number)
      : 0,
    lockCycles: isCount(delta?.lockCycles) ? delta.lockCycles : 0,
  };
  if (Array.isArray(data.cycleChallenges)) {
    state.cycleChallenges = [
      ...new Set<CycleChallengeId>(data.cycleChallenges.filter(isCycleChallengeId)),
    ];
  }
  if (
    isCycleChallengeId(data.cycleChallenge) &&
    !state.cycleChallenges.includes(data.cycleChallenge)
  ) {
    state.cycleChallenge = data.cycleChallenge;
  }
  const garden = data.garden as Record<string, unknown> | undefined;
  state.garden = {
    plots: validPlots(garden?.plots),
    harvests: isCount(garden?.harvests) ? garden.harvests : 0,
    varieties: Array.isArray(garden?.varieties)
      ? [...new Set<VarietyId>(garden.varieties.filter(isVarietyId))]
      : [],
  };
  if (isCount(data.butterflies)) state.butterflies = data.butterflies;
  const butterfly = data.butterfly as Record<string, unknown> | undefined;
  if (
    isFiniteNumber(butterfly?.nextIn) &&
    isFiniteNumber(butterfly.visible) &&
    butterfly.nextIn >= 0 &&
    butterfly.visible >= 0
  ) {
    state.butterfly = {
      nextIn: Math.min(butterfly.nextIn, BUTTERFLY_MAX_INTERVAL),
      visible: Math.min(butterfly.visible, BUTTERFLY_VISIBLE_SECONDS),
    };
  }
  const visits = data.visits as Record<string, unknown> | undefined;
  for (const kind of VISIT_KINDS) {
    const value = visits?.[kind];
    if (isCount(value)) state.visits[kind] = value;
  }
  const visit = data.visit as Record<string, unknown> | undefined;
  const visitor = visit?.kind;
  if (
    isFiniteNumber(visit?.nextIn) &&
    isFiniteNumber(visit.visible) &&
    visit.nextIn >= 0 &&
    visit.visible >= 0 &&
    (visitor === null || (typeof visitor === 'string' && isVisitKind(visitor)))
  ) {
    state.visit = {
      nextIn: Math.min(visit.nextIn, VISIT_MAX_INTERVAL),
      kind: visit.visible > 0 ? (visitor as VisitKind | null) : null,
      visible: visitor === null ? 0 : Math.min(visit.visible, VISIT_VISIBLE_SECONDS),
    };
  }
  if (Array.isArray(data.effects)) {
    // At most one running effect of each kind.
    state.effects = data.effects
      .filter((effect): effect is ActiveEffect => isEffect(effect, state))
      .filter((effect, i, list) => list.findIndex((e) => e.kind === effect.kind) === i);
  }
  if (isCount(data.rngSeed) && data.rngSeed <= 0xffffffff) state.rngSeed = data.rngSeed;
  const settings = data.settings as Record<string, unknown> | undefined;
  if (settings?.notation === 'short' || settings?.notation === 'scientific') {
    state.settings = { ...state.settings, notation: settings.notation };
  }
  if (typeof settings?.reducedMotion === 'boolean') {
    state.settings = { ...state.settings, reducedMotion: settings.reducedMotion };
  }
  if (isFiniteNumber(settings?.volume) && settings.volume >= 0 && settings.volume <= 1) {
    state.settings = { ...state.settings, volume: settings.volume };
  }
  if (typeof settings?.muted === 'boolean') {
    state.settings = { ...state.settings, muted: settings.muted };
  }
  if (isFiniteNumber(settings?.music) && settings.music >= 0 && settings.music <= 1) {
    state.settings = { ...state.settings, music: settings.music };
  }
  if (typeof settings?.reminders === 'boolean') {
    state.settings = { ...state.settings, reminders: settings.reminders };
  }
  if (typeof settings?.language === 'string' && isLanguage(settings.language)) {
    state.settings = { ...state.settings, language: settings.language };
  }
  if (isFiniteNumber(data.lastUpdate)) state.lastUpdate = data.lastUpdate;
  return state;
}

/** Export format (§9.4): the save JSON as UTF-8, base64-encoded so it pastes as one word. */
export function exportSave(state: GameState): string {
  const bytes = new TextEncoder().encode(serialize(state));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

/**
 * Read an exported save. Returns null when the text is not a valid save. The imported game
 * resumes from `now`: importing never grants offline progress.
 */
export function importSave(text: string, now: number): GameState | null {
  let json: string;
  try {
    const binary = atob(text.replace(/\s+/g, ''));
    json = new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    );
  } catch {
    return null;
  }
  const state = deserialize(json, now);
  return state && { ...state, lastUpdate: now };
}

export function saveGame(state: GameState, storage: Storage = localStorage): void {
  try {
    storage.setItem(SAVE_KEY, serialize(state));
  } catch {
    // Storage can be full or disabled (private mode); the game keeps running.
  }
}

export function loadGame(now: number, storage: Storage = localStorage): GameState | null {
  try {
    const json = storage.getItem(SAVE_KEY);
    return json === null ? null : deserialize(json, now);
  } catch {
    return null;
  }
}

export function clearSave(storage: Storage = localStorage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
