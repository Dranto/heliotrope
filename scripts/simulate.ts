// Prints the balancing simulator's pacing table (docs/game-design.md §8): `npm run simulate`.
// The first Season is played until it is advisable (10 Seeds), then a second Season is played
// with those Seeds to check that it reaches every event sooner (§12, milestone 3).
import { CHALLENGE_IDS } from '../src/game/challenges';
import { GENERATOR_IDS } from '../src/game/generators';
import { startNewSeason } from '../src/game/seasons';
import {
  learnReferenceTalents,
  PACING_TARGETS,
  REFERENCE_CLICKS_PER_SECOND,
  ADVISED_CYCLE_TARGET,
  CYCLE_TARGETS,
  simulateCycles,
  simulate,
  simulateFirstCycle,
  simulateSeasonsAfterCycle,
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

// Challenge Seasons (§7.3), played as the third Season.
console.log('\nChallenge Seasons, as the third Season (won at):');
for (const id of CHALLENGE_IDS) {
  const start = learnReferenceTalents(startNewSeason(second.state, id));
  const { challengeWon } = simulate({
    state: start,
    clicksPerSecond,
    maxSeconds: 2 * 3600,
    stopWhenWon: true,
  });
  console.log(id.padEnd(16), minutes(challengeWon).padStart(12));
}
console.log('Species back after two Seasons:', second.state.species.join(', ') || 'none');

// The Bioregion and the first Cycle of water (§7.4): each later Season doubles the Seeds.
const cycle = simulateFirstCycle({
  clicksPerSecond,
  from: second.state,
  elapsed: first.seconds + second.seconds,
});
console.log('\nBioregion opened at:', minutes(cycle.bioregionOpened));
console.log('Later Seasons:', cycle.seasons.map((s) => minutes(s)).join(' · '));
console.log(
  'First Cycle advisable at:',
  minutes(cycle.advisedCycle),
  `(target ${minutes(ADVISED_CYCLE_TARGET)})`,
);
console.log('Collectors:', JSON.stringify(cycle.state.collectors));
console.log('Sites:', JSON.stringify(cycle.state.sites));

// Later Seasons (§7): the first Cycle, then Seasons that each double the Seeds once they are ripe.
const after = simulateSeasonsAfterCycle({ clicksPerSecond, from: cycle.state, count: 6 });
console.log('Seasons after the first Cycle:', after.seasons.map((s) => minutes(s)).join(' · '));
console.log('Seeds after them:', after.state.seeds);

// The endgame (§8, M19): the Cycles after the first, each played until its Sources reach ×1.5,
// with the delta opened and widened and the tree sown as far as they go.
const endgame = simulateCycles({ clicksPerSecond, from: cycle.state, count: 5 });
console.log('\nCycle   Target     Simulated  Seasons                        Sources');
endgame.cycles.forEach((c, i) => {
  const target = CYCLE_TARGETS[i];
  console.log(
    String(i + 2).padEnd(8),
    (target === undefined ? '—' : minutes(target)).padStart(9),
    minutes(c.seconds).padStart(10),
    ' ',
    c.seasons
      .map((s) => minutes(s))
      .join(' · ')
      .padEnd(30),
    c.sources,
  );
});
console.log(
  'Delta:',
  JSON.stringify(endgame.state.delta.levels),
  JSON.stringify(endgame.state.delta.widths),
);
console.log(
  'Canopy complete:',
  Object.values(endgame.state.canopy.levels).join('/'),
  '· Seeds',
  endgame.state.seeds,
);
