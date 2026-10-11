// The landscape of a sister city (docs/game-design.md §7.6, M23), drawn on the Bioregion's land
// between its hills, inside the Bioregion view's frame (VIEW_FRAMES[4]): a bay of the sea and
// its beach to the east for the coast, a ridge of snowy peaks to the north for the mountain,
// fields of wheat to the south for the plain. Part of the land, so both renderers draw it (the
// PixiJS map takes it from here, see pixi/sources.tsx); the home city has none.
import type { LandscapeId } from '../game/cityData';
import './cities.css';

/** The bay: from the shore to beyond the frame, between the two eastern hills. */
const SHORE = 1250;
const BAY_TOP = -80;
const BAY_BOTTOM = 540;
/** The ridge: between the two northern hills, its foot just inside the frame. */
const RIDGE = { from: -120, to: 740, foot: -430 };
/** The fields: between the two southern hills, from just inside the frame. */
const FIELDS = { from: -150, to: 900, top: 920, bottom: 1300 };

function Coast() {
  const mid = (BAY_TOP + BAY_BOTTOM) / 2;
  const waves = [BAY_TOP + 90, mid - 60, mid + 60, BAY_BOTTOM - 90];
  return (
    <g className="landscape" data-landscape="coast">
      <path
        className="landscape-beach"
        d={`M2400 ${BAY_TOP - 60}H${SHORE + 60}C${SHORE - 70} ${BAY_TOP + 60} ${SHORE - 90} ${BAY_BOTTOM - 60} ${SHORE + 60} ${BAY_BOTTOM + 60}H2400Z`}
      />
      <path
        className="landscape-sea"
        d={`M2400 ${BAY_TOP}H${SHORE + 80}C${SHORE - 20} ${BAY_TOP + 90} ${SHORE - 40} ${BAY_BOTTOM - 90} ${SHORE + 80} ${BAY_BOTTOM}H2400Z`}
      />
      {waves.map((y) => (
        <path key={y} className="landscape-foam" d={`M${SHORE + 40} ${y}q30-16 60 0t60 0 60 0`} />
      ))}
    </g>
  );
}

function Mountain() {
  const count = 6;
  const step = (RIDGE.to - RIDGE.from) / (count - 1);
  return (
    <g className="landscape" data-landscape="mountain">
      {Array.from({ length: count }, (_, i) => {
        const x = RIDGE.from + i * step;
        const h = 200 + ((i * 3) % 4) * 45;
        const top = RIDGE.foot - h;
        return (
          <g key={x}>
            <path
              className="landscape-peak"
              d={`M${x - 150} ${RIDGE.foot}L${x} ${top}L${x + 150} ${RIDGE.foot}Z`}
            />
            <path
              className="landscape-snow"
              d={`M${x - 45} ${top + 60}L${x} ${top}L${x + 45} ${top + 60}l-18 -8l-14 12l-13 -12Z`}
            />
          </g>
        );
      })}
    </g>
  );
}

function Plain() {
  const colours = ['#f0d98a', '#e6c66a', '#d9e4a0', '#f3e2a6'];
  const count = 7;
  const width = (FIELDS.to - FIELDS.from) / count;
  return (
    <g className="landscape" data-landscape="plain">
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          className="landscape-field"
          x={FIELDS.from + i * width}
          y={FIELDS.top}
          width={width}
          height={FIELDS.bottom - FIELDS.top}
          fill={colours[i % colours.length]}
        />
      ))}
    </g>
  );
}

export function LandscapeArt({ landscape }: { landscape: LandscapeId | null }) {
  if (landscape === 'coast') return <Coast />;
  if (landscape === 'mountain') return <Mountain />;
  if (landscape === 'plain') return <Plain />;
  return null;
}
