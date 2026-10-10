import { RESOURCE_IDS } from './resources';
import { createInitialState, STATE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'heliotrope.save';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] upgrades a save from version n to n + 1. */
const migrations: Record<number, Migration> = {};

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
    if (typeof value === 'number' && Number.isFinite(value)) state.resources[id] = value;
  }
  if (typeof data.lastUpdate === 'number' && Number.isFinite(data.lastUpdate)) {
    state.lastUpdate = data.lastUpdate;
  }
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
