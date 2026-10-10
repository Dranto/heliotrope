import { fireEvent, render, screen } from '@testing-library/react';
import { exportSave, saveGame } from '../game/save';
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

  it('buys generators in bulk with the ×10 and Max amounts', () => {
    const base = createInitialState(0);
    saveGame({ ...base, resources: { light: 400 }, totalLight: 400 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(screen.getByRole('radio', { name: '×10' }));
    // 10 pots from 0: 15 × (1.15^10 − 1) / 0.15 ≈ 304,6
    fireEvent.click(screen.getByRole('button', { name: /acheter 10 héliotrope en pot pour 305/i }));
    expect(store.getState().generators.pot).toBe(10);
    fireEvent.click(screen.getByRole('radio', { name: 'Max' }));
    expect(
      screen.getByRole('button', { name: /acheter panneau de balcon pour 100/i }),
    ).toBeDisabled();
  });

  it('shows unlocked upgrades and buys the selected one', () => {
    const base = createInitialState(0);
    saveGame({
      ...base,
      resources: { light: 1_000 },
      totalLight: 2_000,
      generators: { ...base.generators, pot: 1 },
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.getByRole('button', { name: 'Gants de jardinage' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Terreau maison' }));
    expect(screen.getByText(/^Héliotrope en pot.: production ×2$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /acheter terreau maison pour 150/i }));
    expect(store.getState().upgrades).toEqual(['pot.1']);
    expect(screen.queryByRole('button', { name: 'Terreau maison' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /acheter gants de jardinage pour 100/i }));
    expect(screen.getByText(/de nouvelles améliorations apparaîtront/i)).toBeInTheDocument();
    expect(screen.getByText('+2', { selector: 'strong' })).toBeInTheDocument();
  });

  it('imports a save from the options', () => {
    const store = renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    const dialog = screen.getByRole('dialog', { name: 'Options' });
    expect(dialog).toBeInTheDocument();
    const base = createInitialState(0);
    const save = exportSave({ ...base, clicks: 3, resources: { light: 42 }, totalLight: 42 });
    fireEvent.change(screen.getByLabelText('Sauvegarde à importer'), { target: { value: 'oops' } });
    fireEvent.click(screen.getByRole('button', { name: 'Charger cette sauvegarde' }));
    expect(screen.getByText('Ce texte n’est pas une sauvegarde valide.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sauvegarde à importer'), { target: { value: save } });
    fireEvent.click(screen.getByRole('button', { name: 'Charger cette sauvegarde' }));
    expect(store.getState().clicks).toBe(3);
    expect(screen.getByTestId('light')).toHaveTextContent('42');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resets the game only after a double confirmation', () => {
    const store = renderApp();
    for (let i = 0; i < 5; i++) fireEvent.click(flower());
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(store.getState().clicks).toBe(5);
    fireEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, continuer' }));
    expect(store.getState().clicks).toBe(5);
    fireEvent.click(screen.getByRole('button', { name: /dernière confirmation/i }));
    expect(store.getState().clicks).toBe(0);
    expect(screen.getByText('La partie a été remise à zéro.')).toBeInTheDocument();
  });
});
