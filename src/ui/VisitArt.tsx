// Visits to the neighbourhood on the map (docs/game-design.md §9.6): the neighbours' cargo bike
// with its trailer of cuttings on the avenue below the home block, a summer cloud raining on
// the rooftop gardens, a flock of migrating birds wheeling over the north-east crossroads. Each
// one breathes a golden ring while it can be welcomed with a click (or Enter).
import { memo, type KeyboardEvent } from 'react';
import type { VisitKind } from '../game/visits';
import { t } from '../i18n';
import type { Daylight } from './daylight';
import { TREES, WORLD } from './neighbourhood';
import './visits.css';

/**
 * Where each visitor stays on the map, in world units: inside the first view (the home block and
 * its streets, so every player sees them) and beside the flower, never under it.
 */
const VISIT_PLACES: Record<VisitKind, [number, number]> = {
  cuttings: [248, 309],
  shower: [240, 228],
  birds: [390, 186],
};

/** Visitors are drawn larger than life so they read at every zoom. */
const VISIT_SCALE = 1.4;

/** Radius of the golden ring around each visitor, in drawing units. */
const RING: Record<VisitKind, number> = { cuttings: 18, shower: 21, birds: 19 };

function Cuttings() {
  return (
    <g className="visit-cuttings">
      <g className="visit-arrive">
        <ellipse className="visit-shadow" cx="1" cy="2" rx="16" ry="6" />
        {/* The trailer: a wooden crate full of young plants. */}
        <rect className="visit-crate" x="-16" y="-6" width="14" height="12" rx="2" />
        {[-13, -9, -5].map((x, i) => (
          <g key={x} className="visit-cutting" style={{ animationDelay: `${-i * 0.6}s` }}>
            <path d={`M${x} 3V-2`} />
            <path d={`M${x} -1c-2 0-3-1.5-3-3 2 0 3 1.5 3 3zm0 0c2 0 3-1.5 3-3-2 0-3 1.5-3 3z`} />
          </g>
        ))}
        <path className="visit-hitch" d="M-2 0h4" />
        {/* The bike, heading right, its rider's straw hat seen from above. */}
        <path className="visit-wheel" d="M3 -4.6h4M3 4.6h4M13 0h4" />
        <rect className="visit-frame" x="2" y="-3.4" width="11" height="6.8" rx="2" />
        <circle className="visit-hat" cx="9" cy="0" r="3.4" />
        <circle className="visit-hat-band" cx="9" cy="0" r="1.8" />
      </g>
    </g>
  );
}

function Shower() {
  return (
    <g className="visit-shower">
      <g className="visit-rain">
        {[-12, -6, 0, 6, 12].map((x, i) => (
          <path key={x} d={`M${x} 6l-2 9`} style={{ animationDelay: `${-i * 0.23}s` }} />
        ))}
      </g>
      <g className="visit-cloud">
        <ellipse className="visit-cloud-shadow" cx="3" cy="16" rx="16" ry="4" />
        <path d="M-15 4c-4 0-6-3-5-6 1-3 4-4 7-3 1-5 6-8 11-6 3-4 9-4 12 0 4-1 8 2 8 6 3 1 4 4 3 6-1 2-3 3-5 3Z" />
      </g>
    </g>
  );
}

/** A small bird seen from above, wings spread. */
function Bird({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className="visit-bird"
        style={{ animationDelay: `${delay}s` }}
        d="M-4 -1C-2 -2.4-1 -1.6 0 0c1-1.6 2-2.4 4-1M0 0v1.2"
      />
    </g>
  );
}

function Birds() {
  const flock: [number, number][] = [
    [0, -6],
    [-5, -2],
    [5, -2],
    [-10, 2],
    [10, 2],
    [-15, 6],
    [15, 6],
  ];
  return (
    <g className="visit-birds">
      <g className="visit-flock">
        {flock.map(([x, y], i) => (
          <Bird key={i} x={x} y={y} delay={-i * 0.15} />
        ))}
      </g>
    </g>
  );
}

const ART: Record<VisitKind, () => React.JSX.Element> = {
  cuttings: Cuttings,
  shower: Shower,
  birds: Birds,
};

/** The visitor on the map, if any; `onWelcome` welcomes it. */
export const VisitLayer = memo(function VisitLayer({
  kind,
  onWelcome,
}: {
  kind: VisitKind | null;
  onWelcome: () => void;
}) {
  if (kind === null) return null;
  const [x, y] = VISIT_PLACES[kind];
  const Art = ART[kind];
  const label = t.visits.welcome[kind];
  function onKey(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onWelcome();
  }
  return (
    <g
      className="visit"
      data-visit={kind}
      role="button"
      tabIndex={0}
      aria-label={label}
      transform={`translate(${x} ${y}) scale(${VISIT_SCALE})`}
      onClick={onWelcome}
      onKeyDown={onKey}
    >
      <title>{label}</title>
      <circle className="visit-ring" r={RING[kind]} />
      <circle className="visit-hit" r={RING[kind]} />
      <Art />
    </g>
  );
});

/** Lanterns along the streets: every fourth street tree has one at its foot. */
const LANTERNS = TREES.filter((_, i) => i % 4 === 0).map(({ x, y }) => [x + 5, y + 3] as const);

/**
 * Evening and night over the map (§9.6), from the player's clock: a warm, then a blue veil, and
 * the lanterns of the streets lit. Decoration only: production does not change.
 */
export const NightLights = memo(function NightLights({ daylight }: { daylight: Daylight }) {
  if (daylight === 'day') return null;
  return (
    <g className="night" data-daylight={daylight} aria-hidden="true">
      <rect
        className="night-veil"
        x={-WORLD.width}
        y={-WORLD.height}
        width={WORLD.width * 3}
        height={WORLD.height * 3}
      />
      {LANTERNS.map(([x, y]) => (
        <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
          <circle className="night-lantern-glow" r="6" />
          <circle className="night-lantern" r="1.3" />
        </g>
      ))}
    </g>
  );
});
