import { describe, expect, it } from 'vitest';
import { isGardenOpen } from './garden';
import {
  ARRIVAL_SECONDS,
  arrivedFeature,
  INTRO_GAP_SECONDS,
  withAllIntroduced,
  type FeatureId,
} from './introductions';
import {
  advanceIntroductions,
  dueFeatures,
  FIRST_SIGHT_SECONDS,
  introduceAllDue,
} from './onboarding';
import { deserialize, serialize } from './save';
import { startNewSeason } from './seasons';
import { learnReferenceTalents, simulate } from './simulator';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

function withPots(state: GameState, pot: number): GameState {
  return { ...state, generators: { ...state.generators, pot } };
}

/** Play a reference Season and note when each mechanic was introduced, in seconds of play. */
function introductionTimes(start: GameState, maxSeconds: number): Map<FeatureId, number> {
  const times = new Map<FeatureId, number>();
  let seconds = 0;
  const known = new Set(start.intro.introduced);
  simulate({
    state: start,
    maxSeconds,
    maxStepSeconds: 2,
    tend: (state, dt) => {
      seconds += dt;
      for (const id of state.intro.introduced) {
        if (!known.has(id) && !times.has(id)) times.set(id, seconds);
      }
      return state;
    },
  });
  return times;
}

function gaps(times: Map<FeatureId, number>): number[] {
  const sorted = [...times.values()].sort((a, b) => a - b);
  return sorted.slice(1).map((t, i) => t - sorted[i]!);
}

describe('progressive introductions (§10.8)', () => {
  it('starts a new game with nothing introduced', () => {
    const state = createInitialState(0);
    expect(state.intro.introduced).toEqual([]);
    expect(dueFeatures(state)).toEqual([]);
  });

  it('holds a due mechanic back until the gap has passed, then lets it in', () => {
    const potted = withPots(createInitialState(0), 1);
    expect(dueFeatures(potted)).toEqual(['garden']);
    expect(isGardenOpen(potted)).toBe(false);
    const early = advanceIntroductions(potted, INTRO_GAP_SECONDS - 1);
    expect(isGardenOpen(early)).toBe(false);
    const later = advanceIntroductions(early, 1);
    expect(later.intro).toEqual({ introduced: ['garden'], sinceLast: 0 });
    expect(isGardenOpen(later)).toBe(true);
  });

  it('lets in one mechanic at a time, in priority order', () => {
    // A second Season with the first one's mechanics known: three are due at once.
    const first: FeatureId[] = [
      'pollen',
      'garden',
      'restoration',
      'achievements',
      'herbier',
      'butterfly',
      'visits',
      'decor',
      'seasons',
    ];
    let state: GameState = {
      ...withPots(createInitialState(0), 10),
      seasons: 1,
      seeds: 3,
      intro: { introduced: first, sinceLast: 1000 },
    };
    expect(dueFeatures(state)).toEqual(['tree', 'requests', 'weather']);
    const order: FeatureId[] = [];
    for (let i = 0; i < 3; i++) {
      const next = advanceIntroductions(state, i === 0 ? 0 : INTRO_GAP_SECONDS);
      order.push(next.intro.introduced.at(-1)!);
      // Nothing more comes until the next gap.
      expect(advanceIntroductions(next, INTRO_GAP_SECONDS - 1).intro.introduced).toEqual(
        next.intro.introduced,
      );
      state = next;
    }
    expect(order).toEqual(['tree', 'requests', 'weather']);
    expect(dueFeatures(state)).toEqual([]);
  });

  it('spaces the first Season’s novelties at least the gap apart, the first ones within minutes', () => {
    const times = introductionTimes(createInitialState(0), 25 * 60);
    expect([...times.keys()]).toEqual([
      'pollen',
      'garden',
      'restoration',
      'achievements',
      'herbier',
      'butterfly',
      'visits',
      'decor',
      'seasons',
    ]);
    for (const gap of gaps(times)) expect(gap).toBeGreaterThanOrEqual(INTRO_GAP_SECONDS - 2);
    expect(times.get('pollen')!).toBeLessThan(60);
    expect(times.get('decor')!).toBeLessThan(10 * 60);
  });

  it('brings the second Season’s mechanics one by one instead of all at once', () => {
    const first = simulate({ stopWhenAdvised: true, maxSeconds: 3 * 3600 });
    const second = learnReferenceTalents(startNewSeason(first.state));
    const times = introductionTimes(second, 6 * 60);
    expect([...times.keys()]).toEqual(['tree', 'cooperatives', 'requests', 'weather']);
    expect(times.get('tree')!).toBeLessThan(5);
    for (const gap of gaps(times)) expect(gap).toBeGreaterThanOrEqual(INTRO_GAP_SECONDS - 2);
  });

  it('keeps what was introduced across Seasons', () => {
    const state = withAllIntroduced(createInitialState(0));
    const ready = { ...state, totalLight: 1e12, seasonSeconds: 3600 };
    expect(startNewSeason(ready).intro.introduced).toEqual(state.intro.introduced);
  });

  it('shows the newest mechanic as just arrived for a few seconds', () => {
    const state = advanceIntroductions(withPots(createInitialState(0), 1), INTRO_GAP_SECONDS);
    expect(arrivedFeature(state)).toBe('garden');
    expect(arrivedFeature(advanceIntroductions(state, ARRIVAL_SECONDS))).toBeNull();
    expect(arrivedFeature(createInitialState(0))).toBeNull();
  });

  it('sends the first butterfly and the first visit soon after they join', () => {
    const base = createInitialState(0);
    const known: FeatureId[] = ['pollen', 'garden', 'restoration', 'achievements', 'herbier'];
    const neighbourhood: GameState = {
      ...base,
      generators: {
        ...base.generators,
        pot: 10,
        balconyPanel: 10,
        rooftopGarden: 10,
        greenhouse: 1,
      },
      totalLight: 1e5,
      butterfly: { nextIn: 200, visible: 0 },
      visit: { nextIn: 300, kind: null, visible: 0 },
      intro: { introduced: known, sinceLast: INTRO_GAP_SECONDS },
    };
    const butterfly = advanceIntroductions(neighbourhood, 0);
    expect(butterfly.intro.introduced.at(-1)).toBe('butterfly');
    expect(butterfly.butterfly.nextIn).toBe(FIRST_SIGHT_SECONDS);
    const visits = advanceIntroductions(butterfly, INTRO_GAP_SECONDS);
    expect(visits.intro.introduced.at(-1)).toBe('visits');
    expect(visits.visit.nextIn).toBe(FIRST_SIGHT_SECONDS);
  });

  it('counts offline time like play time', () => {
    const potted = withPots(createInitialState(0), 1);
    expect(isGardenOpen(tick(potted, INTRO_GAP_SECONDS))).toBe(true);
  });

  it('gives an older save every mechanic it already shows, and holds nothing back', () => {
    const base = createInitialState(0);
    const older: GameState = { ...withPots(base, 12), seasons: 3, seeds: 40 };
    const raw = JSON.parse(serialize(older)) as Record<string, unknown>;
    delete raw.intro;
    raw.version = 31;
    const loaded = deserialize(JSON.stringify(raw), 0)!;
    expect(dueFeatures(loaded)).toEqual([]);
    expect(loaded.intro.introduced).toEqual(introduceAllDue(older).intro.introduced);
    expect(loaded.intro.introduced).toEqual(
      expect.arrayContaining(['garden', 'tree', 'requests', 'weather', 'bioregion', 'orchard']),
    );
    expect(arrivedFeature(loaded)).toBeNull();
  });
});
