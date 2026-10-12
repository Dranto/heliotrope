// The map of the region (docs/game-design.md §7.6): the home city in the middle, the sister
// cities founded around it in order, each in its landscape, joined by golden threads; the city
// lived in wears a ring.
import type { CityKind, LandscapeId } from '../game/cityData';
import { formatNumber } from '../game/format';
import { t } from '../i18n';

/** Where each city stands, in order of founding: the first one is the home city. */
const SPOTS: [number, number][] = [
  [160, 92],
  [70, 52],
  [252, 54],
  [70, 140],
  [254, 138],
  [160, 30],
  [160, 156],
  [24, 96],
  [298, 96],
];

export function RegionMap({
  founded,
  landscape,
}: {
  founded: readonly CityKind[];
  landscape: LandscapeId | null;
}) {
  // Every city: the ones left behind, then the one lived in.
  const cities: CityKind[] = [...founded, landscape ?? 'home'];
  const at = (i: number) => SPOTS[i % SPOTS.length]!;
  return (
    <svg
      viewBox="0 0 320 180"
      className="region-map"
      role="img"
      aria-label={t.cities.regionLabel(formatNumber(cities.length))}
    >
      <rect className="region-land" x="2" y="2" width="316" height="176" rx="14" />
      <path className="region-river" d="M0 120c50-12 80 16 130 0s70-50 120-36 50 26 70 20" />
      {cities.slice(1).map((_, i) => {
        const [x1, y1] = at(i);
        const [x2, y2] = at(i + 1);
        return <path key={i} className="region-thread" d={`M${x1} ${y1}L${x2} ${y2}`} />;
      })}
      {cities.map((kind, i) => {
        const [x, y] = at(i);
        const current = i === cities.length - 1;
        return (
          <g key={i} transform={`translate(${x} ${y})`} data-current={current}>
            {current && <ellipse className="region-here" rx="26" ry="18" />}
            <CityGlyph kind={kind} />
          </g>
        );
      })}
    </svg>
  );
}

/** A small city of a kind, drawn around (0, 0) in a 40 × 28 box. */
export function CityGlyph({ kind }: { kind: CityKind }) {
  return (
    <g className="city-glyph" data-kind={kind}>
      {kind === 'coast' && <path className="city-sea" d="M-20 6q5-3 10 0t10 0 10 0 10 0V14H-20Z" />}
      {kind === 'mountain' && <path className="city-peak" d="M-20 4 -10 -12 -2 0 6 -9 20 4Z" />}
      {kind === 'plain' && (
        <g className="city-field">
          <path d="M-20 4h40v10h-40Z" />
          <path className="city-furrow" d="M-18 7h36M-18 10h36M-18 13h36" />
        </g>
      )}
      {kind === 'forest' && (
        <g className="city-wood">
          <circle cx="-16" cy="-4" r="5" />
          <circle cx="-9" cy="-7" r="4.4" />
          <circle cx="12" cy="-6" r="4.6" />
          <circle cx="18" cy="-2" r="4" />
        </g>
      )}
      {kind === 'marsh' && (
        <g className="city-marsh">
          <ellipse cx="0" cy="10" rx="18" ry="3.6" />
          <path className="city-reed" d="M-16 9v-9M-14 9v-7M15 9v-8M17 9v-6" />
        </g>
      )}
      {kind === 'home' && <circle className="city-flower" cx="0" cy="-8" r="3.4" />}
      <path className="city-house" d="M-11 6v-6l4-3 4 3v6Z" />
      <path className="city-house" d="M-2 6v-9l5-4 5 4v9Z" />
      <path className="city-house" d="M9 6v-5l3-2.5 3 2.5v5Z" />
      <path className="city-roof" d="M-3 -3 3 -8 9 -3" />
      <circle className="city-tree" cx="-14" cy="3" r="2.6" />
      <circle className="city-tree" cx="17" cy="3" r="2.4" />
    </g>
  );
}
