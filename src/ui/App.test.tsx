import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('grows the heliotrope from a sprout as Light is harvested', () => {
    renderApp();
    const panel = () => flower().closest('section')!;
    expect(panel()).toHaveAttribute('data-stage', '0');
    for (let i = 0; i < 100; i++) fireEvent.click(flower());
    expect(panel()).toHaveAttribute('data-stage', '1');
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

  it('builds each purchase on the neighbourhood map, with an entrance', () => {
    const base = createInitialState(0);
    saveGame({ ...base, resources: { light: 400 }, totalLight: 400 });
    const { container } = render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const pots = () => container.querySelectorAll('[data-generator="pot"] .pot');
    expect(pots()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /acheter héliotrope en pot pour 15/i }));
    expect(pots()).toHaveLength(1);
    expect(container.querySelectorAll('[data-generator="pot"] .appear-ring')).toHaveLength(1);
  });

  it('draws what the player already owns without replaying the entrance', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, pot: 3, balconyPanel: 2 } });
    const { container } = render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    expect(container.querySelectorAll('[data-generator="pot"] .pot')).toHaveLength(3);
    expect(container.querySelectorAll('[data-generator="balconyPanel"] rect')).toHaveLength(2);
    expect(container.querySelector('.appear-ring')).toBeNull();
  });

  it('welcomes the player back with the Light produced offline', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, balconyPanel: 1 } });
    renderApp(new GameStore(localStorage, () => 2 * 3600 * 1000));
    expect(screen.getByText(/pendant votre absence \(2 h\)/i)).toHaveTextContent(
      /récolté 7.\d{3} Lumière/,
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

  it('hides the Seasons until a Seed can be gained', () => {
    renderApp();
    expect(screen.queryByRole('button', { name: /saisons/i })).not.toBeInTheDocument();
  });

  it('starts a new Season after a confirmation, keeping the Seeds', () => {
    const base = createInitialState(0);
    saveGame({
      ...base,
      resources: { light: 1e9 },
      generators: { ...base.generators, arcology: 3 },
      upgrades: ['gloves'],
      totalLight: 8e7,
      allTimeLight: 8e7,
      clicks: 77,
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(screen.getByRole('button', { name: 'Saisons, 2 Graines à gagner' }));
    expect(screen.getByRole('dialog', { name: 'Les Saisons' })).toBeInTheDocument();
    expect(screen.getByTestId('seeds-owned')).toHaveTextContent('0');
    expect(screen.getByTestId('seeds-gain')).toHaveTextContent('+2');
    expect(screen.getByTestId('seeds-bonus')).toHaveTextContent(/\+0.% → \+10.%/);
    // Before 10 Seeds the first Season is advised against, but not blocked.
    expect(screen.getByText('La terre n’est pas encore prête')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pas encore' }));
    expect(store.getState().seeds).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' }));
    expect(screen.getByText(/récolter 2 Graines/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Oui, replanter' }));
    expect(store.getState()).toMatchObject({
      seeds: 2,
      seasons: 1,
      clicks: 77,
      upgrades: [],
      totalLight: 0,
      resources: { light: 0 },
    });
    expect(store.getState().generators.arcology).toBe(0);
    expect(screen.getByText('La 2ᵉ Saison commence. La terre se souvient.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' })).toBeDisabled();
    expect(screen.getByTestId('seeds-chip')).toHaveTextContent('2');
    // The new Season is saved right away.
    expect(new GameStore(localStorage, () => 0).getState().seeds).toBe(2);
  });

  it('shows Season and all-time statistics', () => {
    const base = createInitialState(0);
    saveGame({
      ...base,
      totalLight: 1234,
      allTimeLight: 5e9,
      seeds: 10,
      seasons: 1,
      clicks: 12,
      playSeconds: 3 * 3600 + 5 * 60,
      seasonSeconds: 90,
    });
    renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(screen.getByRole('button', { name: 'Statistiques' }));
    const dialog = screen.getByRole('dialog', { name: 'Statistiques' });
    expect(dialog).toHaveTextContent('Cette Saison (2ᵉ Saison)');
    expect(screen.getByTestId('stat-season-light')).toHaveTextContent(/1.234/);
    expect(screen.getByTestId('stat-all-light')).toHaveTextContent('5,00 Md');
    expect(screen.getByTestId('stat-seasons')).toHaveTextContent('1');
    expect(dialog).toHaveTextContent(/3.h.05/);
    expect(dialog).toHaveTextContent(/1.min/);
    expect(dialog).toHaveTextContent(/\+50.%/);
  });

  it('lets the player catch the Golden Butterfly and tells what it brought', () => {
    const base = createInitialState(0);
    saveGame({
      ...base,
      resources: { light: 20_000 },
      totalLight: 20_000,
      allTimeLight: 20_000,
      generators: { ...base.generators, balconyPanel: 10 },
      butterfly: { nextIn: 0, visible: 8 },
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.getByText('Un Papillon doré traverse le quartier.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Attraper le Papillon doré' }));
    expect(store.getState().butterflies).toBe(1);
    expect(screen.queryByRole('button', { name: 'Attraper le Papillon doré' })).toBeNull();
    expect(
      screen.getByText(/^(Floraison|Récolte|Pollinisation) !/, { selector: '.toast' }),
    ).toBeInTheDocument();
  });

  it('lists Milestones, with hidden ones as a question mark', () => {
    const base = createInitialState(0);
    saveGame({ ...base, totalLight: 20_000, achievements: ['light.3', 'pot.1'] });
    renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(screen.getByRole('button', { name: /^Jalons/ }));
    const dialog = screen.getByRole('dialog', { name: 'Jalons' });
    expect(screen.getByTestId('achievements-summary')).toHaveTextContent(
      /^2 sur \d+ jalons, production \+2.%$/,
    );
    expect(dialog).toHaveTextContent('Première lueur');
    expect(dialog).toHaveTextContent('Jalon caché');
    expect(dialog).not.toHaveTextContent('Photosynthèse lente');
  });

  it('announces a Milestone when it is reached', () => {
    let now = 0;
    const store = renderApp(new GameStore(localStorage, () => now));
    now = 100;
    for (let i = 0; i < 100; i++) fireEvent.click(flower());
    act(() => store.step());
    expect(screen.getByText('Jalon atteint : Main tendue')).toBeInTheDocument();
  });

  it('writes the neighbourhood journal as the game goes', () => {
    let now = 0;
    const store = renderApp(new GameStore(localStorage, () => now));
    now = 100;
    expect(screen.getByText('Le carnet est encore vierge. Touchez la fleur.')).toBeInTheDocument();
    fireEvent.click(flower());
    act(() => store.step());
    expect(screen.getByText(/l’héliotrope s’est tournée vers nous/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /journal du quartier/i }));
    expect(screen.getByRole('dialog', { name: 'Journal du quartier' })).toBeInTheDocument();
  });

  it('switches to scientific notation from the options and keeps the choice', () => {
    const base = createInitialState(0);
    saveGame({ ...base, resources: { light: 2e6 }, totalLight: 2e6 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.getByTestId('light')).toHaveTextContent('2,00 M');
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.click(screen.getByRole('radio', { name: /scientifique/i }));
    expect(screen.getByTestId('light')).toHaveTextContent('2,00e6');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Réduire les animations' }));
    expect(store.getState().settings).toEqual({ notation: 'scientific', reducedMotion: true });
    expect(new GameStore(localStorage, () => 0).getState().settings.notation).toBe('scientific');
    fireEvent.click(screen.getByRole('radio', { name: /suffixes courts/i }));
  });

  it('offers a tab bar for small screens (§10.3)', () => {
    renderApp();
    const tabs = screen.getByRole('navigation', { name: 'Sections du jeu' });
    expect(tabs).toHaveTextContent('RécolteBâtirAméliorerPlus');
    fireEvent.click(screen.getByRole('button', { name: 'Bâtir' }));
    expect(screen.getByRole('button', { name: 'Bâtir' })).toHaveAttribute('aria-current', 'page');
  });
});
