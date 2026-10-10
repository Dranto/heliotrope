// Prints the balancing simulator's pacing table (docs/game-design.md §8): `npm run simulate`.
// The first Season is played until it is advisable (10 Seeds), then a second Season is played
// with those Seeds to check that it reaches every event sooner (§12, milestone 3).
import { GENERATOR_IDS } from '../src/game/generators';
import {
  PACING_TARGETS,
  REFERENCE_CLICKS_PER_SECOND,
  simulateTwoSeasons,
} from '../src/game/simulator';

const clicksPerSecond = Number(process.argv[2] ?? REFERENCE_CLICKS_PER_SECOND);
const { first, second } = simulateTwoSeasons({ clicksPerSecond });

function minutes(seconds: number | undefined): string {
  return seconds === undefined ? '—' : `${(seconds / 60).toFixed(1)} min`;
}

const rows = [
  ...GENERATOR_IDS.map(
    (id) => [id, PACING_TARGETS[id], first.firstGenerator[id], second.firstGenerator[id]] as const,
  ),
  [
    'advisedSeason',
    PACING_TARGETS.advisedSeason,
    first.advisedSeason,
    second.advisedSeason,
  ] as const,
];
console.log(`Active player, ${clicksPerSecond} clicks/s\n`);
console.log(
  'event'.padEnd(16),
  'target'.padStart(12),
  'season 1'.padStart(12),
  'ratio'.padStart(7),
  'season 2'.padStart(12),
);
for (const [event, target, actual, next] of rows) {
  const ratio = actual === undefined ? '—' : (actual / target).toFixed(2);
  console.log(
    event.padEnd(16),
    minutes(target).padStart(12),
    minutes(actual).padStart(12),
    ratio.padStart(7),
    minutes(next).padStart(12),
  );
}
for (const [name, result] of [
  ['Season 1', first],
  ['Season 2', second],
] as const) {
  console.log(`\n${name}: ${result.state.upgrades.length} upgrades bought`);
  console.log('Owned:', JSON.stringify(result.state.generators));
  console.log('Parcels restored:', result.state.parcels.join(', ') || 'none');
  console.log('Projects carried out:', result.state.projects.join(', ') || 'none');
  console.log('Talents learnt:', result.state.talents.join(', ') || 'none');
  console.log('Cooperative purchases:', JSON.stringify(result.state.cooperatives.purchases));
  console.log(
    'Seeds owned:',
    result.state.seeds,
    '· Season light:',
    result.state.totalLight.toExponential(2),
  );
}
