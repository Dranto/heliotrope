import { render, screen } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Seasons } from './Seasons';
import { GameStoreContext } from './useGame';

function renderSeasons() {
  render(
    <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
      <Seasons onClose={() => {}} onOpenTree={() => {}} />
    </GameStoreContext.Provider>,
  );
}

describe('Seasons', () => {
  beforeEach(() => localStorage.clear());

  it('says how long the production takes to grow the next Seed', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, pot: 10 } });
    renderSeasons();
    expect(
      screen.getByText(/Prochaine Graine dans .+ Lumière, environ .+ de production\./),
    ).toBeInTheDocument();
  });

  it('gives no time while nothing is produced', () => {
    saveGame(createInitialState(0));
    renderSeasons();
    expect(screen.getByText(/Prochaine Graine dans .+ Lumière\./)).not.toHaveTextContent('environ');
  });
});
