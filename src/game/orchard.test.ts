import { describe, expect, it } from 'vitest';
import { globalBonus } from './bonuses';
import { contribute, STAGE_COSTS } from './greatWorks';
import { growthSpeed } from './garden';
import {
  canPlant,
  FRUIT_BASKETS,
  FRUIT_SECONDS,
  HONEY_SECONDS,
  isOrchardOpen,
  pickFruit,
  plant,
  setHive,
  TREE_SECONDS,
  treeStage,
} from './orchard';
import { deserialize, serialize } from './save';
import { SPECIES_IDS } from './species';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
/** A player with the Bioregion open and baskets to spend. */
function opened(extra: Partial<GameState> = {}): GameState {
  const fresh = openGame(0);
  return { ...fresh, seasons: 3, garden: { ...fresh.garden, baskets: 100 }, ...extra };
}

/** Run the game for `seconds` in steps of an hour. */
function wait(state: GameState, seconds: number): GameState {
  for (let left = seconds; left > 0; left -= 3600) state = tick(state, Math.min(3600, left));
  return state;
}

describe('the orchard (§9.8)', () => {
  it('opens with the Bioregion', () => {
    expect(isOrchardOpen(openGame(0))).toBe(false);
    expect(isOrchardOpen(opened())).toBe(true);
  });

  it('plants the first tree for free, the others for baskets, once', () => {
    let state = opened({ garden: { ...openGame(0).garden, baskets: 5 } });
    expect(canPlant(state, 'pear')).toBe(false);
    state = plant(state, 'apple');
    expect(treeStage(state.orchard.trees.apple)).toBe('sapling');
    expect(state.garden.baskets).toBe(5);
    expect(plant(state, 'apple')).toBe(state);
  });

  it('grows over two days, flowers halfway, then bears fruit every eight hours', () => {
    let state = plant(opened(), 'apple');
    state = wait(state, TREE_SECONDS / 2);
    expect(treeStage(state.orchard.trees.apple)).toBe('flowering');
    state = wait(state, TREE_SECONDS / 2);
    expect(treeStage(state.orchard.trees.apple)).toBe('fruiting');
    state = wait(state, FRUIT_SECONDS);
    expect(treeStage(state.orchard.trees.apple)).toBe('ripe');
    // Ripe fruit waits for the player.
    expect(treeStage(wait(state, 3 * 24 * 3600).orchard.trees.apple)).toBe('ripe');
  });

  it('gives an hour of production, baskets, and sometimes the old variety', () => {
    let state = plant(opened(), 'apple');
    state = wait(state, TREE_SECONDS + FRUIT_SECONDS);
    const before = state.garden.baskets;
    let found = false;
    for (let i = 0; i < 30 && !found; i++) {
      const result = pickFruit(state, 'apple')!;
      expect(result.state.garden.baskets).toBe(state.garden.baskets + FRUIT_BASKETS);
      expect(treeStage(result.state.orchard.trees.apple)).toBe('fruiting');
      found = result.variety;
      state = wait(result.state, FRUIT_SECONDS);
    }
    expect(found).toBe(true);
    expect(state.garden.baskets).toBeGreaterThan(before);
    expect(state.orchard.varieties).toEqual(['apple']);
    expect(globalBonus(state)).toBeCloseTo(0.05);
    expect(state.achievements).toContain('firstFruit');
    expect(pickFruit(plant(opened(), 'pear'), 'pear')).toBeNull();
  });

  it('sets hives that speed the garden and the trees and fill with honey', () => {
    const state = opened();
    const base = growthSpeed(state);
    const hived = setHive(setHive(state));
    expect(hived.orchard.hives).toBe(2);
    expect(hived.garden.baskets).toBe(100 - 15 - 40);
    expect(setHive(hived)).toBe(hived);
    expect(growthSpeed(hived)).toBeCloseTo(base * 1.4);
    const later = wait(hived, HONEY_SECONDS);
    expect(later.orchard.honey).toBe(2);
  });

  it('pays the last stages of the great works with honey', () => {
    const fresh = openGame(0);
    let state: GameState = {
      ...opened(),
      resources: { light: 1e30, water: 1e12 },
      garden: { ...fresh.garden, baskets: 1000 },
      species: [...SPECIES_IDS],
    };
    for (let i = 0; i < 2; i++) state = contribute(state, 'tower');
    expect(state.greatWorks.works.tower.stage).toBe(2);
    state = contribute(state, 'tower');
    expect(state.greatWorks.works.tower.stage).toBe(2);
    state = contribute({ ...state, orchard: { ...state.orchard, honey: 10 } }, 'tower');
    expect(state.greatWorks.works.tower.stage).toBe(3);
    expect(state.orchard.honey).toBe(10 - STAGE_COSTS[2]!.honey);
  });

  it('keeps the orchard in the save, within bounds', () => {
    const state = setHive(plant(opened(), 'apple'));
    const odd: GameState = {
      ...state,
      orchard: {
        ...state.orchard,
        trees: { ...state.orchard.trees, pear: { age: 1e12, fruit: 1e12 } },
        hives: 1,
        honey: 3,
      },
    };
    const loaded = deserialize(serialize(odd), 0)!;
    expect(loaded.orchard.trees.apple.age).toBe(0);
    expect(loaded.orchard.trees.pear).toMatchObject({ age: TREE_SECONDS, fruit: FRUIT_SECONDS });
    expect(loaded.orchard.trees.cherry.age).toBeNull();
    expect(loaded.orchard.hives).toBe(1);
    expect(loaded.orchard.honey).toBe(3);
  });
});
