import { clearSave, deserialize, loadGame, SAVE_KEY, saveGame, serialize } from './save';
import { createInitialState, STATE_VERSION } from './state';

describe('save', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through serialize/deserialize', () => {
    const state = { ...createInitialState(1000), resources: { sunlight: 42 } };
    expect(deserialize(serialize(state), 0)).toEqual(state);
  });

  it('round-trips through localStorage', () => {
    const state = { ...createInitialState(1000), resources: { sunlight: 7 } };
    saveGame(state);
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
    expect(loadGame(0)).toEqual(state);
    clearSave();
    expect(loadGame(0)).toBeNull();
  });

  it('rejects corrupt or future saves', () => {
    expect(deserialize('not json', 0)).toBeNull();
    expect(deserialize('null', 0)).toBeNull();
    expect(deserialize(JSON.stringify({ version: STATE_VERSION + 1 }), 0)).toBeNull();
  });

  it('fills missing or invalid fields with defaults', () => {
    const json = JSON.stringify({ version: STATE_VERSION, resources: { sunlight: 'lots' } });
    expect(deserialize(json, 500)).toEqual(createInitialState(500));
  });
});
