// docs/performance-plan.md, lot 0: how many components a game tick renders in a busy late game.
import './testing/countRenders';
import { act, render } from '@testing-library/react';
import { GENERATOR_IDS } from '../game/generators';
import { withAllIntroduced } from '../game/introductions';
import { PARCEL_IDS } from '../game/parcels';
import { createInitialState, type GameState } from '../game/state';
import { GameStore } from '../game/store';
import { App } from './App';
import { renderStats } from './renderCounter';
import { GameStoreContext } from './useGame';

/** A busy city: every generator well built and every parcel restored. */
function busyCity(): GameState {
  const state = withAllIntroduced(createInitialState(0));
  return {
    ...state,
    resources: { ...state.resources, light: 1e12 },
    totalLight: 1e15,
    allTimeLight: 1e15,
    generators: Object.fromEntries(GENERATOR_IDS.map((id) => [id, 150])) as GameState['generators'],
    parcels: [...PARCEL_IDS],
  };
}

/** Components rendered by one tick of play, once the game has settled. */
function renderedPerTick(): { total: number; byName: Map<string, number> } {
  let now = 0;
  localStorage.clear();
  const store = new GameStore(localStorage, () => now);
  store.load(busyCity());
  render(
    <GameStoreContext.Provider value={store}>
      <App />
    </GameStoreContext.Provider>,
  );
  for (let i = 0; i < 3; i++) {
    now += 100;
    act(() => store.step());
  }
  const stats = renderStats()!;
  const before = { rendered: stats.rendered, byName: new Map(stats.byName) };
  now += 100;
  act(() => store.step());
  const byName = new Map<string, number>();
  for (const [name, n] of stats.byName) {
    const diff = n - (before.byName.get(name) ?? 0);
    if (diff > 0) byName.set(name, diff);
  }
  return { total: stats.rendered - before.rendered, byName };
}

describe('render budget', () => {
  // Measured at 773 before lot 1 (docs/performance-plan.md): the ceiling only keeps it from
  // growing until lot 1 lowers it.
  const CEILING = 900;

  it(`renders at most ${CEILING} components per tick`, () => {
    const { total, byName } = renderedPerTick();
    const top = [...byName]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, n]) => `${name} ${n}`)
      .join(', ');
    expect(total, `rendered per tick: ${top}`).toBeLessThanOrEqual(CEILING);
  });
});
