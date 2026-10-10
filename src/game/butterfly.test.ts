import {
  advanceButterfly,
  BUTTERFLY_VISIBLE_SECONDS,
  butterflyOutcome,
  catchButterfly,
  harvestAmount,
  isButterflyUnlocked,
} from './butterfly';
import { EFFECTS } from './effects';
import { clickValue, lightPerSecond } from './production';
import {
  BUTTERFLY_MAX_INTERVAL,
  BUTTERFLY_MIN_INTERVAL,
  butterflyDelay,
  createInitialState,
  type GameState,
} from './state';
import { tick } from './tick';

/** A state in phase 2, where the butterfly visits. */
function quarter(patch: Partial<GameState> = {}): GameState {
  const base = createInitialState(0);
  return {
    ...base,
    resources: { water: 0, light: 10_000 },
    totalLight: 10_000,
    allTimeLight: 10_000,
    generators: { ...base.generators, balconyPanel: 10 },
    achievements: ['light.3', 'balconyPanel.1'],
    ...patch,
  };
}

const visible = (patch: Partial<GameState> = {}) =>
  quarter({ butterfly: { nextIn: 0, visible: 5 }, ...patch });

describe('Golden Butterfly schedule (§9.2)', () => {
  it('draws the next visit between 3 and 8 minutes', () => {
    expect(butterflyDelay(0)).toBe(BUTTERFLY_MIN_INTERVAL);
    expect(butterflyDelay(0.999999)).toBeCloseTo(BUTTERFLY_MAX_INTERVAL, 2);
    const { nextIn } = createInitialState(42).butterfly;
    expect(nextIn).toBeGreaterThanOrEqual(3 * 60);
    expect(nextIn).toBeLessThanOrEqual(8 * 60);
  });

  it('only visits from phase 2 on', () => {
    const balcony = createInitialState(0);
    expect(isButterflyUnlocked(balcony)).toBe(false);
    expect(advanceButterfly(balcony, 10_000)).toBe(balcony);
    expect(isButterflyUnlocked(quarter())).toBe(true);
  });

  it('appears when its time comes and stays 12 seconds', () => {
    const state = quarter({ butterfly: { nextIn: 10, visible: 0 } });
    expect(advanceButterfly(state, 4).butterfly).toEqual({ nextIn: 6, visible: 0 });
    expect(advanceButterfly(state, 13).butterfly).toEqual({
      nextIn: 0,
      visible: BUTTERFLY_VISIBLE_SECONDS - 3,
    });
  });

  it('flies away after 12 seconds and schedules the next visit', () => {
    const gone = advanceButterfly(visible(), 5).butterfly;
    expect(gone.visible).toBe(0);
    expect(gone.nextIn).toBeGreaterThanOrEqual(BUTTERFLY_MIN_INTERVAL);
    // A long throttled step that covers the whole visit also lets it go.
    const skipped = advanceButterfly(quarter({ butterfly: { nextIn: 1, visible: 0 } }), 60);
    expect(skipped.butterfly.visible).toBe(0);
  });

  it('is deterministic for a given seed', () => {
    expect(catchButterfly(visible())).toEqual(catchButterfly(visible()));
  });
});

describe('catching the Golden Butterfly', () => {
  it('maps the §9.2 odds to outcomes', () => {
    expect(butterflyOutcome(0)).toBe('bloom');
    expect(butterflyOutcome(0.49)).toBe('bloom');
    expect(butterflyOutcome(0.5)).toBe('harvest');
    expect(butterflyOutcome(0.89)).toBe('harvest');
    expect(butterflyOutcome(0.9)).toBe('pollination');
  });

  it('cannot catch a butterfly that is not there', () => {
    expect(catchButterfly(quarter())).toBeNull();
  });

  it('counts the butterfly, removes it and gives one of the three effects', () => {
    const counts = { bloom: 0, harvest: 0, pollination: 0 };
    let state = visible();
    for (let i = 0; i < 400; i++) {
      const result = catchButterfly({ ...state, butterfly: { nextIn: 0, visible: 5 } })!;
      expect(result.state.butterfly.visible).toBe(0);
      expect(result.state.butterflies).toBe(state.butterflies + 1);
      counts[result.outcome] += 1;
      state = { ...result.state, effects: [], resources: { water: 0, light: 10_000 } };
    }
    expect(counts.bloom).toBeGreaterThan(160);
    expect(counts.harvest).toBeGreaterThan(120);
    expect(counts.pollination).toBeGreaterThan(20);
  });

  it('Récolte gives min(15% of the reserve, 15 minutes of production)', () => {
    const rich = quarter({ resources: { water: 0, light: 1e9 } });
    expect(harvestAmount(rich)).toBeCloseTo(lightPerSecond(rich) * 900);
    const poor = quarter({ resources: { water: 0, light: 1_000 } });
    expect(harvestAmount(poor)).toBeCloseTo(150);
  });

  it('Floraison multiplies production for 60 seconds, then wears off', () => {
    const state = quarter({ effects: [{ kind: 'bloom', remaining: EFFECTS.bloom.seconds }] });
    expect(lightPerSecond(state)).toBeCloseTo(lightPerSecond(quarter()) * EFFECTS.bloom.factor);
    expect(tick(state, 59).effects).toHaveLength(1);
    expect(tick(state, 61).effects).toEqual([]);
  });

  it('Pollinisation multiplies the click value by 100 for 10 seconds', () => {
    const state = quarter({ effects: [{ kind: 'pollination', remaining: 10 }] });
    expect(clickValue(state)).toBeCloseTo(clickValue(quarter()) * 100);
  });

  it('counts an effect only for the time it lasts within a long tick', () => {
    const plain = lightPerSecond(quarter());
    const state = quarter({ effects: [{ kind: 'bloom', remaining: 10 }] });
    const earned = tick(state, 30).totalLight - state.totalLight;
    // 10 s boosted, then 20 s plain; the Milestones are already unlocked.
    expect(earned).toBeCloseTo(plain * EFFECTS.bloom.factor * 10 + plain * 20);
    let stepped = state;
    for (let i = 0; i < 300; i++) stepped = tick(stepped, 0.1);
    expect(stepped.totalLight).toBeCloseTo(tick(state, 30).totalLight);
  });

  it('restarts an effect caught again instead of stacking it', () => {
    let state = visible({ effects: [{ kind: 'bloom', remaining: 5 }] });
    for (let i = 0; i < 50; i++) {
      const result = catchButterfly(state)!;
      if (result.outcome === 'bloom') {
        expect(result.state.effects).toEqual([{ kind: 'bloom', remaining: 60 }]);
        return;
      }
      state = { ...result.state, butterfly: { nextIn: 0, visible: 5 } };
    }
    throw new Error('no Floraison drawn');
  });
});
