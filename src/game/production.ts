// Production, click and cost formulas (docs/game-design.md §4, §5, §8). Pure functions shared
// by the game, the UI and the balancing simulator.
import { achievementBonus } from './achievements';
import { challengeProductionFactor, generatorLimit, upgradesAllowed } from './challenges';
import { bonusesOf, costFactor, factorOf, globalBonus } from './bonuses';
import { bouquetBonus, effectFactor } from './effects';
import { COST_GROWTH, GENERATOR_IDS, GENERATORS, type GeneratorId } from './generators';
import { siteFactor } from './bioregion';
import { sourceBonus } from './cycles';
import { seedBonus } from './seasons';
import { HERBIER_COMPLETE_FACTOR, isHerbierComplete, SPECIES_STEPS } from './species';
import type { GameState } from './state';
import { CLICK_UPGRADE_IDS, UPGRADES, type UpgradeDef, type UpgradeId } from './upgrades';

/** §5.4: each generator type owned at these counts adds BIODIVERSITY_STEP to global production. */
export const BIODIVERSITY_THRESHOLDS = [10, 50, 100] as const;
export const BIODIVERSITY_STEP = 0.02;

function boughtUpgrades(state: GameState): UpgradeDef[] {
  return state.upgrades.map((id) => UPGRADES[id]);
}

const CLICK_UPGRADE_SET: ReadonlySet<UpgradeId> = new Set(CLICK_UPGRADE_IDS);

/** Number of click upgrades (§5.2) bought this Season. */
export function clickUpgradeCount(state: GameState): number {
  return state.upgrades.filter((id) => CLICK_UPGRADE_SET.has(id)).length;
}

/**
 * Multiplier from ×2 upgrades, synergies, restored parcels, projects and the sites of the
 * Bioregion (§5, §6.1, §6.2, §7.4) for one generator type.
 */
export function generatorMultiplier(state: GameState, id: GeneratorId): number {
  let factor = 1;
  let synergyBonus = 0;
  for (const { effect } of boughtUpgrades(state)) {
    if (effect.kind === 'generatorMultiplier' && effect.generator === id) factor *= effect.factor;
    if (effect.kind === 'synergy' && effect.generator === id) {
      synergyBonus += effect.bonusPerUnit * state.generators[effect.source];
    }
    if (effect.kind === 'clickSynergy' && effect.generator === id) {
      synergyBonus += effect.bonusPerUpgrade * clickUpgradeCount(state);
    }
  }
  for (const bonus of bonusesOf(state, 'generatorMultiplier')) {
    if (bonus.generator === id) factor *= bonus.factor;
  }
  let typeBonus = 0;
  for (const bonus of bonusesOf(state, 'perType')) {
    if (bonus.generator === id) typeBonus += bonus.bonus * typesOwned(state);
  }
  // §5.5 (M26): the paths of the buildings that grow.
  for (const bonus of bonusesOf(state, 'feeds')) {
    if (bonus.generator === id) synergyBonus += bonus.bonusPerUnit * state.generators[bonus.source];
  }
  for (const bonus of bonusesOf(state, 'perSpecies')) {
    if (bonus.generator === id) typeBonus += bonus.bonus * state.species.length;
  }
  for (const bonus of bonusesOf(state, 'generatorPerParcel')) {
    if (bonus.generator === id) typeBonus += bonus.bonus * state.parcels.length;
  }
  // §9.6: the summer shower waters the rooftop gardens and the greenhouses.
  // §9.7: so do the climbing beans of the courtyard garden.
  if (id === 'rooftopGarden' || id === 'greenhouse') {
    factor *= effectFactor(state.effects, 'shower') * effectFactor(state.effects, 'beans');
  }
  // §9.6, M18: the transhumance's sheep graze under the panels.
  if (id === 'balconyPanel') factor *= effectFactor(state.effects, 'grazing');
  return (
    factor *
    (1 + synergyBonus * factorOf(state, 'synergyFactor')) *
    (1 + typeBonus) *
    siteFactor(state, id)
  );
}

/** Number of generator types owned at least once. */
export function typesOwned(state: GameState): number {
  return GENERATOR_IDS.filter((id) => state.generators[id] > 0).length;
}

/**
 * §5.4: +2% global production per generator type at 10, 50 and 100 units owned, and per species
 * of the Herbier (§9.5); ×1.5 with the complete Herbier, ×2 while migrating birds stay (§9.6).
 */
