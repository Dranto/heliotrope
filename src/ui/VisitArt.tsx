// Visits to the neighbourhood on the map (docs/game-design.md §9.6): the neighbours' cargo bike
// with its trailer of cuttings on the avenue below the home block, a summer cloud raining on
// the rooftop gardens, a flock of migrating birds wheeling over the north-east crossroads; then,
// from the whole city (M18), a flock of sheep, a harvest festival stall, fireflies over reeds and a
// solar flea market. Each one breathes a golden ring while it can be welcomed with a click (or Enter).
import { memo, type KeyboardEvent } from 'react';
import type { VisitKind } from '../game/visits';
import { t } from '../i18n';
import type { Daylight } from './daylight';
import { TREES } from './neighbourhood';
import './visits.css';

/**
 * Where each visitor stays on the map, in world units: inside the first view (the home block and
 * its streets, so every player sees them) and beside the flower, never under it.
 */
const VISIT_PLACES: Record<VisitKind, [number, number]> = {
  cuttings: [248, 309],
  shower: [240, 228],
  birds: [390, 186],
  // The visitors of the city (M18) come in from the edges of the home block too.
  sheep: [310, 300],
  festival: [372, 236],
  fireflies: [262, 188],
  fleaMarket: [360, 188],
};

/** Visitors are drawn larger than life so they read at every zoom. */
const VISIT_SCALE = 1.4;

/** Radius of the golden ring around each visitor, in drawing units. */
const RING: Record<VisitKind, number> = {
  cuttings: 18,
  shower: 21,
  birds: 19,
  sheep: 20,
  festival: 19,
  fireflies: 18,
  fleaMarket: 18,
};

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
        <path
          className="visit-cloud-belly"
          d="M-15 4c-4 0-6-3-5-6 1-3 4-4 7-3 1-5 6-8 11-6 3-4 9-4 12 0 4-1 8 2 8 6 3 1 4 4 3 6-1 2-3 3-5 3Z"
        />
        {/* The sunlit top, lifted off the lilac belly so the cloud reads as a volume. */}
        <path
          className="visit-cloud-top"
          d="M-14 1c-3 0-5-2-4-4 1-3 4-3 6-2 1-5 6-7 10-5 3-4 9-4 12 0 4-1 7 2 7 5 3 1 3 3 2 5-1 1-2 1-4 1Z"
        />
        <path
          className="visit-cloud-light"
          d="M-12-3c1-2 3-2 4-1M-3-8c2-2 5-2 7 0M8-8c2-1 4 0 5 1"
        />
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

/** The transhumance: a small flock of sheep from the agrivoltaic meadows, and their dog. */
function Sheep() {
  const flock: [number, number][] = [
    [-12, -4],
    [-4, -7],
    [4, -3],
    [-8, 4],
    [1, 5],
    [10, 2],
  ];
  return (
    <g className="visit-sheep">
      <g className="visit-arrive">
        <ellipse className="visit-shadow" cx="0" cy="3" rx="18" ry="8" />
        {flock.map(([x, y], i) => (
          <g key={i} className="visit-ewe" style={{ animationDelay: `${-i * 0.3}s` }}>
            <g transform={`translate(${x} ${y})`}>
              <path
                className="visit-wool"
                d="M-3.4 0c0-1.6 1-2.6 2.2-2.4C-.6-3.4.8-3.4 1.4-2.4 2.8-2.6 3.6-1.4 3.4 0c.2 1.4-.6 2.6-2 2.4C.8 3.4-.6 3.4-1.2 2.4-2.6 2.6-3.6 1.6-3.4 0Z"
              />
              <ellipse className="visit-ewe-head" cx="4.2" cy="0" rx="1.5" ry="1.1" />
            </g>
          </g>
        ))}
        {/* The sheepdog, a little ahead. */}
        <ellipse className="visit-dog" cx="16" cy="-6" rx="2.6" ry="1.3" />
        <circle className="visit-dog" cx="18.6" cy="-6.2" r="1.1" />
      </g>
    </g>
  );
}

