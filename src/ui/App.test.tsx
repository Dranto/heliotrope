import { fireEvent, render, screen } from '@testing-library/react';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('gathers sunlight on click', () => {
    const store = new GameStore(localStorage, () => 0);
    render(
      <GameStoreContext.Provider value={store}>
        <App />
      </GameStoreContext.Provider>,
    );
    expect(screen.getByTestId('amount-sunlight')).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: /gather sunlight/i }));
    expect(screen.getByTestId('amount-sunlight')).toHaveTextContent('1');
  });
});
