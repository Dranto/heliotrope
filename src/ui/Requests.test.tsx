import { render } from '@testing-library/react';
import { withAllIntroduced } from '../game/introductions';
import { saveGame } from '../game/save';
import { createInitialState } from '../game/state';
import { GameStore } from '../game/store';
import { Requests } from './Requests';
import { GameStoreContext } from './useGame';

describe('Requests', () => {
  beforeEach(() => localStorage.clear());

  it('shows how far a request has come as a gauge, read out as a sentence', () => {
    const base = withAllIntroduced(createInitialState(0));
    saveGame({
      ...base,
      seasons: 1,
      generators: { ...base.generators, balconyPanel: 4 },
      requests: {
        ...base.requests,
        open: [
          {
            need: { kind: 'owned', generator: 'balconyPanel', count: 10 },
            base: 0,
            hand: 'bloom',
            from: null,
          },
        ],
      },
    });
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <Requests />
      </GameStoreContext.Provider>,
    );
    const progress = document.querySelector('.request-progress')!;
    expect(progress.querySelector('[aria-hidden="true"]')?.textContent).toBe('4/10');
    expect(progress.querySelector<HTMLElement>('.request-bar > span')?.style.width).toBe('40%');
    expect(progress.querySelector('.visually-hidden')?.textContent).toBe(
      'Avancement\u00a0: 4 sur 10',
    );
  });
});
