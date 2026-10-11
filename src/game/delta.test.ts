import {
  canRaiseSite,
  collectorCost,
  isSiteRevealed,
  siteCost,
  waterMultiplier,
} from './bioregion';
import { factorOf } from './bonuses';
import {
  completeCycleChallenge,
  CYCLE_CHALLENGES,
  offeredCycleChallenges,
} from './cycleChallenges';
import { runLockKeeper, sourceBonus, startNewCycle, waterForSources } from './cycles';
import {
  availableSources,
  canOpenArm,
  DELTA,
  DELTA_IDS,
  deltaSourcesSpent,
  isDeltaComplete,
  LOCK_MILESTONE_CYCLES,
  openArm,
  ripeningSeconds,
  setLockFactor,
} from './delta';
import { clickValue } from './production';
import { deserialize, serialize } from './save';
import { areSeedsRipe, SEED_RIPENING_SECONDS } from './seasons';
import { isHerbierComplete, SPECIES_IDS, unlockSpecies } from './species';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

/** A player after a few Cycles, with Sources to spend and the Bioregion open. */
function delta(extra: Partial<GameState> = {}): GameState {
  const fresh = createInitialState(0);
  return {
    ...fresh,
    seasons: 6,
    cycles: 2,
    sources: 30,
    allTimeWater: waterForSources(30),
    waterBeforeCycle: waterForSources(30),
    ...extra,
  };
}

function withArms(state: GameState, ...ids: (typeof DELTA_IDS)[number][]): GameState {
  return ids.reduce(openArm, state);
}

describe('The delta of the Sources (§7.5, M15)', () => {
  it('opens with the first Cycle and spends Sources without lowering their bonus', () => {
    expect(canOpenArm(delta({ cycles: 0 }), 'hillsArm')).toBe(false);
    const state = openArm(delta(), 'hillsArm');
    expect(state.delta.levels.hillsArm).toBe(1);
    expect(availableSources(state)).toBe(30 - DELTA.hillsArm.costs[0]!);
    expect(sourceBonus(state.sources)).toBe(sourceBonus(30));
    expect(openArm(state, 'hillsArm')).toBe(state);
  });

  it('cannot spend more Sources than obtained', () => {
    const poor = delta({ sources: 2 });
    const once = openArm(poor, 'floodArm');
    expect(availableSources(once)).toBe(0);
    expect(canOpenArm(once, 'hillsArm')).toBe(false);
  });

  it('every level of every arm costs 26 Sources in all', () => {
    let state = delta();
    for (const id of DELTA_IDS) {
      for (let i = 0; i < DELTA[id].costs.length; i++) state = openArm(state, id);
    }
    expect(isDeltaComplete(state)).toBe(true);
    expect(deltaSourcesSpent(state.delta.levels)).toBe(26);
    expect(state.achievements).not.toContain('delta.6');
    expect(tick(state, 1).achievements).toEqual(expect.arrayContaining(['delta.1', 'delta.6']));
  });

  it('the seed arm ripens the Seeds sooner: 15, 12 then 10 minutes', () => {
    const none = delta();
    expect(ripeningSeconds(none)).toBe(SEED_RIPENING_SECONDS);
    const one = openArm(none, 'seedArm');
    expect(ripeningSeconds(one)).toBe(12 * 60);
    const two = openArm(one, 'seedArm');
    expect(ripeningSeconds(two)).toBe(10 * 60);
    expect(areSeedsRipe({ ...none, seasonSeconds: 11 * 60 })).toBe(false);
    expect(areSeedsRipe({ ...two, seasonSeconds: 11 * 60 })).toBe(true);
  });

  it('the memory arm keeps half of each collector and site level after a Cycle', () => {
    const built = {
      ...delta({ allTimeWater: waterForSources(40) }),
      collectors: { roofTanks: 5, swales: 3, ponds: 1, streams: 0 },
      sites: { wetlands: 4, meadows: 3, foodForests: 1, oldForest: 0, hillsides: 2 },
    };
    expect(startNewCycle(built).collectors.roofTanks).toBe(0);
    const kept = startNewCycle(openArm(built, 'memoryArm'));
    expect(kept.collectors).toEqual({ roofTanks: 2, swales: 1, ponds: 0, streams: 0 });
    expect(kept.sites).toEqual({
      wetlands: 2,
      meadows: 1,
      foodForests: 0,
      oldForest: 0,
      hillsides: 1,
    });
    expect(kept.resources.water).toBe(0);
  });

  it('the hills arm opens a fifth site that raises the clicks and the visits', () => {
    const state = { ...delta(), resources: { light: 0, water: 1e6 } };
    expect(isSiteRevealed(state, 'hillsides')).toBe(false);
    expect(canRaiseSite(state, 'hillsides')).toBe(false);
    const open = openArm({ ...state, allTimeWater: state.allTimeWater + 1e6 }, 'hillsArm');
    expect(isSiteRevealed(open, 'hillsides')).toBe(true);
    const raised = { ...open, sites: { ...open.sites, hillsides: 2 } };
    expect(clickValue(raised) / clickValue(open)).toBeCloseTo(1.5);
    expect(factorOf(raised, 'visitInterval')).toBeCloseTo(1 / 1.2);
    expect(factorOf(open, 'visitInterval')).toBe(1);
  });

  it('the lock keeper starts a free Cycle at the chosen level, never during a challenge', () => {
    const ready = { ...delta({ allTimeWater: waterForSources(46) }) };
    const keeper = setLockFactor(withArms(ready, 'lockKeeper'), 1.5);
    expect(runLockKeeper(withArms(ready, 'lockKeeper'))).toEqual(withArms(ready, 'lockKeeper'));
    const next = runLockKeeper(keeper);
    expect(next.cycles).toBe(3);
    expect(next.sources).toBe(46);
    expect(next.delta.lockCycles).toBe(1);
    // 30 → 44 Sources is short of ×1.5.
    const short = { ...keeper, allTimeWater: waterForSources(44) };
    expect(runLockKeeper(short)).toBe(short);
    const challenged = { ...keeper, cycleChallenge: 'drought' as const };
    expect(runLockKeeper(challenged)).toBe(challenged);
    expect(runLockKeeper({ ...keeper, challenge: 'wild' as const }).cycles).toBe(2);
    expect(
      runLockKeeper({
        ...keeper,
        delta: { ...keeper.delta, lockCycles: LOCK_MILESTONE_CYCLES - 1 },
      }).achievements,
    ).toContain('lockKeeper');
    expect(setLockFactor(keeper, 7)).toBe(keeper);
  });

  it('round-trips through a save and migrates a v16 save with the delta closed', () => {
    const state = setLockFactor(withArms(delta(), 'seedArm', 'lockKeeper'), 2);
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.delta).toEqual(state.delta);
    const { delta: _delta, cycleChallenge: _c, cycleChallenges: _w, ...rest } = state;
    const old = deserialize(JSON.stringify({ ...rest, version: 16 }), 0)!;
    expect(old.delta.levels.seedArm).toBe(0);
    expect(old.cycleChallenges).toEqual([]);
    expect(old.sites.hillsides).toBe(0);
  });

  it('a save cannot hold arms the Sources do not pay for', () => {
    const raw = JSON.parse(serialize(delta({ sources: 3 })));
    raw.delta.levels = { lockKeeper: 1, seedArm: 5 };
    const loaded = deserialize(JSON.stringify(raw), 0)!;
    expect(deltaSourcesSpent(loaded.delta.levels)).toBe(0);
  });
});

