// The buildings that grow (docs/game-design.md §5.5, M26), on the map: each tier reached with a
// path picked crowns the building's first places with a mark in the path's colour, gold for the
// first path and lilac for the second: a wreath of leaves, then a flower, then a halo. Drawn in
// SVG over both renderers, like the great works (§10.4).
import { memo } from 'react';
import './growth.css';
import type { GeneratorId } from '../game/generators';
import { t } from '../i18n';
import { GROWTH_ANCHORS } from './growthMap';

function parse(encoded: string): [GeneratorId, string][] {
  return encoded
    .split(',')
    .map((part) => part.split(':') as [GeneratorId, string])
    .filter(([, marks]) => marks && marks.replaceAll('-', '').length > 0);
}

const LEAVES = [0, 60, 120, 180, 240, 300];
const PETALS = [0, 72, 144, 216, 288];

function Crown({ marks }: { marks: string }) {
  return (
    <>
      {marks[2] && marks[2] !== '-' && (
        <g className="growth-halo" data-path={marks[2]}>
          <circle r="13" />
          {[45, 135, 225, 315].map((angle) => (
            <path key={angle} d="M0 -16v-4" transform={`rotate(${angle})`} />
          ))}
        </g>
      )}
      {marks[0] && marks[0] !== '-' && (
        <g className="growth-wreath" data-path={marks[0]}>
          {LEAVES.map((angle) => (
            <ellipse key={angle} cx="0" cy="-8" rx="1.6" ry="3" transform={`rotate(${angle})`} />
          ))}
          {LEAVES.map((angle) => (
            <circle
              key={angle}
              className="growth-berry"
              cx="0"
              cy="-8"
              r="1"
              transform={`rotate(${angle + 30})`}
            />
          ))}
        </g>
      )}
      {marks[1] && marks[1] !== '-' && (
        <g className="growth-flower" data-path={marks[1]} transform="translate(0 -11)">
          {PETALS.map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-2.4"
              rx="1.6"
              ry="2.6"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle className="growth-heart" r="1.3" />
        </g>
      )}
    </>
  );
}

export const GrowthLayer = memo(function GrowthLayer({
  growth,
  flying = false,
  reduced = false,
}: {
  growth: string;
  /** A pollen flight crosses the city: the marks shine (§5.7). */
  flying?: boolean;
  reduced?: boolean;
}) {
  const grown = parse(growth);
  if (grown.length === 0) return null;
  return (
    <g
      className="growth-marks"
      data-flying={flying || undefined}
      data-reduced={reduced || undefined}
      aria-hidden="true"
    >
      {grown.map(([id, marks]) =>
        GROWTH_ANCHORS[id].map(([x, y], i) => (
          <g key={`${id}-${i}`} data-growth={id} transform={`translate(${x} ${y})`}>
            <title>{t.growth.forms[id][marks.length - 1]}</title>
            <Crown marks={marks} />
          </g>
        )),
      )}
    </g>
  );
});
