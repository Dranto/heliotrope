import { isAchievementId, type AchievementId } from './achievements';
import { EFFECTS, type ActiveEffect } from './effects';
import { GENERATOR_IDS } from './generators';
import { isJournalId, type JournalId } from './journal';
import { RESOURCE_IDS } from './resources';
import { isUpgradeId, type UpgradeId } from './upgrades';
import { BUTTERFLY_MAX_INTERVAL, createInitialState, STATE_VERSION, type GameState } from './state';
import { BUTTERFLY_VISIBLE_SECONDS } from './butterfly';

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
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isEffect(value: unknown): value is ActiveEffect {
  if (typeof value !== 'object' || value === null) return false;
  const { kind, remaining } = value as Record<string, unknown>;
  return (
    (kind === 'bloom' || kind === 'pollination') &&
    isFiniteNumber(remaining) &&
    remaining > 0 &&
    remaining <= EFFECTS[kind].seconds
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
  if (isCount(data.seeds)) state.seeds = data.seeds;
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
  if (Array.isArray(data.journal)) {
    state.journal = [...new Set<JournalId>(data.journal.filter(isJournalId))];
  }
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
  if (Array.isArray(data.effects)) {
    // At most one running effect of each kind.
    state.effects = data.effects
      .filter(isEffect)
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
