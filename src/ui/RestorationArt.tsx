// Restored parcels and neighbourhood projects drawn on the top-down map (docs/game-design.md
// §6.1, §6.2). Kept apart from Neighbourhood.tsx, which draws the base city and the generators:
// the map hands these layers its camera and its entrance animations.
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ParcelId } from '../game/parcels';
import type { ProjectId } from '../game/projects';
import { Appear } from './Neighbourhood';
import { STREETS, WORLD, type Box } from './neighbourhood';
import {
  CROSSROADS,
  GROUND_ORDER,
  LIVING_ROOFS,
  OUTER_AVENUES,
  PARCEL_PINS,
  PARCEL_PLACES,
  PROJECT_SPOTS,
} from './restorationMap';
import './restoration.css';

/** Deterministic scatter in [0, 1), so the art is the same on every render. */
function noise(i: number, salt = 0): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const FLOWER_CLASSES = ['bloom-lilac', 'bloom-gold', 'bloom-white', 'bloom-rose'] as const;

/** Parcels restored after the map first appeared are unveiled; the others are simply drawn. */
const LiveContext = createContext<{ current: boolean }>({ current: false });

/**
 * A parcel restored while the game runs is unveiled from its pin: a widening circle uncovers the
 * new ground while petals burst out. Parcels already restored at load are simply drawn.
 */
function Unveil({ id, children }: { id: ParcelId; children: ReactNode }) {
  const live = useContext(LiveContext);
  const [animate] = useState(() => live.current);
  if (!animate) return <g data-parcel={id}>{children}</g>;
  const [x, y] = PARCEL_PINS[id];
  const [bx, by, bw, bh] = PARCEL_PLACES[id];
  // Far enough to reach every corner of the place.
  const reach = Math.max(
    ...[
      [bx, by],
      [bx + bw, by],
      [bx, by + bh],
      [bx + bw, by + bh],
    ].map(([cx, cy]) => Math.hypot(cx! - x, cy! - y)),
  );
  return (
    <g data-parcel={id}>
      <clipPath id={`unveil-${id}`}>
        <circle className="unveil" cx={x} cy={y} r={reach} />
      </clipPath>
      <g clipPath={`url(#unveil-${id})`}>{children}</g>
      <circle className="unveil-ring" cx={x} cy={y} r={Math.min(reach, 120)} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const d = 14 + noise(i, 3) * 16;
        return (
          <circle
            key={i}
            className={`burst ${FLOWER_CLASSES[i % FLOWER_CLASSES.length]}`}
            cx={x}
            cy={y}
            r={1.6}
            style={{ '--dx': `${Math.cos(a) * d}px`, '--dy': `${Math.sin(a) * d}px` } as never}
          />
        );
      })}
    </g>
  );
}

function Flowers({ box: [x, y, w, h], count, salt }: { box: Box; count: number; salt: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={x + 1.5 + noise(i, salt) * (w - 3)}
          cy={y + 1.5 + noise(i, salt + 1) * (h - 3)}
          r={0.9 + noise(i, salt + 2) * 0.8}
          className={FLOWER_CLASSES[i % FLOWER_CLASSES.length]}
        />
      ))}
    </>
  );
}

/** Rue jardin: the avenue becomes a paved garden street with planted islands and benches. */
function GardenStreet() {
  const [x, y, w, h] = PARCEL_PLACES.gardenStreet;
  const islands = 5;
  const gap = w / islands;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="paving" />
      <path d={`M${x} ${y + 3} H${x + w} M${x} ${y + h - 3} H${x + w}`} className="paving-edge" />
      {Array.from({ length: islands }, (_, i) => {
        const ix = x + gap * i + 6;
        const box: Box = [ix, y + 6, gap - 12, h - 12];
        return (
          <g key={i}>
            <rect x={ix} y={y + 6} width={gap - 12} height={h - 12} rx="5" className="meadow" />
            <Flowers box={box} count={9} salt={i * 7} />
            <rect x={ix + gap - 6.9} y={y + 8} width="1.8" height="6" rx="0.9" className="bench" />
          </g>
        );
      })}
    </g>
  );
}

