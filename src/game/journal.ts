// Neighbourhood journal (docs/game-design.md §6): short narrative lines unlocked by
// progression. Data only here; the texts live in src/i18n. Entries are kept across Seasons so
// the story moves forward instead of repeating.
import type { GeneratorId } from './generators';
import type { GameState } from './state';

export interface JournalCondition {
  /** Light earned in the current Season. */
  seasonLight?: number;
  /** Units owned of a generator. */
  owned?: { generator: GeneratorId; count: number };
  /** Seasons completed. */
  seasons?: number;
  /** Golden Butterflies caught. */
  butterflies?: number;
  /** Milestones unlocked. */
  achievements?: number;
}

export const JOURNAL_IDS = [
  'firstLight',
  'firstPot',
  'firstPanel',
  'neighbourAsks',
  'firstGarden',
  'quarterWakes',
  'firstGreenhouse',
  'firstButterfly',
  'firstFarm',
  'streetVote',
  'cityWakes',
  'firstMirrors',
  'firstCanopy',
  'tenMilestones',
  'firstArcology',
  'firstSeason',
  'secondSeason',
  'fourSeasons',
] as const;

export type JournalId = (typeof JOURNAL_IDS)[number];

export const JOURNAL: Record<JournalId, JournalCondition> = {
  firstLight: { seasonLight: 1 },
  firstPot: { owned: { generator: 'pot', count: 1 } },
  firstPanel: { owned: { generator: 'balconyPanel', count: 1 } },
  neighbourAsks: { owned: { generator: 'pot', count: 10 } },
  firstGarden: { owned: { generator: 'rooftopGarden', count: 1 } },
  quarterWakes: { seasonLight: 1e4 },
  firstGreenhouse: { owned: { generator: 'greenhouse', count: 1 } },
  firstButterfly: { butterflies: 1 },
  firstFarm: { owned: { generator: 'verticalFarm', count: 1 } },
  streetVote: { owned: { generator: 'greenhouse', count: 10 } },
  cityWakes: { seasonLight: 1e7 },
  firstMirrors: { owned: { generator: 'mirrorPlant', count: 1 } },
  firstCanopy: { owned: { generator: 'urbanCanopy', count: 1 } },
  tenMilestones: { achievements: 10 },
  firstArcology: { owned: { generator: 'arcology', count: 1 } },
  firstSeason: { seasons: 1 },
  secondSeason: { seasons: 2 },
  fourSeasons: { seasons: 4 },
};

export function isJournalId(value: unknown): value is JournalId {
  return typeof value === 'string' && Object.hasOwn(JOURNAL, value);
}

function isMet(state: GameState, condition: JournalCondition): boolean {
  const { seasonLight, owned, seasons, butterflies, achievements } = condition;
  if (seasonLight !== undefined && state.totalLight < seasonLight) return false;
  if (owned && state.generators[owned.generator] < owned.count) return false;
  if (seasons !== undefined && state.seasons < seasons) return false;
  if (butterflies !== undefined && state.butterflies < butterflies) return false;
  if (achievements !== undefined && state.achievements.length < achievements) return false;
  return true;
}

/** Add every journal entry whose condition is met. Returns the same state when none is new. */
export function unlockJournal(state: GameState): GameState {
  const fresh = JOURNAL_IDS.filter(
    (id) => !state.journal.includes(id) && isMet(state, JOURNAL[id]),
  );
  if (fresh.length === 0) return state;
  return { ...state, journal: [...state.journal, ...fresh] };
}
