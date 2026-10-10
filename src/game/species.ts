// The Herbier (docs/game-design.md §9.5): species that come back as the neighbourhood greens.
// Each one returns when a condition of the game is met (a parcel restored, enough of a building,
// Golden Butterflies caught, a challenge Season won), then lives on the map for good. Species are
// kept across Seasons. Names live in src/i18n, drawings and places in src/ui.
import type { ChallengeId } from './challenges';
import type { GeneratorId } from './generators';
import type { ParcelId } from './parcels';
import type { ProjectId } from './projects';
import type { GameState } from './state';
import type { TalentId } from './talents';

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
  | { kind: 'challenge'; challenge: ChallengeId };

export interface SpeciesDef {
  id: SpeciesId;
  condition: SpeciesCondition;
}

/**
 * §9.5: each species found counts as one more biodiversity step (§5.4), so it grows with every
 * biodiversity factor of the parcels and the Tree of Seasons.
 */
export const SPECIES_STEPS = 1;

/** §9.5: the complete Herbier multiplies the whole biodiversity bonus. */
export const HERBIER_COMPLETE_FACTOR = 1.5;

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
];

export const SPECIES: Record<SpeciesId, SpeciesDef> = Object.fromEntries(
  SPECIES_LIST.map((s) => [s.id, s]),
) as Record<SpeciesId, SpeciesDef>;

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
  return state.species.length === SPECIES_IDS.length;
}
