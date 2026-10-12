// The landscape of a sister city (docs/game-design.md §7.6, M23), drawn on the Bioregion's land
// between its hills, inside the Bioregion view's frame (VIEW_FRAMES[4]): a bay of the sea and
// its beach to the east for the coast, a ridge of snowy peaks to the north for the mountain,
// fields of wheat to the south for the plain, a deep wood to the west for the forest, pools and
// reeds along the river to the south for the marsh (M30). Part of the land, so both renderers draw it (the
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
/** The wood: between the two western hills, its edge just inside the frame. */
const WOOD = { edge: -600, top: -160, bottom: 640 };
/** The marsh: along the river as it leaves the plain, between the two southern hills. */
const MARSH = { from: -120, to: 980, top: 790 };

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

/** A steady scatter in [0, 1) from an index, so the wood and the reeds never move. */
function scatter(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Forest() {
  const crowns: { x: number; y: number; r: number; tone: number; pine: boolean }[] = [];
  const rows = 9;
  for (let row = 0; row < rows; row++) {
    const y = WOOD.top + (row * (WOOD.bottom - WOOD.top)) / (rows - 1);
    // The edge of the wood curves out towards the middle of the plain.
    const bulge = Math.sin((row / (rows - 1)) * Math.PI) * 90;
    for (let col = 0; col < 5; col++) {
      const i = row * 5 + col;
      crowns.push({
        x: WOOD.edge + bulge - col * 95 - scatter(i, 1) * 40,
        y: y + (scatter(i, 2) - 0.5) * 60,
        r: 44 + scatter(i, 3) * 26,
        tone: Math.floor(scatter(i, 4) * 3),
        pine: scatter(i, 5) < 0.3,
      });
    }
  }
  // Drawn from the back (top) so the lower crowns overlap the upper ones.
  crowns.sort((a, b) => a.y - b.y);
  return (
    <g className="landscape" data-landscape="forest">
      <path
        className="landscape-undergrowth"
        d={`M-1400 ${WOOD.top - 120}H${WOOD.edge + 20}C${WOOD.edge + 160} ${WOOD.top + 200} ${WOOD.edge + 160} ${WOOD.bottom - 200} ${WOOD.edge + 20} ${WOOD.bottom + 120}H-1400Z`}
      />
      {crowns.map(({ x, y, r, tone, pine }, i) =>
        pine ? (
          <g key={i} className="landscape-pine" data-tone={tone}>
            <path d={`M${x} ${y - r * 1.3}L${x + r * 0.7} ${y + r * 0.6}H${x - r * 0.7}Z`} />
          </g>
        ) : (
          <g key={i} className="landscape-crown" data-tone={tone}>
            <circle cx={x} cy={y} r={r} />
            <circle
              className="landscape-crown-light"
              cx={x - r * 0.3}
              cy={y - r * 0.3}
              r={r * 0.45}
            />
          </g>
        ),
      )}
    </g>
  );
}

function Marsh() {
  const pools = [
    { x: 60, y: 880, rx: 170, ry: 60 },
    { x: 330, y: 960, rx: 200, ry: 66 },
    { x: 760, y: 870, rx: 150, ry: 50 },
    { x: 860, y: 1040, rx: 190, ry: 60 },
    { x: -40, y: 1040, rx: 120, ry: 45 },
  ];
  const reeds = Array.from({ length: 34 }, (_, i) => ({
    x: MARSH.from + scatter(i, 6) * (MARSH.to - MARSH.from),
    y: MARSH.top + 30 + scatter(i, 7) * 300,
    h: 34 + scatter(i, 8) * 30,
  }));
  return (
    <g className="landscape" data-landscape="marsh">
      <path
        className="landscape-wetland"
        d={`M${MARSH.from - 120} 1500V${MARSH.top + 40}C${MARSH.from + 200} ${MARSH.top - 40} ${MARSH.to - 200} ${MARSH.top - 40} ${MARSH.to + 120} ${MARSH.top + 40}V1500Z`}
      />
      {pools.map(({ x, y, rx, ry }) => (
        <g key={x}>
          <ellipse className="landscape-pool" cx={x} cy={y} rx={rx} ry={ry} />
          <ellipse
            className="landscape-pool-light"
            cx={x - rx * 0.25}
            cy={y - ry * 0.3}
            rx={rx * 0.4}
            ry={ry * 0.25}
          />
          <circle className="landscape-lily" cx={x + rx * 0.35} cy={y + ry * 0.1} r={9} />
          <circle className="landscape-lily" cx={x + rx * 0.5} cy={y - ry * 0.25} r={7} />
        </g>
      ))}
      {reeds.map(({ x, y, h }, i) => (
        <g key={i} className="landscape-reed">
          <path
            d={`M${x} ${y}q-4 ${-h / 2} -10 ${-h}M${x} ${y}q2 ${-h / 2} 4 ${-h * 1.1}M${x} ${y}q6 ${-h / 2} 14 ${-h * 0.9}`}
          />
          <ellipse className="landscape-cattail" cx={x + 3.6} cy={y - h * 1.1} rx={3.4} ry={9} />
        </g>
      ))}
    </g>
  );
}

export function LandscapeArt({ landscape }: { landscape: LandscapeId | null }) {
  if (landscape === 'coast') return <Coast />;
  if (landscape === 'mountain') return <Mountain />;
  if (landscape === 'plain') return <Plain />;
  if (landscape === 'forest') return <Forest />;
  if (landscape === 'marsh') return <Marsh />;
  return null;
}