describe('Challenge Cycles (§7.5, M15)', () => {
  const ready = () => withArms(delta({ allTimeWater: waterForSources(40) }), 'floodArm');

  it('are offered once the flood arm is open, until won', () => {
    expect(offeredCycleChallenges(delta())).toEqual([]);
    expect(offeredCycleChallenges(ready()).map((c) => c.id)).toEqual(['drought', 'flood', 'still']);
    expect(
      offeredCycleChallenges({ ...ready(), cycleChallenges: ['flood'] }).map((c) => c.id),
    ).toEqual(['drought', 'still']);
    expect(startNewCycle(delta({ allTimeWater: waterForSources(40) }), 'drought').cycles).toBe(2);
  });

  it('the dry year divides the Water, the flood and still water raise the prices', () => {
    const state = ready();
    const dry = startNewCycle(state, 'drought');
    expect(dry.cycleChallenge).toBe('drought');
    const free = startNewCycle(state);
    expect(waterMultiplier(dry) / waterMultiplier(free)).toBeCloseTo(0.25);
    const flood = startNewCycle(state, 'flood');
    expect(collectorCost(flood, 'roofTanks') / collectorCost(free, 'roofTanks')).toBe(10);
    const still = startNewCycle(state, 'still');
    expect(siteCost(still, 'wetlands') / siteCost(free, 'wetlands')).toBe(4);
  });

  it('gathering the goal wins the challenge, its species and its bonus', () => {
    const dry = startNewCycle(ready(), 'drought');
    expect(completeCycleChallenge(dry)).toBe(dry);
    const goal = CYCLE_CHALLENGES.drought.goal;
    const won = tick({ ...dry, allTimeWater: dry.allTimeWater + goal }, 0.1);
    expect(won.cycleChallenge).toBeNull();
    expect(won.cycleChallenges).toEqual(['drought']);
    expect(won.species).toContain('otter');
    expect(tick(won, 0.1).achievements).toContain('cycleChallenges.1');
    const after = startNewCycle({ ...won, allTimeWater: waterForSources(60) });
    expect(waterMultiplier(after)).toBeCloseTo(
      (waterMultiplier(startNewCycle(ready())) * 1.25 * (1 + 0.1 * 60)) / (1 + 0.1 * 40),
    );
  });

  it('the river species add to the Herbier without being needed to complete it', () => {
    const neighbourhood = SPECIES_IDS.filter(
      (id) => !['otter', 'salmon', 'blackStork'].includes(id),
    );
    expect(isHerbierComplete({ species: neighbourhood })).toBe(true);
    expect(isHerbierComplete({ species: neighbourhood.slice(1) })).toBe(false);
    const state = unlockSpecies({ ...ready(), cycleChallenges: ['flood', 'still'] });
    expect(state.species).toEqual(['salmon', 'blackStork']);
  });

  it('a save keeps the challenge running and the challenges won', () => {
    const state = { ...startNewCycle(ready(), 'still'), cycleChallenges: ['drought' as const] };
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.cycleChallenge).toBe('still');
    expect(loaded.cycleChallenges).toEqual(['drought']);
  });
});
