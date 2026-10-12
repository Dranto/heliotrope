import { globalBonus } from './bonuses';
import { growthSpeed, harvest, BASKETS } from './garden';
import { waterMultiplier } from './bioregion';
import {
  areGreatWorksOpen,
  buildReadyStages,
  canContribute,
  contribute,
  foldBonuses,
  greatWorksBonuses,
  isWorkComplete,
  STAGE_COSTS,
  WORKS,
  stageCount,
  worksBuilt,
  WORK_IDS,
  type WorkId,
} from './greatWorks';
import { DISTRICT_IDS } from './districts';
import { deserialize, serialize } from './save';
import { SPECIES_IDS } from './species';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
/** A player with the Bioregion open and plenty to give. */
function rich(extra: Partial<GameState> = {}): GameState {
  const fresh = openGame(0);
  return {
    ...fresh,
    seasons: 3,
    resources: { light: 1e30, water: 1e12 },
    garden: { ...fresh.garden, baskets: 10_000 },
    orchard: { ...fresh.orchard, honey: 100 },
    species: [...SPECIES_IDS],
    ...extra,
  };
}

function buildAll(state: GameState, id: WorkId, stages = stageCount(id)): GameState {
  for (let i = 0; i < stages; i++) state = contribute(state, id);
  return state;
}

describe('The great works (§6.6, M20)', () => {
  it('open with the Bioregion', () => {
    const early = { ...rich(), seasons: 1 };
    expect(areGreatWorksOpen(early)).toBe(false);
    expect(canContribute(early, 'tram')).toBe(false);
    expect(areGreatWorksOpen(rich())).toBe(true);
  });

  it('keep what is given, and build the stage once everything is paid', () => {
    const cost = STAGE_COSTS[0]!;
    const poor = rich({
      resources: { light: cost.light / 2, water: cost.water },
      garden: { ...rich().garden, baskets: 1 },
    });
    const given = contribute(poor, 'hall');
    expect(given.greatWorks.works.hall).toEqual({
      stage: 0,
      paid: { light: cost.light / 2, water: cost.water, baskets: 1, honey: 0 },
    });
    expect(given.resources.light).toBe(0);
    expect(given.resources.water).toBe(0);
    expect(given.garden.baskets).toBe(0);
    const topped = contribute(
      {
        ...given,
        resources: { light: 1e30, water: 1e12 },
        garden: { ...given.garden, baskets: 100 },
      },
      'hall',
    );
    expect(topped.greatWorks.works.hall.stage).toBe(1);
    expect(topped.greatWorks.works.hall.paid).toEqual({ light: 0, water: 0, baskets: 0, honey: 0 });
    expect(topped.resources.light).toBe(1e30 - cost.light / 2);
    expect(topped.garden.baskets).toBe(100 - (cost.baskets - 1));
  });

  it('waits for the species of a stage, then builds it on its own', () => {
    const state = contribute(rich(), 'tower');
    const short = { ...state, species: SPECIES_IDS.slice(0, 3) };
    const paid = contribute(short, 'tower');
    expect(paid.greatWorks.works.tower.stage).toBe(1);
    expect(canContribute(paid, 'tower')).toBe(false);
    const back = buildReadyStages({ ...paid, species: [...SPECIES_IDS] });
    expect(back.greatWorks.works.tower.stage).toBe(2);
    expect(tick({ ...paid, species: [...SPECIES_IDS] }, 1).greatWorks.works.tower.stage).toBe(2);
  });

  it('completes each work, then asks for nothing more', () => {
    let state = rich();
    for (const id of WORK_IDS) state = buildAll(state, id);
    expect(WORK_IDS.every((id) => isWorkComplete(state, id))).toBe(true);
    expect(worksBuilt(state)).toBe(4);
    expect(contribute(state, 'tram')).toBe(state);
    expect(state.achievements).toContain('works.4');
  });

  it('strengthens the districts, the Water and the garden', () => {
    const base = rich({ districts: [...DISTRICT_IDS] });
    const tram = buildAll(base, 'tram');
    expect(globalBonus(tram) - globalBonus(base)).toBeCloseTo(0.06 * DISTRICT_IDS.length);
    expect(waterMultiplier(buildAll(base, 'river', 1))).toBeCloseTo(waterMultiplier(base) * 1.1);
    expect(growthSpeed(buildAll(base, 'hall', 2))).toBeCloseTo(growthSpeed(base) * 1.15 ** 2);
    expect(greatWorksBonuses(base.greatWorks.works)).toEqual([]);
  });

  it('fills baskets at each harvest, more for longer crops', () => {
    const fresh = openGame(0);
    const plots = fresh.garden.plots.map((p, i) =>
      i === 0 ? { crop: 'beans' as const, grown: 3600 } : p,
    );
    const state = {
      ...fresh,
      generators: { ...fresh.generators, pot: 1 },
      garden: { ...fresh.garden, plots },
    };
    expect(harvest(state, 0)!.state.garden.baskets).toBe(BASKETS.beans);
  });

  it('keeps the works and baskets in the save, within what each stage asks', () => {
    const state = contribute(contribute(rich(), 'river'), 'river');
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.greatWorks).toEqual(state.greatWorks);
    expect(loaded.garden.baskets).toBe(state.garden.baskets);
    const greedy = {
      ...state,
      greatWorks: {
        works: {
          ...state.greatWorks.works,
          tram: { stage: 9, paid: { light: 1e40, water: -1, baskets: 3, honey: 2 } },
        },
      },
    };
    const clamped = deserialize(serialize(greedy), 0)!.greatWorks.works.tram;
    expect(clamped).toEqual({ stage: 4, paid: { light: 0, water: 0, baskets: 0, honey: 0 } });
  });

  it('folds the bonuses of a complete work into one line per effect', () => {
    const folded = foldBonuses(WORKS.tower.stages.flat());
    expect(folded).toHaveLength(2);
    expect(folded[0]).toMatchObject({ kind: 'global' });
    expect((folded[0] as { bonus: number }).bonus).toBeCloseTo(0.14);
    const river = foldBonuses(WORKS.river.stages.flat());
    expect((river[0] as { factor: number }).factor).toBeCloseTo(1.1 ** 3 * 1.25);
  });
});
