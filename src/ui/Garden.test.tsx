import { render, within } from '@testing-library/react';
import { saveGame } from '../game/save';
import { VARIETY_IDS } from '../game/seedBank';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Garden } from './Garden';
import { GameStoreContext } from './useGame';

describe('the garden beds', () => {
  beforeEach(() => localStorage.clear());

  it('let the shoots on each strip of earth grow with the crop', () => {
    const base = createInitialState(0);
    const plot = (crop: 'radish' | 'sunflower' | null, grown: number) => ({
      crop,
      grown,
      last: null,
      rotated: false,
    });
    saveGame({
      ...base,
      generators: { ...base.generators, pot: 1 },
      intro: { ...base.intro, introduced: [...base.intro.introduced, 'garden'] },
      garden: {
        ...base.garden,
        // Radish ripe, sunflowers a quarter grown (20 min), the rest bare or locked.
        plots: [plot('radish', 9999), plot('sunflower', 300), ...base.garden.plots.slice(2)],
      },
    });
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <Garden onHarvest={() => {}} onHarvestAll={() => {}} />
      </GameStoreContext.Provider>,
    );
    const beds = [...document.querySelectorAll<HTMLElement>('.garden-bed')];
    expect(beds[0]).toHaveAttribute('data-state', 'ripe');
    expect(beds[0]!.style.getPropertyValue('--grown')).toBe('1');
    expect(beds[1]).toHaveAttribute('data-state', 'growing');
    expect(beds[1]!.style.getPropertyValue('--grown')).toBe('0.25');
    expect(beds[2]!.style.getPropertyValue('--grown')).toBe('');
  });

  it('marks the sow button of a bare square with a shoot, still named "Semer"', () => {
    const base = createInitialState(0);
    saveGame({
      ...base,
      generators: { ...base.generators, pot: 1 },
      intro: { ...base.intro, introduced: [...base.intro.introduced, 'garden'] },
    });
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <Garden onHarvest={() => {}} onHarvestAll={() => {}} />
      </GameStoreContext.Provider>,
    );
    // The first bare square lists its crops; the next ones offer to sow.
    const bare = document.querySelectorAll<HTMLElement>('.garden-bed[data-state="bare"]')[1]!;
    const sow = within(bare).getByRole('button', { name: 'Semer' });
    expect(sow).toHaveClass('garden-sow');
    expect(sow.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws each seed-bank variety with its two parent crops, greyed until found', () => {
    const base = createInitialState(0);
    saveGame({
      ...base,
      generators: { ...base.generators, pot: 1 },
      intro: { ...base.intro, introduced: [...base.intro.introduced, 'garden'] },
      garden: { ...base.garden, varieties: ['flameRadish'] },
    });
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <Garden onHarvest={() => {}} onHarvestAll={() => {}} />
      </GameStoreContext.Provider>,
    );
    const items = [...document.querySelectorAll<HTMLElement>('.garden-variety')];
    expect(items).toHaveLength(VARIETY_IDS.length);
    for (const item of items) {
      const pair = item.querySelector('.variety-pair')!;
      expect(pair).toHaveAttribute('aria-hidden', 'true');
      expect(pair.querySelectorAll('.crop-art')).toHaveLength(2);
      expect(item.textContent).not.toBe('');
    }
    expect(items.filter((item) => item.dataset.found === 'true')).toHaveLength(1);
  });
});
