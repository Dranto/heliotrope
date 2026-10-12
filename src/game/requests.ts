// The neighbours' requests (docs/game-design.md §9.11, M29): from the second Season, neighbours
// ask for small things the other loops make (garden harvests, fruit, pollen flights, butterflies,
// buildings) and offer a helping hand in return. Hands are kept in reserve, three at most, and
// played when the player wants (decision D20). Requests wait without limit; one can be declined
// for another. The neighbouring districts restored (§6.4) send their own, and serving them
// strengthens a bond. The requests draw from their own seed, like the weather (§9.10).
import { isIntroduced } from './introductions';
import { isButterflyUnlocked, startEffect } from './butterfly';
import type { Bonds } from './bonds';
import { DISTRICT_IDS, type DistrictId } from './districts';
import { CROPS, isRipe } from './garden';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { isOrchardOpen } from './orchard';
import { sendFlights } from './pollen';
import { isGeneratorRevealed, lightPerSecond } from './production';
import { earnLight } from './light';
import { nextRandom } from './random';
import type { GameState } from './state';

export const COUNTED_NEEDS = ['harvests', 'fruit', 'flights', 'butterflies'] as const;
export type CountedNeed = (typeof COUNTED_NEEDS)[number];

/** What a neighbour asks for: things done from now on, or units of a building owned. */
export type Need =
  { kind: CountedNeed; count: number } | { kind: 'owned'; generator: GeneratorId; count: number };

export const HAND_IDS = ['quarter', 'bloom', 'ripen', 'flight'] as const;
/**
 * The helping hands: a quarter of an hour of production at once, a Floraison (§9.2), the crop of
 * the courtyard garden closest to ripe ripens (§9.7), a pollen flight (§5.6).
 */
export type HandId = (typeof HAND_IDS)[number];

export interface Request {
  need: Need;
  /** The need's counter when the request came, so only what is done afterwards counts. */
  base: number;
  hand: HandId;
  /** The neighbouring district that sent it, or null for the neighbourhood's own. */
  from: DistrictId | null;
}

export interface RequestsState {
  open: Request[];
  /** Seconds of play before the next request comes, while fewer than three are open. */
  nextIn: number;
  seed: number;
  /** Helping hands in reserve, played when the player wants. */
  hands: HandId[];
  /** Requests served over the whole game. */
  served: number;
  /** Requests served for each neighbouring district: the bonds (§6.4). */
  bonds: Bonds;
}

export const MAX_REQUESTS = 3;
export const MAX_HANDS = 3;
/** Seconds of play between two requests. */
export const REQUEST_INTERVAL = 4 * 60;
/** The quarter-of-an-hour hand: this many seconds of production at once. */
export const QUARTER_SECONDS = 15 * 60;
/** Share of the requests a restored neighbouring district sends. */
export const DISTRICT_SHARE = 0.5;

export function createRequestsState(seed: number): RequestsState {
  return { open: [], nextIn: REQUEST_INTERVAL / 2, seed, hands: [], served: 0, bonds: {} };
}

/** The neighbours start asking with the second Season, like the weather. */
export function areRequestsOpen(state: Pick<GameState, 'seasons' | 'cycles' | 'intro'>): boolean {
  return isIntroduced(state, 'requests') && (state.seasons > 0 || state.cycles > 0);
}

function counter(state: GameState, need: Need): number {
  switch (need.kind) {
    case 'harvests':
      return state.garden.harvests;
    case 'fruit':
      return state.orchard.harvests;
    case 'flights':
      return state.pollen.flights;
    case 'butterflies':
      return state.butterflies;
    case 'owned':
      return state.generators[need.generator];
  }
}

/** How much of a request is done, from 0 to its count. */
export function requestProgress(state: GameState, request: Request): number {
  const done =
    request.need.kind === 'owned'
      ? counter(state, request.need)
      : counter(state, request.need) - request.base;
  return Math.max(0, Math.min(request.need.count, done));
}

