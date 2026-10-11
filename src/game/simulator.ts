// Headless balancing simulator (docs/game-design.md §8). Replays a simple active strategy with
// the game's own formulas and data, and reports when each pacing event of §8 happens.
import {
  buyCollector,
  canBuyCollector,
  canRaiseSite,
  COLLECTOR_IDS,
  collectorCost,
  isBioregionOpen,
  raiseSite,
  SITE_IDS,
  siteCost,
} from './bioregion';
import { catchButterfly } from './butterfly';
import { ADVISED_FIRST_CYCLE_SOURCES, sourcesToGain, startNewCycle } from './cycles';
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { availableUpgrades, clickValue, generatorCost, lightPerSecond } from './production';
import { ADVISED_FIRST_SEASON_SEEDS, lightForSeeds, seedsToGain, startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { buyGenerator, buyUpgrade, canBuyGenerator, earnLight, tick } from './tick';
import type { UpgradeId } from './upgrades';
import { PARCELS, type ParcelId } from './parcels';
import { PROJECTS, type ProjectId } from './projects';
import { carryOutProject, offeredParcels, offeredProjects, restoreParcel } from './restoration';
import { learnTalent, type TalentId } from './talents';

/** Light earned in a Season that makes the first Season advisable: 10 Seeds (§7), 2e9. */
export const ADVISED_SEASON_LIGHT = lightForSeeds(ADVISED_FIRST_SEASON_SEEDS);

/** Click rate of the reference active player used for the §8 pacing table. */
export const REFERENCE_CLICKS_PER_SECOND = 2.5;

/** Share of Golden Butterflies the reference player catches. */
export const REFERENCE_BUTTERFLY_CATCH_RATE = 1;

export interface SimulationOptions {
  /** State to start from; a fresh game by default. */
  state?: GameState;
  /** Stop as soon as the Season total reaches ADVISED_SEASON_LIGHT. */
  stopWhenAdvised?: boolean;
  /** Stop as soon as the running challenge Season is won (§7.3). */
  stopWhenWon?: boolean;
  /** Clicks per second of the simulated active player. */
  clicksPerSecond?: number;
  /** Stop after this many seconds of play. */
  maxSeconds?: number;
  /** Longest uninterrupted wait before options are re-evaluated (new upgrades may unlock). */
  maxStepSeconds?: number;
  /** Share of Golden Butterflies the player catches (§9.2), deterministic: 0.5 = every other. */
  butterflyCatchRate?: number;
  /** Stop as soon as a new Season would bring this many Seeds. */
  stopAtSeeds?: number;
}

export interface SimulationResult {
  /** Seconds of play when the first unit of each generator was bought. */
  firstGenerator: Partial<Record<GeneratorId, number>>;
  /** Seconds of play when the Season total reached ADVISED_SEASON_LIGHT (2e9 Light). */
  advisedSeason?: number;
  /** Seconds of play when the running challenge Season was won (§7.3), to the nearest step. */
  challengeWon?: number;
  /** State at the end of the simulation. */
  state: GameState;
  seconds: number;
}

type Option =
  | { kind: 'generator'; id: GeneratorId }
  | { kind: 'upgrade'; id: UpgradeId }
  | { kind: 'parcel'; id: ParcelId }
  | { kind: 'project'; id: ProjectId };

function income(state: GameState, clicksPerSecond: number): number {
  return lightPerSecond(state) + clicksPerSecond * clickValue(state);
}

function apply(state: GameState, option: Option): GameState {
  switch (option.kind) {
    case 'generator':
      return buyGenerator(state, option.id);
    case 'upgrade':
      return buyUpgrade(state, option.id);
    case 'parcel':
      return restoreParcel(state, option.id);
    case 'project':
      return carryOutProject(state, option.id);
  }
}

function cost(state: GameState, option: Option): number {
  switch (option.kind) {
    case 'generator':
      return generatorCost(state, option.id);
    case 'upgrade':
      return availableUpgrades(state).find((u) => u.id === option.id)!.cost;
    case 'parcel':
      return PARCELS[option.id].cost;
    case 'project':
      return PROJECTS[option.id].cost;
  }
}

/**
 * Best option: the lowest payback time (cost / income gained), counting the wait to afford it,
 * so a slightly better ratio does not stall the player for minutes.
 */
function bestOption(state: GameState, clicksPerSecond: number): Option {
  // A curious player tries each new generator as soon as it is affordable.
  const novelty = GENERATOR_IDS.find(
    (id) => state.generators[id] === 0 && canBuyGenerator(state, id),
  );
  if (novelty) return { kind: 'generator', id: novelty };
  const current = income(state, clicksPerSecond);
  const options: Option[] = [
    ...GENERATOR_IDS.map((id) => ({ kind: 'generator', id }) as const),
    ...availableUpgrades(state).map((u) => ({ kind: 'upgrade', id: u.id }) as const),
    // Parcels and projects whose effect is not on income (butterflies, offline cap, discounts)
    // score no gain, so the reference player leaves them aside.
    ...offeredParcels(state).map((p) => ({ kind: 'parcel', id: p.id }) as const),
    ...offeredProjects(state).map((p) => ({ kind: 'project', id: p.id }) as const),
  ];
  let best = options[0]!;
  let bestScore = Infinity;
  for (const option of options) {
    const price = cost(state, option);
    // Evaluate the gain as if the option were already affordable.
    const rich = earnLight(state, price);
    const gain = income(apply(rich, option), clicksPerSecond) - current;
    if (gain <= 0) continue;
    const wait = Math.max(0, price - state.resources.light) / current;
    const score = wait + price / gain;
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best;
}

export function simulate({
  state: start = createInitialState(0),
  stopWhenAdvised = false,
  stopWhenWon = false,
  clicksPerSecond = REFERENCE_CLICKS_PER_SECOND,
  maxSeconds = 5 * 3600,
  maxStepSeconds = 10,
  butterflyCatchRate = REFERENCE_BUTTERFLY_CATCH_RATE,
  stopAtSeeds = Infinity,
}: SimulationOptions = {}): SimulationResult {
  let state = start;
  let butterfliesSeen = 0;
  let watching = false;
  /** Catch the butterfly on screen, or let it fly away, to match the catch rate. */
  const watchButterfly = () => {
    if (state.butterfly.visible <= 0) {
      watching = false;
      return;
    }
    if (watching) return;
    watching = true;
    butterfliesSeen += 1;
    const caughtBefore = Math.floor((butterfliesSeen - 1) * butterflyCatchRate);
    if (Math.floor(butterfliesSeen * butterflyCatchRate) > caughtBefore) {
      state = catchButterfly(state)?.state ?? state;
      watching = false;
    }
  };
  let seconds = 0;
  const firstGenerator: SimulationResult['firstGenerator'] = {};
  let advisedSeason: number | undefined;

  let challengeWon: number | undefined;
  while (
    seconds < maxSeconds &&
    !(stopWhenAdvised && advisedSeason !== undefined) &&
    !(stopWhenWon && challengeWon !== undefined) &&
    seedsToGain(state) < stopAtSeeds
  ) {
    state = tendBioregion(state, income(state, clicksPerSecond));
    if (challengeWon === undefined && state.challenges.length > start.challenges.length) {
      challengeWon = seconds;
      if (stopWhenWon) break;
    }
    const option = bestOption(state, clicksPerSecond);
    const price = cost(state, option);
    const rate = income(state, clicksPerSecond);
    const missing = price - state.resources.light;
    if (missing > 0) {
      const dt = Math.min(missing / rate, maxStepSeconds, maxSeconds - seconds);
      const clicks = clicksPerSecond * dt;
      state = earnLight(tick(state, dt), clicks * clickValue(state));
      state = { ...state, clicks: state.clicks + clicks };
      seconds += dt;
      watchButterfly();
      // Tiny floating-point leftovers: top up rather than looping on sub-microsecond waits.
      if (price - state.resources.light > 1e-9 * price) {
        if (advisedSeason === undefined && state.totalLight >= ADVISED_SEASON_LIGHT) {
          advisedSeason = seconds;
        }
        continue;
      }
      state = earnLight(state, Math.max(0, price - state.resources.light));
    }
    const bought = apply(state, option);
    if (bought === state) {
      // Nothing left worth buying (a challenge Season's limits, §7.3): keep playing.
      const dt = Math.min(maxStepSeconds, maxSeconds - seconds);
      state = earnLight(tick(state, dt), clicksPerSecond * dt * clickValue(state));
      state = { ...state, clicks: state.clicks + clicksPerSecond * dt };
      seconds += dt;
      watchButterfly();
      if (advisedSeason === undefined && state.totalLight >= ADVISED_SEASON_LIGHT) {
        advisedSeason = seconds;
      }
      continue;
    }
    state = bought;
    if (option.kind === 'generator' && firstGenerator[option.id] === undefined) {
      firstGenerator[option.id] = seconds;
    }
    if (advisedSeason === undefined && state.totalLight >= ADVISED_SEASON_LIGHT) {
      advisedSeason = seconds;
    }
  }
  return { firstGenerator, advisedSeason, challengeWon, state, seconds };
}

/** The reference player sets aside at most this many seconds of income for a water collector. */
export const REFERENCE_COLLECTOR_BUDGET = 60;

/**
 * The reference player's Bioregion (§7.4): Water has a single use, so every site level it affords
 * is raised, cheapest first; a collector is built whenever it costs no more than a minute of
 * income and the reserve covers it.
 */
export function tendBioregion(state: GameState, income: number): GameState {
  if (!isBioregionOpen(state)) return state;
  let next = state;
  for (;;) {
    const site = [...SITE_IDS]
      .sort((a, b) => siteCost(next, a) - siteCost(next, b))
      .find((id) => canRaiseSite(next, id));
    if (!site) break;
    next = raiseSite(next, site);
  }
  for (;;) {
    const collector = COLLECTOR_IDS.find(
      (id) =>
        canBuyCollector(next, id) && collectorCost(next, id) <= REFERENCE_COLLECTOR_BUDGET * income,
    );
    if (!collector) break;
    next = buyCollector(next, collector);
  }
  return next;
}

/**
 * Talents the reference player learns at the start of a Season, in this order, as far as the
 * Seeds go (§7.1): the gardeners and roofers first, then a little of each branch.
 */
export const REFERENCE_TALENTS: readonly TalentId[] = [
  'gardenersCoop',
  'nectarFlowers',
  'mycorrhiza',
  'roofersCoop',
  'hedgerows',
  'cuttings',
  'earlyDiversity',
  'nightWatch',
  'farmersCoop',
  'neighbourhoodCouncil',
  'longBloom',
  'livingSoil',
  'greatSwarm',
  'forestersCoop',
  'motherForest',
  'beeDance',
  'longMemory',
];

/** Learn the reference talents the Seeds left in the tree can pay for. */
export function learnReferenceTalents(state: GameState): GameState {
  return REFERENCE_TALENTS.reduce(learnTalent, state);
}

/**
 * Milestone 3 exit criterion (§12): play the first Season until it is advisable, start a new
 * Season, then play the second one for as long. Each pacing event should come sooner.
 */
export function simulateTwoSeasons(options: Omit<SimulationOptions, 'state'> = {}): {
  first: SimulationResult;
  second: SimulationResult;
} {
  const first = simulate({ ...options, stopWhenAdvised: true });
  const second = simulate({
    ...options,
    state: learnReferenceTalents(startNewSeason(first.state)),
    stopWhenAdvised: true,
  });
  return { first, second };
}

/** §7.4 pacing target: the first Cycle of water advisable, in seconds of play. */
export const ADVISED_CYCLE_TARGET = (3 + 10 / 60) * 3600;

/** §8 pacing targets for a first active playthrough, in seconds. */
export const PACING_TARGETS: Record<GeneratorId | 'advisedSeason', number> = {
  pot: 15,
  balconyPanel: 35,
  rooftopGarden: 1.5 * 60,
  greenhouse: 5.5 * 60,
  verticalFarm: 12 * 60,
  mirrorPlant: 26 * 60,
  urbanCanopy: 50 * 60,
  arcology: 80 * 60,
  advisedSeason: 100 * 60,
};

/**
 * The reference player's later Seasons: each one is played until it would at least double the
 * Seeds obtained so far (10 for the first one), then the reference talents are learnt.
 */
export const REFERENCE_SEED_GROWTH = 1;

export interface CycleSimulation {
  /** Seconds of play of each Season, in order. */
  seasons: number[];
  /** Seconds of play when the Bioregion opened (§7.4). */
  bioregionOpened?: number;
  /** Seconds of play when the first Cycle of water became advisable. */
  advisedCycle?: number;
  state: GameState;
}

/**
 * §7.4 pacing: play Season after Season, with the Bioregion from the third one, until the first
 * Cycle of water is advisable (ADVISED_FIRST_CYCLE_SOURCES Sources) or `maxSeconds` have passed.
 * `from` resumes a run already `elapsed` seconds in, e.g. after simulateTwoSeasons.
 */
export function simulateFirstCycle({
  maxSeconds = 12 * 3600,
  from = createInitialState(0),
  elapsed = 0,
  ...options
}: Omit<SimulationOptions, 'state' | 'stopAtSeeds'> & {
  from?: GameState;
  elapsed?: number;
} = {}): CycleSimulation {
  let state = from;
  let total = elapsed;
  const seasons: number[] = [];
  let bioregionOpened: number | undefined;
  while (total < maxSeconds && sourcesToGain(state) < ADVISED_FIRST_CYCLE_SOURCES) {
    if (bioregionOpened === undefined && isBioregionOpen(state)) bioregionOpened = total;
    const target = Math.max(
      ADVISED_FIRST_SEASON_SEEDS,
      Math.ceil(state.seeds * REFERENCE_SEED_GROWTH),
    );
    let played = 0;
    // Check the Sources between short stretches, so the Cycle is caught when it becomes advisable.
    while (played < 4 * 3600 && total < maxSeconds) {
      const stretch = Math.min(15 * 60, maxSeconds - total);
      const result = simulate({ ...options, state, stopAtSeeds: target, maxSeconds: stretch });
      state = result.state;
      played += result.seconds;
      total += result.seconds;
      if (seedsToGain(state) >= target || sourcesToGain(state) >= ADVISED_FIRST_CYCLE_SOURCES) {
        break;
      }
    }
    seasons.push(played);
    if (sourcesToGain(state) >= ADVISED_FIRST_CYCLE_SOURCES) break;
    state = learnReferenceTalents(startNewSeason(state));
  }
  const advisedCycle = sourcesToGain(state) >= ADVISED_FIRST_CYCLE_SOURCES ? total : undefined;
  return { seasons, bioregionOpened, advisedCycle, state };
}

/**
 * §7 pacing after the first Cycle of water: start it, then play `count` Seasons, each until it
 * at least doubles the Seeds (10 for the first one) and they are ripe. Returns each Season's
 * length in seconds of play.
 */
export function simulateSeasonsAfterCycle({
  from,
  count,
  ...options
}: Omit<SimulationOptions, 'state' | 'stopAtSeeds' | 'maxSeconds'> & {
  from: GameState;
  count: number;
}): { seasons: number[]; state: GameState } {
  let state = learnReferenceTalents(startNewCycle(from));
  const seasons: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const target = Math.max(
      ADVISED_FIRST_SEASON_SEEDS,
      Math.ceil(state.seeds * REFERENCE_SEED_GROWTH),
    );
    const result = simulate({ ...options, state, stopAtSeeds: target, maxSeconds: 4 * 3600 });
    seasons.push(result.seconds);
    state = learnReferenceTalents(startNewSeason(result.state));
  }
  return { seasons, state };
}
