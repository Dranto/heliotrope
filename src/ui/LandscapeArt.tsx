// The landscape of a sister city on the map (docs/game-design.md §7.6, M23), at the edges of the
// Bioregion's land: the sea and its beach to the east for the coast, a ridge of snowy peaks to
// the north for the mountain, fields of wheat to the south for the plain. Drawn in SVG over both
// maps; the home city has none.
import { memo } from 'react';
import type { LandscapeId } from '../game/cityData';
import { LAND } from './bioregionMap';
import './cities.css';

const [X, Y, W, H] = LAND;
const RIGHT = X + W;
const BOTTOM = Y + H;
/** Where each landscape begins, just inside the Bioregion view's frame (VIEW_FRAMES[4]). */
const SHORE = 1180;
const FOOTHILLS = -400;
const FIELDS = 900;

function Coast() {
  const waves = [-400, -150, 100, 350, 600, 850];
  return (
    <g className="landscape" data-landscape="coast">
      <path
        className="landscape-beach"
        d={`M${SHORE - 70} ${Y}H${RIGHT}V${BOTTOM}H${SHORE - 90}Z`}
      />
      <path
        className="landscape-sea"
        d={`M${SHORE} ${Y}C${SHORE + 40} ${Y + H / 3} ${SHORE - 40} ${Y + (2 * H) / 3} ${SHORE + 10} ${BOTTOM}H${RIGHT}V${Y}Z`}
      />
      {waves.map((y) => (
        <path key={y} className="landscape-foam" d={`M${SHORE + 30} ${y}q40-20 80 0t80 0 80 0`} />
      ))}
    </g>
  );
}

function Mountain() {
  const peaks = Array.from({ length: 9 }, (_, i) => X + 150 + i * ((W - 300) / 8));
  return (
    <g className="landscape" data-landscape="mountain">
      {peaks.map((x, i) => {
        const h = 220 + ((i * 97) % 5) * 40;
        return (
          <g key={x}>
            <path
              className="landscape-peak"
              d={`M${x - 260} ${FOOTHILLS}L${x} ${FOOTHILLS - h}L${x + 260} ${FOOTHILLS}Z`}
            />
            <path
              className="landscape-snow"
              d={`M${x - 70} ${FOOTHILLS - h + 70}L${x} ${FOOTHILLS - h}L${x + 70} ${FOOTHILLS - h + 70}l-30 -10l-20 16l-20 -16Z`}
            />
          </g>
        );
      })}
    </g>
  );
}

function Plain() {
  const colours = ['#f0d98a', '#e6c66a', '#d9e4a0', '#f3e2a6'];
  const width = W / 8;
  return (
    <g className="landscape" data-landscape="plain">
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          className="landscape-field"
          x={X + i * width}
          y={FIELDS}
          width={width}
          height={BOTTOM - FIELDS}
          fill={colours[i % colours.length]}
        />
      ))}
    </g>
  );
}

function Landscape({ landscape }: { landscape: LandscapeId | null }) {
  if (landscape === 'coast') return <Coast />;
  if (landscape === 'mountain') return <Mountain />;
  if (landscape === 'plain') return <Plain />;
  return null;
}

export const LandscapeLayer = memo(Landscape);
