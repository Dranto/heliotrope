// Display texts of parcels and neighbourhood projects, resolved from their bonuses.
import type { Bonus } from '../game/bonuses';
import { formatDecimal, formatPercent } from '../game/format';
import type { Future, ParcelId } from '../game/parcels';
import { t } from './index';

const factor = formatDecimal;

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
    case 'water':
      return b.water(factor(bonus.factor));
    case 'visitInterval':
      return b.visitInterval(formatPercent(1 - bonus.factor));
    case 'cuttingsGift':
      return b.cuttingsGift(bonus.units);
    case 'perDistrict':
      return b.perDistrict(formatPercent(bonus.bonus));
    case 'gardenGrowth':
      return b.gardenGrowth(factor(bonus.factor));
    case 'pollenFill':
      return b.pollenFill(factor(bonus.factor));
    case 'feeds':
      return b.feeds(
        t.generators[bonus.generator].name,
        t.generators[bonus.source].name,
        formatPercent(bonus.bonusPerUnit),
      );
    case 'perSpecies':
      return b.perSpecies(t.generators[bonus.generator].name, formatPercent(bonus.bonus));
    case 'generatorPerParcel':
      return b.generatorPerParcel(t.generators[bonus.generator].name, formatPercent(bonus.bonus));
    case 'perPath':
      return b.perPath(formatPercent(bonus.bonus));
    case 'perMilestoneFamily':
      return b.perMilestoneFamily(formatPercent(bonus.bonus));
  }
}

export function bonusesText(bonuses: readonly Bonus[]): string {
  return bonuses.map(bonusText).join(' · ');
}

/** The name of a parcel in one of its futures (§6.5). */
export function parcelName(id: ParcelId, future: Future): string {
  return future === 1 ? t.restoration.secondNames[id] : t.restoration.parcelNames[id];
}
