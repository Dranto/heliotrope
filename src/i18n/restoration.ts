// Display texts of parcels and neighbourhood projects, resolved from their bonuses.
import type { Bonus } from '../game/bonuses';
import { formatPercent } from '../game/format';
import { t } from './fr';

const factor = (value: number) => String(value).replace('.', ',');

export function bonusText(bonus: Bonus): string {
  const b = t.restoration.bonus;
  switch (bonus.kind) {
    case 'generatorMultiplier':
      return b.generatorMultiplier(t.generators[bonus.generator].name, factor(bonus.factor));
    case 'perType':
      return b.perType(t.generators[bonus.generator].name, formatPercent(bonus.bonus));
    case 'global':
      return b.global(formatPercent(bonus.bonus));
    case 'perParcel':
      return b.perParcel(formatPercent(bonus.bonus));
    case 'clickMultiplier':
      return b.clickMultiplier(factor(bonus.factor));
    case 'clickPerUnit':
      return b.clickPerUnit(factor(bonus.amount), t.generators[bonus.generator].name);
    case 'discount':
      return b.discount(formatPercent(bonus.fraction));
    case 'biodiversityThreshold':
      return b.biodiversityThreshold(String(bonus.threshold));
    case 'biodiversityFactor':
      return b.biodiversityFactor(factor(bonus.factor));
    case 'perAchievement':
      return b.perAchievement(formatPercent(bonus.bonus));
    case 'synergyFactor':
      return b.synergyFactor(factor(bonus.factor));
    case 'butterflyInterval':
      return b.butterflyInterval(formatPercent(1 - bonus.factor));
    case 'effectDuration':
      return b.effectDuration(t.restoration.effectNames[bonus.effect], factor(bonus.factor));
    case 'harvestFactor':
      return b.harvestFactor(factor(bonus.factor));
    case 'offlineCap':
      return b.offlineCap(t.duration(bonus.seconds));
    case 'keepGenerators':
      return b.keepGenerators(formatPercent(bonus.fraction));
    case 'perSeason':
      return b.perSeason(formatPercent(bonus.bonus));
    case 'globalPerType':
      return b.globalPerType(formatPercent(bonus.bonus));
  }
}

export function bonusesText(bonuses: readonly Bonus[]): string {
  return bonuses.map(bonusText).join(' · ');
}
