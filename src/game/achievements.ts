// Milestones ("Jalons", docs/game-design.md §9.3). Data table plus pure unlock checks; names
// and descriptions live in src/i18n. Milestones are kept across Seasons.
import { WEATHER_IDS, type WeatherId } from './weather';
import { WEATHER_SPECIES } from './species';
import { totalGreetings } from './greetings';
import { completeFamilies } from './families';
import { MAX_WAITING_GIFTS, milestoneGift } from './milestoneFamilies';
import { pathsWorking } from './growth';
import { BASIN_SITE_IDS, collectorsOwned, siteLevels } from './bioregion';
import { bonusesOf } from './bonuses';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { clickValue, lightPerSecond } from './production';
import { lightForSeeds } from './seasons';
import { deltaLevels, LOCK_MILESTONE_CYCLES } from './delta';
import { workingAlliances } from './alliances';
import { bouquetSize } from './effects';
import { FRUIT_IDS } from './fruits';
import { TREE_AGE_PICKS, treeAge } from './orchard';
import { worksBuilt } from './greatWorks';
import { VARIETY_IDS } from './seedBank';
import type { GameState } from './state';
import { canopyLevels, isCanopyComplete } from './talents';
import { CLICK_UPGRADE_IDS, SYNERGY_IDS, type UpgradeId } from './upgrades';
import { CITY_VISITS, cityVisits, NEIGHBOURHOOD_VISITS, type VisitKind } from './visits';

/** Seasons the sower starts for its Milestone "Semis spontané" (§7.1). */
export const SOWER_MILESTONE_SEASONS = 10;

/** Visits of one kind welcomed for their Milestone (§9.6). */
export const VISIT_MILESTONE_COUNT = 10;

/** Harvests after a different crop for the Milestone of the rotation (M32). */
export const ROTATION_MILESTONE = 25;

/** Effects running at once for the Milestones of the bouquet (§5.7). */
export const BOUQUET_MILESTONES = [3, 5] as const;

/** §9.3: each Milestone unlocked adds +1% to global production (additive). */
export const ACHIEVEMENT_BONUS = 0.01;

/** Upgrade groups a Milestone can ask to complete within one Season. */
export const UPGRADE_SETS = {
  synergies: SYNERGY_IDS,
  clicks: CLICK_UPGRADE_IDS,
} as const satisfies Record<string, readonly UpgradeId[]>;
export type UpgradeSet = keyof typeof UPGRADE_SETS;

