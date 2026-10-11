// Effects of restored parcels and neighbouring districts, neighbourhood projects, talents and canopy of the Tree of Seasons and won
// challenge Seasons (docs/game-design.md §6.1, §6.2, §7.1, §7.3). Their tables describe their
// effect with the same `Bonus` shape; the formulas in production.ts,
// butterfly.ts and offline.ts read the totals through the helpers below.
import { allianceBonuses } from './alliances';
import type { GameState } from './state';
import { cityBonuses, type CitySource } from './cityData';
import { corridorBonuses } from './corridors';
import { fruitVarietyBonuses, type FruitId } from './fruits';
import type { EffectKind } from './effects';
import type { GeneratorId } from './generators';
import { CHALLENGES, type ChallengeId } from './challenges';
import { CYCLE_CHALLENGES, type CycleChallengeId } from './cycleChallenges';
import { hillsidesBonuses, scaleBonus, widenFactor, type WideArmId } from './delta';
import { DISTRICTS, type DistrictId } from './districts';
import { greatWorksBonuses, type WorkId } from './greatWorks';
import { parcelBonuses, type Future, type ParcelId } from './parcels';
import { PROJECTS, type ProjectId } from './projects';
import { varietyBonuses, type VarietyId } from './seedBank';
import { canopyBonuses, TALENTS, type CanopyState, type TalentId } from './talents';

export type Bonus =
  /** Multiplies one generator's production. */
  | { kind: 'generatorMultiplier'; generator: GeneratorId; factor: number }
  /** `generator` gains `bonus` (additive) per generator type owned. */
  | { kind: 'perType'; generator: GeneratorId; bonus: number }
  /** Adds `bonus` to global production (additive with the other global bonuses). */
  | { kind: 'global'; bonus: number }
  /** Adds `bonus` to global production per restored parcel. */
  | { kind: 'perParcel'; bonus: number }
  /** Multiplies the base Light of a click. */
  | { kind: 'clickMultiplier'; factor: number }
  /** Adds `amount` to the base Light of a click per unit of `generator` owned. */
  | { kind: 'clickPerUnit'; generator: GeneratorId; amount: number }
  /** Every generator costs `fraction` less (stacks multiplicatively). */
  | { kind: 'discount'; fraction: number }
  /** The biodiversity bonus also counts each generator type owned at `threshold` units. */
  | { kind: 'biodiversityThreshold'; threshold: number }
  /** Multiplies the biodiversity bonus. */
  | { kind: 'biodiversityFactor'; factor: number }
  /** Each Milestone adds `bonus` more to production. */
  | { kind: 'perAchievement'; bonus: number }
  /** Multiplies the bonus of every synergy. */
  | { kind: 'synergyFactor'; factor: number }
  /** Multiplies the time between two Golden Butterflies. */
  | { kind: 'butterflyInterval'; factor: number }
  /** Multiplies how long a Golden Butterfly effect lasts. */
  | { kind: 'effectDuration'; effect: EffectKind; factor: number }
  /** Multiplies the Light of a Récolte. */
  | { kind: 'harvestFactor'; factor: number }
  /** Adds `seconds` to the offline progress cap. */
  | { kind: 'offlineCap'; seconds: number }
  /** A new Season starts with `fraction` of each generator owned (rounded down). */
  | { kind: 'keepGenerators'; fraction: number }
  /** Adds `bonus` to global production per Season completed. */
  | { kind: 'perSeason'; bonus: number }
  /** Adds `bonus` to global production per generator type owned. */
  | { kind: 'globalPerType'; bonus: number }
  /** Multiplies the Water every collector gathers (§7.4). */
  | { kind: 'water'; factor: number }
  /** Multiplies the time between two visits (§9.6). */
  | { kind: 'visitInterval'; factor: number }
  /** Adds `bonus` to global production per neighbouring district restored (§6.4, §6.6). */
  | { kind: 'perDistrict'; bonus: number }
  /** Multiplies how fast the courtyard garden's crops grow (§9.7, §6.6). */
  | { kind: 'gardenGrowth'; factor: number }
  /** The neighbours bring `units` more of their building (§9.6). */
  | { kind: 'cuttingsGift'; units: number };

export type BonusKind = Bonus['kind'];
type BonusOf<K extends BonusKind> = Extract<Bonus, { kind: K }>;

/**
 * What the bonus helpers read: restored parcels, projects carried out this Season, talents
 * learnt, and the counts some bonuses grow with.
 */
