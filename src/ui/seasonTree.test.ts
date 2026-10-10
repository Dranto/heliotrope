import { TALENT_IDS, TALENTS } from '../game/talents';
import { GROUND_Y, TALENT_SPOTS, TREE_VIEW, talentBranch, treeGrowth } from './seasonTree';

describe('Tree of Seasons drawing', () => {
  it('places roots under the soil and the two other branches in the canopy', () => {
    for (const id of TALENT_IDS) {
      const [x, y] = TALENT_SPOTS[id];
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(TREE_VIEW.width);
      if (TALENTS[id].branch === 'roots') expect(y).toBeGreaterThan(GROUND_Y);
      else expect(y).toBeLessThan(GROUND_Y);
    }
    // Pollinators lean left of the trunk, memory right.
    expect(TALENT_SPOTS.beeDance[0]).toBeLessThan(180);
    expect(TALENT_SPOTS.forestersCoop[0]).toBeGreaterThan(180);
  });

  it('keeps talents apart so each bud can be touched', () => {
    for (const a of TALENT_IDS) {
      for (const b of TALENT_IDS) {
        if (a >= b) continue;
        const [ax, ay] = TALENT_SPOTS[a];
        const [bx, by] = TALENT_SPOTS[b];
        expect(Math.hypot(ax - bx, ay - by)).toBeGreaterThan(24);
      }
    }
  });

  it('draws each branch from its parent', () => {
    const [x, y] = TALENT_SPOTS.gardenersCoop;
    expect(talentBranch('roofersCoop').startsWith(`M${x} ${y} `)).toBe(true);
    expect(treeGrowth([])).toBe(0);
    expect(treeGrowth(TALENT_IDS)).toBe(1);
  });
});