export type AchievementCondition =
  | { kind: 'allTimeLight'; amount: number }
  /** Light per second right now. */
  | { kind: 'lightPerSecond'; amount: number }
  /** Light of a single click right now, Pollinisation included. */
  | { kind: 'clickValue'; amount: number }
  | { kind: 'owned'; generator: GeneratorId; count: number }
  /** `count` units of `generator` and no other building. */
  | { kind: 'onlyGenerator'; generator: GeneratorId; count: number }
  /** `amount` Light earned this Season without owning any building. */
  | { kind: 'noBuildings'; amount: number }
  | { kind: 'clicks'; count: number }
  | { kind: 'butterflies'; count: number }
  | { kind: 'seasons'; count: number }
  /** Every generator type owned at least `count` times. */
  | { kind: 'everyGenerator'; count: number }
  /** Upgrades bought this Season. */
  | { kind: 'upgrades'; count: number }
  /** At least `count` upgrades of a group bought this Season. */
  | { kind: 'upgradeSet'; set: UpgradeSet; count: number }
  /** Parcels restored, kept across Seasons (§6.1). */
  | { kind: 'parcels'; count: number }
  /** Neighbourhood projects carried out this Season (§6.2). */
  | { kind: 'projects'; count: number }
  /** Neighbouring districts restored, kept across Seasons (§6.4). */
  | { kind: 'districts'; count: number }
  /** Talents learnt in the Tree of Seasons (§7.1). */
  | { kind: 'talents'; count: number }
  /** Levels sown in the Canopy above the tree, all together (§7.1). */
  | { kind: 'canopyLevels'; count: number }
  /** Every Canopy talent at its last level (§7.1). */
  | { kind: 'fullCanopy' }
  /** Seasons the sower started (§7.1). */
  | { kind: 'sowerSeasons'; count: number }
  /** Harvests of the courtyard garden (§9.7). */
  | { kind: 'harvests'; count: number }
  /** Varieties in the garden's seed bank (§9.7). */
  | { kind: 'varieties'; count: number }
  /** Species of the Herbier back, kept across Seasons (§9.5). */
  | { kind: 'species'; count: number }
  /** Challenge Seasons won (§7.3). */
  | { kind: 'challenges'; count: number }
  /** Purchases of every Cooperative together, over all Seasons (§7.2). */
  | { kind: 'cooperativePurchases'; count: number }
  /** Water gathered over all Cycles (§7.4). */
  | { kind: 'allTimeWater'; amount: number }
  /** Water collectors owned, all kinds together (§7.4). */
  | { kind: 'collectors'; count: number }
  /** Levels of every regional site together (§7.4). */
  | { kind: 'siteLevels'; count: number }
  /** Every regional site raised to at least `count` levels (§7.4). */
  | { kind: 'everySite'; count: number }
  /** Cycles of water completed (§7.4). */
  | { kind: 'cycles'; count: number }
  /** Levels opened in the delta of the Sources (§7.5). */
  | { kind: 'deltaLevels'; count: number }
  /** Cycles the lock keeper started (§7.5). */
  | { kind: 'lockCycles'; count: number }
  /** Great works complete, kept forever (§6.6). */
  | { kind: 'worksBuilt'; count: number }
  /** Fruit picked in the orchard, and old varieties found there (§9.8). */
  | { kind: 'fruitHarvests'; count: number }
  | { kind: 'fruitVarieties'; count: number }
  /** Harvests of a crop sown after a different one (M32). */
  | { kind: 'rotations'; count: number }
  /** A fruit tree at its last age (M32). */
  | { kind: 'oldTree' }
  /** Sister cities founded (§7.6). */
  | { kind: 'sisterCities'; count: number }
  /** Alliances chosen and awake (§9.9), and the grand bloom. */
  | { kind: 'alliances'; count: number }
  | { kind: 'grandBloom' }
  /** Paths working on the buildings that grow (§5.5). */
  | { kind: 'paths'; count: number }
  /** Pollen flights sent over all Seasons (§5.6). */
  | { kind: 'flights'; count: number }
  /** Kinds of effect running at once, the bouquet (§5.7). */
  | { kind: 'bouquet'; count: number }
  /** A weather lived at least once (§9.10). */
  | { kind: 'weather'; weather: WeatherId }
  /** Every species of the weather back (M33). */
  | { kind: 'weatherSpecies' }
  /** Species greeted on the map, over the whole game (M35). */
  | { kind: 'greetings'; count: number }
  /** Families of the Herbier complete (M35). */
  | { kind: 'families'; count: number }
  /** Neighbours' requests served over the whole game (§9.11). */
  | { kind: 'requests'; count: number }
  /** Challenge Cycles won (§7.5). */
  | { kind: 'cycleChallenges'; count: number }
  /** Visits of one kind welcomed over all Seasons (§9.6). */
  | { kind: 'visits'; visit: VisitKind; count: number }
  /** Every visitor of the city (§9.6, M18) welcomed once, or this many of them in all. */
  | { kind: 'everyCityVisit' }
  | { kind: 'cityVisits'; count: number }
  /** Every kind of visit welcomed at least once (§9.6). */
  | { kind: 'everyVisit' }
  /** Seconds of play over all Seasons. */
  | { kind: 'playSeconds'; seconds: number }
  /** Seconds of play in the current Season. */
  | { kind: 'seasonSeconds'; seconds: number }
  /** The Season earns the Light of `seeds` Seeds (§7) within `seconds` of play. */
  | { kind: 'swiftSeason'; seeds: number; seconds: number }
  /** Seconds without buying anything, with at least one generator owned. */
  | { kind: 'idle'; seconds: number }
  /** Unlocked by an action rather than by the state, see `unlockAchievement`. */
  | { kind: 'action' };

/** Display families of the Milestones screen, in order. */
export const ACHIEVEMENT_FAMILIES = [
  'light',
  'buildings',
  'upgrades',
  'clicks',
  'butterflies',
  'neighbourhood',
  'seasons',
  'bioregion',
] as const;
export type AchievementFamily = (typeof ACHIEVEMENT_FAMILIES)[number];

const LIGHT_EXPONENTS = [3, 6, 9, 12, 15, 18, 21, 24] as const;
const RATE_EXPONENTS = [3, 6, 9] as const;
const OWNED_STEPS = [1, 50, 100, 200] as const;
const UPGRADE_STEPS = [10, 25, 50, 75] as const;
const CLICK_STEPS = [10, 100, 1_000, 10_000, 100_000] as const;
const CLICK_VALUE_EXPONENTS = [3, 6] as const;
const BUTTERFLY_STEPS = [1, 10, 25, 50, 100] as const;
const PARCEL_STEPS = [1, 4, 8] as const;
const DISTRICT_STEPS = [1, 4, 8] as const;
const PROJECT_STEPS = [1, 8, 15] as const;
const TALENT_STEPS = [1, 9, 17] as const;
const CANOPY_STEPS = [1, 18] as const;
const HARVEST_STEPS = [1, 25, 250] as const;
const COOPERATIVE_STEPS = [100, 1_000] as const;
const SPECIES_STEPS = [1, 10, 18] as const;
const CHALLENGE_STEPS = [1, 4] as const;
const SEASON_STEPS = [1, 3, 5, 10, 25] as const;
const PLAY_HOURS = [1, 24] as const;
const WATER_EXPONENTS = [3, 6, 9] as const;
const COLLECTOR_STEPS = [10, 50] as const;
const SITE_STEPS = [1, 10, 25] as const;
const CYCLE_STEPS = [1, 3] as const;
const DELTA_STEPS = [1, 6] as const;
const WORK_STEPS = [1, 4] as const;
const CITY_STEPS = [1, 3] as const;
const CYCLE_CHALLENGE_STEPS = [1, 3] as const;

