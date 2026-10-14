// The Herbier (docs/game-design.md §9.5): species that come back as the neighbourhood greens.
// Each one returns when a condition of the game is met (a parcel restored, enough of a building,
// Golden Butterflies caught, a challenge Season won), then lives on the map for good. Species are
// kept across Seasons. Names live in src/i18n, drawings and places in src/ui.
import type { ChallengeId } from './challenges';
import { longestCorridor, SPECIES_LENGTH, type CorridorFamily } from './corridors';
import type { CycleChallengeId } from './cycleChallenges';
import type { GeneratorId } from './generators';
import type { ParcelId } from './parcels';
import type { ProjectId } from './projects';
import type { GameState } from './state';
import type { TalentId } from './talents';
import type { VisitKind } from './visits';
import { isWeatherOpen, type WeatherId } from './weather';

export const SPECIES_IDS = [
  'poppy',
  'bee',
  'fern',
  'ladybird',
  'bumblebee',
  'sparrow',
  'blueTit',
  'brimstone',
  'frog',
  'hedgehog',
  'robin',
  'swift',
  'glowWorm',
  'bat',
  'kingfisher',
  'orchid',
  'stagBeetle',
  'owl',
  'otter',
  'salmon',
  'blackStork',
  'skylark',
  'swallow',
  'dragonfly',
  'redstart',
  'greenWoodpecker',
  'newt',
  'snail',
  'wallLizard',
  'kestrel',
  'salamander',
  'cicada',
] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export type SpeciesCondition =
  | { kind: 'parcel'; parcel: ParcelId }
  | { kind: 'owned'; generator: GeneratorId; count: number }
  | { kind: 'butterflies'; count: number }
  /** A neighbourhood project carried out at least once (the species stays after the Season). */
  | { kind: 'project'; project: ProjectId }
  | { kind: 'talent'; talent: TalentId }
  /** Won by completing a challenge Season (§7.3). */
  | { kind: 'challenge'; challenge: ChallengeId }
  /** Won by completing a challenge Cycle of water (§7.5). */
  | { kind: 'cycleChallenge'; challenge: CycleChallengeId }
  /** Won by welcoming a visitor of the city (§9.6, M18) a few times. */
  | { kind: 'visit'; visit: VisitKind; count: number }
  /** A corridor of a family at least this long (§6.7, M21). */
  | { kind: 'corridor'; family: CorridorFamily; length: number }
  /** Comes out only under one weather (§9.10, M28). */
  | { kind: 'weather'; weather: WeatherId };

export interface SpeciesDef {
  id: SpeciesId;
  condition: SpeciesCondition;
}

/**
 * §9.5: each species found counts as one more biodiversity step (§5.4), so it grows with every
 * biodiversity factor of the parcels and the Tree of Seasons.
 */
export const SPECIES_STEPS = 1;

/**
 * §9.5: the complete Herbier multiplies the whole biodiversity bonus. It counts the species of
 * the neighbourhood; the river species of the challenge Cycles (§7.5) and the species of the
 * city's visits (§9.6) come on top.
 */
export const HERBIER_COMPLETE_FACTOR = 1.5;

/** Welcomes of a visitor of the city that bring its species back. */
export const CITY_SPECIES_VISITS = 5;

