// Restoring the neighbourhood (docs/game-design.md §6.1, §6.2): when parcels and projects are
// offered, and the player actions that carry them out. Pure functions returning new state.
import {
  PARCEL_LIST,
  PARCEL_REVEAL_SHARE,
  PARCELS,
  type Future,
  type ParcelDef,
  type ParcelId,
} from './parcels';
import { phaseOf } from './phases';
import { PROJECT_LIST, PROJECTS, type ProjectDef, type ProjectId } from './projects';
import type { GameState } from './state';
import type { GeneratorId } from './generators';

/** A parcel is offered once its place is in view (its phase) and the Season earned half its cost. */
export function isParcelOffered(state: GameState, id: ParcelId): boolean {
  const parcel = PARCELS[id];
  return (
    !state.parcels.includes(id) &&
    phaseOf(state) >= parcel.phase &&
    state.totalLight >= parcel.cost * PARCEL_REVEAL_SHARE
  );
}

/** Parcels offered and not restored yet, cheapest first. */
export function offeredParcels(state: GameState): ParcelDef[] {
  return PARCEL_LIST.filter((p) => isParcelOffered(state, p.id));
}

export function canRestoreParcel(state: GameState, id: ParcelId): boolean {
  return isParcelOffered(state, id) && state.resources.light >= PARCELS[id].cost;
}

/**
 * Player action: restore a parcel in one of its two futures (§6.5). It stays restored in every
 * later Season.
 */
export function restoreParcel(state: GameState, id: ParcelId, future: Future = 0): GameState {
  if (!canRestoreParcel(state, id)) return state;
  return {
    ...state,
    resources: { ...state.resources, light: Math.max(0, state.resources.light - PARCELS[id].cost) },
    parcels: [...state.parcels, id],
    futures: withFuture(state.futures, id, future),
    idleSeconds: 0,
  };
}

export interface FuturesState {
  /** The future of each restored parcel; absent for the first one. */
  chosen: Partial<Record<ParcelId, Future>>;
  /** Cycle of water (§7.4, the Cycles completed) in which a parcel's future was last changed. */
  changed: Partial<Record<ParcelId, number>>;
}

export function createFuturesState(): FuturesState {
  return { chosen: {}, changed: {} };
}

function withFuture(futures: FuturesState, id: ParcelId, future: Future): FuturesState {
  const chosen = { ...futures.chosen };
  if (future === 1) chosen[id] = 1;
  else delete chosen[id];
  return { ...futures, chosen };
}

/** The future a restored parcel follows. */
export function futureOf(state: Pick<GameState, 'futures'>, id: ParcelId): Future {
  return state.futures.chosen[id] ?? 0;
}

/** A restored parcel can change its future once in every Cycle of water (decision D7). */
export function canChangeFuture(state: GameState, id: ParcelId): boolean {
  return state.parcels.includes(id) && state.futures.changed[id] !== state.cycles;
}

/** Player action: give a restored parcel its other future, free, once per Cycle of water. */
export function changeFuture(state: GameState, id: ParcelId, future: Future): GameState {
  if (!canChangeFuture(state, id) || futureOf(state, id) === future) return state;
  const futures = withFuture(state.futures, id, future);
  return {
    ...state,
    futures: { ...futures, changed: { ...futures.changed, [id]: state.cycles } },
  };
}

/** A project is offered when its condition is met this Season; conditions never turn false. */
export function isProjectUnlocked(state: GameState, id: ProjectId): boolean {
  const { owned, phase, parcels, parcelCount } = PROJECTS[id].condition;
  if (phase !== undefined && phaseOf(state) < phase) return false;
  if (parcels && !parcels.every((p) => state.parcels.includes(p))) return false;
  if (parcelCount !== undefined && state.parcels.length < parcelCount) return false;
  if (owned) {
    for (const [generator, count] of Object.entries(owned) as [GeneratorId, number][]) {
      if (state.generators[generator] < count) return false;
    }
  }
  return true;
}

/** Projects offered and not carried out yet this Season, cheapest first. */
export function offeredProjects(state: GameState): ProjectDef[] {
  return PROJECT_LIST.filter(
    (p) => !state.projects.includes(p.id) && isProjectUnlocked(state, p.id),
  );
}

export function canCarryOutProject(state: GameState, id: ProjectId): boolean {
  return (
    !state.projects.includes(id) &&
    isProjectUnlocked(state, id) &&
    state.resources.light >= PROJECTS[id].cost
  );
}

/** Player action: carry out a neighbourhood project for the rest of the Season. */
export function carryOutProject(state: GameState, id: ProjectId): GameState {
  if (!canCarryOutProject(state, id)) return state;
  return {
    ...state,
    resources: {
      ...state.resources,
      light: Math.max(0, state.resources.light - PROJECTS[id].cost),
    },
    projects: [...state.projects, id],
    idleSeconds: 0,
  };
}