export type AchievementId =
  | `light.${(typeof LIGHT_EXPONENTS)[number]}`
  | `rate.${(typeof RATE_EXPONENTS)[number]}`
  | `${GeneratorId}.${(typeof OWNED_STEPS)[number]}`
  | `upgrades.${(typeof UPGRADE_STEPS)[number]}`
  | `clicks.${(typeof CLICK_STEPS)[number]}`
  | `clickValue.${(typeof CLICK_VALUE_EXPONENTS)[number]}`
  | `butterflies.${(typeof BUTTERFLY_STEPS)[number]}`
  | `parcels.${(typeof PARCEL_STEPS)[number]}`
  | `districts.${(typeof DISTRICT_STEPS)[number]}`
  | `projects.${(typeof PROJECT_STEPS)[number]}`
  | `talents.${(typeof TALENT_STEPS)[number]}`
  | `canopy.${(typeof CANOPY_STEPS)[number]}`
  | 'crown'
  | 'selfSown'
  | `harvests.${(typeof HARVEST_STEPS)[number]}`
  | 'firstVariety'
  | 'seedBank'
  | `cooperatives.${(typeof COOPERATIVE_STEPS)[number]}`
  | `species.${(typeof SPECIES_STEPS)[number]}`
  | `challenges.${(typeof CHALLENGE_STEPS)[number]}`
  | `seasons.${(typeof SEASON_STEPS)[number]}`
  | `playHours.${(typeof PLAY_HOURS)[number]}`
  | `water.${(typeof WATER_EXPONENTS)[number]}`
  | `collectors.${(typeof COLLECTOR_STEPS)[number]}`
  | `sites.${(typeof SITE_STEPS)[number]}`
  | `cycles.${(typeof CYCLE_STEPS)[number]}`
  | `delta.${(typeof DELTA_STEPS)[number]}`
  | `works.${(typeof WORK_STEPS)[number]}`
  | 'firstFruit'
  | 'oldOrchard'
  | 'rotation'
  | 'oldTree'
  | `cities.${(typeof CITY_STEPS)[number]}`
  | 'firstAlliance'
  | 'livingWeb'
  | 'grandBloom'
  | 'firstPath'
  | 'manyPaths'
  | 'firstFlight'
  | 'pollenStorm'
  | 'bouquet'
  | 'grandBouquet'
  | 'weather.sun'
  | 'weather.shower'
  | 'weather.wind'
  | 'weather.mist'
  | 'weather.heat'
  | 'skyCreatures'
  | 'hello'
  | 'wholeFamily'
  | 'firstFavour'
  | 'goodNeighbour'
  | 'lockKeeper'
  | `cycleChallenges.${(typeof CYCLE_CHALLENGE_STEPS)[number]}`
  | 'watershed'
  | 'openDoors'
  | 'goodNeighbours'
  | 'afterRain'
  | 'stopover'
  | 'cityFestival'
  | 'cityVisits.25'
  | 'floodTide'
  | 'mosaic'
  | 'patchwork'
  | 'wildGarden'
  | 'onlyPots'
  | 'sleepingSeed'
  | 'firstThread'
  | 'goldenWeb'
  | 'goldenHands'
  | 'goldenPollen'
  | 'justInTime'
  | 'swiftSeason'
  | 'longSeason'
  | 'lateHarvest'
  | 'slowPhotosynthesis'
  | 'earlySowing';

export interface AchievementDef {
  id: AchievementId;
  family: AchievementFamily;
  condition: AchievementCondition;
  /** Hidden Milestones show as "?" until unlocked. */
  hidden?: boolean;
}

