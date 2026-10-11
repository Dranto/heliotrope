// Display texts of a Milestone, resolved from its id and condition.
import {
  FLOOD_TIDE_SOURCES,
  LATE_HARVEST_SEEDS,
  UPGRADE_SETS,
  type AchievementDef,
} from '../game/achievements';
import { formatNumber } from '../game/format';
import { t } from './index';

/** Round thresholds read better without decimals: "1 M" rather than "1,00 M". */
function round(value: number): string {
  return formatNumber(value).replace(/,00(?=\s)/, '');
}

export function achievementName(achievement: AchievementDef): string {
  return t.achievements.names[achievement.id];
}

export function achievementDescription({ id, condition }: AchievementDef): string {
  const describe = t.achievements.describe;
  switch (condition.kind) {
    case 'allTimeLight':
      return describe.allTimeLight(round(condition.amount));
    case 'lightPerSecond':
      return describe.lightPerSecond(round(condition.amount));
    case 'clickValue':
      return describe.clickValue(round(condition.amount));
    case 'owned':
      return describe.owned(t.generators[condition.generator].name, condition.count);
    case 'onlyGenerator':
      return describe.onlyGenerator(t.generators[condition.generator].name, condition.count);
    case 'noBuildings':
      return describe.noBuildings(round(condition.amount));
    case 'clicks':
      return describe.clicks(round(condition.count));
    case 'butterflies':
      return describe.butterflies(condition.count);
    case 'visits':
      return describe.visits[condition.visit](condition.count);
    case 'everyVisit':
      return describe.everyVisit;
    case 'everyCityVisit':
      return describe.everyCityVisit;
    case 'cityVisits':
      return describe.cityVisits(condition.count);
    case 'seasons':
      return describe.seasons(condition.count);
    case 'everyGenerator':
      return describe.everyGenerator(condition.count);
    case 'upgrades':
      return describe.upgrades(condition.count);
    case 'upgradeSet':
      if (condition.count === 1) return describe.firstThread;
      return condition.set === 'synergies'
        ? describe.goldenWeb(UPGRADE_SETS.synergies.length)
        : describe.goldenHands(UPGRADE_SETS.clicks.length);
    case 'parcels':
      return describe.parcels(condition.count);
    case 'districts':
      return describe.districts(condition.count);
    case 'projects':
      return describe.projects(condition.count);
    case 'talents':
      return describe.talents(condition.count);
    case 'canopyLevels':
      return describe.canopyLevels(condition.count);
    case 'fullCanopy':
      return describe.fullCanopy;
    case 'sowerSeasons':
      return describe.sowerSeasons(condition.count);
    case 'harvests':
      return describe.harvests(condition.count);
    case 'varieties':
      return describe.varieties(condition.count);
    case 'species':
      return describe.species(condition.count);
    case 'challenges':
      return describe.challenges(condition.count);
    case 'cooperativePurchases':
      return describe.cooperativePurchases(round(condition.count));
    case 'allTimeWater':
      return describe.allTimeWater(round(condition.amount));
    case 'collectors':
      return describe.collectors(condition.count);
    case 'siteLevels':
      return describe.siteLevels(condition.count);
    case 'everySite':
      return describe.everySite;
    case 'cycles':
      return describe.cycles(condition.count);
    case 'deltaLevels':
      return describe.deltaLevels(condition.count);
    case 'worksBuilt':
      return describe.worksBuilt(condition.count);
    case 'sisterCities':
      return describe.sisterCities(condition.count);
    case 'alliances':
      return describe.alliances;
    case 'grandBloom':
      return describe.grandBloom;
    case 'fruitHarvests':
      return describe.fruitHarvests(condition.count);
    case 'fruitVarieties':
      return describe.fruitVarieties(condition.count);
    case 'lockCycles':
      return describe.lockCycles(condition.count);
    case 'cycleChallenges':
      return describe.cycleChallenges(condition.count);
    case 'playSeconds':
      return describe.playHours(condition.seconds / 3600);
    case 'seasonSeconds':
      return describe.longSeason(condition.seconds / 3600);
    case 'swiftSeason':
      return describe.swiftSeason(condition.seeds, condition.seconds / 60);
    case 'idle':
      return describe.idle;
    case 'action':
      switch (id) {
        case 'earlySowing':
          return describe.earlySowing;
        case 'lateHarvest':
          return describe.lateHarvest(LATE_HARVEST_SEEDS);
        case 'goldenPollen':
          return describe.goldenPollen;
        case 'justInTime':
          return describe.justInTime;
        case 'floodTide':
          return describe.floodTide(FLOOD_TIDE_SOURCES);
        default:
          return '';
      }
  }
}
