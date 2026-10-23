import { render, screen } from '@testing-library/react';
import { withAllIntroduced } from '../game/introductions';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Restoration } from './Restoration';
import { GameStoreContext } from './useGame';

function renderRestoration() {
  render(
    <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
      <Restoration onHighlight={() => {}} />
    </GameStoreContext.Provider>,
  );
}

describe('Restoration', () => {
  beforeEach(() => localStorage.clear());

  it('writes out what the other future of a restored parcel would give', () => {
    saveGame({ ...createInitialState(0), parcels: ['river'] });
    renderRestoration();
    const group = screen.getByRole('radiogroup', { name: /Avenir de Rivière retrouvée/ });
    expect(group).toBeInTheDocument();
    expect(document.querySelector('.future-other')?.textContent).toMatch(
      /^Ou Rivière baignade\s: /,
    );
  });

  it('marks the cards of parcels with two futures, so their button can sit under the text', () => {
    saveGame({ ...withAllIntroduced(createInitialState(0)), totalLight: 750 });
    renderRestoration();
    const button = screen.getByRole('button', { name: /Rue jardin/ });
    const card = button.closest('.restoration-card');
    expect(card).toHaveAttribute('data-futures', 'true');
    expect(card?.querySelector('[role="radiogroup"]')).not.toBeNull();
  });

  it('reads each progress dot as a restored plot by name or a plot still to restore', () => {
    saveGame({ ...createInitialState(0), parcels: ['park', 'pollinatorStrip'] });
    renderRestoration();
    const dots = screen.getByRole('list', { name: 'Parcelles à restaurer' });
    const items = [...dots.querySelectorAll('li')].map((li) => li.textContent);
    // "Parc du parking restaurée" did not agree with masculine and plural names.
    expect(items).toContain('Parcelle restaurée\u00a0: Parc du parking');
    expect(items).toContain('Parcelle restaurée\u00a0: Corridor des pollinisateurs');
    expect(items.filter((text) => text === 'Parcelle à restaurer')).toHaveLength(items.length - 2);
    expect(items).not.toContain('…');
  });
});