/** Display order: by family, each one from the easiest to the farthest goal. */
export const ACHIEVEMENT_LIST: readonly AchievementDef[] = [
  // Light.
  ...LIGHT_EXPONENTS.map((exponent) => ({
    id: `light.${exponent}` as const,
    family: 'light' as const,
    condition: { kind: 'allTimeLight', amount: 10 ** exponent } as const,
  })),
  ...RATE_EXPONENTS.map((exponent) => ({
    id: `rate.${exponent}` as const,
    family: 'light' as const,
    condition: { kind: 'lightPerSecond', amount: 10 ** exponent } as const,
  })),
  // Buildings.
  ...GENERATOR_IDS.flatMap((generator) =>
    OWNED_STEPS.map((count) => ({
      id: `${generator}.${count}` as const,
      family: 'buildings' as const,
      condition: { kind: 'owned', generator, count } as const,
    })),
  ),
  { id: 'mosaic', family: 'buildings', condition: { kind: 'everyGenerator', count: 10 } },
  { id: 'patchwork', family: 'buildings', condition: { kind: 'everyGenerator', count: 50 } },
  {
    id: 'wildGarden',
    family: 'buildings',
    condition: { kind: 'everyGenerator', count: 100 },
    hidden: true,
  },
  {
    id: 'onlyPots',
    family: 'buildings',
    condition: { kind: 'onlyGenerator', generator: 'pot', count: 50 },
    hidden: true,
  },
  // Upgrades.
  ...UPGRADE_STEPS.map((count) => ({
    id: `upgrades.${count}` as const,
    family: 'upgrades' as const,
    condition: { kind: 'upgrades', count } as const,
  })),
  {
    id: 'firstThread',
    family: 'upgrades',
    condition: { kind: 'upgradeSet', set: 'synergies', count: 1 },
  },
  {
    id: 'goldenWeb',
    family: 'upgrades',
    condition: { kind: 'upgradeSet', set: 'synergies', count: SYNERGY_IDS.length },
  },
  {
    id: 'goldenHands',
    family: 'upgrades',
    condition: { kind: 'upgradeSet', set: 'clicks', count: CLICK_UPGRADE_IDS.length },
  },
  // Clicks.
  ...CLICK_STEPS.map((count) => ({
    id: `clicks.${count}` as const,
    family: 'clicks' as const,
    condition: { kind: 'clicks', count } as const,
  })),
  ...CLICK_VALUE_EXPONENTS.map((exponent) => ({
    id: `clickValue.${exponent}` as const,
    family: 'clicks' as const,
    condition: { kind: 'clickValue', amount: 10 ** exponent } as const,
  })),
  {
    id: 'sleepingSeed',
    family: 'clicks',
    condition: { kind: 'noBuildings', amount: 1_000 },
    hidden: true,
  },
  // Golden Butterfly.
  ...BUTTERFLY_STEPS.map((count) => ({
    id: `butterflies.${count}` as const,
    family: 'butterflies' as const,
    condition: { kind: 'butterflies', count } as const,
  })),
  { id: 'goldenPollen', family: 'butterflies', condition: { kind: 'action' } },
  { id: 'justInTime', family: 'butterflies', condition: { kind: 'action' }, hidden: true },
  // Neighbourhood: parcels, projects, Tree of Seasons and Cooperatives.
  ...PARCEL_STEPS.map((count) => ({
    id: `parcels.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'parcels', count } as const,
  })),
  ...DISTRICT_STEPS.map((count) => ({
    id: `districts.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'districts', count } as const,
  })),
  ...PROJECT_STEPS.map((count) => ({
    id: `projects.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'projects', count } as const,
  })),
  ...TALENT_STEPS.map((count) => ({
    id: `talents.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'talents', count } as const,
  })),
  ...CANOPY_STEPS.map((count) => ({
    id: `canopy.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'canopyLevels', count } as const,
  })),
  { id: 'crown', family: 'neighbourhood', condition: { kind: 'fullCanopy' } },
  // The great works (§6.6).
  ...WORK_STEPS.map((count) => ({
    id: `works.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'worksBuilt', count } as const,
  })),
  // The sister cities (§7.6).
  ...CITY_STEPS.map((count) => ({
    id: `cities.${count}` as const,
    family: 'seasons' as const,
    condition: { kind: 'sisterCities', count } as const,
  })),
  // The alliances and the grand bloom (§9.9).
  { id: 'firstAlliance', family: 'neighbourhood', condition: { kind: 'alliances', count: 1 } },
  { id: 'livingWeb', family: 'neighbourhood', condition: { kind: 'alliances', count: 5 } },
  { id: 'grandBloom', family: 'neighbourhood', condition: { kind: 'grandBloom' } },
  // The buildings that grow (§5.5).
  { id: 'firstPath', family: 'buildings', condition: { kind: 'paths', count: 1 } },
  { id: 'manyPaths', family: 'buildings', condition: { kind: 'paths', count: 12 } },
  // The pollen (§5.6).
  { id: 'firstFlight', family: 'clicks', condition: { kind: 'flights', count: 1 } },
  { id: 'pollenStorm', family: 'clicks', condition: { kind: 'flights', count: 100 } },
  // The bouquet of effects running together (§5.7, M31).
  {
    id: 'bouquet',
    family: 'butterflies',
    condition: { kind: 'bouquet', count: BOUQUET_MILESTONES[0] },
  },
  {
    id: 'grandBouquet',
    family: 'butterflies',
    condition: { kind: 'bouquet', count: BOUQUET_MILESTONES[1] },
  },
  // The neighbours' requests (§9.11).
  { id: 'firstFavour', family: 'neighbourhood', condition: { kind: 'requests', count: 1 } },
  { id: 'goodNeighbour', family: 'neighbourhood', condition: { kind: 'requests', count: 25 } },
  // The weather (§9.10): one per weather lived.
  ...WEATHER_IDS.map(
    (weather) =>
      ({
        id: `weather.${weather}`,
        family: 'neighbourhood',
        condition: { kind: 'weather', weather },
      }) as const,
  ),
  { id: 'skyCreatures', family: 'neighbourhood', condition: { kind: 'weatherSpecies' } },
  // The species greeted and the families of the Herbier (M35).
  { id: 'hello', family: 'neighbourhood', condition: { kind: 'greetings', count: 1 } },
  { id: 'wholeFamily', family: 'neighbourhood', condition: { kind: 'families', count: 2 } },
  // The orchard (§9.8).
  { id: 'firstFruit', family: 'neighbourhood', condition: { kind: 'fruitHarvests', count: 1 } },
  {
    id: 'oldOrchard',
    family: 'neighbourhood',
    condition: { kind: 'fruitVarieties', count: FRUIT_IDS.length },
  },
  // The lighter garden and orchard (M32).
  { id: 'oldTree', family: 'neighbourhood', condition: { kind: 'oldTree' } },
  {
    id: 'rotation',
    family: 'neighbourhood',
    condition: { kind: 'rotations', count: ROTATION_MILESTONE },
  },
  {
    id: 'selfSown',
    family: 'neighbourhood',
    condition: { kind: 'sowerSeasons', count: SOWER_MILESTONE_SEASONS },
  },
  // The courtyard garden (§9.7).
  ...HARVEST_STEPS.map((count) => ({
    id: `harvests.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'harvests', count } as const,
  })),
  { id: 'firstVariety', family: 'neighbourhood', condition: { kind: 'varieties', count: 1 } },
  {
    id: 'seedBank',
    family: 'neighbourhood',
    condition: { kind: 'varieties', count: VARIETY_IDS.length },
  },
  ...COOPERATIVE_STEPS.map((count) => ({
    id: `cooperatives.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'cooperativePurchases', count } as const,
  })),
  ...SPECIES_STEPS.map((count) => ({
    id: `species.${count}` as const,
    family: 'neighbourhood' as const,
    condition: { kind: 'species', count } as const,
  })),
  // Visits (§9.6).
  { id: 'openDoors', family: 'neighbourhood', condition: { kind: 'everyVisit' } },
  {
    id: 'goodNeighbours',
    family: 'neighbourhood',
    condition: { kind: 'visits', visit: 'cuttings', count: VISIT_MILESTONE_COUNT },
  },
  {
    id: 'afterRain',
    family: 'neighbourhood',
    condition: { kind: 'visits', visit: 'shower', count: VISIT_MILESTONE_COUNT },
  },
  {
    id: 'stopover',
    family: 'neighbourhood',
    condition: { kind: 'visits', visit: 'birds', count: VISIT_MILESTONE_COUNT },
  },
  // Visits of the city (§9.6, M18).
  { id: 'cityFestival', family: 'neighbourhood', condition: { kind: 'everyCityVisit' } },
  { id: 'cityVisits.25', family: 'neighbourhood', condition: { kind: 'cityVisits', count: 25 } },
  ...CHALLENGE_STEPS.map((count) => ({
    id: `challenges.${count}` as const,
    family: 'seasons' as const,
    condition: { kind: 'challenges', count } as const,
  })),
  // Seasons and time.
  ...SEASON_STEPS.map((count) => ({
    id: `seasons.${count}` as const,
    family: 'seasons' as const,
    condition: { kind: 'seasons', count } as const,
  })),
  ...PLAY_HOURS.map((hours) => ({
    id: `playHours.${hours}` as const,
    family: 'seasons' as const,
    condition: { kind: 'playSeconds', seconds: hours * 3600 } as const,
  })),
  {
    id: 'swiftSeason',
    family: 'seasons',
    // The 10 Seeds advised for the first Season (§7), as a literal: seasons.ts imports this module.
    condition: { kind: 'swiftSeason', seeds: 10, seconds: 30 * 60 },
  },
  { id: 'longSeason', family: 'seasons', condition: { kind: 'seasonSeconds', seconds: 4 * 3600 } },
  { id: 'lateHarvest', family: 'seasons', condition: { kind: 'action' } },
  {
    id: 'slowPhotosynthesis',
    family: 'seasons',
    condition: { kind: 'idle', seconds: 600 },
    hidden: true,
  },
  { id: 'earlySowing', family: 'seasons', condition: { kind: 'action' }, hidden: true },
  // The Bioregion and the Cycle of water (§7.4).
  ...WATER_EXPONENTS.map((exponent) => ({
    id: `water.${exponent}` as const,
    family: 'bioregion' as const,
    condition: { kind: 'allTimeWater', amount: 10 ** exponent } as const,
  })),
  ...COLLECTOR_STEPS.map((count) => ({
    id: `collectors.${count}` as const,
    family: 'bioregion' as const,
    condition: { kind: 'collectors', count } as const,
  })),
  ...SITE_STEPS.map((count) => ({
    id: `sites.${count}` as const,
    family: 'bioregion' as const,
    condition: { kind: 'siteLevels', count } as const,
  })),
  { id: 'watershed', family: 'bioregion', condition: { kind: 'everySite', count: 1 } },
  ...CYCLE_STEPS.map((count) => ({
    id: `cycles.${count}` as const,
    family: 'bioregion' as const,
    condition: { kind: 'cycles', count } as const,
  })),
  { id: 'floodTide', family: 'bioregion', condition: { kind: 'action' }, hidden: true },
  // The delta of the Sources and the challenge Cycles (§7.5).
  ...DELTA_STEPS.map((count) => ({
    id: `delta.${count}` as const,
    family: 'bioregion' as const,
    condition: { kind: 'deltaLevels', count } as const,
  })),
  {
    id: 'lockKeeper',
    family: 'bioregion',
    condition: { kind: 'lockCycles', count: LOCK_MILESTONE_CYCLES },
  },
  ...CYCLE_CHALLENGE_STEPS.map((count) => ({
    id: `cycleChallenges.${count}` as const,
    family: 'bioregion' as const,
    condition: { kind: 'cycleChallenges', count } as const,
  })),
];