/** Jardins de pluie: two planted swales catch the rain along the avenue. */
function RainGardens() {
  const [x, y, w, h] = PARCEL_PLACES.rainGardens;
  const wave = (cy: number, phase: number) => {
    let d = `M${x + 4} ${cy}`;
    for (let i = 0; i < 12; i++) {
      const sx = x + 4 + ((w - 8) / 12) * (i + 0.5);
      const ex = x + 4 + ((w - 8) / 12) * (i + 1);
      d += ` Q${sx} ${cy + ((i + phase) % 2 ? 1.6 : -1.6)} ${ex} ${cy}`;
    }
    return d;
  };
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="paving" />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx="6" className="meadow" />
      <path d={wave(y + h / 2 - 3, 0)} className="swale" />
      <path d={wave(y + h / 2 + 3, 1)} className="swale" />
      {Array.from({ length: 26 }, (_, i) => (
        <path
          key={i}
          d={`M${x + 8 + i * ((w - 16) / 25)} ${y + (i % 2 ? h - 5 : 5)} v-2.4`}
          className="reed"
        />
      ))}
    </g>
  );
}

/** Corridor des pollinisateurs: a wildflower meadow along a whole street. */
function PollinatorStrip() {
  const [x, y, w, h] = PARCEL_PLACES.pollinatorStrip;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="meadow" />
      <path d={`M${x + w / 2} ${y} V${y + h}`} className="mown-path" />
      <Flowers box={[x, y, w, h]} count={150} salt={11} />
    </g>
  );
}

/** Rivière retrouvée: the river buried under the street flows again, under small footbridges. */
function River() {
  const [x, y, w, h] = PARCEL_PLACES.river;
  const mid = x + w / 2;
  let bed = `M${mid} ${y}`;
  for (let i = 0; i < 9; i++) {
    const y0 = y + (h / 9) * i;
    bed += ` C${mid + (i % 2 ? -4 : 4)} ${y0 + h / 27} ${mid + (i % 2 ? -4 : 4)} ${y0 + (h / 27) * 2} ${mid} ${y0 + h / 9}`;
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="bank" />
      <path d={bed} className="river-bed" />
      <path d={bed} className="river-water" />
      <path d={bed} className="river-ripple" />
      {STREETS.horizontal.map((sy) => (
        <g key={sy} className="footbridge">
          <rect x={x - 1} y={sy + 6} width={w + 2} height={STREETS.width - 12} rx="1" />
          <path d={`M${x} ${sy + 6.6} H${x + w} M${x} ${sy + STREETS.width - 6.6} H${x + w}`} />
        </g>
      ))}
    </g>
  );
}

/** Parc du parking: a lawn with a pond, a winding path and clumps of trees. */
function Park() {
  const [x, y, w, h] = PARCEL_PLACES.park;
  const clumps: [number, number, number][] = [
    [x + 16, y + 16, 9],
    [x + 30, y + 12, 7],
    [x + w - 16, y + h - 18, 10],
    [x + w - 30, y + h - 12, 7],
    [x + 14, y + h - 22, 8],
  ];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" className="lawn" />
      <path
        d={`M${x} ${y + h * 0.7} C${x + w * 0.3} ${y + h * 0.75} ${x + w * 0.4} ${y + h * 0.2} ${x + w} ${y + h * 0.3}`}
        className="park-path"
      />
      <ellipse cx={x + w * 0.62} cy={y + h * 0.58} rx="17" ry="12" className="pond" />
      <ellipse cx={x + w * 0.62} cy={y + h * 0.58} rx="11" ry="7" className="pond-light" />
      <Flowers box={[x + w * 0.2, y + h * 0.42, w * 0.22, h * 0.14]} count={18} salt={5} />
      {clumps.map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx + r * 0.35} cy={cy + r * 0.35} r={r} className="tree-shadow" />
          <circle cx={cx} cy={cy} r={r} className="foliage" opacity="0.9" />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.6} className="foliage-light" />
        </g>
      ))}
    </g>
  );
}

/** Verger de l'entrepôt: the warehouse opens its roof to rows of fruit trees. */
function Orchard() {
  const [x, y, w, h] = PARCEL_PLACES.orchard;
  const columns = 11;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" className="lawn" />
      {Array.from({ length: columns * 2 }, (_, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const cx = x + 9 + col * ((w - 18) / (columns - 1)) + (row ? 4 : 0);
        const cy = y + 10 + row * 14;
        return (
          <g key={i}>
            <circle cx={cx + 1.6} cy={cy + 1.6} r="5" className="tree-shadow" />
            <circle cx={cx} cy={cy} r="5" className="foliage" opacity="0.9" />
            <circle cx={cx - 1.4} cy={cy - 1.4} r="2.8" className="foliage-light" />
            <circle cx={cx + 2} cy={cy + 0.6} r="0.9" className="fruit" />
            <circle cx={cx - 0.6} cy={cy + 2.2} r="0.9" className="fruit" />
          </g>
        );
      })}
    </g>
  );
}