export function biodiversityBonus(state: GameState): number {
  const thresholds = [
    ...BIODIVERSITY_THRESHOLDS,
    ...bonusesOf(state, 'biodiversityThreshold').map((b) => b.threshold),
  ];
  let steps = state.species.length * SPECIES_STEPS;
  for (const id of GENERATOR_IDS) {
    for (const threshold of thresholds) {
      if (state.generators[id] >= threshold) steps += 1;
    }
  }
  const herbier = isHerbierComplete(state) ? HERBIER_COMPLETE_FACTOR : 1;
  // §9.6: a flock of migrating birds doubles it while it stays.
  const birds = effectFactor(state.effects, 'birds');
  return steps * BIODIVERSITY_STEP * factorOf(state, 'biodiversityFactor') * herbier * birds;
}

/** §5.3: additive global bonus from the upgrades that grow with the other upgrades bought. */
export function upgradeSynergyBonus(state: GameState): number {
  const upgrades = boughtUpgrades(state);
  const synergies = upgrades.filter(({ effect }) => effect.kind === 'synergy').length;
  let bonus = 0;
  for (const { effect } of upgrades) {
    if (effect.kind !== 'upgradeSynergy') continue;
    bonus += effect.bonusPerUpgrade * (effect.counts === 'all' ? upgrades.length : synergies);
  }
  return bonus;
}

/**
 * §8: multiplier applied to every generator: Seeds × Sources × Milestones × biodiversity ×
 * upgrade synergies × parcels and projects × Floraison × the pollen's flight (§5.6) × the bouquet of
 * the effects running together (§5.7), and the constraint of a challenge Season (§7.3).
 */
export function globalMultiplier(state: GameState): number {
  return (
    (1 + seedBonus(state.seeds, state.sources)) *
    (1 + sourceBonus(state.sources)) *
    (1 + globalBonus(state)) *
    (1 + achievementBonus(state)) *
    (1 + biodiversityBonus(state)) *
    (1 + upgradeSynergyBonus(state)) *
    effectFactor(state.effects, 'bloom') *
    effectFactor(state.effects, 'flight') *
    (1 + bouquetBonus(state.effects)) *
    challengeProductionFactor(state)
  );
}

/** Light per second produced by all units of one generator, multipliers included. */
export function generatorProduction(state: GameState, id: GeneratorId): number {
  const owned = state.generators[id];
  if (owned === 0) return 0;
  return (
    GENERATORS[id].baseProduction * owned * generatorMultiplier(state, id) * globalMultiplier(state)
  );
}

/**
 * Total Light per second. Same sum as generatorProduction over every type, with the global
 * multiplier computed once instead of once per type: it is the costly part, and this runs on every
 * tick and many times per render.
 */
/** Production per state: a state never changes, and the formula is read many times per tick. */
const lightCache = new WeakMap<GameState, number>();

export function lightPerSecond(state: GameState): number {
  let cached = lightCache.get(state);
  if (cached === undefined) {
    cached = computeLightPerSecond(state);
    lightCache.set(state, cached);
  }
  return cached;
}

function computeLightPerSecond(state: GameState): number {
  let total = 0;
  for (const id of GENERATOR_IDS) {
    const owned = state.generators[id];
    if (owned > 0) total += GENERATORS[id].baseProduction * owned * generatorMultiplier(state, id);
  }
  return total === 0 ? 0 : total * globalMultiplier(state);
}

/**
 * §5.2: click = (1 + Light per building from upgrades and projects) × click multipliers + share of the production per second, all ×100 during a
 * Pollinisation (§9.2).
 */
export function clickValue(state: GameState): number {
  let multiplier = factorOf(state, 'clickMultiplier');
  let fraction = 0;
  let perBuilding = 0;
  let flat = 1;
  for (const bonus of bonusesOf(state, 'clickPerUnit')) {
    flat += bonus.amount * state.generators[bonus.generator];
  }
  for (const { effect } of boughtUpgrades(state)) {
    if (effect.kind === 'clickMultiplier') multiplier *= effect.factor;
    if (effect.kind === 'clickFromProduction') fraction += effect.fraction;
    if (effect.kind === 'clickPerBuilding') perBuilding += effect.perUnit;
  }
  if (perBuilding > 0) for (const id of GENERATOR_IDS) flat += perBuilding * state.generators[id];
  const base = flat * multiplier + (fraction > 0 ? fraction * lightPerSecond(state) : 0);
  // §9.6, M18: the fireflies of the water gardens light up every click.
  return (
    base * effectFactor(state.effects, 'pollination') * effectFactor(state.effects, 'fireflies')
  );
}