export interface BonusSource {
  parcels: readonly ParcelId[];
  /** The second futures chosen for parcels (§6.5); absent where none can be. */
  futures?: { chosen: Readonly<Partial<Record<ParcelId, Future>>> };
  /** Neighbouring districts restored (§6.4); absent where none can be. */
  districts?: readonly DistrictId[];
  projects: readonly ProjectId[];
  talents: readonly TalentId[];
  /** Levels of the Canopy above the tree (§7.1); absent where none can be. */
  canopy?: Pick<CanopyState, 'levels'>;
  /** Challenge Seasons won (§7.3). */
  challenges: readonly ChallengeId[];
  /** The garden's seed bank (§9.7); absent where none can be. */
  garden?: { varieties: readonly VarietyId[] };
  /** Challenge Cycles won (§7.5); absent where none can be. */
  cycleChallenges?: readonly CycleChallengeId[];
  /** Levels of the Bioregion's sites, read for the hillsides (§7.5); absent where none can be. */
  sites?: { hillsides: number };
  /** Widenings of the delta's arms, read for the hillsides and the flood arm (M19). */
  delta?: { widths: Readonly<Record<WideArmId, number>> };
  /** Stages of the great works built (§6.6, M20); absent where none can be. */
  greatWorks?: { works: Readonly<Record<WorkId, { stage: number }>> };
  /** Old fruit varieties found in the orchard (§9.8, M22); absent where none can be. */
  orchard?: { varieties: readonly FruitId[] };
  /** The sister cities (§7.6, M23); absent where none can be. */
  city?: CitySource;
  seasons: number;
  generators: Readonly<Record<string, number>>;
}

/** The alliances (§9.9) read the whole game, so only a full state brings them. */
function isGameState(source: BonusSource): source is GameState {
  return 'alliances' in source && 'species' in source;
}

/**
 * Every bonus in force: parcels, then neighbouring districts, then projects, then talents and the
 * canopy, then challenges won, then the varieties of the garden's seed bank, then challenge
 * Cycles won and the hillsides site (§7.5).
 */
export function activeBonuses(source: BonusSource): Bonus[] {
  const {
    parcels,
    futures,
    districts = [],
    projects,
    talents,
    canopy,
    challenges,
    garden,
    cycleChallenges = [],
    sites,
    delta,
    greatWorks,
    orchard,
    city,
  } = source;
  const floodScale = widenFactor(delta?.widths.floodArm ?? 0);
  return [
    ...parcels.flatMap((id) => parcelBonuses(id, futures?.chosen[id])),
    ...districts.flatMap((id) => DISTRICTS[id].bonuses),
    ...projects.flatMap((id) => PROJECTS[id].bonuses),
    ...talents.flatMap((id) => TALENTS[id].bonuses),
    ...(canopy ? canopyBonuses(canopy.levels) : []),
    ...challenges.flatMap((id) => CHALLENGES[id].bonuses),
    ...(garden ? varietyBonuses(garden.varieties) : []),
    ...cycleChallenges.flatMap((id) =>
      CYCLE_CHALLENGES[id].bonuses.map((b) => scaleBonus(b, floodScale)),
    ),
    ...(sites ? hillsidesBonuses(sites.hillsides, widenFactor(delta?.widths.hillsArm ?? 0)) : []),
    ...(greatWorks ? greatWorksBonuses(greatWorks.works) : []),
    ...corridorBonuses({ parcels, futures }),
    ...(orchard ? fruitVarietyBonuses(orchard.varieties) : []),
    ...(city ? cityBonuses(city) : []),
    ...(isGameState(source) ? allianceBonuses(source) : []),
  ];
}

export function bonusesOf<K extends BonusKind>(source: BonusSource, kind: K): BonusOf<K>[] {
  return activeBonuses(source).filter((b): b is BonusOf<K> => b.kind === kind);
}

/** Product of the `factor` of every bonus of a kind (1 with none). */
export function factorOf(
  source: BonusSource,
  kind:
    | 'clickMultiplier'
    | 'biodiversityFactor'
    | 'synergyFactor'
    | 'butterflyInterval'
    | 'visitInterval'
    | 'harvestFactor'
    | 'gardenGrowth',
): number {
  return bonusesOf(source, kind).reduce((product, b) => product * b.factor, 1);
}

/** Generator cost factor: each discount stacks multiplicatively. */
export function costFactor(source: BonusSource): number {
  return bonusesOf(source, 'discount').reduce((product, b) => product * (1 - b.fraction), 1);
}

/**
 * Additive global production bonus: flat bonuses, plus the ones per parcel restored, per
 * Season completed and per generator type owned.
 */
export function globalBonus(source: BonusSource): number {
  let bonus = 0;
  for (const b of bonusesOf(source, 'global')) bonus += b.bonus;
  for (const b of bonusesOf(source, 'perParcel')) bonus += b.bonus * source.parcels.length;
  const districts = source.districts?.length ?? 0;
  for (const b of bonusesOf(source, 'perDistrict')) bonus += b.bonus * districts;
  for (const b of bonusesOf(source, 'perSeason')) bonus += b.bonus * source.seasons;
  const types = Object.values(source.generators).filter((owned) => owned > 0).length;
  for (const b of bonusesOf(source, 'globalPerType')) bonus += b.bonus * types;
  return bonus;
}

/** Share of each generator a new Season keeps (the best one in force, 0 with none). */
export function keptGeneratorShare(source: BonusSource): number {
  return Math.max(0, ...bonusesOf(source, 'keepGenerators').map((b) => b.fraction));
}

/** How long a Golden Butterfly effect lasts with the bonuses in force. */
export function effectDurationFactor(source: BonusSource, effect: EffectKind): number {
  return bonusesOf(source, 'effectDuration')
    .filter((b) => b.effect === effect)
    .reduce((product, b) => product * b.factor, 1);
}

/** Extra seconds of offline progress. */
export function offlineCapBonus(source: BonusSource): number {
  return bonusesOf(source, 'offlineCap').reduce((sum, b) => sum + b.seconds, 0);
}
