import { GENERATOR_IDS, GENERATORS, type GeneratorId } from './generators';
import { createInitialState, type GameState } from './state';
import {
  buyGenerator,
  canBuyGenerator,
  clickHeliotrope,
  generatorCost,
  isGeneratorRevealed,
  lightPerSecond,
  tick,
} from './tick';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

const owned = (patch: Partial<GameState['generators']>) => ({
  ...createInitialState(0).generators,
  ...patch,
});

describe('generator data', () => {
  it('matches the design document §4', () => {
    expect(
      GENERATOR_IDS.map((id) => [GENERATORS[id].baseCost, GENERATORS[id].baseProduction]),
    ).toEqual([
      [15, 0.1],
      [100, 1],
      [1_100, 8],
      [12_000, 47],
    ]);
  });
});

describe('production', () => {
  it('is zero without generators', () => {
    expect(lightPerSecond(createInitialState(0))).toBe(0);
  });

  it('sums base production × owned over all generators', () => {
    const state = withState({ generators: owned({ pot: 3, balconyPanel: 2, greenhouse: 1 }) });
    expect(lightPerSecond(state)).toBeCloseTo(0.3 + 2 + 47);
  });
});

describe('tick', () => {
  it('adds production proportional to elapsed time', () => {
    const state = tick(withState({ generators: owned({ balconyPanel: 2 }) }), 2.5);
    expect(state.resources.light).toBeCloseTo(5);
    expect(state.totalLight).toBeCloseTo(5);
    expect(state.lastUpdate).toBe(2500);
  });

  it('gives the same result for one long step or many short ones', () => {
    const start = withState({ generators: owned({ pot: 7, rooftopGarden: 3 }) });
    let stepped = start;
    for (let i = 0; i < 100; i++) stepped = tick(stepped, 0.1);
    expect(stepped.resources.light).toBeCloseTo(tick(start, 10).resources.light);
  });

  it('ignores non-positive time steps', () => {
    const state = createInitialState(0);
    expect(tick(state, 0)).toBe(state);
    expect(tick(state, -1)).toBe(state);
  });

  it('does not mutate the input state', () => {
    const state = withState({ generators: owned({ pot: 1 }) });
    tick(state, 10);
    expect(state.resources.light).toBe(0);
  });
});

describe('clickHeliotrope', () => {
  it('adds one Light, counts towards total Light and counts the click', () => {
    const state = clickHeliotrope(clickHeliotrope(createInitialState(0)));
    expect(state.resources.light).toBe(2);
    expect(state.totalLight).toBe(2);
    expect(state.clicks).toBe(2);
  });
});

describe('generatorCost', () => {
  it('grows by 15% per owned unit', () => {
    expect(generatorCost(createInitialState(0), 'pot')).toBe(15);
    expect(generatorCost(withState({ generators: owned({ pot: 1 }) }), 'pot')).toBeCloseTo(17.25);
    expect(generatorCost(withState({ generators: owned({ pot: 10 }) }), 'pot')).toBeCloseTo(
      15 * 1.15 ** 10,
    );
  });
});

describe('buyGenerator', () => {
  it('spends the cost and adds one unit, leaving total Light untouched', () => {
    const state = withState({ resources: { light: 120 }, totalLight: 500 });
    const next = buyGenerator(state, 'balconyPanel');
    expect(next.resources.light).toBe(20);
    expect(next.generators.balconyPanel).toBe(1);
    expect(next.totalLight).toBe(500);
    expect(state.generators.balconyPanel).toBe(0);
  });

  it('does nothing when the player cannot afford it', () => {
    const state = withState({ resources: { light: 14.9 } });
    expect(canBuyGenerator(state, 'pot')).toBe(false);
    expect(buyGenerator(state, 'pot')).toBe(state);
  });

  it('charges the increased price for the next unit', () => {
    let state = withState({ resources: { light: 15 + 17.25 } });
    state = buyGenerator(buyGenerator(state, 'pot'), 'pot');
    expect(state.generators.pot).toBe(2);
    expect(state.resources.light).toBeCloseTo(0);
  });
});

describe('isGeneratorRevealed', () => {
  it('reveals a generator once half its base cost was earned this Season', () => {
    expect(isGeneratorRevealed(withState({ totalLight: 49 }), 'balconyPanel')).toBe(false);
    expect(isGeneratorRevealed(withState({ totalLight: 50 }), 'balconyPanel')).toBe(true);
  });

  it('keeps owned generators revealed', () => {
    expect(
      isGeneratorRevealed(withState({ generators: owned({ greenhouse: 1 }) }), 'greenhouse'),
    ).toBe(true);
  });
});

describe('first session pacing', () => {
  // Milestone 1 exit criterion (docs/game-design.md §12): within 15 minutes of active play
  // the player can buy the first four generators. Simulates 4 clicks per second, in 1 s steps,
  // always saving for the generator that minimises time-to-afford + payback time.
  it('reaches the first Community greenhouse within 15 minutes', () => {
    const clicksPerSecond = 4;
    let state = createInitialState(0);
    let seconds = 0;
    while (state.generators.greenhouse === 0 && seconds < 15 * 60) {
      for (let i = 0; i < clicksPerSecond; i++) state = clickHeliotrope(state);
      state = tick(state, 1);
      seconds += 1;
      const income = lightPerSecond(state) + clicksPerSecond;
      const score = (id: GeneratorId) => {
        const cost = generatorCost(state, id);
        const wait = Math.max(0, cost - state.resources.light) / income;
        return wait + cost / GENERATORS[id].baseProduction;
      };
      const target = [...GENERATOR_IDS].sort((a, b) => score(a) - score(b))[0]!;
      state = buyGenerator(state, target);
    }
    expect(state.generators.greenhouse).toBe(1);
    expect(seconds).toBeGreaterThan(8 * 60);
  });
});