export const ACHIEVEMENTS = Object.fromEntries(ACHIEVEMENT_LIST.map((a) => [a.id, a])) as Record<
  AchievementId,
  AchievementDef
>;

/** Seeds gained at once by a new Season that unlocks "Moisson tardive". */
export const LATE_HARVEST_SEEDS = 50;
/** Sources gained at once by a new Cycle of water that unlocks the hidden "Grandes eaux". */
export const FLOOD_TIDE_SOURCES = 25;
/** Seconds left on screen under which catching the butterfly unlocks "De justesse". */
export const JUST_IN_TIME_SECONDS = 2;

export function isAchievementId(value: unknown): value is AchievementId {
  return typeof value === 'string' && Object.hasOwn(ACHIEVEMENTS, value);
}

/** Production bonus of one Milestone, raised by parcels and projects (§6.1, §6.2). */
export function bonusPerAchievement(state: GameState): number {
  return bonusesOf(state, 'perAchievement').reduce((sum, b) => sum + b.bonus, ACHIEVEMENT_BONUS);
}

/** Additive production bonus from the Milestones unlocked. */
export function achievementBonus(state: GameState): number {
  return state.achievements.length * bonusPerAchievement(state);
}

function buildingsOwned(state: GameState): number {
  return GENERATOR_IDS.reduce((sum, id) => sum + state.generators[id], 0);
}