/** The most expensive building owned, the one the solar flea market sells cheaper (§9.6, M18). */
export function fleaMarketGenerator(state: GameState): GeneratorId | null {
  return [...GENERATOR_IDS].reverse().find((id) => state.generators[id] > 0) ?? null;
}

function fleaMarketFactor(state: GameState, id: GeneratorId): number {
  if (!state.effects.some((e) => e.kind === 'fleaMarket')) return 1;
  return fleaMarketGenerator(state) === id ? effectFactor(state.effects, 'fleaMarket') : 1;
}

/**
 * Cost of `count` units of a generator bought from the current amount owned, after the
 * discounts of projects (§6.2): baseCost × 1.15^owned × (1.15^count − 1) / 0.15. For one unit: baseCost × 1.15^owned.
 */
export function generatorCost(state: GameState, id: GeneratorId, count = 1): number {
  const first =
    GENERATORS[id].baseCost *
    costFactor(state) *
    fleaMarketFactor(state, id) *
    COST_GROWTH ** state.generators[id];
  if (count === 1) return first;
  return (first * (COST_GROWTH ** count - 1)) / (COST_GROWTH - 1);
}

/**
 * Largest number of units of a generator affordable with the Light in reserve, within the limit
 * of a challenge Season (§7.3).
 */
export function maxAffordable(state: GameState, id: GeneratorId): number {
  const first = generatorCost(state, id);
  const light = state.resources.light;
  const room = generatorLimit(state, id) - state.generators[id];
  if (light < first || room < 1) return 0;
  let count = Math.floor(Math.log(1 + (light * (COST_GROWTH - 1)) / first) / Math.log(COST_GROWTH));
  // Guard against floating-point error at the boundary.
  while (count > 1 && generatorCost(state, id, count) > light) count -= 1;
  while (generatorCost(state, id, count + 1) <= light) count += 1;
  return Math.min(room, Math.max(1, count));
}

/**
 * A generator is shown once the player has earned half its base cost this Season.
 * Owning one keeps it shown.
 */
export function isGeneratorRevealed(state: GameState, id: GeneratorId): boolean {
  // The first building is shown from the very start, so a new garden opens on a named goal.
  if (id === GENERATOR_IDS[0]) return true;
  return state.generators[id] > 0 || state.totalLight >= GENERATORS[id].baseCost / 2;
}

export function isUpgradeBought(state: GameState, id: UpgradeId): boolean {
  return state.upgrades.includes(id);
}

/**
 * An upgrade appears when its condition is met; conditions never become false in a Season. The
 * wild challenge Season (§7.3) offers none until it is won.
 */
export function isUpgradeUnlocked(state: GameState, id: UpgradeId): boolean {
  if (!upgradesAllowed(state)) return false;
  const { owned, totalLight, upgrades, synergies, clicks, clickUpgrades } = UPGRADES[id].condition;
  if (totalLight !== undefined && state.totalLight < totalLight) return false;
  if (clicks !== undefined && state.clicks < clicks) return false;
  if (clickUpgrades !== undefined && clickUpgradeCount(state) < clickUpgrades) return false;
  if (upgrades !== undefined && state.upgrades.length < upgrades) return false;
  if (synergies !== undefined) {
    const bought = boughtUpgrades(state).filter(({ effect }) => effect.kind === 'synergy');
    if (bought.length < synergies) return false;
  }
  if (owned) {
    for (const [generator, count] of Object.entries(owned) as [GeneratorId, number][]) {
      if (state.generators[generator] < count) return false;
    }
  }
  return true;
}

/** Unlocked upgrades not bought yet, cheapest first (§5). */
export function availableUpgrades(state: GameState): UpgradeDef[] {
  return Object.values(UPGRADES)
    .filter((u) => !isUpgradeBought(state, u.id) && isUpgradeUnlocked(state, u.id))
    .sort((a, b) => a.cost - b.cost);
}
