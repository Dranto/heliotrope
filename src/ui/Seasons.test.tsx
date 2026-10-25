import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
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

  it('marks each seed tile with its own hidden line icon, keeping the label as its name', () => {
    saveGame(createInitialState(0));
    renderSeasons();
    const tiles = [...document.querySelectorAll<HTMLElement>('.seed-tile')];
    expect(tiles.map((tile) => tile.dataset.kind)).toEqual(['owned', 'gain', 'bonus']);
    for (const tile of tiles) {
      const icon = tile.querySelector('dt > svg.seed-tile-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.getByText('À récolter').tagName).toBe('DT');
  });

  it('keeps the start button pinned at the foot of the dialog, a screen below the fold before', () => {
    saveGame(createInitialState(0));
    renderSeasons();
    const start = screen.getByRole('button', { name: 'Commencer une nouvelle Saison' });
    const foot = start.closest('.prestige-actions')!;
    expect(foot).not.toBeNull();
    expect(foot.parentElement).toBe(screen.getByRole('dialog'));
    expect(foot.nextElementSibling).toBeNull();
    // A file name in a variable: Vite would turn a literal one into an asset address.
    const file = './App.css';
    const css = readFileSync(new URL(file, import.meta.url), 'utf8');
    const rule = /^\.prestige-actions \{([^}]*)\}/m.exec(css)![1]!;
    expect(rule).toMatch(/position: sticky;/);
    expect(rule).toMatch(/bottom: -1\.5rem;/);
  });

  it('keeps a blocked start button tappable and says why on a tap', () => {
    saveGame(createInitialState(0));
    renderSeasons();
    const button = screen.getByRole('button', { name: 'Commencer une nouvelle Saison' });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button);
    expect(screen.getByRole('status')).toHaveTextContent(/au moins une Graine/);
    expect(screen.queryByRole('button', { name: 'Oui, replanter' })).not.toBeInTheDocument();
  });

  it('says how long the Seeds still ripen when the start button is tapped too early', () => {
    saveGame({ ...createInitialState(0), allTimeLight: 1e15, seasonSeconds: 60 });
    renderSeasons();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer une nouvelle Saison' }));
    expect(screen.getByRole('status')).toHaveTextContent(/Les Graines mûrissent/);
  });
});
