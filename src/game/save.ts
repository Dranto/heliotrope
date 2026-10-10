import { GENERATOR_IDS } from './generators';
import { RESOURCE_IDS } from './resources';
import { createInitialState, STATE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'heliotrope.save';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a save from version n to n + 1. */
const migrations: Record<number, Migration> = {
  // v1 only had the placeholder "sunlight" resource, which was free and has no equivalent in
  // the real game. Drop it so players start the real game fresh.
  1: ({ resources: _placeholder, ...rest }) => ({ ...rest, version: 2 }),
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
  if (isFiniteNumber(data.totalLight) && data.totalLight >= 0) state.totalLight = data.totalLight;
  if (isCount(data.clicks)) state.clicks = data.clicks;
  if (isFiniteNumber(data.lastUpdate)) state.lastUpdate = data.lastUpdate;
  return state;
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
