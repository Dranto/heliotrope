import { clearSave, deserialize, loadGame, SAVE_KEY, saveGame, serialize } from './save';
import { createInitialState, STATE_VERSION, type GameState } from './state';

function playedState(): GameState {
  const base = createInitialState(1000);
  return {
    ...base,
    resources: { light: 42.5 },
    generators: { ...base.generators, pot: 3, balconyPanel: 1 },
    totalLight: 300,
    clicks: 120,
  };
}

describe('save', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through serialize/deserialize', () => {
    const state = playedState();
    expect(deserialize(serialize(state), 0)).toEqual(state);
  });

  it('round-trips through localStorage', () => {
    const state = playedState();
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
    const json = JSON.stringify({
      version: STATE_VERSION,
      resources: { light: 'lots' },
      generators: { pot: -1, balconyPanel: 2.5, rooftopGarden: null },
      totalLight: NaN,
      clicks: 'many',
    });
    expect(deserialize(json, 500)).toEqual(createInitialState(500));
  });

  it('migrates a v1 placeholder save to a fresh game that keeps its timestamp', () => {
    const v1 = JSON.stringify({ version: 1, resources: { sunlight: 9000 }, lastUpdate: 1234 });
    expect(deserialize(v1, 0)).toEqual(createInitialState(1234));
  });
});
