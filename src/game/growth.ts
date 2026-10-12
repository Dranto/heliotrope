// Buildings that grow (docs/game-design.md §5.5, M26): each generator reaches three tiers of
// units owned, and at each the player picks one of two paths, each a bonus of the shared shape.
import type { Bonus } from './bonuses';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import type { GameState } from './state';
import { WEATHER_PATH_FACTOR } from './weather';

/** Units owned at which a building grows into its next form. */
export const GROWTH_TIERS = [50, 100, 200] as const;
export type Path = 0 | 1;

export interface GrowthState {
  /** The path picked at each tier of each building, null while none is. Kept across Seasons. */
  paths: Record<GeneratorId, (Path | null)[]>;
  /** The Season in which a building last changed the path of a tier already reached. */
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
const feeds = (generator: GeneratorId, source: GeneratorId, bonusPerUnit: number): Bonus => ({
  kind: 'feeds',
  generator,
  source,
  bonusPerUnit,
});
const perSpecies = (generator: GeneratorId, bonus: number): Bonus => ({
  kind: 'perSpecies',
  generator,
  bonus,
});

/** The two paths of each tier, for each building: [tier][path]. */
export const GROWTH: Record<GeneratorId, readonly (readonly [Bonus, Bonus])[]> = {
  pot: [
    [
      { kind: 'clickPerUnit', generator: 'pot', amount: 0.25 },
      feeds('rooftopGarden', 'pot', 0.0025),
    ],
    [times('pot', 1.5), { kind: 'gardenGrowth', factor: 1.15 }],
    [perSpecies('pot', 0.05), { kind: 'pollenFill', factor: 1.25 }],
  ],
  balconyPanel: [
    [
      { kind: 'clickPerUnit', generator: 'balconyPanel', amount: 1 },
      feeds('greenhouse', 'balconyPanel', 0.0025),
    ],
    [times('balconyPanel', 1.5), { kind: 'effectDuration', effect: 'bloom', factor: 1.25 }],
    [
      times('balconyPanel', 1.5),
      { kind: 'generatorPerParcel', generator: 'balconyPanel', bonus: 0.05 },
    ],
  ],
  rooftopGarden: [
    [
      { kind: 'gardenGrowth', factor: 1.15 },
      { kind: 'generatorPerParcel', generator: 'rooftopGarden', bonus: 0.04 },
    ],
    [times('rooftopGarden', 1.5), feeds('verticalFarm', 'rooftopGarden', 0.002)],
    [{ kind: 'harvestFactor', factor: 1.5 }, perSpecies('rooftopGarden', 0.025)],
  ],
  greenhouse: [
    [times('greenhouse', 1.25), feeds('rooftopGarden', 'greenhouse', 0.005)],
    [{ kind: 'gardenGrowth', factor: 1.2 }, perSpecies('greenhouse', 0.025)],
    [times('greenhouse', 1.5), { kind: 'global', bonus: 0.02 }],
  ],
  verticalFarm: [
    [times('verticalFarm', 1.25), { kind: 'clickPerUnit', generator: 'verticalFarm', amount: 25 }],
    [feeds('mirrorPlant', 'verticalFarm', 0.0025), times('verticalFarm', 1.4)],
    [times('verticalFarm', 1.5), { kind: 'biodiversityFactor', factor: 1.05 }],
  ],
  mirrorPlant: [
    [
      { kind: 'effectDuration', effect: 'bloom', factor: 1.25 },
      { kind: 'water', factor: 1.15 },
    ],
    [times('mirrorPlant', 1.5), { kind: 'butterflyInterval', factor: 0.9 }],
    [times('mirrorPlant', 1.5), feeds('urbanCanopy', 'mirrorPlant', 0.005)],
  ],
  urbanCanopy: [
    [times('urbanCanopy', 1.25), { kind: 'visitInterval', factor: 0.9 }],
    [perSpecies('urbanCanopy', 0.01), { kind: 'biodiversityFactor', factor: 1.05 }],
    [times('urbanCanopy', 1.5), { kind: 'offlineCap', seconds: 3600 }],
  ],
  arcology: [
    [times('arcology', 1.25), { kind: 'discount', fraction: 0.05 }],
    [perSpecies('arcology', 0.01), { kind: 'global', bonus: 0.03 }],
    [times('arcology', 1.5), { kind: 'globalPerType', bonus: 0.01 }],
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

/**
 * A path played `scale` times as strong (M33): the part of its effect above none grows, whatever
 * its shape; a shorter interval gets shorter still. Offline hours are kept as they are.
 */
export function strengthen(bonus: Bonus, scale: number): Bonus {
  if (scale === 1) return bonus;
  if ('factor' in bonus) return { ...bonus, factor: 1 + (bonus.factor - 1) * scale };
  if ('bonus' in bonus) return { ...bonus, bonus: bonus.bonus * scale };
  if ('bonusPerUnit' in bonus) return { ...bonus, bonusPerUnit: bonus.bonusPerUnit * scale };
  if ('amount' in bonus) return { ...bonus, amount: bonus.amount * scale };
  if ('fraction' in bonus) return { ...bonus, fraction: bonus.fraction * scale };
  return bonus;
}

/**
 * Bonuses of every path picked at a tier reached; those of the `favoured` buildings, under their
 * weather (M33), play WEATHER_PATH_FACTOR stronger.
 */
export function growthBonuses(
  state: {
    generators: Readonly<Record<string, number>>;
    growth: GrowthState;
  },
  favoured: readonly GeneratorId[] = [],
): Bonus[] {
  const bonuses: Bonus[] = [];
  for (const id of GENERATOR_IDS) {
    const reached = reachedTiers(state, id);
    const paths = state.growth.paths[id];
    const scale = favoured.includes(id) ? WEATHER_PATH_FACTOR : 1;
    for (let tier = 0; tier < reached; tier++) {
      const path = paths[tier];
      if (path !== null && path !== undefined) {
        bonuses.push(strengthen(GROWTH[id][tier]![path], scale));
      }
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
 * one; a path already working changes once per building and per Season (decision D18).
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
  return state.growth.swapped[id] !== state.seasons;
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
      swapped: working ? { ...state.growth.swapped, [id]: state.seasons } : state.growth.swapped,
    },
  };
}

/** Paths picked at any tier reached, over every building (Milestones). */
export function pathsWorking(state: GameState): number {
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
