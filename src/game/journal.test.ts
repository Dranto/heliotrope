import { JOURNAL, JOURNAL_IDS, unlockJournal } from './journal';
import { phaseOf, visualSeason } from './phases';
import { startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { buyGenerator, clickHeliotrope, tick } from './tick';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

describe('neighbourhood journal (§6)', () => {
  it('has a condition for every entry', () => {
    expect(Object.keys(JOURNAL).sort()).toEqual([...JOURNAL_IDS].sort());
  });

  it('writes its first lines as the player starts', () => {
    let state = tick(clickHeliotrope(createInitialState(0)), 0.1);
    expect(state.journal).toEqual(['firstLight']);
    state = tick(buyGenerator({ ...state, resources: { light: 15 } }, 'pot'), 0.1);
    expect(state.journal).toEqual(['firstLight', 'firstPot']);
  });

  it('adds entries once, and keeps them across Seasons', () => {
    const state = unlockJournal(withState({ totalLight: 5e9, allTimeLight: 5e9 }));
    expect(state.journal).toEqual(['firstLight', 'quarterWakes', 'cityWakes']);
    expect(unlockJournal(state)).toBe(state);
    const next = startNewSeason(state);
    expect(next.journal).toEqual(['firstLight', 'quarterWakes', 'cityWakes', 'firstSeason']);
  });
});

describe('phases (§6)', () => {
  it('follows the Light earned this Season', () => {
    expect(phaseOf(withState({ totalLight: 9_999 }))).toBe(1);
    expect(phaseOf(withState({ totalLight: 10_000 }))).toBe(2);
    expect(phaseOf(withState({ totalLight: 1e7 }))).toBe(3);
  });

  it('tints the scene by season after the first one, cycling', () => {
    expect(visualSeason(withState({ seasons: 0 }))).toBeNull();
    expect(visualSeason(withState({ seasons: 1 }))).toBe('spring');
    expect(visualSeason(withState({ seasons: 4 }))).toBe('winter');
    expect(visualSeason(withState({ seasons: 5 }))).toBe('spring');
  });
});
