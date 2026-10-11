// The Cooperatives (docs/game-design.md §7.2): neighbours who buy for the player once a talent of
// the Tree of Seasons brings them in. Each one looks after some buildings, the council after the
// upgrades, the fountaineers (from the Canopy, §7.1) after the water collectors of the
// Bioregion. Pure: `runCooperatives` returns new state, called by every tick.
import {
  buyCollector,
  canBuyCollector,
  COLLECTOR_IDS,
  collectorCost,
  isCollectorRevealed,
  type CollectorId,
} from './bioregion';
import { generatorLimit } from './challenges';
import { GENERATOR_IDS, GENERATORS, type GeneratorId } from './generators';
import {
  availableUpgrades,
  generatorCost,
  generatorMultiplier,
  isGeneratorRevealed,
} from './production';
import type { GameState } from './state';
import { CANOPY_LIST, TALENT_LIST } from './talents';

export const COOPERATIVE_IDS = [
  'gardeners',
  'roofers',
  'farmers',
  'foresters',
  'council',
  'fountaineers',
] as const;
export type CooperativeId = (typeof COOPERATIVE_IDS)[number];

/** Buildings each cooperative buys; the council buys upgrades, the fountaineers collectors. */
export const COOPERATIVE_GENERATORS: Record<CooperativeId, readonly GeneratorId[]> = {
  gardeners: ['pot', 'balconyPanel'],
  roofers: ['rooftopGarden', 'greenhouse'],
  farmers: ['verticalFarm', 'mirrorPlant'],
  foresters: ['urbanCanopy', 'arcology'],
  council: [],
  fountaineers: [],
};

/** "Garder une réserve": a purchase may then cost at most this share of the Light in reserve. */
export const THRIFTY_SHARE = 0.1;

/** Upper bound of purchases in one tick, so a long offline step never stalls the game. */
const MAX_PURCHASES_PER_TICK = 500;

export interface CooperativesState {
  /** Cooperatives the player paused; the others work whenever their talent is learnt. */
  paused: CooperativeId[];
  /** Keep a reserve: each purchase costs at most THRIFTY_SHARE of the Light in reserve. */
  thrifty: boolean;
  /** Purchases made by each cooperative, over all Seasons (statistics, map animation). */
  purchases: Record<CooperativeId, number>;
}

export function createCooperativesState(): CooperativesState {
  return {
    paused: [],
    thrifty: false,
    purchases: Object.fromEntries(COOPERATIVE_IDS.map((id) => [id, 0])) as Record<
      CooperativeId,
      number
    >,
  };
}

export function isCooperativeId(value: unknown): value is CooperativeId {
  return typeof value === 'string' && (COOPERATIVE_IDS as readonly string[]).includes(value);
}

/**
 * A cooperative joins once the talent that brings it in is learnt (from the 2nd Season, D3), or
 * its canopy talent sown.
 */
export function isCooperativeUnlocked(state: GameState, id: CooperativeId): boolean {
  return (
    TALENT_LIST.some((t) => t.cooperative === id && state.talents.includes(t.id)) ||
    CANOPY_LIST.some((c) => c.cooperative === id && state.canopy.levels[c.id] > 0)
  );
}

export function isCooperativeActive(state: GameState, id: CooperativeId): boolean {
  return isCooperativeUnlocked(state, id) && !state.cooperatives.paused.includes(id);
}

export function unlockedCooperatives(state: GameState): CooperativeId[] {
  return COOPERATIVE_IDS.filter((id) => isCooperativeUnlocked(state, id));
}

/** Player action: pause a cooperative or set it back to work. */
export function toggleCooperative(state: GameState, id: CooperativeId): GameState {
  const { paused } = state.cooperatives;
  return {
    ...state,
    cooperatives: {
      ...state.cooperatives,
      paused: paused.includes(id) ? paused.filter((p) => p !== id) : [...paused, id],
    },
  };
}

/** Player action: keep a reserve of Light, or let the cooperatives spend all of it. */
export function setThrifty(state: GameState, thrifty: boolean): GameState {
  return { ...state, cooperatives: { ...state.cooperatives, thrifty } };
}

function budget(state: GameState): number {
  const light = state.resources.light;
  return state.cooperatives.thrifty ? light * THRIFTY_SHARE : light;
}

/** Light spent per Light/s gained by one more unit: lower is better. */
function payback(state: GameState, id: GeneratorId): number {
  const gain = GENERATORS[id].baseProduction * generatorMultiplier(state, id);
  return generatorCost(state, id) / gain;
}

