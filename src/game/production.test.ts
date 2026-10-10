import { GENERATOR_IDS } from './generators';
import {
  availableUpgrades,
  biodiversityBonus,
  clickValue,
  generatorCost,
  generatorMultiplier,
  generatorProduction,
  isUpgradeUnlocked,
  lightPerSecond,
  maxAffordable,
} from './production';
import { createInitialState, type GameState } from './state';
import { UPGRADE_LIST, UPGRADES, type UpgradeId } from './upgrades';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

const owned = (patch: Partial<GameState['generators']>) => ({
  ...createInitialState(0).generators,
  ...patch,
});

describe('upgrade data', () => {
  it('has 7 ×2 upgrades per generator, 5 click upgrades and 3 synergies (§5)', () => {
    expect(UPGRADE_LIST).toHaveLength(8 * 7 + 5 + 3);
    expect(new Set(UPGRADE_LIST.map((u) => u.id)).size).toBe(UPGRADE_LIST.length);
  });

  it('prices ×2 upgrades from the generator base cost (§5.1)', () => {
    expect(UPGRADES['pot.1'].cost).toBe(150);
    expect(UPGRADES['pot.4'].cost).toBe(750_000);
    expect(UPGRADES['arcology.7'].cost).toBe(800_000_000 * 50_000_000_000);
    expect(UPGRADES['greenhouse.3'].condition).toEqual({ owned: { greenhouse: 25 } });
  });

  it('prices synergies at 10 000 × the dearer base cost (§5.3)', () => {
    expect(UPGRADES.sharedCompost.cost).toBe(120_000_000);
    expect(UPGRADES.usefulShade.cost).toBe(500_000_000_000);
    expect(UPGRADES.recoveredHeat.cost).toBe(30_000_000_000);
  });
});

describe('generator production', () => {
  it('doubles for each ×2 upgrade of that generator only', () => {
    const state = withState({
      generators: owned({ pot: 10, balconyPanel: 1 }),
      upgrades: ['pot.1', 'pot.2'],
    });
    expect(generatorProduction(state, 'pot')).toBeCloseTo(0.1 * 10 * 4 * 1.02);
    expect(generatorProduction(state, 'balconyPanel')).toBeCloseTo(1 * 1.02);
  });

  it('adds synergy bonuses per unit of the source generator', () => {
    const state = withState({
      generators: owned({ rooftopGarden: 15, greenhouse: 20 }),
      upgrades: ['sharedCompost'],
    });
    expect(generatorMultiplier(state, 'rooftopGarden')).toBeCloseTo(1 + 0.05 * 20);
    expect(generatorMultiplier(state, 'greenhouse')).toBe(1);
  });

  it('multiplies ×2 upgrades with the synergy bonus', () => {
    const state = withState({
      generators: owned({ greenhouse: 25, mirrorPlant: 15 }),
      upgrades: ['greenhouse.1', 'recoveredHeat'],
    });
    expect(generatorMultiplier(state, 'greenhouse')).toBeCloseTo(2 * 1.3);
  });
});

describe('biodiversityBonus', () => {
  it('gives +2% per generator type at 10, 50 and 100 units (§5.4)', () => {
    expect(biodiversityBonus(withState({ generators: owned({ pot: 9 }) }))).toBe(0);
    expect(biodiversityBonus(withState({ generators: owned({ pot: 10 }) }))).toBeCloseTo(0.02);
    expect(
      biodiversityBonus(withState({ generators: owned({ pot: 100, arcology: 50 }) })),
    ).toBeCloseTo(0.1);
  });

  it('caps at +48% with every type at 100', () => {
    const all = Object.fromEntries(GENERATOR_IDS.map((id) => [id, 120]));
    expect(biodiversityBonus(withState({ generators: owned(all) }))).toBeCloseTo(0.48);
  });

  it('applies to the whole production', () => {
    const state = withState({ generators: owned({ balconyPanel: 10, rooftopGarden: 1 }) });
    expect(lightPerSecond(state)).toBeCloseTo((10 + 8) * 1.02);
  });
});

describe('clickValue', () => {
  it('is 1 without upgrades', () => {
    expect(clickValue(createInitialState(0))).toBe(1);
  });

  it('applies click multipliers and the share of production (§5.2)', () => {
    const state = withState({
      generators: owned({ balconyPanel: 5 }),
      upgrades: ['gloves', 'copperCan', 'greenHands', 'sharedGesture'],
    });
    expect(clickValue(state)).toBeCloseTo(4 + 0.02 * 5);
  });
});

describe('generatorCost', () => {
  it('sums the geometric series for bulk purchases (§4)', () => {
    const state = withState({ generators: owned({ pot: 3 }) });
    let expected = 0;
    for (let n = 3; n < 13; n++) expected += 15 * 1.15 ** n;
    expect(generatorCost(state, 'pot', 10)).toBeCloseTo(expected);
    expect(generatorCost(state, 'pot', 1)).toBeCloseTo(15 * 1.15 ** 3);
  });
});

describe('maxAffordable', () => {
  it('is the largest affordable bulk', () => {
    expect(maxAffordable(withState({ resources: { light: 14 } }), 'pot')).toBe(0);
    expect(maxAffordable(withState({ resources: { light: 15 } }), 'pot')).toBe(1);
    for (const light of [100, 1_234, 98_765, 1e9]) {
      const state = withState({ resources: { light }, generators: owned({ pot: 7 }) });
      const count = maxAffordable(state, 'pot');
      expect(generatorCost(state, 'pot', count)).toBeLessThanOrEqual(light);
      expect(generatorCost(state, 'pot', count + 1)).toBeGreaterThan(light);
    }
  });

  it('handles an exact bulk price', () => {
    const base = withState({ generators: owned({ balconyPanel: 4 }) });
    const state = { ...base, resources: { light: generatorCost(base, 'balconyPanel', 25) } };
    expect(maxAffordable(state, 'balconyPanel')).toBe(25);
  });
});

describe('upgrade availability', () => {
  it('unlocks ×2 upgrades at owned thresholds', () => {
    expect(isUpgradeUnlocked(withState({ generators: owned({ pot: 4 }) }), 'pot.2')).toBe(false);
    expect(isUpgradeUnlocked(withState({ generators: owned({ pot: 5 }) }), 'pot.2')).toBe(true);
  });

  it('unlocks click upgrades on Light earned this Season', () => {
    expect(isUpgradeUnlocked(withState({ totalLight: 999 }), 'gloves')).toBe(false);
    expect(isUpgradeUnlocked(withState({ totalLight: 1_000 }), 'gloves')).toBe(true);
  });

  it('unlocks synergies when both generators reach 15', () => {
    const id: UpgradeId = 'sharedCompost';
    const some = owned({ rooftopGarden: 15, greenhouse: 14 });
    expect(isUpgradeUnlocked(withState({ generators: some }), id)).toBe(false);
    expect(isUpgradeUnlocked(withState({ generators: { ...some, greenhouse: 15 } }), id)).toBe(
      true,
    );
  });

  it('lists unlocked upgrades not bought yet, cheapest first', () => {
    const state = withState({
      totalLight: 2_000,
      generators: owned({ pot: 5, balconyPanel: 1 }),
      upgrades: ['pot.1'],
    });
    expect(availableUpgrades(state).map((u) => u.id)).toEqual([
      'gloves',
      'pot.2',
      'balconyPanel.1',
    ]);
  });
});
