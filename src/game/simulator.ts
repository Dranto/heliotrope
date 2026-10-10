// Headless balancing simulator (docs/game-design.md §8). Replays a simple active strategy with
// the game's own formulas and data, and reports when each pacing event of §8 happens.
import { GENERATOR_IDS, type GeneratorId } from './generators';
import { availableUpgrades, clickValue, generatorCost, lightPerSecond } from './production';
import { createInitialState, type GameState } from './state';
import { buyGenerator, buyUpgrade, earnLight, tick } from './tick';
import type { UpgradeId } from './upgrades';

/** Light earned in total that makes the first Season advisable: 10 Seeds (§7), 100 × 5e7. */
export const ADVISED_SEASON_LIGHT = 5e9;

/** Click rate of the reference active player used for the §8 pacing table. */
export const REFERENCE_CLICKS_PER_SECOND = 2.5;

export interface SimulationOptions {
  /** Clicks per second of the simulated active player. */
  clicksPerSecond?: number;
  /** Stop after this many seconds of play. */
  maxSeconds?: number;
  /** Longest uninterrupted wait before options are re-evaluated (new upgrades may unlock). */
  maxStepSeconds?: number;
}

export interface SimulationResult {
  /** Seconds of play when the first unit of each generator was bought. */
  firstGenerator: Partial<Record<GeneratorId, number>>;
  /** Seconds of play when the Season total reached ADVISED_SEASON_LIGHT. */
  advisedSeason?: number;
  /** State at the end of the simulation. */
  state: GameState;
  seconds: number;
}

type Option = { kind: 'generator'; id: GeneratorId } | { kind: 'upgrade'; id: UpgradeId };

function income(state: GameState, clicksPerSecond: number): number {
  return lightPerSecond(state) + clicksPerSecond * clickValue(state);
}

function apply(state: GameState, option: Option): GameState {
  return option.kind === 'generator'
    ? buyGenerator(state, option.id)
    : buyUpgrade(state, option.id);
}

function cost(state: GameState, option: Option): number {
  if (option.kind === 'generator') return generatorCost(state, option.id);
  return availableUpgrades(state).find((u) => u.id === option.id)!.cost;
}

/**
 * Best option: the lowest payback time (cost / income gained), counting the wait to afford it,
 * so a slightly better ratio does not stall the player for minutes.
 */
function bestOption(state: GameState, clicksPerSecond: number): Option {
  // A curious player tries each new generator as soon as it is affordable.
  const novelty = GENERATOR_IDS.find(
    (id) => state.generators[id] === 0 && state.resources.light >= generatorCost(state, id),
  );
  if (novelty) return { kind: 'generator', id: novelty };
  const current = income(state, clicksPerSecond);
  const options: Option[] = [
    ...GENERATOR_IDS.map((id) => ({ kind: 'generator', id }) as const),
    ...availableUpgrades(state).map((u) => ({ kind: 'upgrade', id: u.id }) as const),
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
  clicksPerSecond = REFERENCE_CLICKS_PER_SECOND,
  maxSeconds = 5 * 3600,
  maxStepSeconds = 10,
}: SimulationOptions = {}): SimulationResult {
  let state = createInitialState(0);
  let seconds = 0;
  const firstGenerator: SimulationResult['firstGenerator'] = {};
  let advisedSeason: number | undefined;

  while (seconds < maxSeconds) {
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
      // Tiny floating-point leftovers: top up rather than looping on sub-microsecond waits.
      if (price - state.resources.light > 1e-9 * price) {
        if (advisedSeason === undefined && state.totalLight >= ADVISED_SEASON_LIGHT) {
          advisedSeason = seconds;
        }
        continue;
      }
      state = earnLight(state, Math.max(0, price - state.resources.light));
    }
    state = apply(state, option);
    if (option.kind === 'generator' && firstGenerator[option.id] === undefined) {
      firstGenerator[option.id] = seconds;
    }
    if (advisedSeason === undefined && state.totalLight >= ADVISED_SEASON_LIGHT) {
      advisedSeason = seconds;
    }
  }
  return { firstGenerator, advisedSeason, state, seconds };
}

/** §8 pacing targets for a first active playthrough, in seconds. */
export const PACING_TARGETS: Record<GeneratorId | 'advisedSeason', number> = {
  pot: 15,
  balconyPanel: 60,
  rooftopGarden: 4 * 60,
  greenhouse: 12 * 60,
  verticalFarm: 30 * 60,
  mirrorPlant: 60 * 60,
  urbanCanopy: 2 * 3600,
  arcology: 3.5 * 3600,
  advisedSeason: 4 * 3600,
};
