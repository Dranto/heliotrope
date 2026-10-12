import { describe, expect, it } from 'vitest';
import { growersCrop, isCooperativeUnlocked, runCooperatives } from './cooperatives';
import { createGreatWorksState, HONEY_RESERVE } from './greatWorks';
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

  it('sow the crop of the weather when it changes the bed', () => {
    const state = late();
    const sunny = { ...state, weather: { ...state.weather, current: 'sun' as const } };
    expect(growersCrop(sunny, 'beans')).toBe('sunflower');
    expect(growersCrop(sunny, 'sunflower')).toBe('beans');
  });

  it('stay home without their canopy talent', () => {
    const state = harvested(late());
    expect(runCooperatives(state).garden.plots[0]!.crop).toBeNull();
  });
});

describe('the beekeepers (M36)', () => {
  const works = createGreatWorksState();
  const stage = { ...works.works.tram, stage: 2 };

  it('come with the second hive and carry the spare honey to the work in progress', () => {
    const state = late({
      orchard: { ...late().orchard, hives: 2, honey: HONEY_RESERVE + 5 },
      greatWorks: { works: { ...works.works, tram: stage } },
    });
    expect(isCooperativeUnlocked(state, 'beekeepers')).toBe(true);
    const run = runCooperatives(state);
    expect(run.greatWorks.works.tram.paid.honey).toBe(3);
    expect(run.orchard.honey).toBe(HONEY_RESERVE + 2);
    expect(run.cooperatives.purchases.beekeepers).toBe(3);
  });

  it('keep carrying honey with no talent learnt, as after a swarm', () => {
    const state = late({
      talents: [],
      orchard: { ...late().orchard, hives: 2, honey: HONEY_RESERVE + 5 },
      greatWorks: { works: { ...works.works, tram: stage } },
    });
    const run = runCooperatives(state);
    expect(run.greatWorks.works.tram.paid.honey).toBe(3);
    expect(run.orchard.honey).toBe(HONEY_RESERVE + 2);
  });

  it('keep the reserve, and wait for the second hive', () => {
    const one = late({
      orchard: { ...late().orchard, hives: 1, honey: 9 },
      greatWorks: { works: { ...works.works, tram: stage } },
    });
    expect(isCooperativeUnlocked(one, 'beekeepers')).toBe(false);
    expect(runCooperatives(one).orchard.honey).toBe(9);
    const reserve = { ...one, orchard: { ...one.orchard, hives: 2, honey: HONEY_RESERVE } };
    expect(runCooperatives(reserve).orchard.honey).toBe(HONEY_RESERVE);
  });
});

describe('the save (M36)', () => {
  it('keeps the new canopy talents and cooperatives', () => {
    const state = withCanopy(late({ seeds: 1e6 }), { assembly: 1, growers: 1 });
    const back = deserialize(serialize(state), 0)!;
    expect(back.canopy.levels.assembly).toBe(1);
    expect(back.canopy.levels.growers).toBe(1);
    expect(back.cooperatives.purchases.beekeepers).toBe(0);
  });
});