function isMet(state: GameState, condition: AchievementCondition): boolean {
  switch (condition.kind) {
    case 'allTimeLight':
      return state.allTimeLight >= condition.amount;
    case 'lightPerSecond':
      return lightPerSecond(state) >= condition.amount;
    case 'clickValue':
      return clickValue(state) >= condition.amount;
    case 'owned':
      return state.generators[condition.generator] >= condition.count;
    case 'onlyGenerator':
      return (
        state.generators[condition.generator] >= condition.count &&
        buildingsOwned(state) === state.generators[condition.generator]
      );
    case 'noBuildings':
      return state.totalLight >= condition.amount && buildingsOwned(state) === 0;
    case 'clicks':
      return state.clicks >= condition.count;
    case 'butterflies':
      return state.butterflies >= condition.count;
    case 'visits':
      return state.visits[condition.visit] >= condition.count;
    case 'everyVisit':
      return NEIGHBOURHOOD_VISITS.every((kind) => state.visits[kind] > 0);
    case 'everyCityVisit':
      return CITY_VISITS.every((kind) => state.visits[kind] > 0);
    case 'cityVisits':
      return cityVisits(state) >= condition.count;
    case 'seasons':
      return state.seasons >= condition.count;
    case 'everyGenerator':
      return GENERATOR_IDS.every((id) => state.generators[id] >= condition.count);
    case 'upgrades':
      return state.upgrades.length >= condition.count;
    case 'upgradeSet': {
      const set: readonly UpgradeId[] = UPGRADE_SETS[condition.set];
      return state.upgrades.filter((id) => set.includes(id)).length >= condition.count;
    }
    case 'parcels':
      return state.parcels.length >= condition.count;
    case 'districts':
      return state.districts.length >= condition.count;
    case 'projects':
      return state.projects.length >= condition.count;
    case 'talents':
      return state.talents.length >= condition.count;
    case 'canopyLevels':
      return canopyLevels(state) >= condition.count;
    case 'fullCanopy':
      return isCanopyComplete(state);
    case 'sowerSeasons':
      return state.canopy.sowerSeasons >= condition.count;
    case 'harvests':
      return state.garden.harvests >= condition.count;
    case 'varieties':
      return state.garden.varieties.length >= condition.count;
    case 'species':
      return state.species.length >= condition.count;
    case 'challenges':
      return state.challenges.length >= condition.count;
    case 'cooperativePurchases':
      return (
        Object.values(state.cooperatives.purchases).reduce((sum, n) => sum + n, 0) >=
        condition.count
      );
    case 'allTimeWater':
      return state.allTimeWater >= condition.amount;
    case 'collectors':
      return collectorsOwned(state) >= condition.count;
    case 'siteLevels':
      return siteLevels(state) >= condition.count;
    case 'everySite':
      return BASIN_SITE_IDS.every((id) => state.sites[id] >= condition.count);
    case 'cycles':
      return state.cycles >= condition.count;
    case 'deltaLevels':
      return deltaLevels(state) >= condition.count;
    case 'lockCycles':
      return state.delta.lockCycles >= condition.count;
    case 'worksBuilt':
      return worksBuilt(state) >= condition.count;
    case 'sisterCities':
      return state.city.founded.length >= condition.count;
    case 'alliances':
      return workingAlliances(state).length >= condition.count;
    case 'grandBloom':
      return state.alliances.bloomed;
    case 'paths':
      return pathsWorking(state) >= condition.count;
    case 'rotations':
      return state.garden.rotations >= condition.count;
    case 'oldTree':
      return FRUIT_IDS.some((id) => treeAge(state.orchard.trees[id]) === TREE_AGE_PICKS.length);
    case 'flights':
      return state.pollen.flights >= condition.count;
    case 'bouquet':
      return bouquetSize(state.effects) >= condition.count;
    case 'weather':
      return state.weather.seen.includes(condition.weather);
    case 'weatherSpecies':
      return WEATHER_SPECIES.every((id) => state.species.includes(id));
    case 'greetings':
      return totalGreetings(state) >= condition.count;
    case 'families':
      return completeFamilies(state.species).length >= condition.count;
    case 'requests':
      return state.requests.served >= condition.count;
    case 'fruitHarvests':
      return state.orchard.harvests >= condition.count;
    case 'fruitVarieties':
      return state.orchard.varieties.length >= condition.count;
    case 'cycleChallenges':
      return state.cycleChallenges.length >= condition.count;
    case 'playSeconds':
      return state.playSeconds >= condition.seconds;
    case 'seasonSeconds':
      return state.seasonSeconds >= condition.seconds;
    case 'swiftSeason':
      return (
        state.seasonSeconds <= condition.seconds &&
        state.totalLight >= lightForSeeds(condition.seeds)
      );
    case 'idle':
      return (
        state.idleSeconds >= condition.seconds && GENERATOR_IDS.some((id) => state.generators[id])
      );
    case 'action':
      return false;
  }
}

