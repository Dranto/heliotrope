// The decor of the neighbourhood (docs/game-design.md §6.5, M16): purely decorative pieces won
// with the Milestones and the Herbier, set by the player on a few spots of the map, and the colour
// of the heliotrope's flowers. Nothing here changes production. Names live in src/i18n, the
// drawings and the spots in src/ui.
import type { GameState } from './state';

export const DECOR_IDS = [
  'bench',
  'planter',
  'lanterns',
  'birdhouse',
  'fresco',
  'fountain',
  'insectHotel',
] as const;
export type DecorId = (typeof DECOR_IDS)[number];

export const FLOWER_COLOURS = ['lilac', 'gold', 'rose', 'blue', 'white'] as const;
export type FlowerColour = (typeof FLOWER_COLOURS)[number];

/** What wins a piece of decor or a colour: Milestones reached, or species back in the Herbier. */
export type DecorCondition =
  { kind: 'achievements'; count: number } | { kind: 'species'; count: number };

export const DECOR_CONDITIONS: Record<DecorId, DecorCondition> = {
  bench: { kind: 'achievements', count: 10 },
  planter: { kind: 'species', count: 3 },
  lanterns: { kind: 'achievements', count: 30 },
  birdhouse: { kind: 'species', count: 8 },
  fresco: { kind: 'achievements', count: 50 },
  fountain: { kind: 'achievements', count: 75 },
  insectHotel: { kind: 'species', count: 15 },
};

export const FLOWER_CONDITIONS: Record<FlowerColour, DecorCondition | null> = {
  lilac: null,
  gold: { kind: 'achievements', count: 20 },
  rose: { kind: 'species', count: 6 },
  blue: { kind: 'species', count: 12 },
  white: { kind: 'achievements', count: 60 },
};

/** Spots of the map where a piece of decor can stand. */
export const DECOR_SLOTS = 8;

export interface DecorState {
  /** The piece standing on each spot, null where the spot is empty; DECOR_SLOTS long. */
  slots: (DecorId | null)[];
  flower: FlowerColour;
}

export function createDecorState(): DecorState {
  return { slots: Array.from({ length: DECOR_SLOTS }, () => null), flower: 'lilac' };
}

export function isDecorId(value: unknown): value is DecorId {
  return typeof value === 'string' && (DECOR_IDS as readonly string[]).includes(value);
}

export function isFlowerColour(value: unknown): value is FlowerColour {
  return typeof value === 'string' && (FLOWER_COLOURS as readonly string[]).includes(value);
}

function isMet(state: Pick<GameState, 'achievements' | 'species'>, condition: DecorCondition) {
  return condition.kind === 'achievements'
    ? state.achievements.length >= condition.count
    : state.species.length >= condition.count;
}

export function isDecorUnlocked(
  state: Pick<GameState, 'achievements' | 'species'>,
  id: DecorId,
): boolean {
  return isMet(state, DECOR_CONDITIONS[id]);
}

export function isFlowerColourUnlocked(
  state: Pick<GameState, 'achievements' | 'species'>,
  colour: FlowerColour,
): boolean {
  const condition = FLOWER_CONDITIONS[colour];
  return condition === null || isMet(state, condition);
}

export function unlockedDecor(state: Pick<GameState, 'achievements' | 'species'>): DecorId[] {
  return DECOR_IDS.filter((id) => isDecorUnlocked(state, id));
}

/** Decorating opens with the first piece won. */
export function isDecorOpen(state: Pick<GameState, 'achievements' | 'species'>): boolean {
  return unlockedDecor(state).length > 0;
}

/** Player action: set a piece of decor won on a spot, or clear the spot with null. */
export function placeDecor(state: GameState, slot: number, id: DecorId | null): GameState {
  if (slot < 0 || slot >= DECOR_SLOTS || !Number.isInteger(slot)) return state;
  if (id !== null && !isDecorUnlocked(state, id)) return state;
  if (state.decor.slots[slot] === id) return state;
  const slots = state.decor.slots.map((piece, i) => (i === slot ? id : piece));
  return { ...state, decor: { ...state.decor, slots } };
}

/**
 * The piece that follows `current` when the player clicks a spot: every piece won in turn, then
 * the empty spot again.
 */
export function nextDecor(state: GameState, current: DecorId | null): DecorId | null {
  const pieces = unlockedDecor(state);
  if (pieces.length === 0) return null;
  const index = current === null ? -1 : pieces.indexOf(current);
  return index + 1 < pieces.length ? pieces[index + 1]! : null;
}

/** Player action: the colour of the heliotrope's flowers. */
export function setFlowerColour(state: GameState, colour: FlowerColour): GameState {
  if (!isFlowerColourUnlocked(state, colour) || state.decor.flower === colour) return state;
  return { ...state, decor: { ...state.decor, flower: colour } };
}

/** Keep only what a save can hold: known pieces, DECOR_SLOTS long. */
export function validDecorSlots(raw: unknown): (DecorId | null)[] {
  const slots = createDecorState().slots;
  if (!Array.isArray(raw)) return slots;
  return slots.map((empty, i) => (isDecorId(raw[i]) ? (raw[i] as DecorId) : empty));
}
