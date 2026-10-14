// docs/performance-plan.md, lot 3: the map rests while a screen covers it.
import { fireEvent, render, screen } from '@testing-library/react';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

describe('map pause', () => {
  beforeEach(() => localStorage.clear());

  it('pauses the map while a screen is open, and wakes it when closed', () => {
    const { container } = render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const app = container.querySelector('.app')!;
    expect(app).not.toHaveAttribute('data-map-paused');
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    expect(app).toHaveAttribute('data-map-paused');
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    expect(app).not.toHaveAttribute('data-map-paused');
  });
});