export function isRequestMet(state: GameState, request: Request): boolean {
  return requestProgress(state, request) >= request.need.count;
}

/** The needs the player can work on now, so no request asks for a locked system. */
function possibleNeeds(state: GameState): Need[] {
  const needs: Need[] = [
    { kind: 'harvests', count: 3 },
    { kind: 'flights', count: 2 },
  ];
  if (isOrchardOpen(state)) needs.push({ kind: 'fruit', count: 2 });
  if (isButterflyUnlocked(state)) needs.push({ kind: 'butterflies', count: 2 });
  const revealed = GENERATOR_IDS.filter((id) => isGeneratorRevealed(state, id));
  const generator = revealed[revealed.length - 1];
  if (generator) {
    const count = Math.ceil((state.generators[generator] + 10) / 5) * 5;
    needs.push({ kind: 'owned', generator, count });
  }
  return needs;
}

function pick<T>(list: readonly T[], seed: number): [T, number] {
  const [value, next] = nextRandom(seed);
  return [list[Math.floor(value * list.length)]!, next];
}

function drawRequest(state: GameState, seed: number): [Request, number] {
  const [need, afterNeed] = pick(possibleNeeds(state), seed);
  const [hand, afterHand] = pick(HAND_IDS, afterNeed);
  const [share, afterShare] = nextRandom(afterHand);
  let from: DistrictId | null = null;
  let next = afterShare;
  const districts = DISTRICT_IDS.filter((id) => state.districts.includes(id));
  if (districts.length > 0 && share < DISTRICT_SHARE) [from, next] = pick(districts, next);
  return [{ need, base: counter(state, need), hand, from }, next];
}

/** Move the requests forward by dtSeconds of play: a new one comes while fewer than three wait. */
export function advanceRequests(state: GameState, dtSeconds: number): GameState {
  if (!areRequestsOpen(state)) return state;
  const { requests } = state;
  if (requests.open.length >= MAX_REQUESTS) return state;
  let nextIn = requests.nextIn - dtSeconds;
  if (nextIn > 0) return { ...state, requests: { ...requests, nextIn } };
  let { seed } = requests;
  const open = [...requests.open];
  while (nextIn <= 0 && open.length < MAX_REQUESTS) {
    const [request, after] = drawRequest(state, seed);
    open.push(request);
    seed = after;
    nextIn += REQUEST_INTERVAL;
  }
  return {
    ...state,
    requests: { ...requests, open, seed, nextIn: nextIn > 0 ? nextIn : REQUEST_INTERVAL },
  };
}

export function canServe(state: GameState, index: number): boolean {
  const request = state.requests.open[index];
  return (
    request !== undefined && isRequestMet(state, request) && state.requests.hands.length < MAX_HANDS
  );
}

/** Player action: serve a request met; its helping hand goes into the reserve. */
export function serveRequest(state: GameState, index: number): GameState {
  if (!canServe(state, index)) return state;
  const { requests } = state;
  const request = requests.open[index]!;
  const bonds = request.from
    ? { ...requests.bonds, [request.from]: (requests.bonds[request.from] ?? 0) + 1 }
    : requests.bonds;
  return {
    ...state,
    requests: {
      ...requests,
      open: requests.open.filter((_, i) => i !== index),
      nextIn: requests.open.length >= MAX_REQUESTS ? REQUEST_INTERVAL : requests.nextIn,
      hands: [...requests.hands, request.hand],
      served: requests.served + 1,
      bonds,
    },
  };
}

/** Player action: decline a request; another one takes its place at once. */
export function declineRequest(state: GameState, index: number): GameState {
  const { requests } = state;
  if (requests.open[index] === undefined) return state;
  const [request, seed] = drawRequest(state, requests.seed);
  return {
    ...state,
    requests: {
      ...requests,
      open: requests.open.map((r, i) => (i === index ? request : r)),
      seed,
    },
  };
}

