// Effects of restored parcels and neighbouring districts, neighbourhood projects, talents and
// canopy of the Tree of Seasons (docs/game-design.md §6.1, §6.2, §7.1). Their tables describe their
// effect with the same `Bonus` shape; the formulas in production.ts,
// butterfly.ts and offline.ts read the totals through the helpers below.
import { completeMilestoneFamilies, milestoneFamilyBonuses } from './milestoneFamilies';
import type { IntroState } from './introductions';
import { weatherBonuses, type WeatherState } from './weather';
import type { GameState } from './state';
import { cityBonuses, type CitySource } from './cityData';
import { corridorBonuses } from './corridors';
import type { EffectKind } from './effects';
import type { GeneratorId } from './generators';
import { hillsidesBonuses, widenFactor, type WideArmId } from './delta';
import { DISTRICTS, type DistrictId } from './districts';
import { growthBonuses, pathsWorking, type GrowthState } from './growth';
import { familyBonuses } from './families';
import { parcelBonuses, type Future, type ParcelId } from './parcels';
import { PROJECTS, type ProjectId } from './projects';
import { varietyBonuses, type VarietyId } from './seedBank';
import { canopyBonuses, TALENTS, type CanopyState, type TalentId } from './talents';
import { UPGRADES, type UpgradeId } from './upgrades';

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
  /** The pollen gauge fills faster (§5.6). */
  | { kind: 'pollenFill'; factor: number }
  /** The neighbours bring `units` more of their building (§9.6). */
  | { kind: 'cuttingsGift'; units: number }
  /** `generator` gains `bonusPerUnit` (additive, like a synergy) per unit of `source` (§5.5). */
  | { kind: 'feeds'; generator: GeneratorId; source: GeneratorId; bonusPerUnit: number }
  /** `generator` gains `bonus` (additive) per species back in the Herbier (§5.5). */
  | { kind: 'perSpecies'; generator: GeneratorId; bonus: number }
  /** `generator` gains `bonus` (additive) per parcel restored (§5.5). */
  | { kind: 'generatorPerParcel'; generator: GeneratorId; bonus: number }
  /** Adds `bonus` to global production per path working on the buildings (§9.9, M34). */
  | { kind: 'perPath'; bonus: number }
  /** Adds `bonus` to global production per family of Milestones complete (§9.16, M37). */
  | { kind: 'perMilestoneFamily'; bonus: number }
  /** The Seeds of the Season ripen this many seconds sooner (§5.5, slimming plan lot 5). */
  | { kind: 'ripening'; seconds: number }
  /** Water collectors cost this share less Light (§7.4). */
  | { kind: 'collectorDiscount'; fraction: number }
  /** Site levels cost this share less Water (§7.4). */
  | { kind: 'siteDiscount'; fraction: number }
  /** Neighbourhood projects cost this share less Light (§6.2, slimming plan lot 8). */
  | { kind: 'projectDiscount'; fraction: number }
  /** Parcels and neighbouring districts cost this share less Light (§6.1, §6.4, lot 8). */
  | { kind: 'landDiscount'; fraction: number };

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
  /** The garden's seed bank (§9.7); absent where none can be. */
  garden?: { varieties: readonly VarietyId[] };
  /** Levels of the Bioregion's sites, read for the hillsides (§7.5); absent where none can be. */
  sites?: { hillsides: number };
  /** Widenings of the delta's arms, read for the hillsides and the flood arm (M19). */
  delta?: { widths: Readonly<Record<WideArmId, number>> };
  /** The sister cities (§7.6, M23); absent where none can be. */
  city?: CitySource;
  /** The paths picked as the buildings grow (§5.5, M26); absent where none can be. */
  growth?: GrowthState;
  /** The weather over the neighbourhood (§9.10, M28); absent where none can be. */
  weather?: Pick<WeatherState, 'current'>;
  /** The mechanics introduced (§10.8): the weather counts once it has come. */
  intro?: IntroState;
  /** Cycles of water done: the weather opens with the second Season or the first Cycle. */
  cycles?: number;
  seasons: number;
  generators: Readonly<Record<string, number>>;
}

/** The Herbier families and the Milestone families read the whole game: only a full state brings them. */
function isGameState(source: BonusSource): source is GameState {
  return 'cooperatives' in source && 'species' in source;
}

/**
 * Every bonus in force: parcels, then neighbouring districts, then projects, then talents and the
 * canopy, then the varieties of the garden's seed bank, then the hillsides site (§7.5).
 */
export function activeBonuses(source: BonusSource): Bonus[] {
  // States are never mutated, so the list is computed once per state: the formulas ask for it
  // dozens of times per tick and per render.
  const cached = bonusCache.get(source);
  if (cached) return cached;
  const bonuses = collectBonuses(source);
  bonusCache.set(source, bonuses);
  return bonuses;
}

