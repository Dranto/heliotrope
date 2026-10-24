import { fireEvent, render, screen } from '@testing-library/react';
import { withAllIntroduced } from '../game/introductions';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { DecorToolbar } from './MapTools';
import { GameStoreContext } from './useGame';

describe('DecorToolbar', () => {
  beforeEach(() => localStorage.clear());

  it('tells how to win a locked colour when it is tapped, and keeps the colour', () => {
    saveGame(withAllIntroduced(createInitialState(0)));
    const store = new GameStore(localStorage, () => 0);
    render(
      <GameStoreContext.Provider value={store}>
        <DecorToolbar onDone={() => {}} />
      </GameStoreContext.Provider>,
    );
    const blue = screen.getByRole('radio', { name: 'Bleu' });
    expect(blue.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(blue);
    expect(document.querySelector('.colour-to-win')?.textContent).toBe(
      'Bleu \u00e0 gagner\u00a0: 12 esp\u00e8ces de l\u2019Herbier',
    );
    expect(store.getState().decor.flower).toBe('lilac');
    fireEvent.click(screen.getByRole('radio', { name: 'Lilas' }));
    expect(document.querySelector('.colour-to-win')?.textContent).toBe('');
  });
});