/** The crop of the courtyard garden closest to ripe, if one grows. */
function closestToRipe(state: GameState): number | null {
  let best: number | null = null;
  let left = Infinity;
  state.garden.plots.forEach((plot, i) => {
    if (plot.crop === null || isRipe(plot)) return;
    const remaining = CROPS[plot.crop].seconds - plot.grown;
    if (remaining < left) {
      left = remaining;
      best = i;
    }
  });
  return best;
}

export function canPlayHand(state: GameState, index: number): boolean {
  const hand = state.requests.hands[index];
  if (hand === undefined) return false;
  return hand !== 'ripen' || closestToRipe(state) !== null;
}

/** Player action: play a helping hand from the reserve. */
export function playHand(state: GameState, index: number): GameState {
  if (!canPlayHand(state, index)) return state;
  const hand = state.requests.hands[index]!;
  const next: GameState = {
    ...state,
    requests: { ...state.requests, hands: state.requests.hands.filter((_, i) => i !== index) },
  };
  switch (hand) {
    case 'quarter':
      return earnLight(next, lightPerSecond(state) * QUARTER_SECONDS);
    case 'bloom':
      return { ...next, effects: startEffect(next, 'bloom') };
    case 'flight':
      return sendFlights(next, 1);
    case 'ripen': {
      const plot = closestToRipe(state)!;
      const plots = next.garden.plots.map((p, i) =>
        i === plot && p.crop !== null ? { ...p, grown: CROPS[p.crop].seconds } : p,
      );
      return { ...next, garden: { ...next.garden, plots } };
    }
  }
}

function isNeed(value: unknown): value is Need {
  if (typeof value !== 'object' || value === null) return false;
  const { kind, count, generator } = value as Record<string, unknown>;
  if (typeof count !== 'number' || !Number.isInteger(count) || count <= 0) return false;
  if (kind === 'owned') {
    return (
      typeof generator === 'string' && (GENERATOR_IDS as readonly string[]).includes(generator)
    );
  }
  return typeof kind === 'string' && (COUNTED_NEEDS as readonly string[]).includes(kind);
}

function isHand(value: unknown): value is HandId {
  return typeof value === 'string' && (HAND_IDS as readonly string[]).includes(value);
}

function isDistrict(value: unknown): value is DistrictId {
  return typeof value === 'string' && (DISTRICT_IDS as readonly string[]).includes(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function validRequests(raw: unknown, fallback: RequestsState): RequestsState {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const data = raw as Record<string, unknown>;
  const open = Array.isArray(data.open)
    ? data.open
        .filter((r): r is Request => {
          if (typeof r !== 'object' || r === null) return false;
          const { need, base, hand, from } = r as Record<string, unknown>;
          return (
            isNeed(need) && isCount(base) && isHand(hand) && (from === null || isDistrict(from))
          );
        })
        .slice(0, MAX_REQUESTS)
        .map(({ need, base, hand, from }) => ({ need, base, hand, from }))
    : [];
  const hands = Array.isArray(data.hands) ? data.hands.filter(isHand).slice(0, MAX_HANDS) : [];
  const bonds: Bonds = {};
  if (typeof data.bonds === 'object' && data.bonds !== null) {
    for (const [id, served] of Object.entries(data.bonds)) {
      if (isDistrict(id) && isCount(served) && served > 0) bonds[id] = served;
    }
  }
  const nextIn = data.nextIn;
  const seed = data.seed;
  return {
    open,
    nextIn:
      typeof nextIn === 'number' && nextIn >= 0 && nextIn <= REQUEST_INTERVAL
        ? nextIn
        : fallback.nextIn,
    seed: isCount(seed) && seed <= 0xffffffff ? seed : fallback.seed,
    hands,
    served: isCount(data.served) ? data.served : 0,
    bonds,
  };
}