type Purchase = { cooperative: CooperativeId } & (
  | { kind: 'generator'; id: GeneratorId; cost: number }
  | { kind: 'upgrade'; id: GameState['upgrades'][number]; cost: number }
  | { kind: 'collector'; id: CollectorId; cost: number }
);

/**
 * The fountaineers build the cheapest water collector shown, once it costs at most a tenth of the
 * Light in reserve: the Bioregion grows on the side and never holds back the buildings.
 */
function nextCollector(state: GameState): Purchase | null {
  if (!isCooperativeActive(state, 'fountaineers')) return null;
  let best: { id: CollectorId; cost: number } | null = null;
  for (const id of COLLECTOR_IDS) {
    if (!isCollectorRevealed(state, id) || !canBuyCollector(state, id)) continue;
    const cost = collectorCost(state, id);
    if (!best || cost < best.cost) best = { id, cost };
  }
  if (!best || best.cost > state.resources.light * THRIFTY_SHARE) return null;
  return { cooperative: 'fountaineers', kind: 'collector', ...best };
}

/**
 * A building of a cooperative is a good deal when it pays back at most this many times slower
 * than the best building shown, theirs or not.
 */
export const COOPERATIVE_TOLERANCE = 1.25;

/**
 * The council saves for an upgrade, and the building cooperatives wait, when the upgrade costs
 * at most this many times the building they would buy next.
 */
export const COUNCIL_PRIORITY = 30;

/**
 * The next purchase, if one is affordable now. The building cooperatives together pick the
 * building of theirs that pays back fastest, among those shown to the player. When it is a good
 * deal they spend what they may; otherwise the player is probably saving for a better building,
 * so they only buy it with a tenth of the reserve. The council buys the cheapest upgrade, and the
 * others wait for it while it is not much dearer than their next building.
 */
function nextPurchase(state: GameState): Purchase | null {
  const collector = nextCollector(state);
  if (collector) return collector;
  const scores = new Map<GeneratorId, number>();
  for (const id of GENERATOR_IDS) {
    if (isGeneratorRevealed(state, id) && state.generators[id] < generatorLimit(state, id)) {
      scores.set(id, payback(state, id));
    }
  }
  let best: { cooperative: CooperativeId; id: GeneratorId; score: number } | null = null;
  for (const cooperative of COOPERATIVE_IDS) {
    if (!isCooperativeActive(state, cooperative)) continue;
    for (const id of COOPERATIVE_GENERATORS[cooperative]) {
      const score = scores.get(id);
      if (score !== undefined && (!best || score < best.score)) best = { cooperative, id, score };
    }
  }
  const money = budget(state);
  const buildingCost = best ? generatorCost(state, best.id) : Infinity;
  const upgrade = isCooperativeActive(state, 'council') ? availableUpgrades(state)[0] : undefined;
  if (upgrade && (!best || upgrade.cost <= buildingCost * COUNCIL_PRIORITY)) {
    if (upgrade.cost > money) return null;
    return { cooperative: 'council', kind: 'upgrade', id: upgrade.id, cost: upgrade.cost };
  }
  if (!best) return null;
  const goodDeal = best.score <= Math.min(...scores.values()) * COOPERATIVE_TOLERANCE;
  const allowed = goodDeal ? money : state.resources.light * THRIFTY_SHARE;
  if (buildingCost > allowed) return null;
  return { cooperative: best.cooperative, kind: 'generator', id: best.id, cost: buildingCost };
}

/**
 * Let the working cooperatives buy what they can afford now. Their purchases are not the
 * player's: they do not reset the time since the last purchase (hidden Milestone, §9.3).
 */
export function runCooperatives(state: GameState): GameState {
  if (state.talents.length === 0) return state;
  let next = state;
  for (let i = 0; i < MAX_PURCHASES_PER_TICK; i++) {
    const purchase = nextPurchase(next);
    if (!purchase) break;
    const { purchases } = next.cooperatives;
    const counted = {
      ...next.cooperatives,
      purchases: { ...purchases, [purchase.cooperative]: purchases[purchase.cooperative] + 1 },
    };
    if (purchase.kind === 'collector') {
      // Kept as the player's purchase would, except for the time since the last purchase.
      next = {
        ...buyCollector(next, purchase.id),
        idleSeconds: next.idleSeconds,
        cooperatives: counted,
      };
      continue;
    }
    const light = Math.max(0, next.resources.light - purchase.cost);
    next = {
      ...next,
      resources: { ...next.resources, light },
      cooperatives: counted,
      ...(purchase.kind === 'generator'
        ? { generators: { ...next.generators, [purchase.id]: next.generators[purchase.id] + 1 } }
        : { upgrades: [...next.upgrades, purchase.id] }),
    };
  }
  return next;
}