/** Toits vivants: every grey roof is planted with sedum and wild flowers. */
function LivingRoofs() {
  return (
    <g>
      {LIVING_ROOFS.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="2" className="sedum" />
          <rect
            x={x + 2}
            y={y + 2}
            width={w - 4}
            height={h - 4}
            rx="2"
            fill="url(#sedum-texture)"
          />
          <Flowers box={[x + 3, y + 3, w - 6, h - 6]} count={Math.round((w * h) / 160)} salt={i} />
        </g>
      ))}
    </g>
  );
}

/** Places plantées: the crossroads around home become round squares around a tree. */
function Squares() {
  return (
    <g>
      {CROSSROADS.map(([x, y]) => (
        <g key={`${x},${y}`}>
          <circle cx={x} cy={y} r="13" className="paving" />
          <circle cx={x} cy={y} r="13" className="square-ring" />
          <circle cx={x} cy={y} r="8" className="meadow" />
          <circle cx={x + 2} cy={y + 2} r="5.5" className="tree-shadow" />
          <circle cx={x} cy={y} r="5.5" className="foliage" />
          <circle cx={x - 1.5} cy={y - 1.5} r="3" className="foliage-light" />
          {[0, 2.1, 4.2].map((a) => (
            <circle
              key={a}
              cx={x + Math.cos(a) * 3.2}
              cy={y + Math.sin(a) * 3.2}
              r="0.9"
              className="blossom"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

const PARCEL_ART: Record<ParcelId, () => ReactNode> = {
  livingRoofs: LivingRoofs,
  gardenStreet: GardenStreet,
  rainGardens: RainGardens,
  pollinatorStrip: PollinatorStrip,
  river: River,
  squares: Squares,
  park: Park,
  orchard: Orchard,
};

/** Patterns the parcels are painted with. */
export function ParcelPatterns() {
  return (
    <pattern id="sedum-texture" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.7" className="sedum-dot" />
      <circle cx="3" cy="3" r="0.5" className="sedum-dot" />
    </pattern>
  );
}

/** One restored parcel, without its entrance: the enriched map turns it into a texture. */
export function ParcelArt({ id }: { id: ParcelId }) {
  const Art = PARCEL_ART[id];
  return <Art />;
}

/** Restored parcels, drawn over the grey city and under the generators. */
export const ParcelGround = memo(function ParcelGround({
  parcels,
}: {
  parcels: readonly ParcelId[];
}) {
  const live = useRef(false);
  useEffect(() => {
    live.current = true;
  }, []);
  return (
    <LiveContext.Provider value={live}>
      <g className="parcels">
        <defs>
          <ParcelPatterns />
        </defs>
        {GROUND_ORDER.filter((id) => parcels.includes(id)).map((id) => {
          const Art = PARCEL_ART[id];
          return (
            <Unveil key={id} id={id}>
              <Art />
            </Unveil>
          );
        })}
      </g>
    </LiveContext.Provider>
  );
});

/** A small rounded box, the building block of the project marks. */
function Box({ box: [x, y, w, h], className }: { box: Box; className: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 3} className={className} />;
}

/** Strings of little flags or lanterns between two points, sagging gently. */
function Garland({ from, to, count, className }: GarlandProps) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const sag = 4;
  const point = (f: number): [number, number] => [
    x1 + (x2 - x1) * f,
    y1 + (y2 - y1) * f + Math.sin(f * Math.PI) * sag,
  ];
  const [mx, my] = point(0.5);
  return (
    <g>
      <path d={`M${x1} ${y1} Q${mx} ${my + sag} ${x2} ${y2}`} className="garland-string" />
      {Array.from({ length: count }, (_, i) => {
        const [x, y] = point((i + 1) / (count + 1));
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1"
            className={`${className} ${FLOWER_CLASSES[i % FLOWER_CLASSES.length]}`}
          />
        );
      })}
    </g>
  );
}

interface GarlandProps {
  from: [number, number];
  to: [number, number];
  count: number;
  className: string;
}

function Lane({ box: [x, y, w, h] }: { box: Box }) {
  return (
    <path d={`M${x} ${y + 2.5} H${x + w} M${x} ${y + h - 2.5} H${x + w}`} className="bike-lane" />
  );
}

const PROJECT_ART: Record<ProjectId, () => ReactNode> = {
  seedSwap: () => (
    <g>
      <Box box={[278, 231.5, 12, 9]} className="table" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={279.5 + i * 2.6}
          y={233 + (i % 2)}
          width="2"
          height="3"
          rx="0.4"
          className={FLOWER_CLASSES[i]}
        />
      ))}
    </g>
  ),
  toolLibrary: () => (
    <g>
      <Box box={[332, 231, 12, 10]} className="shed" />
      <path d="M332 236 H344" className="shed-ridge" />
      <path d="M336 233.5 l4 5" className="tool" />
    </g>
  ),
  compost: () => (
    <g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={263} y={229 + i * 5} width="8" height="4" rx="1" className="compost" />
      ))}
    </g>
  ),
  sharedBatteries: () => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <Box box={[316 + i * 13, 198, 9, 6]} className="battery" />
          <path d={`M${319.5 + i * 13} 199.5 l1.8 1.6 -1.4 0 1.8 1.6`} className="bolt" />
        </g>
      ))}
    </g>
  ),
  beehives: () => (
    <g>
      {[0, 1].map((i) => (
        <g key={i}>
          <Box box={[351 + i * 6, 232.5 + i * 1.5, 4.6, 5]} className="hive" />
          <path d={`M${351 + i * 6} ${234.5 + i * 1.5} h4.6`} className="hive-line" />
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          className="bee"
          cx={348 + noise(i, 9) * 16}
          cy={226 + noise(i, 10) * 18}
          r="0.7"
          style={{ animationDelay: `${-noise(i, 4) * 4}s` }}
        />
      ))}
    </g>
  ),
  festival: () => (
    <g className="festival">
      <Garland from={[262, 216]} to={[360, 216]} count={13} className="flag" />
      <Garland from={[262, 256]} to={[360, 256]} count={13} className="flag" />
    </g>
  ),
  bikeLanes: () => (
    <g>
      {Object.values(OUTER_AVENUES).map((box) => (
        <Lane key={box.join()} box={box} />
      ))}
    </g>
  ),
  market: () => {
    const [x, y] = OUTER_AVENUES.northEast;
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <Box box={[x + 16 + i * 32, y + 5, 22, 12]} className="awning" />
            {[0, 1, 2, 3].map((k) => (
              <path
                key={k}
                d={`M${x + 20 + i * 32 + k * 4.6} ${y + 5.5} v11`}
                className={i % 2 ? 'awning-stripe gold' : 'awning-stripe'}
              />
            ))}
          </g>
        ))}
      </g>
    );
  },
  repairCafe: () => {
    const [x, y] = OUTER_AVENUES.southEast;
    return (
      <g>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={x + 14 + i * 13} cy={y + 11} r="5" className="parasol" />
            <path
              d={`M${x + 14 + i * 13 - 5} ${y + 11} h10 M${x + 14 + i * 13} ${y + 6} v10`}
              className="parasol-rib"
            />
          </g>
        ))}
      </g>
    );
  },
  rainwater: () => (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={440 + i * 12} cy={236} r="3.4" className="cistern" />
          <circle cx={440 + i * 12} cy={236} r="1.6" className="cistern-water" />
        </g>
      ))}
    </g>
  ),
  butterflyGarden: () => {
    const [x, , w] = PARCEL_PLACES.pollinatorStrip;
    return (
      <g>
        {Array.from({ length: 14 }, (_, i) => {
          const cy = 12 + i * 32;
          const cx = x + (i % 2 ? 6 : w - 6);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="3.6" className="buddleia" />
              <circle cx={cx - 1} cy={cy - 1} r="1.8" className="bloom-lilac" />
            </g>
          );
        })}
      </g>
    );
  },
  solarCanopy: () => {
    const [x, y, w] = OUTER_AVENUES.southWest;
    return (
      <g>
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${x + 8 + i * ((w - 26) / 6)} ${y + 6})`}>
            <rect width="18" height="10" rx="1" className="canopy-panel" />
            <path d="M0 5 h18 M6 0 v10 M12 0 v10" className="canopy-grid" />
          </g>
        ))}
      </g>
    );
  },
  tram: () => {
    const [x, y, w, h] = OUTER_AVENUES.northWest;
    const mid = y + h / 2;
    return (
      <g>
        <path
          d={`M${x} ${mid - 2.4} H${x + w} M${x} ${mid + 2.4} H${x + w}`}
          className="track-grass"
        />
        <path d={`M${x} ${mid - 2.4} H${x + w} M${x} ${mid + 2.4} H${x + w}`} className="track" />
        <g className="tram-car">
          <rect x={x + 40} y={mid - 4} width="44" height="8" rx="3.5" className="tram-body" />
          <rect x={x + 43} y={mid - 2.6} width="38" height="5.2" rx="2.4" className="tram-roof" />
        </g>
      </g>
    );
  },
  assembly: () => (
    <g>
      {[13.5, 16.5].map((r) => (
        <circle key={r} cx="311" cy="236" r={r} className="assembly-seats" />
      ))}
    </g>
  ),
  lightFestival: () => (
    <g>
      {[...STREETS.horizontal.map((y) => ({ y })), ...STREETS.vertical.map((x) => ({ x }))].flatMap(
        (street, s) =>
          Array.from({ length: 10 }, (_, i) => {
            const along = (i + 0.5) / 10;
            const cx = 'x' in street ? street.x! + STREETS.width / 2 : along * WORLD.width;
            const cy = 'y' in street ? street.y! + STREETS.width / 2 : along * WORLD.height;
            return (
              <circle
                key={`${s}-${i}`}
                cx={cx}
                cy={cy}
                r="1.6"
                className="lantern"
                style={{ animationDelay: `${-noise(i, s) * 3}s` }}
              />
            );
          }),
      )}
    </g>
  ),
};

/** Projects carried out this Season: small marks over the city, each with a soft entrance. */
export const ProjectMarks = memo(function ProjectMarks({
  projects,
}: {
  projects: readonly ProjectId[];
}) {
  return (
    <g className="projects">
      {projects.map((id) => {
        const Art = PROJECT_ART[id];
        return (
          <g key={id} data-project={id}>
            <Appear at={PROJECT_SPOTS[id]} size={10}>
              <Art />
            </Appear>
          </g>
        );
      })}
    </g>
  );
});

/**
 * Parcels offered for restoration: a golden dashed outline breathes around the grey place, and
 * a pin stands where it would start to grow. `highlight` is the parcel the player is looking at
 * in the panel. Clicking a pin restores the parcel when it is affordable; the panel under the
 * map is the accessible way to do the same.
 */
export const ParcelOffers = memo(function ParcelOffers({
  offered,
  affordable,
  highlight,
  onRestore,
}: {
  offered: readonly ParcelId[];
  affordable: readonly ParcelId[];
  highlight: ParcelId | null;
  onRestore: (id: ParcelId) => void;
}) {
  return (
    <g className="offers" aria-hidden="true">
      {offered.map((id) => {
        const outline =
          id === 'livingRoofs'
            ? LIVING_ROOFS
            : id === 'squares'
              ? CROSSROADS.map(([x, y]): Box => [x - 11, y - 11, 22, 22])
              : [PARCEL_PLACES[id]];
        const [px, py] = PARCEL_PINS[id];
        const ready = affordable.includes(id);
        return (
          <g
            key={id}
            className="offer"
            data-offer={id}
            data-ready={ready}
            data-highlight={highlight === id}
          >
            {outline.map(([x, y, w, h]) => (
              <rect
                key={`${x},${y}`}
                x={x}
                y={y}
                width={w}
                height={h}
                rx="3"
                className="offer-outline"
              />
            ))}
            <g
              className="pin"
              onClick={ready ? () => onRestore(id) : undefined}
              transform={`translate(${px} ${py})`}
            >
              <circle r="7" className="pin-halo" />
              <circle r="4.6" className="pin-disc" />
              <path
                d="M0 2.4 V-0.6 M0 0.4 C-2 0.2 -2.6 -1.2 -2.6 -2.4 C-1 -2.4 0 -1.4 0 0.4 M0 -0.6 C1.6 -0.8 2.4 -1.8 2.4 -2.8 C1 -2.8 0 -2 0 -0.6"
                className="pin-sprout"
              />
            </g>
          </g>
        );
      })}
    </g>
  );
});
