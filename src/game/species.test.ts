import { BIODIVERSITY_STEP, biodiversityBonus } from './production';
import { startNewSeason } from './seasons';
import {
  HERBIER_COMPLETE_FACTOR,
  SPECIES_IDS,
  SPECIES_LIST,
  unlockSpecies,
  type SpeciesId,
} from './species';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

function state(patch: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), ...patch };
}

describe('Herbier (§9.5)', () => {
  it('lists every species once', () => {
    expect(SPECIES_LIST.map((s) => s.id)).toEqual([...SPECIES_IDS]);
  });

  it('brings a species back when its parcel is restored, and only then', () => {
    expect(unlockSpecies(state()).species).toEqual([]);
    expect(unlockSpecies(state({ parcels: ['river'] })).species).toEqual(['frog']);
  });

  it('brings species back from buildings, butterflies, projects, talents and Seasons', () => {
    const base = createInitialState(0);
    const next = unlockSpecies(
      state({
        generators: { ...base.generators, rooftopGarden: 25 },
        butterflies: 5,
        projects: ['lightFestival'],
        talents: ['nightWatch'],
        seasons: 10,
      }),
    );
    expect(next.species).toEqual(['bee', 'brimstone', 'glowWorm', 'bat', 'owl']);
  });

  it('returns the same state when no species is new', () => {
    const s = state({ parcels: ['river'], species: ['frog'] });
    expect(unlockSpecies(s)).toBe(s);
  });

  it('checks species on every tick', () => {
    expect(tick(state({ parcels: ['park'] }), 1).species).toEqual(['hedgehog']);
  });

  it('counts each species as a biodiversity step, ×1.5 with the complete Herbier', () => {
    expect(biodiversityBonus(state({ species: ['frog', 'bee'] }))).toBeCloseTo(
      2 * BIODIVERSITY_STEP,
    );
    expect(biodiversityBonus(state({ species: [...SPECIES_IDS] as SpeciesId[] }))).toBeCloseTo(
      // The weather's family complete gives biodiversity ×1.1 (§9.17).
      SPECIES_IDS.length * BIODIVERSITY_STEP * HERBIER_COMPLETE_FACTOR * 1.1,
    );
  });

  it('keeps the Herbier across Seasons', () => {
    const s = state({ allTimeLight: 1e12, species: ['frog'] });
    expect(startNewSeason(s).species).toEqual(['frog']);
  });
});