/** Display order: the first returns of the Balcony, then the Neighbourhood, then the City. */
export const SPECIES_LIST: readonly SpeciesDef[] = [
  { id: 'poppy', condition: { kind: 'parcel', parcel: 'gardenStreet' } },
  { id: 'bee', condition: { kind: 'owned', generator: 'rooftopGarden', count: 25 } },
  { id: 'fern', condition: { kind: 'parcel', parcel: 'rainGardens' } },
  { id: 'ladybird', condition: { kind: 'owned', generator: 'greenhouse', count: 25 } },
  { id: 'bumblebee', condition: { kind: 'parcel', parcel: 'pollinatorStrip' } },
  { id: 'sparrow', condition: { kind: 'owned', generator: 'pot', count: 100 } },
  { id: 'blueTit', condition: { kind: 'owned', generator: 'urbanCanopy', count: 10 } },
  { id: 'brimstone', condition: { kind: 'butterflies', count: 5 } },
  { id: 'frog', condition: { kind: 'parcel', parcel: 'river' } },
  { id: 'hedgehog', condition: { kind: 'parcel', parcel: 'park' } },
  { id: 'robin', condition: { kind: 'parcel', parcel: 'orchard' } },
  { id: 'swift', condition: { kind: 'parcel', parcel: 'livingRoofs' } },
  { id: 'glowWorm', condition: { kind: 'project', project: 'lightFestival' } },
  { id: 'bat', condition: { kind: 'talent', talent: 'nightWatch' } },
  { id: 'kingfisher', condition: { kind: 'challenge', challenge: 'cloudy' } },
  { id: 'orchid', condition: { kind: 'challenge', challenge: 'wild' } },
  { id: 'stagBeetle', condition: { kind: 'challenge', challenge: 'frugal' } },
  { id: 'owl', condition: { kind: 'challenge', challenge: 'hands' } },
  { id: 'otter', condition: { kind: 'cycleChallenge', challenge: 'drought' } },
  { id: 'salmon', condition: { kind: 'cycleChallenge', challenge: 'flood' } },
  { id: 'blackStork', condition: { kind: 'cycleChallenge', challenge: 'still' } },
  { id: 'skylark', condition: { kind: 'visit', visit: 'sheep', count: CITY_SPECIES_VISITS } },
  { id: 'swallow', condition: { kind: 'visit', visit: 'festival', count: CITY_SPECIES_VISITS } },
  { id: 'dragonfly', condition: { kind: 'visit', visit: 'fireflies', count: CITY_SPECIES_VISITS } },
  { id: 'redstart', condition: { kind: 'visit', visit: 'fleaMarket', count: CITY_SPECIES_VISITS } },
  // The corridors' species (§6.7, M21): they only come along a long enough corridor.
  {
    id: 'greenWoodpecker',
    condition: { kind: 'corridor', family: 'green', length: SPECIES_LENGTH },
  },
  { id: 'newt', condition: { kind: 'corridor', family: 'blue', length: SPECIES_LENGTH } },
  // The weather's species (§9.10, M28): the snail comes out under the shower.
  { id: 'snail', condition: { kind: 'weather', weather: 'shower' } },
  // M33: one species for each other weather.
  { id: 'wallLizard', condition: { kind: 'weather', weather: 'sun' } },
  { id: 'kestrel', condition: { kind: 'weather', weather: 'wind' } },
  { id: 'salamander', condition: { kind: 'weather', weather: 'mist' } },
  { id: 'cicada', condition: { kind: 'weather', weather: 'heat' } },
];

/** The river species (§7.5), beyond the neighbourhood's Herbier. */
export const RIVER_SPECIES: readonly SpeciesId[] = ['otter', 'salmon', 'blackStork'];

/** The species of the city's visits (§9.6, M18), beyond the neighbourhood's Herbier too. */
export const CITY_SPECIES: readonly SpeciesId[] = ['skylark', 'swallow', 'dragonfly', 'redstart'];

/** The species of the corridors (§6.7, M21), outside the Herbier of the neighbourhood too. */
export const CORRIDOR_SPECIES: readonly SpeciesId[] = ['greenWoodpecker', 'newt'];

/** The species that come out under one weather (§9.10, M28): not needed for the complete Herbier. */
export const WEATHER_SPECIES: readonly SpeciesId[] = [
  'snail',
  'wallLizard',
  'kestrel',
  'salamander',
  'cicada',
];

export function isSpeciesId(value: unknown): value is SpeciesId {
  return typeof value === 'string' && (SPECIES_IDS as readonly string[]).includes(value);
}

function isMet(state: GameState, condition: SpeciesCondition): boolean {
  switch (condition.kind) {
    case 'parcel':
      return state.parcels.includes(condition.parcel);
    case 'owned':
      return state.generators[condition.generator] >= condition.count;
    case 'butterflies':
      return state.butterflies >= condition.count;
    case 'project':
      return state.projects.includes(condition.project);
    case 'talent':
      return state.talents.includes(condition.talent);
    case 'challenge':
      return state.challenges.includes(condition.challenge);
    case 'cycleChallenge':
      return state.cycleChallenges.includes(condition.challenge);
    case 'visit':
      return state.visits[condition.visit] >= condition.count;
    case 'corridor':
      return longestCorridor(state, condition.family) >= condition.length;
    case 'weather':
      return isWeatherOpen(state) && state.weather.current === condition.weather;
  }
}

/** Bring back every species whose condition is met. Returns the same state when none is new. */
export function unlockSpecies(state: GameState): GameState {
  const fresh = SPECIES_LIST.filter(
    (s) => !state.species.includes(s.id) && isMet(state, s.condition),
  ).map((s) => s.id);
  if (fresh.length === 0) return state;
  return { ...state, species: [...state.species, ...fresh] };
}

export function isHerbierComplete(state: Pick<GameState, 'species'>): boolean {
  return SPECIES_IDS.every(
    (id) =>
      RIVER_SPECIES.includes(id) ||
      CITY_SPECIES.includes(id) ||
      CORRIDOR_SPECIES.includes(id) ||
      WEATHER_SPECIES.includes(id) ||
      state.species.includes(id),
  );
}