/** The harvest festival of the park-and-ride halls: bunting over a stall full of produce. */
function Festival() {
  const flags = ['#e48a7c', '#f4c063', '#8fae8b', '#7fb2d0', '#e48a7c', '#f4c063'];
  return (
    <g className="visit-festival">
      <ellipse className="visit-shadow" cx="1" cy="9" rx="14" ry="4" />
      <rect className="visit-stall" x="-11" y="-2" width="22" height="10" rx="1.6" />
      {[
        [-7, 1, '#e07a4f'],
        [-2, 2, '#c8453a'],
        [3, 1, '#d6b45a'],
        [8, 2, '#6fae5b'],
        [-5, 5, '#d6b45a'],
        [1, 5, '#e07a4f'],
        [6, 5, '#6fae5b'],
      ].map(([x, y, fill]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r="1.8" fill={fill as string} />
      ))}
      <path className="visit-bunting-line" d="M-15 -9Q0 -4 15 -9" />
      <g className="visit-bunting">
        {flags.map((fill, i) => {
          const x = -12.5 + i * 5;
          const y = -8 + Math.sin(((i + 0.5) / 6) * Math.PI) * 3.4;
          return <path key={i} d={`M${x - 1.6} ${y}h3.2l-1.6 3.2Z`} fill={fill} />;
        })}
      </g>
    </g>
  );
}

/** The fireflies of the water gardens: points of light blinking over a clump of reeds. */
function Fireflies() {
  const lights: [number, number][] = [
    [-9, -6],
    [-3, -10],
    [4, -7],
    [10, -3],
    [-11, 2],
    [-4, 0],
    [6, 2],
    [1, -3],
    [9, 7],
  ];
  return (
    <g className="visit-fireflies">
      {[-4, -1, 2, 5].map((x, i) => (
        <path
          key={x}
          className="visit-reed"
          d={`M${x} 12q${i % 2 ? 1 : -1} -6 ${i % 2 ? 2 : -2} -10`}
        />
      ))}
      {lights.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <g className="visit-firefly" style={{ animationDelay: `${-i * 0.37}s` }}>
            <circle className="visit-firefly-glow" r="4" />
            <circle className="visit-firefly-light" r="1.3" />
          </g>
        </g>
      ))}
    </g>
  );
}

/** The solar flea market of the workshops: a striped parasol over a table of second-hand panels. */
function FleaMarket() {
  return (
    <g className="visit-flea">
      <ellipse className="visit-shadow" cx="2" cy="4" rx="15" ry="6" />
      <rect className="visit-flea-table" x="-2" y="-4" width="16" height="10" rx="1.2" />
      {[0, 5, 10].map((x) => (
        <rect
          key={x}
          className="visit-flea-panel"
          x={x - 0.5}
          y="-2.6"
          width="4"
          height="3"
          rx="0.4"
        />
      ))}
      <rect className="visit-flea-panel" x="2" y="1.6" width="6" height="3" rx="0.4" />
      <g className="visit-parasol">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i * Math.PI) / 4;
          const b = ((i + 1) * Math.PI) / 4;
          const r = 9;
          return (
            <path
              key={i}
              d={`M-7 -2L${-7 + r * Math.cos(a)} ${-2 + r * Math.sin(a)}A${r} ${r} 0 0 1 ${-7 + r * Math.cos(b)} ${-2 + r * Math.sin(b)}Z`}
              className={i % 2 ? 'visit-parasol-a' : 'visit-parasol-b'}
            />
          );
        })}
        <circle cx="-7" cy="-2" r="1" className="visit-parasol-top" />
      </g>
    </g>
  );
}

const ART: Record<VisitKind, () => React.JSX.Element> = {
  cuttings: Cuttings,
  shower: Shower,
  birds: Birds,
  sheep: Sheep,
  festival: Festival,
  fireflies: Fireflies,
  fleaMarket: FleaMarket,
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
 * Evening and night over the map (§9.6), from the player's clock. Two layers over the whole map,
 * so both renderers get them: a veil that darkens what lies beneath (multiply, warm in the evening,
 * deep blue at night) and, above it, the lanterns of the streets, which the veil leaves lit.
 * Decoration only: production does not change.
 */
export const NightLights = memo(function NightLights({
  daylight,
  camera,
  width,
  height,
}: {
  daylight: Daylight;
  camera: string;
  width: number;
  height: number;
}) {
  if (daylight === 'day') return null;
  return (
    <>
      <svg
        className="night-veil"
        data-daylight={daylight}
        viewBox="0 0 10 10"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect width="10" height="10" />
      </svg>
      <svg
        className="night"
        data-daylight={daylight}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="night-lantern-glow">
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.75" />
            <stop offset="0.35" stopColor="#ffc46b" stopOpacity="0.32" />
            <stop offset="1" stopColor="#ffb85c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="camera" style={{ transform: camera }}>
          {LANTERNS.map(([x, y]) => (
            <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
              <circle className="night-lantern-glow" r="9" fill="url(#night-lantern-glow)" />
              <circle className="night-lantern" r="1.1" />
            </g>
          ))}
        </g>
      </svg>
    </>
  );
});
