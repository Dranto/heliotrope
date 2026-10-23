import { render } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { withAllIntroduced } from '../game/introductions';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

describe('the vertical farm on the map', () => {
  beforeEach(() => localStorage.clear());

  it('plants each terrace rim with greens and flowers of its own colour', () => {
    const base = withAllIntroduced(createInitialState(0));
    saveGame({ ...base, generators: { ...base.generators, verticalFarm: 1 } });
    const { container } = render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const farm = container.querySelector('.farm')!;
    const terraces = farm.querySelectorAll(':is(.farm-deck, .farm-stone)').length;
    expect(terraces).toBeGreaterThanOrEqual(3);
    expect(farm.querySelectorAll('.farm-greens')).toHaveLength(terraces);
    const blooms = [...farm.querySelectorAll('.farm-blooms')];
    expect(blooms).toHaveLength(terraces);
    expect(new Set(blooms.map((b) => b.getAttribute('class'))).size).toBe(3);
  });
});
