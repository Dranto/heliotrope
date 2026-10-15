import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { exportSave, saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { withAllIntroduced } from '../game/introductions';
import { tick } from '../game/tick';
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

/** A new game whose mechanics are all introduced (§10.8), to test their screens directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));

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
    // The first building is named from the start, the next one is a silhouette.
    expect(screen.getByText('Héliotrope en pot')).toBeInTheDocument();
    expect(screen.getByLabelText('Encore à découvrir')).toHaveTextContent('100');
    for (let i = 0; i < 8; i++) fireEvent.click(flower());
    expect(
      screen.getByRole('button', { name: /acheter héliotrope en pot pour 15/i }),
    ).toBeDisabled();
    expect(screen.queryByText('Panneau de balcon')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Encore à découvrir')).toHaveTextContent('100');
  });

  it('shows the next goal, the time before a purchase, and buys with the keyboard (§10.5)', async () => {
    const store = renderApp();
    expect(screen.getByTestId('next-goal')).toHaveTextContent(/Prochain\s+: Héliotrope en pot/);
    for (let i = 0; i < 15; i++) fireEvent.click(flower());
    fireEvent.keyDown(document, { key: '1' });
    expect(store.getState().generators.pot).toBe(1);
    // The first click upgrade is now the cheapest thing out of reach.
    expect(screen.getByTestId('next-goal')).toHaveTextContent(/Mains tièdes\s*dans \d/);
    // Screen readers get the whole sentence as text: an aria-label on a plain span is ignored.
    expect(screen.getByText(/^Prochain objectif\s+: Mains tièdes, dans \d/)).toHaveClass(
      'visually-hidden',
    );
    expect(screen.getByTestId('next-goal')).not.toHaveAttribute('aria-label');
    // 0,1 Light per second: the second pot (17,25) is about 2 min 53 away.
    expect(
      screen.getByRole('button', { name: /acheter héliotrope en pot pour/i }),
    ).toHaveTextContent(/dans 2\s+min/);
    fireEvent.keyDown(document, { key: 'm' });
    expect(screen.getByRole('radio', { name: 'Max' })).toBeChecked();
    // No shortcut while a dialog is open.
    fireEvent.click(screen.getByRole('button', { name: /statistiques/i }));
    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'm' });
    expect(screen.getByRole('radio', { name: 'Max' })).toBeChecked();
  });

  it('grows the heliotrope from a sprout as Light is harvested', () => {
    renderApp();
    const panel = () => flower().closest('section')!;
    expect(panel()).toHaveAttribute('data-stage', '0');
    for (let i = 0; i < 100; i++) fireEvent.click(flower());
    expect(panel()).toHaveAttribute('data-stage', '1');
    // A hundred renders of the whole app: slow on a busy machine.
  }, 15_000);

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
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 400 }, totalLight: 400 });
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
    const base = openGame(0);
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
    const base = openGame(0);
    saveGame({ ...base, generators: { ...base.generators, balconyPanel: 1 } });
    renderApp(new GameStore(localStorage, () => 2 * 3600 * 1000));
    expect(screen.getByText(/pendant votre absence \(2 h\)/i)).toHaveTextContent(
      /récolté 7.\d{3} Lumière/,
    );
  });

  it('buys generators in bulk with the ×10 and Max amounts', () => {
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 400 }, totalLight: 400 });
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
    const base = openGame(0);
    saveGame({
      ...base,
      resources: { water: 0, light: 1_000 },
      totalLight: 2_000,
      generators: { ...base.generators, pot: 1 },
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    const gloves = screen.getByRole('button', { name: /^Gants de jardinage,/ });
    expect(gloves).toHaveAttribute('aria-pressed', 'true');
    // Each tile names its price and whether it is within reach, without relying on colour.
    expect(gloves).toHaveAccessibleName('Gants de jardinage, 100\u00a0Lumière, à portée');
    expect(gloves).toHaveAttribute('title', 'Gants de jardinage, 100\u00a0Lumière, à portée');
    // The open card wears the chosen tile's family: the click for the gloves, the pot here.
    const detail = () => document.querySelector('.upgrade-detail')!;
    expect(detail()).toHaveAttribute('data-family', 'click');
    fireEvent.click(screen.getByRole('button', { name: /^Terreau maison,/ }));
    expect(screen.getByText(/^Héliotrope en pot.: production ×2$/)).toBeInTheDocument();
    expect(detail()).toHaveAttribute('data-family', 'pot');
    expect(detail().querySelector('.detail-emblem')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(screen.getByRole('button', { name: /acheter terreau maison pour 150/i }));
    expect(store.getState().upgrades).toEqual(['pot.1']);
    expect(screen.queryByRole('button', { name: /^Terreau maison,/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /acheter gants de jardinage pour 100/i }));
    expect(screen.getByText(/de nouvelles améliorations apparaîtront/i)).toBeInTheDocument();
    // The gloves double the click: the next touch floats a +2 from the flower.
    fireEvent.click(screen.getByRole('button', { name: /récolter la lumière/i }));
    expect(screen.getByText('+2', { selector: '.floater' })).toBeInTheDocument();
  });

  it('imports a save from the options', () => {
    const store = renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    const dialog = screen.getByRole('dialog', { name: 'Options' });
    expect(dialog).toBeInTheDocument();
    const base = openGame(0);
    const save = exportSave({
      ...base,
      clicks: 3,
      resources: { water: 0, light: 42 },
      totalLight: 42,
    });
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

  it('starts a new Season after a confirmation, keeping the Seeds', async () => {
    const base = openGame(0);
    saveGame({
      ...base,
      resources: { water: 0, light: 1e9 },
      generators: { ...base.generators, arcology: 3 },
      upgrades: ['gloves'],
      totalLight: 8e7,
      allTimeLight: 8e7,
      clicks: 77,
      playSeconds: 600,
      seasonSeconds: 600,
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    // The Seeds grow before they are ripe: they are shown, but not harvested yet (§7).
    fireEvent.click(screen.getByRole('button', { name: 'Saisons' }));
    expect(await screen.findByRole('dialog', { name: 'Les Saisons' })).toBeInTheDocument();
    expect(screen.getByTestId('seeds-gain')).toHaveTextContent('+2');
    expect(screen.getByText('mûres dans 5 min')).toBeInTheDocument();
    expect(screen.getByText('Les Graines mûrissent : encore 5 min de Saison.')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Graines mûres à 66,7\u00a0%' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Fermer les Saisons/ }));
    act(() => store.dispatch((s) => ({ ...s, playSeconds: 900, seasonSeconds: 900 })));
    fireEvent.click(screen.getByRole('button', { name: 'Saisons, 2 Graines à gagner' }));
    expect(screen.getByText('Les Graines sont mûres.')).toBeInTheDocument();
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
      resources: { water: 0, light: 0 },
    });
    expect(store.getState().generators.arcology).toBe(0);
    expect(screen.getByText('La 2ᵉ Saison commence. La terre se souvient.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' })).toBeDisabled();
    expect(screen.getByTestId('seeds-chip')).toHaveTextContent('2');
    // The new Season is saved right away.
    expect(new GameStore(localStorage, () => 0).getState().seeds).toBe(2);
  });

  it('starts a challenge Season, shows its goal and lifts it once won (§7.3)', async () => {
    const base = openGame(0);
    saveGame({
      ...base,
      seeds: 10,
      seasons: 1,
      allTimeLight: 1e11,
      totalLight: 1e9,
      playSeconds: 3600,
      seasonSeconds: 3600,
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(screen.getByRole('button', { name: /^Saisons/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Les Saisons' });
    expect(dialog).toHaveTextContent('Saison à défi');
    fireEvent.click(screen.getByRole('radio', { name: /La Saison des nuages/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' }));
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la Saison des nuages' }));
    expect(store.getState().challenge).toBe('cloudy');
    expect(screen.getByTestId('challenge-chip')).toHaveTextContent('La Saison des nuages');
    fireEvent.click(screen.getByRole('button', { name: /Fermer les Saisons/ }));
    act(() => store.dispatch((s) => ({ ...s, totalLight: 2e9 })));
    act(() => store.dispatch((s) => tick(s, 0.1)));
    expect(store.getState()).toMatchObject({ challenge: null, challenges: ['cloudy'] });
    expect(screen.queryByTestId('challenge-chip')).not.toBeInTheDocument();
    expect(screen.getByText(/Défi réussi/)).toBeInTheDocument();
    expect(screen.getByText(/De retour dans le quartier.*Martin-pêcheur/)).toBeInTheDocument();
  });

  it('shows the Herbier, with the species back drawn on the map (§9.5)', async () => {
    const base = openGame(0);
    saveGame({ ...base, parcels: ['river'], species: ['frog'] });
    renderApp(new GameStore(localStorage, () => 0));
    expect(document.querySelector('.species [data-species="frog"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Herbier/ }));
    const dialog = await screen.findByRole('dialog', { name: 'L’Herbier' });
    expect(screen.getByTestId('herbier-summary')).toHaveTextContent('1 espèces revenues sur 32');
    expect(dialog.querySelector('[data-species="frog"]')).toHaveAttribute('data-found', 'true');
    expect(dialog.querySelector('[data-species="hedgehog"]')).toHaveTextContent(
      'Restaurer Parc du parking',
    );
    // One bead per species of the family, the frog's filled.
    const river = within(dialog).getByText('Gens de la rivière').closest('li')!;
    const beads = river.querySelectorAll('.family-beads i');
    expect(beads).toHaveLength(7);
    expect(river.querySelectorAll('.family-beads i[data-found="true"]')).toHaveLength(1);
  });

  it('shows Season and all-time statistics', async () => {
    const base = openGame(0);
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
    const dialog = await screen.findByRole('dialog', { name: 'Statistiques' });
    expect(dialog).toHaveTextContent('Cette Saison (2ᵉ Saison)');
    expect(screen.getByTestId('stat-season-light')).toHaveTextContent(/1.234/);
    expect(screen.getByTestId('stat-all-light')).toHaveTextContent('5,00 Md');
    expect(screen.getByTestId('stat-seasons')).toHaveTextContent('1');
    expect(dialog).toHaveTextContent(/3.h.05/);
    expect(dialog).toHaveTextContent(/1.min/);
    expect(dialog).toHaveTextContent(/\+50.%/);
  });

  it('lets the player catch the Golden Butterfly and tells what it brought', () => {
    const base = openGame(0);
    saveGame({
      ...base,
      resources: { water: 0, light: 20_000 },
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

  it('lists Milestones, with hidden ones as a question mark', async () => {
    const base = openGame(0);
    saveGame({ ...base, totalLight: 20_000, achievements: ['light.3', 'pot.1'] });
    renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(screen.getByRole('button', { name: /^Jalons/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Jalons' });
    expect(screen.getByTestId('achievements-summary')).toHaveTextContent(
      /^2 sur \d+ jalons, production \+2.%$/,
    );
    expect(dialog).toHaveTextContent('Première lueur');
    expect(dialog).toHaveTextContent('Jalon caché');
    expect(dialog).not.toHaveTextContent('Photosynthèse lente');
    // Families are reached by their headings, not as landmarks named like the main panels.
    expect(within(dialog).queryAllByRole('region')).toHaveLength(0);
    expect(within(dialog).getByRole('heading', { level: 3, name: /^Lumière/ })).toBeInTheDocument();
  });

  it('announces a Milestone when it is reached', () => {
    let now = 0;
    const store = renderApp(new GameStore(localStorage, () => now));
    now = 100;
    for (let i = 0; i < 100; i++) fireEvent.click(flower());
    act(() => store.step());
    expect(screen.getByText('Jalon atteint : Main tendue')).toBeInTheDocument();
  });

  it('switches to scientific notation from the options and keeps the choice', () => {
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 2e6 }, totalLight: 2e6 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.getByTestId('light')).toHaveTextContent('2,00 M');
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.click(screen.getByRole('radio', { name: /scientifique/i }));
    expect(screen.getByTestId('light')).toHaveTextContent('2,00e6');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Réduire les animations' }));
    expect(store.getState().settings).toMatchObject({
      notation: 'scientific',
      reducedMotion: true,
    });
    expect(new GameStore(localStorage, () => 0).getState().settings.notation).toBe('scientific');
    fireEvent.click(screen.getByRole('radio', { name: /suffixes courts/i }));
  });

  it('switches the whole interface to English from the options (§14 Q1)', async () => {
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 12_345 }, totalLight: 12_345 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.getByTestId('light')).toHaveTextContent('12 345');
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    expect(store.getState().settings.language).toBe('en');
    // English is fetched the first time it is chosen.
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Options' })).toHaveTextContent('Language'),
    );
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('button', { name: /harvest the heliotrope/i })).toBeInTheDocument();
    expect(screen.getByTestId('light')).toHaveTextContent('12,345');
    expect(screen.getByText('Potted heliotrope')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Français' }));
    expect(screen.getByText('Héliotrope en pot')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });

  it('sets the volume and mutes the sounds from the options', () => {
    const store = renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.change(screen.getByRole('slider', { name: /volume/i }), { target: { value: '20' } });
    expect(store.getState().settings.volume).toBe(0.2);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Couper le son' }));
    expect(store.getState().settings.muted).toBe(true);
    expect(screen.getByRole('slider', { name: /volume/i })).toBeDisabled();
    expect(new GameStore(localStorage, () => 0).getState().settings.muted).toBe(true);
  });

  it('restores a parcel from the panel under the map, and keeps it on the map', () => {
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 2_000 }, totalLight: 2_000 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.getByRole('heading', { name: 'Le quartier' })).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /restaurer rue jardin pour 1.500 lumière/i }),
    );
    expect(store.getState().parcels).toEqual(['gardenStreet']);
    expect(document.querySelector('[data-parcel="gardenStreet"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /restaurer rue jardin/i })).toBeNull();
  });

  it('carries out a neighbourhood project, which leaves its mark on the map', () => {
    const base = openGame(0);
    saveGame({
      ...base,
      resources: { water: 0, light: 300 },
      totalLight: 300,
      generators: { ...base.generators, pot: 5 },
    });
    const store = renderApp(new GameStore(localStorage, () => 0));
    fireEvent.click(
      screen.getByRole('button', { name: 'Lancer le projet Troc de graines pour 250 Lumière' }),
    );
    expect(store.getState().projects).toEqual(['seedSwap']);
    expect(document.querySelector('[data-project="seedSwap"]')).not.toBeNull();
  });

  it('outlines an offered parcel on the map and restores it from its pin', () => {
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 2_000 }, totalLight: 2_000 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    const offer = document.querySelector('[data-offer="gardenStreet"]')!;
    expect(offer).toHaveAttribute('data-ready', 'true');
    fireEvent.click(offer.querySelector('.pin')!);
    expect(store.getState().parcels).toEqual(['gardenStreet']);
  });

  it('sorts the side menu by layers and makes new panels glow until touched (M25)', () => {
    saveGame({ ...openGame(0), seasons: 2, seenPanels: ['generators'] });
    const store = renderApp();
    const layers = screen.getByRole('navigation', { name: 'Couches du menu' });
    expect(layers).toHaveTextContent('La villeLe vivant (nouveau)La région (nouveau)');
    const living = within(layers).getByRole('button', { name: /Le vivant/ });
    expect(living).toHaveAttribute('data-new', 'true');
    fireEvent.click(living);
    expect(living).toHaveAttribute('aria-current', 'page');
    expect(document.querySelector('.app')).toHaveAttribute('data-layer', 'living');
    const panels = document.querySelector('.side-panels')!;
    expect(panels.getAttribute('data-new')).toContain('garden');
    fireEvent.pointerDown(document.querySelector('.garden-panel h2')!);
    expect(store.getState().seenPanels).toContain('garden');
    expect(panels.getAttribute('data-new')).not.toContain('garden');
  });

  it('asks for a path when a building grows, and crowns it on the map (§5.5, M26)', () => {
    const fresh = openGame(0);
    saveGame({ ...fresh, generators: { ...fresh.generators, pot: 50 } });
    const store = renderApp();
    const forms = screen.getByRole('group', { name: 'Formes\u00a0: Héliotrope en pot' });
    const fork = within(forms).getByRole('group', { name: /Jardinière fleurie/ });
    fireEvent.click(within(fork).getByRole('button', { name: /Le clic rapporte \+0,25/ }));
    expect(store.getState().growth.paths.pot[0]).toBe(0);
    expect(document.querySelector('[data-growth="pot"] .growth-wreath')).toHaveAttribute(
      'data-path',
      'a',
    );
  });

  it('fills the pollen gauge with the clicks and sends a flight across the map (§5.6, M27)', () => {
    const fresh = openGame(0);
    // No gauge before the first click upgrade (§10.8).
    saveGame(fresh);
    renderApp();
    expect(screen.queryByRole('meter')).toBeNull();
    cleanup();
    saveGame({ ...fresh, upgrades: ['warmHands'], pollen: { gauge: 0.99, flights: 0 } });
    renderApp();
    expect(
      screen.getByRole('meter', { name: 'Jauge de pollen\u00a0: 99\u00a0%' }),
    ).toBeInTheDocument();
    expect(document.querySelector('.pollen-wave')).toBeNull();
    fireEvent.click(flower());
    fireEvent.click(flower());
    // The gauge starts again from almost nothing (faster at the start of a Season, §5.7).
    expect(Number(screen.getByRole('meter').getAttribute('aria-valuenow'))).toBeLessThan(5);
    expect(flower().closest('section')).toHaveAttribute('data-flight', 'true');
    expect(document.querySelector('.pollen-wave')).not.toBeNull();
  });

  it('shows the neighbours’ requests, serves one and plays its hand (§9.11, M29)', () => {
    const fresh = openGame(0);
    saveGame({
      ...fresh,
      seasons: 1,
      garden: { ...fresh.garden, harvests: 3 },
      requests: {
        ...fresh.requests,
        open: [{ need: { kind: 'harvests', count: 3 }, base: 0, hand: 'bloom', from: 'tanneries' }],
      },
    });
    const store = renderApp();
    const panel = document.querySelector('.requests-panel') as HTMLElement;
    expect(panel).toHaveTextContent('3 récoltes du potager');
    expect(document.querySelector('.request-bubble[data-met]')).not.toBeNull();
    fireEvent.click(
      within(panel).getByRole('button', {
        name: 'Rendre service\u00a0: 3\u00a0récoltes du potager',
      }),
    );
    expect(store.getState().requests.hands).toEqual(['bloom']);
    expect(panel).toHaveTextContent('+1 %');
    fireEvent.click(within(panel).getByRole('button', { name: 'Lancer\u00a0: Une Floraison' }));
    expect(store.getState().effects.some((e) => e.kind === 'bloom')).toBe(true);
  });

  it('offers a tab bar for small screens (§10.3)', () => {
    renderApp();
    const tabs = screen.getByRole('navigation', { name: 'Sections du jeu' });
    expect(tabs).toHaveTextContent('BâtirAméliorerPlus');
    fireEvent.click(within(tabs).getByRole('button', { name: 'Améliorer' }));
    expect(within(tabs).getByRole('button', { name: 'Améliorer' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps the flower in the map, with no text under it', () => {
    renderApp();
    const map = document.querySelector('.scene-map')!;
    expect(
      within(map as HTMLElement).getByRole('button', { name: /récolter la lumière/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/touchez la fleur/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/par clic/i)).not.toBeInTheDocument();
  });

  it('switches between the map views opened so far (§6)', () => {
    const base = openGame(0);
    saveGame({ ...base, totalLight: 2e4, generators: { ...base.generators, pot: 3 } });
    renderApp(new GameStore(localStorage, () => 0));
    const views = screen.getByRole('radiogroup', { name: 'Vue de la carte' });
    expect(
      within(views)
        .getAllByRole('radio')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Le Balcon', 'Le Quartier']);
    expect(within(views).getByRole('radio', { name: 'Le Quartier' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(within(views).getByRole('radio', { name: 'Le Balcon' }));
    expect(within(views).getByRole('radio', { name: 'Le Balcon' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(localStorage.getItem('heliotrope.layout.view')).toBe('1');
  });

  it('folds a panel away and the side menu with it (§10.1)', () => {
    const base = openGame(0);
    saveGame({ ...base, resources: { water: 0, light: 50 }, totalLight: 50 });
    renderApp(new GameStore(localStorage, () => 0));
    const title = screen.getByRole('button', { name: 'Bâtir', expanded: true });
    fireEvent.click(title);
    expect(title).toHaveAttribute('aria-expanded', 'false');
    expect(title.closest('.panel')).toHaveAttribute('data-open', 'false');
    const side = screen.getByRole('button', { name: /replier les menus/i });
    fireEvent.click(side);
    expect(side).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.app')).toHaveAttribute('data-side', 'closed');
  });

  it('spends Seeds in the Tree of Seasons and brings in a cooperative (§7.1, §7.2)', async () => {
    const base = openGame(0);
    saveGame({ ...base, seeds: 3, seasons: 1, allTimeLight: 2e8 });
    const store = renderApp(new GameStore(localStorage, () => 0));
    expect(screen.queryByRole('region', { name: 'Coopératives' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Arbre des Saisons, 3 Graines à semer' }));
    const tree = await screen.findByRole('dialog', { name: 'L’Arbre des Saisons' });
    expect(screen.getByTestId('seeds-available')).toHaveTextContent('3');
    fireEvent.click(screen.getByRole('button', { name: 'Les jardiniers, à semer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apprendre Les jardiniers pour 1 Graine' }));
    expect(store.getState().talents).toEqual(['gardenersCoop']);
    expect(store.getState().seeds).toBe(3);
    expect(screen.getByTestId('seeds-available')).toHaveTextContent('2');
    // Its children open: the roofers cost 2 Seeds, still affordable.
    expect(screen.getByRole('button', { name: 'Les maraîchers, à semer' })).toBeInTheDocument();
    expect(tree.querySelector('.tree-node.fresh')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer l’Arbre des Saisons' }));

    const panel = screen.getByRole('region', { name: 'Coopératives' });
    const toggle = screen.getByRole('switch', { name: 'Les jardiniers en marche' });
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(store.getState().cooperatives.paused).toEqual(['gardeners']);
    expect(panel.querySelector('[data-cooperative="gardeners"]')).toHaveAttribute(
      'data-working',
      'false',
    );
    fireEvent.click(screen.getByLabelText(/Garder une réserve/));
    expect(store.getState().cooperatives.thrifty).toBe(true);
    // The bike waits on the map while its cooperative is paused.
    expect(document.querySelector('.coop-bike[data-cooperative="gardeners"]')).toHaveAttribute(
      'data-working',
      'false',
    );
  });
  it('gathers Water in the Bioregion, raises a site and opens the Water Cycle (§7.4)', async () => {
    saveGame({
      ...openGame(0),
      seasons: 2,
      seeds: 10,
      totalLight: 2e7,
      allTimeLight: 2e9,
      resources: { light: 2e6, water: 0 },
      allTimeWater: 5e5,
    });
    const store = renderApp();
    const panel = screen.getByRole('region', { name: 'La Biorégion' });
    fireEvent.click(within(panel).getByRole('button', { name: /bâtir citernes de toit/i }));
    expect(store.getState().collectors.roofTanks).toBe(1);
    expect(screen.getByTestId('water-chip')).toHaveTextContent('0');
    act(() => store.dispatch((s) => tick(s, 60)));
    expect(store.getState().resources.water).toBeCloseTo(60);
    fireEvent.click(within(panel).getByRole('button', { name: /étendre zones humides/i }));
    expect(store.getState().sites.wetlands).toBe(1);
    // The land of the Bioregion is on the map, with its first wetland.
    expect(screen.getByRole('radio', { name: 'La Biorégion' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-site="wetlands"] .marsh').length).toBeGreaterThan(0);
    // One Source is already in reach.
    fireEvent.click(screen.getByRole('button', { name: /Cycle de l’eau, 1 Sources à gagner/ }));
    expect(await screen.findByTestId('sources-gain')).toHaveTextContent('+1');
    expect(screen.getByText('La rivière n’est pas encore prête')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer un nouveau Cycle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui, recommencer le Cycle' }));
    expect(store.getState().sources).toBe(1);
    expect(store.getState().collectors.roofTanks).toBe(0);
    expect(screen.getByTestId('sources-chip')).toHaveTextContent('1');
  });
});

describe('the phone tab bar', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    window.scrollY = 0;
  });

  it('opens a tab picked from far down at its first panel, not mid-page', () => {
    renderApp();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    // Scrolled 2000 px down the "Bâtir" panels, which start 500 px into the page.
    window.scrollY = 2000;
    vi.spyOn(document.getElementById('side-panels')!, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, -1500, 390, 3000),
    );
    const tabs = within(screen.getByRole('navigation', { name: 'Sections du jeu' }));
    fireEvent.click(tabs.getByRole('button', { name: 'Bâtir' }));
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.click(tabs.getByRole('button', { name: /Améliorer/ }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 488 });
  });

  it('leaves the page where it is when the panels are already in view', () => {
    renderApp();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    window.scrollY = 200;
    vi.spyOn(document.getElementById('side-panels')!, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 300, 390, 3000),
    );
    const tabs = within(screen.getByRole('navigation', { name: 'Sections du jeu' }));
    fireEvent.click(tabs.getByRole('button', { name: /Améliorer/ }));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('puts the screen tiles of the "Plus" tab in the main landmark', () => {
    // Every media query matches, so the screen reads as a phone.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    try {
      renderApp();
      const menu = screen.getByRole('navigation', { name: 'Menu' });
      expect(menu.closest('header')).not.toBeNull();
      const tabs = within(screen.getByRole('navigation', { name: 'Sections du jeu' }));
      fireEvent.click(tabs.getByRole('button', { name: 'Plus' }));
      const moved = screen.getByRole('navigation', { name: 'Menu' });
      expect(moved.closest('main')).not.toBeNull();
      expect(within(moved).getByRole('button', { name: /Options/ })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
