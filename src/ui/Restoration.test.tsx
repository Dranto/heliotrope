import { render, screen } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Restoration } from './Restoration';
import { GameStoreContext } from './useGame';

function renderRestoration() {
  render(
    <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
      <Restoration onHighlight={() => {}} />
    </GameStoreContext.Provider>,
  );
}

describe('Restoration', () => {
  beforeEach(() => localStorage.clear());

  it('writes out what the other future of a restored parcel would give', () => {
    saveGame({ ...createInitialState(0), parcels: ['river'] });
    renderRestoration();
    const group = screen.getByRole('radiogroup', { name: /Avenir de Rivière retrouvée/ });
    expect(group).toBeInTheDocument();
    expect(document.querySelector('.future-other')?.textContent).toMatch(
      /^Ou Rivière baignade\s: /,
    );
  });
});
