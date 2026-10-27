// Buildings that grow (docs/game-design.md §5.5, M26): each generator reaches three tiers of
// units owned, and at each the player picks one of two paths, each a bonus of the shared shape:
// the building much stronger, or a system that sets the pace.
import type { Bonus } from './bonuses';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import type { GameState } from './state';

/** Units owned at which a building grows into its next form. */
export const GROWTH_TIERS = [50, 100, 200] as const;
export type Path = 0 | 1;

export interface GrowthState {
  /** The path picked at each tier of each building, null while none is. Kept across Seasons. */
  paths: Record<GeneratorId, (Path | null)[]>;
  /** The Cycle of water in which a building last changed the path of a tier already reached. */
  swapped: Partial<Record<GeneratorId, number>>;
}

export function createGrowthState(): GrowthState {
  return {
    paths: Object.fromEntries(
      GENERATOR_IDS.map((id) => [id, GROWTH_TIERS.map(() => null)]),
    ) as Record<GeneratorId, (Path | null)[]>,
    swapped: {},
  };
}

const times = (generator: GeneratorId, factor: number): Bonus => ({
  kind: 'generatorMultiplier',
  generator,
  factor,
});
const ripening = (seconds: number): Bonus => ({ kind: 'ripening', seconds });

/**
 * The two paths of each tier, for each building: [tier][path]. The first one makes the building
 * itself much stronger; the second ties it to a system that sets the pace (slimming plan, lot 5):
 * the Seeds' ripening, the Water, the prices, the click, the garden.
 */
export const GROWTH: Record<GeneratorId, readonly (readonly [Bonus, Bonus])[]> = {
  pot: [
    [times('pot', 1.5), { kind: 'clickPerUnit', generator: 'pot', amount: 1 }],
    [times('pot', 1.75), { kind: 'gardenGrowth', factor: 1.3 }],
    [times('pot', 2), { kind: 'pollenFill', factor: 1.5 }],
  ],
  balconyPanel: [
    [times('balconyPanel', 1.5), { kind: 'clickPerUnit', generator: 'balconyPanel', amount: 4 }],
    [times('balconyPanel', 1.75), { kind: 'effectDuration', effect: 'bloom', factor: 1.5 }],
    [times('balconyPanel', 2), ripening(20)],
  ],
  rooftopGarden: [
    [times('rooftopGarden', 1.5), { kind: 'gardenGrowth', factor: 1.3 }],
    [times('rooftopGarden', 1.75), { kind: 'harvestFactor', factor: 2 }],
    [times('rooftopGarden', 2), ripening(20)],
  ],
  greenhouse: [
    [times('greenhouse', 1.5), { kind: 'gardenGrowth', factor: 1.3 }],
    [times('greenhouse', 1.75), ripening(20)],
    [times('greenhouse', 2), ripening(30)],
  ],
  verticalFarm: [
    [times('verticalFarm', 1.5), { kind: 'clickPerUnit', generator: 'verticalFarm', amount: 100 }],
    [times('verticalFarm', 1.75), { kind: 'discount', fraction: 0.05 }],
    [times('verticalFarm', 2), ripening(30)],
  ],
  mirrorPlant: [
    [times('mirrorPlant', 1.5), { kind: 'water', factor: 1.3 }],
    [times('mirrorPlant', 1.75), { kind: 'butterflyInterval', factor: 0.8 }],
    [times('mirrorPlant', 2), { kind: 'collectorDiscount', fraction: 0.2 }],
  ],
  urbanCanopy: [
    [times('urbanCanopy', 1.5), { kind: 'visitInterval', factor: 0.8 }],
    [times('urbanCanopy', 1.75), { kind: 'water', factor: 1.3 }],
    [times('urbanCanopy', 2), { kind: 'siteDiscount', fraction: 0.2 }],
  ],
  arcology: [
    [times('arcology', 1.5), { kind: 'discount', fraction: 0.1 }],
    [times('arcology', 1.75), ripening(30)],
    [times('arcology', 2), { kind: 'water', factor: 1.5 }],
  ],
};

