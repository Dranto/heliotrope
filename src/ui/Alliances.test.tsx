import { render, within } from '@testing-library/react';
import { ALLIANCE_IDS, isAwake } from '../game/alliances';
import { withAllIntroduced } from '../game/introductions';
import { saveGame } from '../game/save';
import { createInitialState, type GameState } from '../game/state';
import { GameStore } from '../game/store';
import { Alliances } from './Alliances';
import { GameStoreContext } from './useGame';

/** A player after a first Cycle, whose orchard bees and deep roots are awake. */
function grown(): GameState {
  const fresh = withAllIntroduced(createInitialState(0));
  return {
    ...fresh,
    seasons: 3,
    cycles: 1,
    orchard: { ...fresh.orchard, hives: 1 },
    species: ['bee', 'bumblebee', 'ladybird'],
    canopy: { ...fresh.canopy, levels: { ...fresh.canopy.levels, sower: 10 } },
    delta: { ...fresh.delta, widths: { ...fresh.delta.widths, seedArm: 1 } },
  };
}

describe('the alliances panel', () => {
  beforeEach(() => localStorage.clear());

  it('shows the alliances awake and folds those still asleep', () => {
    saveGame(grown());
    const store = new GameStore(localStorage, () => 0);
    const state = store.getState();
    render(
      <GameStoreContext.Provider value={store}>
        <Alliances />
      </GameStoreContext.Provider>,
    );
    const awake = ALLIANCE_IDS.filter((id) => isAwake(state, id));
    expect(awake.length).toBeGreaterThan(0);
    const folded = document.querySelector('details.alliances-asleep');
    expect(folded).not.toBeNull();
    expect(folded).not.toHaveAttribute('open');
    expect(
      within(folded as HTMLElement).getByText(
        `Alliances endormies (${ALLIANCE_IDS.length - awake.length})`,
      ),
    ).toBeInTheDocument();
    const shown = document.querySelectorAll('.alliances-panel > .alliances-list > li');
    expect([...shown].map((li) => li.getAttribute('data-alliance'))).toEqual(awake);
    // An asleep alliance can still be chosen once its fold is opened.
    expect(
      within(folded as HTMLElement).getAllByRole('button', { name: /^Choisir/, hidden: true }),
    ).toHaveLength(ALLIANCE_IDS.length - awake.length);
    const list = document.querySelector('.alliances-panel > .alliances-list') as HTMLElement;
    expect(within(list).getAllByRole('button', { name: /^Choisir/ })).toHaveLength(awake.length);
  });
});
