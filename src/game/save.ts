import { GENERATOR_IDS } from './generators';
import { RESOURCE_IDS } from './resources';
import { isUpgradeId, type UpgradeId } from './upgrades';
import { createInitialState, STATE_VERSION, type GameState } from './state';

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
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
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
