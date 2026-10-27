// The Cooperatives (docs/game-design.md §7.2): neighbours who buy for the player once a talent of
// the Tree of Seasons brings them in. Each one looks after some buildings, the council after the
// upgrades, the fountaineers (from the Canopy, §7.1) after the water collectors of the
// Bioregion. M36 adds the small loops: the council carries out the projects once the assembly of
// the Canopy asks it, the growers resow the courtyard garden (never harvesting, D27) and the
// beekeepers carry the spare honey to the great works. Pure: `runCooperatives` returns new
// state, called by every tick.
import { isIntroduced } from './introductions';
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
import {
  canSow,
  CROP_IDS,
  isCropUnlocked,
  openPlots,
  sow,
  weatherCrop,
  type CropId,
} from './garden';
import { carryHoney } from './greatWorks';
import { HIVE_COSTS } from './orchard';
import { PROJECTS, type ProjectId } from './projects';
import { carryOutProject, offeredProjects } from './restoration';

export const COOPERATIVE_IDS = [
  'gardeners',
  'roofers',
  'farmers',
  'foresters',
  'council',
  'fountaineers',
  'growers',
  'beekeepers',
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
  growers: [],
  beekeepers: [],
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
 * its canopy talent sown. The beekeepers come with the second hive of the orchard (M36).
 */
export function isCooperativeUnlocked(state: GameState, id: CooperativeId): boolean {
  if (!isIntroduced(state, 'cooperatives')) return false;
  if (id === 'beekeepers') return state.orchard.hives >= HIVE_COSTS.length;
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
  | { kind: 'project'; id: ProjectId; cost: number }
);

/** The council carries out the projects once the assembly of the Canopy is sown (M36). */
export function councilLeadsProjects(state: GameState): boolean {
  return isCooperativeActive(state, 'council') && state.canopy.levels.assembly > 0;
}

/** The cheapest project offered this Season, for the council. */
function nextProject(state: GameState): { id: ProjectId; cost: number } | null {
  if (!councilLeadsProjects(state)) return null;
  let best: { id: ProjectId; cost: number } | null = null;
  for (const { id } of offeredProjects(state)) {
    const { cost } = PROJECTS[id];
    if (!best || cost < best.cost) best = { id, cost };
  }
  return best;
}

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
  const council = isCooperativeActive(state, 'council');
  const upgrade = council ? availableUpgrades(state)[0] : undefined;
  // The council's projects (M36) wait in line with its upgrades, the cheaper first.
  const project = nextProject(state);
  if (project && (!upgrade || project.cost < upgrade.cost)) {
    if (!best || project.cost <= buildingCost * COUNCIL_PRIORITY) {
      if (project.cost > money) return null;
      return { cooperative: 'council', kind: 'project', ...project };
    }
  }
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
 * What the growers sow after `last` (M36): the crop of the weather when it differs, otherwise
 * the next crop unlocked after it, so every bed rotates; the same crop when it is the only one.
 */
export function growersCrop(state: GameState, last: CropId): CropId {
  const sky = weatherCrop(state);
  if (sky !== null && sky !== last && isCropUnlocked(state, sky)) return sky;
  const from = CROP_IDS.indexOf(last);
  for (let step = 1; step < CROP_IDS.length; step++) {
    const crop = CROP_IDS[(from + step) % CROP_IDS.length]!;
    if (isCropUnlocked(state, crop)) return crop;
  }
  return last;
}

function counted(state: GameState, id: CooperativeId, count: number): GameState {
  if (count === 0) return state;
  const { purchases } = state.cooperatives;
  return {
    ...state,
    cooperatives: {
      ...state.cooperatives,
      purchases: { ...purchases, [id]: purchases[id] + count },
    },
  };
}

/** The growers (M36) resow every harvested bed; they never harvest (D27). */
function resowGarden(state: GameState): GameState {
  if (!isCooperativeActive(state, 'growers')) return state;
  let next = state;
  let sown = 0;
  for (let i = 0; i < openPlots(state); i++) {
    const last = next.garden.plots[i]?.last;
    if (!last) continue;
    const crop = growersCrop(next, last);
    if (!canSow(next, i, crop)) continue;
    next = sow(next, i, crop);
    sown += 1;
  }
  return counted(next, 'growers', sown);
}

/** The beekeepers (M36) carry the spare honey to the great work in progress. */
function tendHives(state: GameState): GameState {
  if (!isCooperativeActive(state, 'beekeepers')) return state;
  const next = carryHoney(state);
  return counted(next, 'beekeepers', state.orchard.honey - next.orchard.honey);
}

/**
 * Let the working cooperatives buy what they can afford now. Their purchases are not the
 * player's: they do not reset the time since the last purchase (hidden Milestone, §9.3).
 */
export function runCooperatives(state: GameState): GameState {
  // The beekeepers need no talent (M36): they keep working after a swarm empties the tree.
  let next = tendHives(resowGarden(state));
  if (next.talents.length === 0) return next;
  for (let i = 0; i < MAX_PURCHASES_PER_TICK; i++) {
    const purchase = nextPurchase(next);
    if (!purchase) break;
    const { cooperatives } = counted(next, purchase.cooperative, 1);
    if (purchase.kind === 'collector' || purchase.kind === 'project') {
      // Kept as the player's purchase would, except for the time since the last purchase.
      const bought =
        purchase.kind === 'collector'
          ? buyCollector(next, purchase.id)
          : carryOutProject(next, purchase.id);
      next = { ...bought, idleSeconds: next.idleSeconds, cooperatives };
      continue;
    }
    const light = Math.max(0, next.resources.light - purchase.cost);
    next = {
      ...next,
      resources: { ...next.resources, light },
      cooperatives,
      ...(purchase.kind === 'generator'
        ? { generators: { ...next.generators, [purchase.id]: next.generators[purchase.id] + 1 } }
        : { upgrades: [...next.upgrades, purchase.id] }),
    };
  }
  return next;
}
