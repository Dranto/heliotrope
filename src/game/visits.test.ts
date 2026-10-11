import { effectSeconds } from './butterfly';
import { BIRDS_SECONDS_PER_SPECIES, EFFECTS } from './effects';
import { applyOfflineProgress } from './offline';
import { biodiversityBonus, generatorMultiplier } from './production';
import { carryOutProject } from './restoration';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import {
  advanceVisit,
  cuttingsGenerator,
  isVisitUnlocked,
  VISIT_MAX_INTERVAL,
  VISIT_MIN_INTERVAL,
  VISIT_VISIBLE_SECONDS,
  welcomeVisit,
  type VisitKind,
} from './visits';
import { waterMultiplier } from './bioregion';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

function generators(patch: Partial<GameState['generators']>): GameState['generators'] {
  return { ...createInitialState(0).generators, ...patch };
}

/** A state with `kind` on the map. */
function visiting(kind: VisitKind, patch: Partial<GameState> = {}): GameState {
  return withState({ visit: { nextIn: 0, kind, visible: 10 }, ...patch });
}

describe('visits to the neighbourhood (§9.6)', () => {
  it('starts within the interval and waits until a visitor is drawn', () => {
    const state = createInitialState(0);
    expect(state.visit.kind).toBeNull();
    expect(state.visit.nextIn).toBeGreaterThanOrEqual(VISIT_MIN_INTERVAL);
    expect(state.visit.nextIn).toBeLessThanOrEqual(VISIT_MAX_INTERVAL);
    // Nothing draws visitors yet: the clock does not run.
    expect(advanceVisit(state, 1000)).toBe(state);
  });

  it('unlocks each visitor with what the player built', () => {
    expect(isVisitUnlocked(withState({ generators: generators({ pot: 10 }) }), 'cuttings')).toBe(
      true,
    );
    expect(isVisitUnlocked(withState({ generators: generators({ pot: 9 }) }), 'cuttings')).toBe(
      false,
    );
    expect(
      isVisitUnlocked(withState({ generators: generators({ rooftopGarden: 10 }) }), 'shower'),
    ).toBe(true);
    expect(
      isVisitUnlocked(withState({ generators: generators({ urbanCanopy: 1 }) }), 'birds'),
    ).toBe(true);
    expect(isVisitUnlocked(withState({ parcels: ['livingRoofs'] }), 'birds')).toBe(true);
  });

  it('arrives, stays 20 seconds, then leaves and comes back later', () => {
    let state = withState({ generators: generators({ pot: 10 }) });
    state = advanceVisit(state, state.visit.nextIn + 1);
    expect(state.visit.kind).toBe('cuttings');
    expect(state.visit.visible).toBeCloseTo(VISIT_VISIBLE_SECONDS - 1);
    state = advanceVisit(state, VISIT_VISIBLE_SECONDS);
    expect(state.visit.kind).toBeNull();
    expect(state.visit.nextIn).toBeGreaterThanOrEqual(VISIT_MIN_INTERVAL);
  });

  it('comes sooner with the pollinator corridor', () => {
    const state = visiting('cuttings', {
      generators: generators({ pot: 10 }),
      parcels: ['pollinatorStrip'],
    });
    const next = welcomeVisit(state)!.state;
    expect(next.visit.nextIn).toBeLessThanOrEqual(VISIT_MAX_INTERVAL * 0.8);
  });

  it('brings one of the most expensive building owned, two with the seed swap', () => {
    const state = visiting('cuttings', { generators: generators({ pot: 12, greenhouse: 3 }) });
    expect(cuttingsGenerator(state)).toBe('greenhouse');
    const result = welcomeVisit(state)!;
    expect(result.gift).toEqual({ generator: 'greenhouse', units: 1 });
    expect(result.state.generators.greenhouse).toBe(4);
    expect(result.state.visits.cuttings).toBe(1);
    expect(result.state.visit.kind).toBeNull();

    const swapped = carryOutProject({ ...state, resources: { light: 1e4, water: 0 } }, 'seedSwap');
    expect(welcomeVisit(swapped)!.state.generators.greenhouse).toBe(5);
  });

  it('waters the rooftop gardens, the greenhouses and the collectors during a shower', () => {
    const state = visiting('shower', {
      generators: generators({ rooftopGarden: 10, greenhouse: 1 }),
    });
    const next = welcomeVisit(state)!.state;
    expect(next.effects).toEqual([{ kind: 'shower', remaining: EFFECTS.shower.seconds }]);
    expect(generatorMultiplier(next, 'rooftopGarden')).toBe(
      generatorMultiplier(state, 'rooftopGarden') * 2,
    );
    expect(generatorMultiplier(next, 'greenhouse')).toBe(
      generatorMultiplier(state, 'greenhouse') * 2,
    );
    expect(generatorMultiplier(next, 'pot')).toBe(generatorMultiplier(state, 'pot'));
    expect(waterMultiplier(next)).toBe(waterMultiplier(state) * 2);
  });

  it('lasts twice as long with the rain gardens', () => {
    const plain = visiting('shower');
    const gardens = { ...plain, parcels: ['rainGardens' as const] };
    expect(effectSeconds(gardens, 'shower')).toBe(effectSeconds(plain, 'shower') * 2);
  });

  it('doubles biodiversity while migrating birds stay, longer with each species', () => {
    const state = visiting('birds', {
      generators: generators({ pot: 10, urbanCanopy: 1 }),
      species: ['sparrow', 'robin'],
    });
    const next = welcomeVisit(state)!.state;
    expect(biodiversityBonus(next)).toBeCloseTo(biodiversityBonus(state) * 2);
    expect(next.effects[0]).toEqual({
      kind: 'birds',
      remaining: EFFECTS.birds.seconds + 2 * BIRDS_SECONDS_PER_SPECIES,
    });
    // The effect ends with time.
    expect(tick(next, 200).effects).toEqual([]);
  });

  it('does nothing without a visitor', () => {
    expect(welcomeVisit(createInitialState(0))).toBeNull();
  });

  it('unlocks the visit Milestones', () => {
    let state = withState({
      generators: generators({ pot: 10 }),
      visits: { ...withState({}).visits, cuttings: 9, shower: 1, birds: 1 },
    });
    state = welcomeVisit({ ...state, visit: { nextIn: 0, kind: 'cuttings', visible: 5 } })!.state;
    expect(state.achievements).toEqual(expect.arrayContaining(['openDoors', 'goodNeighbours']));
  });

  it('pauses offline, like the Golden Butterfly', () => {
    const state = withState({ generators: generators({ pot: 10 }), lastUpdate: 0 });
    const { state: back } = applyOfflineProgress(state, 3600 * 1000);
    expect(back.visit).toEqual(state.visit);
  });
});
