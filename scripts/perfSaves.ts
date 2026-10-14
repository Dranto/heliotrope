// Saves for `npm run perf` (docs/performance-plan.md, lot 0), played by the balancing simulator:
// the middle of the first Season, the end of the second, and a first Cycle of water within reach.
import { writeFileSync } from 'node:fs';
import { serialize } from '../src/game/save';
import { simulate, simulateFirstCycle, simulateTwoSeasons } from '../src/game/simulator';
import { createInitialState } from '../src/game/state';

const out = process.argv[2]!;
const season1 = simulate({ state: createInitialState(0), maxSeconds: 25 * 60 }).state;
const { second } = simulateTwoSeasons({});
const cycle = simulateFirstCycle({ from: second.state }).state;
for (const [name, state] of Object.entries({ season1, season2: second.state, cycle })) {
  writeFileSync(`${out}/${name}.json`, serialize(state));
}