const bonusCache = new WeakMap<BonusSource, Bonus[]>();

function collectBonuses(source: BonusSource): Bonus[] {
  const {
    parcels,
    futures,
    districts = [],
    projects,
    talents,
    canopy,
    garden,
    sites,
    delta,
    city,
    growth,
    weather,
  } = source;
  return [
    ...parcels.flatMap((id) => parcelBonuses(id, futures?.chosen[id])),
    ...districts.flatMap((id) => DISTRICTS[id].bonuses),
    ...projects.flatMap((id) => PROJECTS[id].bonuses),
    ...talents.flatMap((id) => TALENTS[id].bonuses),
    ...(canopy ? canopyBonuses(canopy.levels) : []),
    ...(garden ? varietyBonuses(garden.varieties) : []),
    ...(sites ? hillsidesBonuses(sites.hillsides, widenFactor(delta?.widths.hillsArm ?? 0)) : []),
    ...corridorBonuses({ parcels, futures }),
    ...(city ? cityBonuses(city) : []),
    ...(growth ? growthBonuses({ generators: source.generators, growth }) : []),
    ...(weather && source.intro
      ? weatherBonuses({
          weather,
          seasons: source.seasons,
          cycles: source.cycles,
          intro: source.intro,
        })
      : []),
    ...(isGameState(source) ? familyBonuses(source.species) : []),
    ...(isGameState(source) ? milestoneFamilyBonuses(source.achievements) : []),
    ...(isGameState(source) ? ruleBonuses(source.upgrades) : []),
  ];
}

/** The rules the upgrades bought change (slimming plan, lot 6). */
function ruleBonuses(upgrades: readonly UpgradeId[]): Bonus[] {
  return upgrades.flatMap((id) => {
    const effect = UPGRADES[id]?.effect;
    return effect?.kind === 'rule' ? [effect.bonus] : [];
  });
}

export function bonusesOf<K extends BonusKind>(
  source: BonusSource,
  kind: K,
): readonly BonusOf<K>[] {
  // Sorted by kind once per state: the formulas ask for one kind at a time, many times.
  let byKind = kindCache.get(source);
  if (!byKind) {
    byKind = new Map();
    for (const bonus of activeBonuses(source)) {
      const list = byKind.get(bonus.kind);
      if (list) list.push(bonus);
      else byKind.set(bonus.kind, [bonus]);
    }
    kindCache.set(source, byKind);
  }
  return (byKind.get(kind) ?? NONE) as readonly BonusOf<K>[];
}

const kindCache = new WeakMap<BonusSource, Map<BonusKind, Bonus[]>>();
const NONE: readonly Bonus[] = [];

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
    | 'gardenGrowth'
    | 'pollenFill',
): number {
  return bonusesOf(source, kind).reduce((product, b) => product * b.factor, 1);
}

/** Seconds the Seeds of the Season ripen sooner. */
export function ripeningBonus(source: BonusSource): number {
  return bonusesOf(source, 'ripening').reduce((sum, b) => sum + b.seconds, 0);
}

/** Cost factor of a discount kind other than the buildings': each one stacks multiplicatively. */
export function discountFactor(
  source: BonusSource,
  kind: 'collectorDiscount' | 'siteDiscount' | 'projectDiscount' | 'landDiscount',
): number {
  return bonusesOf(source, kind).reduce((product, b) => product * (1 - b.fraction), 1);
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
  const perPath = bonusesOf(source, 'perPath');
  if (perPath.length > 0 && source.growth) {
    const paths = pathsWorking({ generators: source.generators, growth: source.growth });
    for (const b of perPath) bonus += b.bonus * paths;
  }
  const perFamily = bonusesOf(source, 'perMilestoneFamily');
  if (perFamily.length > 0 && isGameState(source)) {
    const families = completeMilestoneFamilies(source.achievements).length;
    for (const b of perFamily) bonus += b.bonus * families;
  }
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

/**
 * Bonuses of a list of stages folded together for display: same kinds (and same effect) add up,
 * factors multiply, so a complete work reads as one line per effect.
 */
export function foldBonuses(bonuses: readonly Bonus[]): Bonus[] {
  const folded = new Map<string, Bonus>();
  for (const bonus of bonuses) {
    const key = [
      bonus.kind,
      'effect' in bonus ? bonus.effect : '',
      'generator' in bonus ? bonus.generator : '',
    ].join(':');
    const prev = folded.get(key);
    if (!prev) {
      folded.set(key, bonus);
      continue;
    }
    const merged: Record<string, unknown> = { ...prev };
    for (const [field, value] of Object.entries(bonus)) {
      if (typeof value !== 'number') continue;
      const before = (prev as unknown as Record<string, number>)[field] ?? 0;
      merged[field] = field === 'factor' ? before * value : before + value;
    }
    folded.set(key, merged as unknown as Bonus);
  }
  return [...folded.values()];
}
