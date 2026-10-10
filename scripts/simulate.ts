// Prints the balancing simulator's pacing table (docs/game-design.md §8): `npm run simulate`.
import { GENERATOR_IDS } from '../src/game/generators';
import { PACING_TARGETS, REFERENCE_CLICKS_PER_SECOND, simulate } from '../src/game/simulator';

const clicksPerSecond = Number(process.argv[2] ?? REFERENCE_CLICKS_PER_SECOND);
const result = simulate({ clicksPerSecond });

function minutes(seconds: number | undefined): string {
  return seconds === undefined ? '—' : `${(seconds / 60).toFixed(1)} min`;
}

const rows = [
  ...GENERATOR_IDS.map((id) => [id, PACING_TARGETS[id], result.firstGenerator[id]] as const),
  ['advisedSeason', PACING_TARGETS.advisedSeason, result.advisedSeason] as const,
];
console.log(`Active player, ${clicksPerSecond} clicks/s\n`);
console.log(
  'event'.padEnd(16),
  'target'.padStart(12),
  'simulated'.padStart(12),
  'ratio'.padStart(7),
);
for (const [event, target, actual] of rows) {
  const ratio = actual === undefined ? '—' : (actual / target).toFixed(2);
  console.log(
    event.padEnd(16),
    minutes(target).padStart(12),
    minutes(actual).padStart(12),
    ratio.padStart(7),
  );
}
console.log(`\nUpgrades bought: ${result.state.upgrades.length}`);
console.log('Owned:', JSON.stringify(result.state.generators));
console.log('Total light:', result.state.totalLight.toExponential(2));
