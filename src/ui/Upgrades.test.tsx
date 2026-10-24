import { render, screen } from '@testing-library/react';
import { availableUpgrades } from '../game/production';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Upgrades } from './Upgrades';
import { GameStoreContext } from './useGame';

describe('Upgrades', () => {
  beforeEach(() => localStorage.clear());

  it('names the next upgrade apart from the building count it waits for', () => {
    const initial = createInitialState(0);
    let state = { ...initial, generators: { ...initial.generators, pot: 40, balconyPanel: 3 } };
    // Own every upgrade already in reach, so the panel shows the one still locked.
    for (let open = availableUpgrades(state); open.length > 0; open = availableUpgrades(state)) {
      state = { ...state, upgrades: [...state.upgrades, ...open.map((u) => u.id)] };
    }
    saveGame(state);
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <Upgrades />
      </GameStoreContext.Provider>,
    );
    const sight = screen.getByTestId('upgrade-in-sight');
    expect(sight.querySelector('.upgrade-sight-name')?.textContent).toMatch(/^Prochaine\u00a0: /);
    expect(sight.querySelector('.upgrade-sight-count')?.textContent).toBe(
      'Héliotrope en pot\u00a0: 40\u00a0/\u00a050',
    );
  });
});
