import { fireEvent, render, screen } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Generators } from './Generators';
import { GameStoreContext } from './useGame';

function renderGenerators() {
  render(
    <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
      <Generators />
    </GameStoreContext.Provider>,
  );
}

describe('Generators growth pips', () => {
  beforeEach(() => localStorage.clear());

  it('opens and closes the two paths of a form from its pip', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, pot: 60 } });
    renderGenerators();
    const pip = screen.getByRole('button', { name: 'Mur de pots, dès 100' });
    expect(pip).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(pip);
    expect(pip).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('group', { name: 'Mur de pots : choisir une voie' }),
    ).toBeInTheDocument();
    fireEvent.click(pip);
    expect(pip).toHaveAttribute('aria-expanded', 'false');
  });
});
