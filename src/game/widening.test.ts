import { collectorCost, siteCost } from './bioregion';
import { startNewCycle, waterForSources } from './cycles';
import {
  availableSources,
  canWidenArm,
  DELTA_IDS,
  DELTA,
  deltaSourcesSpent,
  MIN_RIPENING_SECONDS,
  nextWidenCost,
  openArm,
  ripeningSeconds,
  widenArm,
  widenCost,
  WIDEN_MAX,
  type WideArmId,
} from './delta';
import { clickValue } from './production';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';

/** A late player with every arm of the delta open and Sources to spare. */
function openDelta(sources = 400): GameState {
  const fresh = createInitialState(0);
  let state: GameState = {
    ...fresh,
    seasons: 20,
    cycles: 6,
    sources,
    allTimeWater: waterForSources(sources),
    waterBeforeCycle: waterForSources(sources),
  };
  for (const id of DELTA_IDS) {
    for (let level = 0; level < DELTA[id].costs.length; level++) state = openArm(state, id);
  }
  return state;
}

function widen(state: GameState, id: WideArmId, times: number): GameState {
  for (let i = 0; i < times; i++) state = widenArm(state, id);
  return state;
}

describe('Widening the arms of the delta (§7.5, M19)', () => {
  it('waits for the whole delta to be open', () => {
    const partial = openArm({ ...openDelta(), delta: createInitialState(0).delta }, 'seedArm');
    expect(nextWidenCost(partial, 'seedArm')).toBeNull();
    expect(widenArm(partial, 'seedArm')).toBe(partial);
    expect(canWidenArm(openDelta(), 'seedArm')).toBe(true);
  });

  it('costs more at each level, from the Sources left, up to its last level', () => {
    const state = openDelta();
    const before = availableSources(state);
    const once = widenArm(state, 'memoryArm');
    expect(availableSources(once)).toBe(before - widenCost(0));
    expect(widenCost(1)).toBeGreaterThan(widenCost(0));
    const full = widen(openDelta(10_000), 'memoryArm', WIDEN_MAX + 2);
    expect(full.delta.widths.memoryArm).toBe(WIDEN_MAX);
    expect(nextWidenCost(full, 'memoryArm')).toBeNull();
    expect(deltaSourcesSpent(full.delta.levels, full.delta.widths)).toBeGreaterThan(
      deltaSourcesSpent(full.delta.levels),
    );
  });

  it('ripens the Seeds sooner with the seed arm, never under five minutes', () => {
    const state = openDelta(10_000);
    expect(ripeningSeconds(widenArm(state, 'seedArm'))).toBe(ripeningSeconds(state) - 30);
    expect(ripeningSeconds(widen(state, 'seedArm', WIDEN_MAX))).toBe(MIN_RIPENING_SECONDS);
  });

  it('keeps more of the Bioregion after a Cycle with the memory arm', () => {
    const base = {
      ...openDelta(10_000),
      collectors: { roofTanks: 100, swales: 0, ponds: 0, streams: 0 },
      allTimeWater: waterForSources(10_100),
    };
    expect(startNewCycle(base).collectors.roofTanks).toBe(50);
    expect(startNewCycle(widen(base, 'memoryArm', 5)).collectors.roofTanks).toBe(70);
    expect(collectorCost(base, 'roofTanks')).toBeGreaterThan(0);
  });

  it('strengthens the hillsides and lowers the price of the sites further', () => {
    const state = {
      ...openDelta(10_000),
      sites: { ...createInitialState(0).sites, hillsides: 2 },
    };
    const wide = widen(widen(state, 'hillsArm', 5), 'floodArm', 5);
    expect(clickValue(wide)).toBeGreaterThan(clickValue(state));
    expect(siteCost(wide, 'wetlands') / siteCost(state, 'wetlands')).toBeCloseTo(0.625 / 0.75);
  });

  it('keeps its widenings in the save, and drops more than the Sources pay for', () => {
    const state = widen(openDelta(), 'seedArm', 3);
    expect(deserialize(serialize(state), 0)!.delta.widths.seedArm).toBe(3);
    const greedy = {
      ...state,
      delta: { ...state.delta, widths: { ...state.delta.widths, floodArm: 10 } },
    };
    expect(deserialize(serialize(greedy), 0)!.delta.widths.floodArm).toBe(0);
  });
});
