import { render } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { withAllIntroduced } from '../game/introductions';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

describe('the potted heliotrope on the map', () => {
  beforeEach(() => localStorage.clear());

  it('draws a pot with soil, a rosette of leaves and a dome of florets', () => {
    const base = withAllIntroduced(createInitialState(0));
    saveGame({ ...base, generators: { ...base.generators, pot: 2 } });
    const { container } = render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const pots = container.querySelectorAll('[data-generator="pot"] .pot-art');
    expect(pots).toHaveLength(2);
    for (const pot of pots) {
      for (const part of ['.pot-shadow', '.pot', '.pot-rim', '.pot-soil', '.pot-gleam']) {
        expect(pot.querySelectorAll(part)).toHaveLength(1);
      }
      expect(pot.querySelectorAll('.pot-leaf')).toHaveLength(6);
      // No upgrade yet: the smallest dome, its heart darker than its edge.
      expect(pot.querySelectorAll('.floret')).toHaveLength(7);
      expect(pot.querySelectorAll('.floret.deep').length).toBeGreaterThan(0);
      expect(pot.querySelectorAll('.floret:not(.deep)').length).toBeGreaterThan(0);
    }
  });
});
