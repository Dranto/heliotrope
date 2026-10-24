import { fireEvent, render, screen } from '@testing-library/react';
import { withAllIntroduced } from '../game/introductions';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Generators } from './Generators';
import { GameStoreContext } from './useGame';

function renderGenerators() {
  render(
    <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
      <Generators />
    </GameStoreContext.Provider>,
  );
}

describe('Generators growth pips', () => {
  beforeEach(() => localStorage.clear());

  it('opens and closes the two paths of a form from its pip', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, pot: 60 } });
    renderGenerators();
    const pip = screen.getByRole('button', { name: 'Mur de pots, dès 100' });
    expect(pip).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(pip);
    expect(pip).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('group', { name: 'Mur de pots : choisir une voie' }),
    ).toBeInTheDocument();
    fireEvent.click(pip);
    expect(pip).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('the weather mark on a building', () => {
  beforeEach(() => localStorage.clear());

  it('writes out what the weather does when tapped, since a phone shows no tooltip', () => {
    const base = withAllIntroduced(createInitialState(0));
    saveGame({ ...base, seasons: 1, generators: { ...base.generators, pot: 60 } });
    renderGenerators();
    const sky = screen.getByRole('button', { name: /les voies de ce bâtiment jouent/ });
    expect(sky).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.growth-sky-note')).toBeNull();
    fireEvent.click(sky);
    expect(sky).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.growth-sky-note')?.textContent).toBe(
      sky.getAttribute('aria-label'),
    );
    fireEvent.click(sky);
    expect(document.querySelector('.growth-sky-note')).toBeNull();
  });
});

describe('the time before a building is affordable', () => {
  beforeEach(() => localStorage.clear());

  it('describes the buy button without being re-read as it ticks', () => {
    const base = createInitialState(0);
    saveGame({ ...base, generators: { ...base.generators, pot: 1 } });
    renderGenerators();
    const buy = screen.getByRole('button', { name: /^Acheter Héliotrope en pot pour/ });
    expect(buy).toHaveAccessibleDescription(/^dans \d/);
    const eta = document.getElementById(buy.getAttribute('aria-describedby')!)!;
    expect(eta).toHaveClass('buy-eta');
    expect(eta).toHaveAttribute('aria-hidden', 'true');
  });
});
