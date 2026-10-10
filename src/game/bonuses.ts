// Effects of restored parcels and neighbourhood projects (docs/game-design.md §6.1, §6.2). Both
// tables describe their effect with the same `Bonus` shape; the formulas in production.ts,
// butterfly.ts and offline.ts read the totals through the helpers below.
import type { EffectKind } from './effects';
import type { GeneratorId } from './generators';
import { PARCELS, type ParcelId } from './parcels';
import { PROJECTS, type ProjectId } from './projects';

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
  | { kind: 'offlineCap'; seconds: number };

export type BonusKind = Bonus['kind'];
type BonusOf<K extends BonusKind> = Extract<Bonus, { kind: K }>;

/** What the bonus helpers read: restored parcels and projects carried out this Season. */
export interface BonusSource {
  parcels: readonly ParcelId[];
  projects: readonly ProjectId[];
}

/** Every bonus in force, parcels first. */
export function activeBonuses({ parcels, projects }: BonusSource): Bonus[] {
  return [
    ...parcels.flatMap((id) => PARCELS[id].bonuses),
    ...projects.flatMap((id) => PROJECTS[id].bonuses),
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
    | 'harvestFactor',
): number {
  return bonusesOf(source, kind).reduce((product, b) => product * b.factor, 1);
}

/** Generator cost factor: each discount stacks multiplicatively. */
export function costFactor(source: BonusSource): number {
  return bonusesOf(source, 'discount').reduce((product, b) => product * (1 - b.fraction), 1);
}

/** Additive global production bonus: flat bonuses plus the per-parcel ones. */
export function globalBonus(source: BonusSource): number {
  let bonus = 0;
  for (const b of bonusesOf(source, 'global')) bonus += b.bonus;
  for (const b of bonusesOf(source, 'perParcel')) bonus += b.bonus * source.parcels.length;
  return bonus;
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