/** Conditions on amounts spanning many powers of ten: their progress reads in orders of magnitude. */
const LOG_KINDS: readonly AchievementCondition['kind'][] = [
  'allTimeLight',
  'lightPerSecond',
  'clickValue',
  'allTimeWater',
];

export function isMeasuredInPowers(condition: AchievementCondition): boolean {
  return LOG_KINDS.includes(condition.kind);
}

/** How far a condition is, as [have, need]; null for the ones that cannot be measured. */
function measure(state: GameState, condition: AchievementCondition): [number, number] | null {
  switch (condition.kind) {
    case 'allTimeLight':
      return [state.allTimeLight, condition.amount];
    case 'lightPerSecond':
      return [lightPerSecond(state), condition.amount];
    case 'clickValue':
      return [clickValue(state), condition.amount];
    case 'allTimeWater':
      return [state.allTimeWater, condition.amount];
    case 'owned':
      return [state.generators[condition.generator], condition.count];
    case 'clicks':
      return [state.clicks, condition.count];
    case 'butterflies':
      return [state.butterflies, condition.count];
    case 'visits':
      return [state.visits[condition.visit], condition.count];
    case 'cityVisits':
      return [cityVisits(state), condition.count];
    case 'seasons':
      return [state.seasons, condition.count];
    case 'everyGenerator':
      return [Math.min(...GENERATOR_IDS.map((id) => state.generators[id])), condition.count];
    case 'upgrades':
      return [state.upgrades.length, condition.count];
    case 'upgradeSet': {
      const set: readonly UpgradeId[] = UPGRADE_SETS[condition.set];
      return [state.upgrades.filter((id) => set.includes(id)).length, condition.count];
    }
    case 'parcels':
      return [state.parcels.length, condition.count];
    case 'districts':
      return [state.districts.length, condition.count];
    case 'projects':
      return [state.projects.length, condition.count];
    case 'talents':
      return [state.talents.length, condition.count];
    case 'canopyLevels':
      return [canopyLevels(state), condition.count];
    case 'sowerSeasons':
      return [state.canopy.sowerSeasons, condition.count];
    case 'harvests':
      return [state.garden.harvests, condition.count];
    case 'varieties':
      return [state.garden.varieties.length, condition.count];
    case 'species':
      return [state.species.length, condition.count];
    case 'challenges':
      return [state.challenges.length, condition.count];
    case 'cooperativePurchases':
      return [
        Object.values(state.cooperatives.purchases).reduce((a, b) => a + b, 0),
        condition.count,
      ];
    case 'collectors':
      return [collectorsOwned(state), condition.count];
    case 'siteLevels':
      return [siteLevels(state), condition.count];
    case 'cycles':
      return [state.cycles, condition.count];
    case 'deltaLevels':
      return [deltaLevels(state), condition.count];
    case 'lockCycles':
      return [state.delta.lockCycles, condition.count];
    case 'worksBuilt':
      return [worksBuilt(state), condition.count];
    case 'sisterCities':
      return [state.city.founded.length, condition.count];
    case 'alliances':
      return [workingAlliances(state).length, condition.count];
    case 'paths':
      return [pathsWorking(state), condition.count];
    case 'rotations':
      return [state.garden.rotations, condition.count];
    case 'flights':
      return [state.pollen.flights, condition.count];
    case 'greetings':
      return [totalGreetings(state), condition.count];
    case 'families':
      return [completeFamilies(state.species).length, condition.count];
    case 'requests':
      return [state.requests.served, condition.count];
    case 'fruitHarvests':
      return [state.orchard.harvests, condition.count];
    case 'fruitVarieties':
      return [state.orchard.varieties.length, condition.count];
    case 'cycleChallenges':
      return [state.cycleChallenges.length, condition.count];
    case 'playSeconds':
      return [state.playSeconds, condition.seconds];
    default:
      return null;
  }
}

