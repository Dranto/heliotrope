import { render, screen } from '@testing-library/react';
import { withAllIntroduced } from '../game/introductions';
import { fruitVarietyBonuses } from '../game/fruits';
import { FRUIT_IDS } from '../game/orchard';
import { saveGame } from '../game/save';
import { createInitialState, type GameState } from '../game/state';
import { GameStore } from '../game/store';
import { t } from '../i18n';
import { bonusesText } from '../i18n/restoration';
import { Orchard } from './Orchard';
import { GameStoreContext } from './useGame';

/** A player with one tree planted and one old variety found. */
function planted(): GameState {
  const fresh = withAllIntroduced(createInitialState(0));
  const [first] = FRUIT_IDS;
  return {
    ...fresh,
    orchard: {
      ...fresh.orchard,
      trees: { ...fresh.orchard.trees, [first]: { ...fresh.orchard.trees[first], age: 0 } },
      varieties: [first],
    },
  };
}

describe('the orchard panel', () => {
  beforeEach(() => localStorage.clear());

  it('writes what every old variety gives, found or still to find, without a tooltip', () => {
    saveGame(planted());
    const store = new GameStore(localStorage, () => 0);
    render(
      <GameStoreContext.Provider value={store}>
        <Orchard onHarvestAll={() => {}} />
      </GameStoreContext.Provider>,
    );
    const items = screen.getAllByRole('listitem').filter((li) => li.closest('.orchard-varieties'));
    expect(items).toHaveLength(FRUIT_IDS.length);
    FRUIT_IDS.forEach((id, i) => {
      const item = items[i] as HTMLElement;
      expect(item).not.toHaveAttribute('title');
      expect(item.textContent).toContain(bonusesText(fruitVarietyBonuses([id])));
      const found = i === 0;
      expect(item).toHaveAttribute('data-found', String(found));
      expect(item.textContent).toContain(
        found ? t.orchard.varieties[id] : t.orchard.unknownVariety(t.orchard.names[id]),
      );
    });
  });
});