export function isPath(value: unknown): value is Path {
  return value === 0 || value === 1;
}

/** Tiers a building has reached with the units owned now (0 to 3). */
export function reachedTiers(
  state: { generators: Readonly<Record<string, number>> },
  id: GeneratorId,
): number {
  return GROWTH_TIERS.filter((tier) => (state.generators[id] ?? 0) >= tier).length;
}

/** Bonuses of every path picked at a tier reached. */
export function growthBonuses(state: {
  generators: Readonly<Record<string, number>>;
  growth: GrowthState;
}): Bonus[] {
  const bonuses: Bonus[] = [];
  for (const id of GENERATOR_IDS) {
    const reached = reachedTiers(state, id);
    const paths = state.growth.paths[id];
    for (let tier = 0; tier < reached; tier++) {
      const path = paths[tier];
      if (path !== null && path !== undefined) bonuses.push(GROWTH[id][tier]![path]);
    }
  }
  return bonuses;
}

/** Tiers reached with no path picked yet: the panel asks for a choice. */
export function pendingTier(state: GameState, id: GeneratorId): number | null {
  const reached = reachedTiers(state, id);
  for (let tier = 0; tier < reached; tier++) {
    if (state.growth.paths[id][tier] === null) return tier;
  }
  return null;
}

/**
 * A path can be picked freely before its tier is reached, and when the tier is reached without
 * one; a path already working changes once per building and per Cycle of water (slimming plan,
 * lot 5: a path is a commitment, no longer a Season's choice).
 */
export function canChoosePath(
  state: GameState,
  id: GeneratorId,
  tier: number,
  path: Path,
): boolean {
  if (tier < 0 || tier >= GROWTH_TIERS.length) return false;
  const current = state.growth.paths[id][tier];
  if (current === path) return false;
  if (current === null || tier >= reachedTiers(state, id)) return true;
  return state.growth.swapped[id] !== state.cycles;
}

/** Player action: pick or change the path of a building's tier. */
export function choosePath(state: GameState, id: GeneratorId, tier: number, path: Path): GameState {
  if (!canChoosePath(state, id, tier, path)) return state;
  const current = state.growth.paths[id][tier];
  const working = current !== null && tier < reachedTiers(state, id);
  const paths = state.growth.paths[id].map((p, i) => (i === tier ? path : p));
  return {
    ...state,
    growth: {
      paths: { ...state.growth.paths, [id]: paths },
      swapped: working ? { ...state.growth.swapped, [id]: state.cycles } : state.growth.swapped,
    },
  };
}

/** Paths picked at any tier reached, over every building (Milestones). */
export function pathsWorking(state: {
  generators: Readonly<Record<string, number>>;
  growth: GrowthState;
}): number {
  return GENERATOR_IDS.reduce((sum, id) => {
    const reached = reachedTiers(state, id);
    return sum + state.growth.paths[id].slice(0, reached).filter((p) => p !== null).length;
  }, 0);
}

/** A saved growth state, or a fresh one where it is missing or malformed. */
export function validGrowth(raw: unknown): GrowthState {
  const growth = createGrowthState();
  if (typeof raw !== 'object' || raw === null) return growth;
  const data = raw as Record<string, unknown>;
  const paths = data.paths as Record<string, unknown> | undefined;
  for (const id of GENERATOR_IDS) {
    const list = paths?.[id];
    if (!Array.isArray(list)) continue;
    growth.paths[id] = GROWTH_TIERS.map((_, tier) => (isPath(list[tier]) ? list[tier] : null));
  }
  const swapped = data.swapped as Record<string, unknown> | undefined;
  for (const id of GENERATOR_IDS) {
    const season = swapped?.[id];
    if (typeof season === 'number' && Number.isInteger(season) && season >= 0) {
      growth.swapped[id] = season;
    }
  }
  return growth;
}