/**
 * Share of a Milestone's goal reached, from 0 to 1 (M37); null when it cannot be measured. The
 * amounts spanning powers of ten count in orders of magnitude.
 */
export function achievementProgress(
  state: GameState,
  condition: AchievementCondition,
): number | null {
  const measured = measure(state, condition);
  if (!measured) return null;
  const [have, need] = measured;
  if (need <= 0) return 1;
  const share = isMeasuredInPowers(condition)
    ? Math.log10(Math.max(1, have)) / Math.log10(need)
    : have / need;
  return Math.max(0, Math.min(1, share));
}

/** Unlock every Milestone whose condition is met. Returns the same state when none is new. */
export function unlockAchievements(state: GameState): GameState {
  const fresh = ACHIEVEMENT_LIST.filter(
    (a) => !state.achievements.includes(a.id) && isMet(state, a.condition),
  ).map((a) => a.id);
  if (fresh.length === 0) return state;
  return leaveGifts({ ...state, achievements: [...state.achievements, ...fresh] }, fresh);
}

/** Unlock one Milestone directly, e.g. one earned by an action. */
export function unlockAchievement(state: GameState, id: AchievementId): GameState {
  if (state.achievements.includes(id)) return state;
  return leaveGifts({ ...state, achievements: [...state.achievements, id] }, [id]);
}

/** Each Milestone reached leaves its gift on the map (M37), to be gathered by the player. */
function leaveGifts(state: GameState, fresh: readonly AchievementId[]): GameState {
  const gifts = [...state.milestoneGifts, ...fresh.map(milestoneGift)];
  return { ...state, milestoneGifts: gifts.slice(0, MAX_WAITING_GIFTS) };
}
