import { fireEvent, render, screen } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Cycles } from './Cycles';
import { GameStoreContext } from './useGame';

describe('Cycles', () => {
  beforeEach(() => localStorage.clear());

  it('keeps a blocked start button tappable, described by why, and stresses that line on a tap', () => {
    saveGame(createInitialState(0));
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <Cycles onClose={() => {}} />
      </GameStoreContext.Provider>,
    );
    const button = screen.getByRole('button', { name: 'Commencer un nouveau Cycle' });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAccessibleDescription(/au moins une Source/);
    const reason = screen.getByText(/au moins une Source/);
    expect(reason).not.toHaveAttribute('data-stressed');
    fireEvent.click(button);
    expect(reason).toHaveAttribute('data-stressed');
    expect(screen.getAllByText(/au moins une Source/)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Oui, recommencer le Cycle' })).toBeNull();
  });
});
