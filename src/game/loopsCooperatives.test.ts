import { describe, expect, it } from 'vitest';
import { growersCrop, isCooperativeUnlocked, runCooperatives } from './cooperatives';
import { withAllIntroduced } from './introductions';
import { PROJECTS } from './projects';
import { offeredProjects } from './restoration';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';
import { TALENT_LIST } from './talents';

/** A late player: the whole tree learnt, the Canopy open, the Bioregion too. */
function late(extra: Partial<GameState> = {}): GameState {
  const fresh = withAllIntroduced(createInitialState(0));
  return {
    ...fresh,
    seasons: 8,
    seeds: 1e6,
    talents: TALENT_LIST.map((t) => t.id),
    ...extra,
  };
}

function withCanopy(state: GameState, levels: Partial<GameState['canopy']['levels']>): GameState {
  return { ...state, canopy: { ...state.canopy, levels: { ...state.canopy.levels, ...levels } } };
}

describe('the council carries out the projects (M36)', () => {
  it('once the assembly is sown, cheapest first, every Season', () => {
    const fresh = late();
    const generators = Object.fromEntries(
      Object.keys(fresh.generators).map((id) => [id, 300]),
    ) as GameState['generators'];
    const rich = late({ resources: { light: 1e30, water: 0 }, generators, parcels: ['river'] });
    const offered = offeredProjects(rich);
    expect(offered.length).toBeGreaterThan(0);
    expect(runCooperatives(rich).projects).toEqual([]);
    const run = runCooperatives(withCanopy(rich, { assembly: 1 }));
    for (const { id } of offered) expect(run.projects).toContain(id);
    const cheapest = Math.min(...offered.map((p) => p.cost));
    expect(PROJECTS[run.projects[0]!].cost).toBe(cheapest);
    expect(run.cooperatives.purchases.council).toBeGreaterThanOrEqual(offered.length);
  });

  it('waits for a project it cannot afford yet', () => {
    const poor = withCanopy(late({ resources: { light: 1, water: 0 } }), { assembly: 1 });
    expect(runCooperatives(poor).projects).toEqual([]);
  });
});

describe('the friends of the garden (M36)', () => {
  const harvested = (state: GameState): GameState => ({
    ...state,
    garden: {
      ...state.garden,
      plots: state.garden.plots.map((p, i) =>
        i === 0
          ? { crop: null, grown: 0, last: 'beans', rotated: false }
          : i === 1
            ? { crop: 'radish', grown: 1e6, last: null, rotated: false }
            : p,
      ),
    },
  });

  it('resow the harvested beds in rotation, and never harvest', () => {
    const state = harvested(withCanopy(late(), { growers: 1 }));
    expect(isCooperativeUnlocked(state, 'growers')).toBe(true);
    const run = runCooperatives(state);
    expect(run.garden.plots[0]!.crop).not.toBe('beans');
    expect(run.garden.plots[0]!.crop).not.toBeNull();
    expect(run.garden.plots[0]!.rotated).toBe(true);
    // The ripe radishes wait for the player; the bare beds never harvested stay bare.
    expect(run.garden.plots[1]).toEqual(state.garden.plots[1]);
    expect(run.garden.plots[2]!.crop).toBeNull();
    expect(run.garden.harvests).toBe(state.garden.harvests);
    expect(run.cooperatives.purchases.growers).toBe(1);
  });

  it('sow the next crop unlocked, so every bed rotates', () => {
    const state = late();
    expect(growersCrop(state, 'beans')).toBe('squash');
    expect(growersCrop(state, 'squash')).not.toBe('squash');
  });

  it('stay home without their canopy talent', () => {
    const state = harvested(late());
    expect(runCooperatives(state).garden.plots[0]!.crop).toBeNull();
  });
});

describe('the save (M36)', () => {
  it('keeps the new canopy talents and cooperatives', () => {
    const state = withCanopy(late({ seeds: 1e6 }), { assembly: 1, growers: 1 });
    const back = deserialize(serialize(state), 0)!;
    expect(back.canopy.levels.assembly).toBe(1);
    expect(back.canopy.levels.growers).toBe(1);
    expect(back.cooperatives.purchases.growers).toBe(0);
  });
});
