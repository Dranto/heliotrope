import { fireEvent, render, screen } from '@testing-library/react';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

function renderApp(store = new GameStore(localStorage, () => 0)) {
  render(
    <GameStoreContext.Provider value={store}>
      <App />
    </GameStoreContext.Provider>,
  );
  return store;
}

const flower = () => screen.getByRole('button', { name: /récolter la lumière/i });

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('harvests Light when the heliotrope is clicked', () => {
    renderApp();
    expect(screen.getByTestId('light')).toHaveTextContent('0');
    fireEvent.click(flower());
    expect(screen.getByTestId('light')).toHaveTextContent('1');
  });

  it('reveals generators one at a time, the next one as a priced silhouette', () => {
    renderApp();
    expect(screen.queryByText('Héliotrope en pot')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Encore à découvrir')).toHaveTextContent('15');
    for (let i = 0; i < 8; i++) fireEvent.click(flower());
    expect(screen.getByText('Héliotrope en pot')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /acheter héliotrope en pot pour 15/i }),
    ).toBeDisabled();
    expect(screen.queryByText('Panneau de balcon')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Encore à découvrir')).toHaveTextContent('100');
  });

  it('buys a generator once affordable and starts producing', () => {
    const store = renderApp();
    for (let i = 0; i < 15; i++) fireEvent.click(flower());
    const buy = screen.getByRole('button', { name: /acheter héliotrope en pot pour 15/i });
    expect(buy).toBeEnabled();
    fireEvent.click(buy);
    expect(store.getState().generators.pot).toBe(1);
    expect(screen.getByTestId('owned-pot')).toHaveTextContent('1');
    expect(screen.getByTestId('light')).toHaveTextContent('0');
    expect(screen.getByTestId('light-rate')).toHaveTextContent('+0,1');
    expect(screen.getByRole('button', { name: /pour 18 lumière/i })).toBeDisabled();
  });

  it('welcomes the player back with the Light produced offline', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, balconyPanel: 1 } });
    renderApp(new GameStore(localStorage, () => 2 * 3600 * 1000));
    expect(screen.getByText(/pendant votre absence \(2 h\)/i)).toHaveTextContent(
      /récolté 7.200 Lumière/,
    );
  });
});
