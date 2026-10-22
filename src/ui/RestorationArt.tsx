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
import type { Future, ParcelId } from '../game/parcels';
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

/** Wild flowers scattered over a box: petals of four colours, each with its heart. */
function Flowers({ box: [x, y, w, h], count, salt }: { box: Box; count: number; salt: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const cx = x + 1.5 + noise(i, salt) * (w - 3);
        const cy = y + 1.5 + noise(i, salt + 1) * (h - 3);
        const r = 0.9 + noise(i, salt + 2) * 0.8;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} className={FLOWER_CLASSES[i % FLOWER_CLASSES.length]} />
            <circle cx={cx} cy={cy} r={r * 0.38} className="bloom-heart" />
          </g>
        );
      })}
    </>
  );
}

/** Tufts of grass over a box, so the green is never a flat colour. */
function Tufts({ box: [x, y, w, h], count, salt }: { box: Box; count: number; salt: number }) {
  const d = Array.from({ length: count }, (_, i) => {
    const tx = x + 1 + noise(i, salt + 5) * (w - 2);
    const ty = y + 2.5 + noise(i, salt + 6) * (h - 3);
    return `M${tx - 1} ${ty}l.4 -2M${tx} ${ty}v-2.4M${tx + 1} ${ty}l-.3 -2`;
  }).join('');
  return <path d={d} className="tuft" />;
}

/** A textured surface: the colour, then a pattern of grass, mowing stripes or joints over it. */
function Surface({
  box: [x, y, w, h],
  rx = 0,
  className,
  texture,
}: {
  box: Box;
  rx?: number;
  className: string;
  texture: 'meadow-texture' | 'lawn-stripes' | 'paving-joints';
}) {
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx} className={className} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#${texture})`} />
    </>
  );
}

/**
 * Rue jardin: the avenue becomes a paved garden street, a cycle lane down its middle, planted
 * islands of grasses and flowers with a young tree each, and benches facing them.
 */
function GardenStreet() {
  const [x, y, w, h] = PARCEL_PLACES.gardenStreet;
  const islands = 5;
  const gap = w / islands;
  return (
    <g>
      <Surface box={[x, y, w, h]} className="paving" texture="paving-joints" />
      <path d={`M${x} ${y + 3} H${x + w} M${x} ${y + h - 3} H${x + w}`} className="paving-edge" />
      {Array.from({ length: islands }, (_, i) => {
        const ix = x + gap * i + 6;
        const box: Box = [ix, y + 6, gap - 12, h - 12];
        return (
          <g key={i}>
            <rect
              x={ix - 0.6}
              y={y + 5.4}
              width={gap - 10.8}
              height={h - 10.8}
              rx="5.4"
              className="kerb"
            />
            <Surface box={box} rx={5} className="meadow" texture="meadow-texture" />
            <Tufts box={box} count={6} salt={i * 3} />
            <Flowers box={box} count={9} salt={i * 7} />
            <Tree
              x={ix + (gap - 12) * (i % 2 ? 0.7 : 0.3)}
              y={y + h / 2}
              r={3.6}
              bloom={i % 2 === 0}
            />
            <Bench x={ix + gap - 6.9} y={y + 8} vertical />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Jardins de pluie: two planted swales catch the rain along the avenue, stepping stones across
 * them, reeds and irises on their banks.
 */
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
      <Surface box={[x, y, w, h]} className="paving" texture="paving-joints" />
      <Surface
        box={[x + 3, y + 3, w - 6, h - 6]}
        rx={6}
        className="meadow"
        texture="meadow-texture"
      />
      {[0, 1].map((k) => (
        <g key={k}>
          <path d={wave(y + h / 2 + (k ? 3 : -3), k)} className="swale-bed" />
          <path d={wave(y + h / 2 + (k ? 3 : -3), k)} className="swale" />
          <path d={wave(y + h / 2 + (k ? 3 : -3), k)} className="swale-glint" />
        </g>
      ))}
      {[0.22, 0.5, 0.78].map((f) => (
        <g key={f}>
          {[-3, 0, 3].map((dy) => (
            <ellipse
              key={dy}
              cx={x + w * f + dy * 0.3}
              cy={y + h / 2 + dy}
              rx="1.4"
              ry="1"
              className="stepping-stone"
            />
          ))}
        </g>
      ))}
      {Array.from({ length: 26 }, (_, i) => (
        <path
          key={i}
          d={`M${x + 8 + i * ((w - 16) / 25)} ${y + (i % 2 ? h - 5 : 5)} l-.8 -2.2M${x + 8 + i * ((w - 16) / 25)} ${y + (i % 2 ? h - 5 : 5)} v-2.8M${x + 8 + i * ((w - 16) / 25)} ${y + (i % 2 ? h - 5 : 5)} l.8 -2.2`}
          className="reed"
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={i}
          cx={x + 12 + i * ((w - 24) / 8)}
          cy={y + (i % 2 ? h - 7.6 : 7.6)}
          r="0.9"
          className="iris"
        />
      ))}
    </g>
  );
}

/**
 * Corridor des pollinisateurs: a wildflower meadow along a whole street, tall grasses, a mown
 * path down the middle, and insect hotels for the bees.
 */
function PollinatorStrip() {
  const [x, y, w, h] = PARCEL_PLACES.pollinatorStrip;
  return (
    <g>
      <Surface box={[x, y, w, h]} className="meadow" texture="meadow-texture" />
      <Tufts box={[x, y, w, h]} count={70} salt={2} />
      <path d={`M${x + w / 2} ${y} V${y + h}`} className="mown-path" />
      <Flowers box={[x, y, w, h]} count={150} salt={11} />
      {[0.2, 0.55, 0.85].map((f) => (
        <g key={f}>
          <rect
            x={x + w / 2 - 2.6}
            y={y + h * f}
            width="5.2"
            height="3.6"
            rx="0.5"
            className="insect-hotel"
          />
          <path
            d={`M${x + w / 2 - 1.8} ${y + h * f + 1.2}h3.6M${x + w / 2 - 1.8} ${y + h * f + 2.4}h3.6`}
            className="insect-hotel-lines"
          />
        </g>
      ))}
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

/**
 * Parc du parking: a mown lawn with a pond and its water lilies, a winding gravel path with
 * benches, a flower bed, and clumps of trees.
 */
function Park() {
  const [x, y, w, h] = PARCEL_PLACES.park;
  const clumps: [number, number, number][] = [
    [x + 16, y + 16, 9],
    [x + 30, y + 12, 7],
    [x + w - 16, y + h - 18, 10],
    [x + w - 30, y + h - 12, 7],
    [x + 14, y + h - 22, 8],
  ];
  const path = `M${x} ${y + h * 0.7} C${x + w * 0.3} ${y + h * 0.75} ${x + w * 0.4} ${y + h * 0.2} ${x + w} ${y + h * 0.3}`;
  const [px, py] = [x + w * 0.62, y + h * 0.58];
  return (
    <g>
      <Surface box={[x, y, w, h]} rx={4} className="lawn" texture="lawn-stripes" />
      <path d={path} className="park-path-edge" />
      <path d={path} className="park-path" />
      <ellipse cx={px} cy={py} rx="18.4" ry="13.2" className="pond-bank" />
      <ellipse cx={px} cy={py} rx="17" ry="12" className="pond" />
      <ellipse cx={px - 2} cy={py - 2} rx="11" ry="7" className="pond-light" />
      {[
        [px + 7, py + 4, 1.8],
        [px + 10, py + 1, 1.3],
        [px - 9, py + 5, 1.5],
      ].map(([lx, ly, lr], i) => (
        <g key={i}>
          <circle cx={lx} cy={ly} r={lr} className="lily-pad" />
          {i === 0 && <circle cx={lx! + 0.3} cy={ly! - 0.2} r="0.6" className="bloom-rose" />}
        </g>
      ))}
      <ellipse
        cx={x + w * 0.31}
        cy={y + h * 0.49}
        rx={w * 0.12}
        ry={h * 0.08}
        className="flower-bed"
      />
      <Flowers box={[x + w * 0.2, y + h * 0.42, w * 0.22, h * 0.14]} count={22} salt={5} />
      <Bench x={x + w * 0.5} y={y + h * 0.3} />
      <Bench x={x + w * 0.16} y={y + h * 0.62} />
      {clumps.map(([cx, cy, r], i) => (
        <Tree key={i} x={cx} y={cy} r={r} bloom={i === 1} />
      ))}
    </g>
  );
}

/** Verger de l'entrepôt: the warehouse opens its roof to rows of fruit trees in the grass. */
function Orchard() {
  const [x, y, w, h] = PARCEL_PLACES.orchard;
  const columns = 11;
  return (
    <g>
      <Surface box={[x, y, w, h]} rx={2} className="lawn" texture="lawn-stripes" />
      <Tufts box={[x, y, w, h]} count={30} salt={8} />
      {Array.from({ length: columns * 2 }, (_, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const cx = x + 9 + col * ((w - 18) / (columns - 1)) + (row ? 4 : 0);
        const cy = y + 10 + row * 14;
        return <Tree key={i} x={cx} y={cy} r={5} fruit={i % 4 !== 3} bloom={i % 4 === 3} />;
      })}
    </g>
  );
}

/** Toits vivants: every grey roof is planted with drifts of sedum and wild flowers. */
function LivingRoofs() {
  return (
    <g>
      {LIVING_ROOFS.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="2" className="sedum" />
          {Array.from({ length: Math.max(3, Math.round((w * h) / 90)) }, (_, k) => (
            <ellipse
              key={k}
              cx={x + 4 + noise(k, i + 40) * (w - 8)}
              cy={y + 4 + noise(k, i + 41) * (h - 8)}
              rx={2 + noise(k, i + 42) * 3}
              ry={1.5 + noise(k, i + 43) * 2}
              className={`sedum-drift drift-${k % 3}`}
            />
          ))}
          <rect
            x={x + 2}
            y={y + 2}
            width={w - 4}
            height={h - 4}
            rx="2"
            fill="url(#sedum-texture)"
          />
          {/* A gravel path of stepping stones along the roof, so it reads as a garden walked in. */}
          <path
            d={
              w >= h
                ? `M${x + 5} ${y + h * 0.55}H${x + w - 5}`
                : `M${x + w * 0.55} ${y + 5}V${y + h - 5}`
            }
            className="roof-steps"
          />
          <Flowers box={[x + 3, y + 3, w - 6, h - 6]} count={Math.round((w * h) / 160)} salt={i} />
          {/* Rounded shrubs, each with its shadow and a sunlit top. */}
          {Array.from({ length: Math.max(2, Math.round((w * h) / 700)) }, (_, k) => {
            const cx = x + 6 + noise(k, i + 60) * (w - 12);
            const cy = y + 6 + noise(k, i + 61) * (h - 12);
            const r = 2.2 + noise(k, i + 62) * 1.4;
            return (
              <g key={`s${k}`} className="roof-clump">
                <circle cx={cx + 0.7} cy={cy + 0.9} r={r} className="roof-clump-shadow" />
                <circle cx={cx} cy={cy} r={r} className="roof-clump-leaf" />
                <circle
                  cx={cx - r * 0.3}
                  cy={cy - r * 0.3}
                  r={r * 0.45}
                  className="roof-clump-light"
                />
              </g>
            );
          })}
          {/* The parapet: a lit edge on the sun side and its shadow on the far side. */}
          <rect
            x={x + 1.4}
            y={y + 1.4}
            width={w - 2.8}
            height={h - 2.8}
            rx="2.4"
            className="roof-lip"
          />
          <path
            d={`M${x + 2.6} ${y + h - 2.2}H${x + w - 2.2}V${y + 2.6}`}
            className="roof-lip-shade"
          />
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
          <circle cx={x} cy={y} r="13" fill="url(#paving-joints)" />
          <circle cx={x} cy={y} r="10.6" className="square-setts" />
          <circle cx={x} cy={y} r="13" className="square-ring" />
          <circle cx={x} cy={y} r="8" className="meadow" />
          <circle cx={x} cy={y} r="8" fill="url(#meadow-texture)" />
          <Flowers box={[x - 6, y - 6, 12, 12]} count={6} salt={x} />
          <Tree x={x} y={y} r={5.5} bloom />
          {[0.6, 2.2, 3.8, 5.4].map((a) => (
            <rect
              key={a}
              x={x + Math.cos(a) * 11 - 1.6}
              y={y + Math.sin(a) * 11 - 0.6}
              width="3.2"
              height="1.2"
              rx="0.4"
              transform={`rotate(${(a * 180) / Math.PI + 90} ${x + Math.cos(a) * 11} ${y + Math.sin(a) * 11})`}
              className="bench"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/**
 * A tree seen from above, as on the other parcels: its shadow, a lobed crown, the shade on its
 * far side, clumps of leaves catching the sun, and fruit or blossom when asked.
 */
function Tree({
  x,
  y,
  r,
  fruit = false,
  bloom = false,
}: {
  x: number;
  y: number;
  r: number;
  fruit?: boolean;
  bloom?: boolean;
}) {
  const salt = Math.round(x * 3 + y * 7);
  return (
    <g>
      <circle cx={x + r * 0.35} cy={y + r * 0.35} r={r} className="tree-shadow" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + noise(salt, 1);
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * r * 0.42}
            cy={y + Math.sin(a) * r * 0.42}
            r={r * (0.55 + noise(i, salt) * 0.12)}
            className="foliage"
          />
        );
      })}
      <circle cx={x + r * 0.22} cy={y + r * 0.25} r={r * 0.72} className="crown-shade" />
      {[
        [-0.38, -0.3, 0.36],
        [0.05, -0.45, 0.28],
        [-0.45, 0.12, 0.26],
        [0.1, 0.05, 0.22],
      ].map(([dx, dy, k], i) => (
        <circle key={i} cx={x + dx! * r} cy={y + dy! * r} r={r * k!} className="foliage-light" />
      ))}
      <circle cx={x - r * 0.42} cy={y - r * 0.38} r={r * 0.14} className="leaf-glint" />
      {fruit && (
        <>
          <circle cx={x + r * 0.4} cy={y + r * 0.12} r={r * 0.17} className="fruit" />
          <circle cx={x - r * 0.12} cy={y + r * 0.45} r={r * 0.17} className="fruit" />
          <circle cx={x + r * 0.05} cy={y - r * 0.5} r={r * 0.15} className="fruit" />
        </>
      )}
      {bloom &&
        [0, 2.1, 4.2].map((a) => (
          <circle
            key={a}
            cx={x + Math.cos(a) * r * 0.55}
            cy={y + Math.sin(a) * r * 0.55}
            r={r * 0.16}
            className="blossom"
          />
        ))}
    </g>
  );
}

/** A wooden bench seen from above: seat slats and a back rest. */
function Bench({ x, y, vertical = false }: { x: number; y: number; vertical?: boolean }) {
  return vertical ? (
    <g>
      <rect x={x} y={y} width="2.2" height="6" rx="0.5" className="bench" />
      <path d={`M${x + 0.4} ${y + 0.6}v4.8`} className="bench-back" />
    </g>
  ) : (
    <g>
      <rect x={x} y={y} width="6" height="2.2" rx="0.5" className="bench" />
      <path d={`M${x + 0.6} ${y + 0.4}h4.8`} className="bench-back" />
    </g>
  );
}

// The second futures of the parcels (§6.5, M16): another drawing on the same place.

/** Rue des enfants: the avenue becomes a play street, hopscotch, sandpits and shade trees. */
function PlayStreet() {
  const [x, y, w, h] = PARCEL_PLACES.gardenStreet;
  const cells = 6;
  return (
    <g>
      <Surface box={[x, y, w, h]} className="paving" texture="paving-joints" />
      <path d={`M${x} ${y + 3} H${x + w} M${x} ${y + h - 3} H${x + w}`} className="paving-edge" />
      {[0.12, 0.62].map((f) => (
        <g key={f}>
          {Array.from({ length: cells }, (_, i) => (
            <rect
              key={i}
              x={x + w * f + i * 5.2}
              y={y + 7 + (i % 3 === 1 ? -2.6 : 0)}
              width="4.6"
              height={i % 3 === 1 ? 4 : 8}
              rx="0.6"
              className={`play-paint paint-${i % 3}`}
            />
          ))}
        </g>
      ))}
      {[0.44, 0.92].map((f) => (
        <g key={f}>
          <circle cx={x + w * f} cy={y + h / 2} r="6.5" className="sand-edge" />
          <circle cx={x + w * f} cy={y + h / 2} r="5.4" className="sand" />
        </g>
      ))}
      {[0.04, 0.34, 0.54, 0.82].map((f) => (
        <Tree key={f} x={x + w * f + 4} y={y + h / 2} r={4.6} />
      ))}
    </g>
  );
}

/** Bassin d'orage: a long pond holds the storms, crossed by stepping stones. */
function StormPond() {
  const [x, y, w, h] = PARCEL_PLACES.rainGardens;
  return (
    <g>
      <Surface box={[x, y, w, h]} className="paving" texture="paving-joints" />
      <Surface
        box={[x + 3, y + 3, w - 6, h - 6]}
        rx={7}
        className="meadow"
        texture="meadow-texture"
      />
      <rect x={x + 9} y={y + 6} width={w - 18} height={h - 12} rx="5" className="pond" />
      <rect x={x + 14} y={y + 8.5} width={w - 28} height={h - 17} rx="3" className="pond-light" />
      {[0.3, 0.5, 0.7].map((f) =>
        [-3.6, 0, 3.6].map((dy) => (
          <ellipse
            key={`${f}${dy}`}
            cx={x + w * f + dy * 0.4}
            cy={y + h / 2 + dy}
            rx="1.8"
            ry="1.3"
            className="stepping-stone"
          />
        )),
      )}
      {Array.from({ length: 18 }, (_, i) => (
        <path
          key={i}
          d={`M${x + 12 + i * ((w - 24) / 17)} ${y + (i % 2 ? h - 4.6 : 4.6)} v-2.4`}
          className="reed"
        />
      ))}
    </g>
  );
}

/** Haie bocagère: a mixed hedge runs down the street, berries for the birds. */
function Hedgerow() {
  const [x, y, w, h] = PARCEL_PLACES.pollinatorStrip;
  const shrubs = 28;
  return (
    <g>
      <Surface box={[x, y, w, h]} className="meadow" texture="meadow-texture" />
      <Tufts box={[x, y, w, h]} count={40} salt={6} />
      <path d={`M${x + 3} ${y} V${y + h}`} className="mown-path" />
      {Array.from({ length: shrubs }, (_, i) => {
        const cy = y + 8 + i * ((h - 16) / (shrubs - 1));
        const cx = x + w / 2 + 2 + (noise(i, 4) - 0.5) * 4;
        const r = 4.4 + noise(i, 5) * 2;
        return (
          <g key={i}>
            <circle cx={cx + 1.4} cy={cy + 1.4} r={r} className="tree-shadow" />
            <circle cx={cx} cy={cy} r={r} className="hedge" />
            <circle cx={cx - 1.2} cy={cy - 1.2} r={r * 0.5} className="foliage-light" />
            {i % 3 === 0 && <circle cx={cx + 1.6} cy={cy + 0.8} r="0.8" className="berry" />}
          </g>
        );
      })}
    </g>
  );
}

/** Rivière baignade: the river widens into pools with wooden decks. */
function BathingRiver() {
  const [x, y, w, h] = PARCEL_PLACES.river;
  const [north, south] = STREETS.horizontal;
  const pools: [number, number][] = [
    [y + 6, north - 6],
    [north + STREETS.width + 6, south - 6],
    [south + STREETS.width + 6, y + h - 6],
  ];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="bank" />
      {pools.map(([top, bottom]) => (
        <g key={top}>
          <rect x={x + 2} y={top} width={w - 4} height={bottom - top} rx="6" className="pool" />
          <rect
            x={x + 5}
            y={top + 4}
            width={w - 10}
            height={bottom - top - 8}
            rx="4"
            className="pond-light"
          />
          <rect
            x={x + 1}
            y={(top + bottom) / 2 - 5}
            width="5"
            height="10"
            rx="0.6"
            className="deck"
          />
          <rect
            x={x + w - 6}
            y={top + (bottom - top) * 0.7 - 4}
            width="5"
            height="8"
            rx="0.6"
            className="deck"
          />
        </g>
      ))}
      {STREETS.horizontal.map((sy) => (
        <g key={sy} className="footbridge">
          <rect x={x - 1} y={sy + 6} width={w + 2} height={STREETS.width - 12} rx="1" />
          <path d={`M${x} ${sy + 6.6} H${x + w} M${x} ${sy + STREETS.width - 6.6} H${x + w}`} />
        </g>
      ))}
    </g>
  );
}

/** Marché couvert: the car park gets a long market hall, its awnings out on the square. */
function Market() {
  const [x, y, w, h] = PARCEL_PLACES.park;
  const awnings = 5;
  return (
    <g>
      <Surface box={[x, y, w, h]} rx={4} className="paving" texture="paving-joints" />
      <rect x={x + 14} y={y + 22} width={w - 28} height={h - 44} rx="3" className="market-shadow" />
      <rect x={x + 12} y={y + 20} width={w - 28} height={h - 44} rx="3" className="market-roof" />
      <path d={`M${x + 12} ${y + h / 2} H${x + w - 16}`} className="market-ridge" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M${x + 18 + i * ((w - 40) / 6)} ${y + 22} V${y + h - 26}`}
          className="market-rib"
        />
      ))}
      {Array.from({ length: awnings }, (_, i) => (
        <g key={i}>
          <rect
            x={x + 12 + i * ((w - 28) / awnings) + 1}
            y={y + 8}
            width={(w - 28) / awnings - 2}
            height="8"
            rx="1"
            className={`awning paint-${i % 3}`}
          />
          <rect
            x={x + 12 + i * ((w - 28) / awnings) + 1}
            y={y + h - 16}
            width={(w - 28) / awnings - 2}
            height="8"
            rx="1"
            className={`awning paint-${(i + 1) % 3}`}
          />
        </g>
      ))}
      <Tree x={x + 6} y={y + 8} r={5} />
      <Tree x={x + w - 7} y={y + h - 9} r={5.5} />
    </g>
  );
}

/** Serres de l'entrepôt: the warehouse roof turns into rows of glasshouses. */
function Glasshouses() {
  const [x, y, w, h] = PARCEL_PLACES.orchard;
  const bays = 8;
  const bw = (w - 8) / bays;
  return (
    <g>
      <Surface box={[x, y, w, h]} rx={2} className="paving" texture="paving-joints" />
      {Array.from({ length: bays }, (_, i) => (
        <g key={i}>
          <rect
            x={x + 4 + i * bw + 0.8}
            y={y + 3}
            width={bw - 1.6}
            height={h - 6}
            rx="1.2"
            className="glass"
          />
          <path d={`M${x + 4 + i * bw + bw / 2} ${y + 3} V${y + h - 3}`} className="glass-ridge" />
          {[0.3, 0.55, 0.8].map((f) => (
            <circle
              key={f}
              cx={x + 4 + i * bw + bw / 2 + (f === 0.55 ? 2.4 : -2.4)}
              cy={y + h * f}
              r="1.6"
              className="foliage"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/** Toits potagers: rows of vegetables on every grey roof. */
function KitchenRoofs() {
  return (
    <g>
      {LIVING_ROOFS.map(([x, y, w, h], i) => {
        const horizontal = w >= h;
        const rows = Math.max(2, Math.floor((horizontal ? h : w) / 6));
        return (
          <g key={i}>
            <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="2" className="roof-soil" />
            {Array.from({ length: rows }, (_, r) => {
              const f = (r + 0.5) / rows;
              return horizontal ? (
                <path
                  key={r}
                  d={`M${x + 4} ${y + 2 + (h - 4) * f} H${x + w - 4}`}
                  className={`roof-crop crop-${(r + i) % 3}`}
                />
              ) : (
                <path
                  key={r}
                  d={`M${x + 2 + (w - 4) * f} ${y + 4} V${y + h - 4}`}
                  className={`roof-crop crop-${(r + i) % 3}`}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

/** Places des fontaines: each crossroads around home gets a round fountain. */
function FountainSquares() {
  return (
    <g>
      {CROSSROADS.map(([x, y]) => (
        <g key={`${x},${y}`}>
          <circle cx={x} cy={y} r="13" className="paving" />
          <circle cx={x} cy={y} r="13" fill="url(#paving-joints)" />
          <circle cx={x} cy={y} r="13" className="square-ring" />
          <circle cx={x} cy={y} r="8.4" className="fountain-rim" />
          <circle cx={x} cy={y} r="7" className="pond" />
          <circle cx={x} cy={y} r="3.6" className="fountain-ripple" />
          <circle cx={x} cy={y} r="1.4" className="fountain-jet" />
        </g>
      ))}
    </g>
  );
}

const SECOND_ART: Record<ParcelId, () => ReactNode> = {
  livingRoofs: KitchenRoofs,
  gardenStreet: PlayStreet,
  rainGardens: StormPond,
  pollinatorStrip: Hedgerow,
  river: BathingRiver,
  squares: FountainSquares,
  park: Market,
  orchard: Glasshouses,
};

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
    <>
      <pattern id="sedum-texture" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" className="sedum-dot" />
        <circle cx="3" cy="3" r="0.5" className="sedum-dot" />
      </pattern>
      <pattern id="meadow-texture" width="7" height="6" patternUnits="userSpaceOnUse">
        <path
          d="M1.5 5l-.5 -1.6M1.5 5l.2 -1.9M1.5 5l1 -1.3M5 2.4l-.4 -1.5M5 2.4l.6 -1.4"
          className="meadow-blade"
        />
        <circle cx="4.2" cy="5.1" r="0.35" className="meadow-speck" />
        <circle cx="6.3" cy="0.9" r="0.28" className="meadow-speck-light" />
      </pattern>
      <pattern
        id="lawn-stripes"
        width="12"
        height="12"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-24)"
      >
        <rect width="6" height="12" className="lawn-stripe" />
        <path d="M8 3l-.3 -1.2M10 9l.3 -1.2" className="meadow-blade" />
      </pattern>
      <pattern id="paving-joints" width="4.2" height="3.2" patternUnits="userSpaceOnUse">
        <path d="M0 3.1H4.2M2.1 0V1.6M0 1.6H4.2M4.1 1.6V3.2" className="paving-joint" />
      </pattern>
    </>
  );
}

/** One restored parcel, without its entrance: the enriched map turns it into a texture. */
export function ParcelArt({ id, future = 0 }: { id: ParcelId; future?: Future }) {
  const Art = future === 1 ? SECOND_ART[id] : PARCEL_ART[id];
  return <Art />;
}

/** Restored parcels, drawn over the grey city and under the generators, in their futures. */
export const ParcelGround = memo(function ParcelGround({
  parcels,
  seconds = '',
}: {
  parcels: readonly ParcelId[];
  /** The parcels in their second future (§6.5), joined with commas. */
  seconds?: string;
}) {
  const second = new Set(seconds.split(','));
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
          const future: Future = second.has(id) ? 1 : 0;
          const Art = future === 1 ? SECOND_ART[id] : PARCEL_ART[id];
          return (
            // A new future plays the unveiling again.
            <Unveil key={`${id}:${future}`} id={id}>
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
  // A swap table in relief under a linen runner, its paper seed packets each printed with their
  // flower, and a jar of loose seeds.
  seedSwap: () => (
    <g>
      <rect x={314.7} y={265.8} width="12" height="9" rx="3" className="table-shadow" />
      <Box box={[314, 265, 12, 9]} className="table" />
      <rect x={314.6} y={269.3} width="10.8" height="2.6" rx="0.5" className="swap-cloth" />
      <path d="M314.9 270.2 H325.1 M314.9 271 H325.1" className="swap-stripe" />
      {[0, 1, 2, 3].map((i) => {
        const x = 315.4 + i * 2.5;
        const y = 266 + (i % 2) * 0.7;
        return (
          <g key={i}>
            <rect x={x} y={y} width="2" height="2.8" rx="0.3" className="swap-packet" />
            <path d={`M${x + 0.2} ${y + 0.6} h1.6`} className="swap-fold" />
            <circle
              cx={x + 1}
              cy={y + 1.7}
              r="0.55"
              className={`${FLOWER_CLASSES[i]} swap-bloom`}
            />
          </g>
        );
      })}
      <circle cx={322.9} cy={272.7} r="0.95" className="swap-jar" />
      <circle cx={322.7} cy={272.5} r="0.45" className="swap-seeds" />
    </g>
  ),
  // A tiled shed, its roof sunlit on one slope, with a rake laid in front, a spade against the
  // wall and a watering can waiting to be borrowed.
  toolLibrary: () => (
    <g>
      <rect x={348.7} y={265.8} width="12" height="10" rx="3.3" className="shed-shadow" />
      <Box box={[348, 265, 12, 10]} className="shed" />
      <path
        d="M348.3 270 H359.7 V272 a2.9 2.9 0 0 1 -2.9 2.7 H351.2 a2.9 2.9 0 0 1 -2.9 -2.7 Z"
        className="shed-shade"
      />
      <path
        d="M350 267.4 H358 M349.6 268.8 H358.4 M349.6 271.6 H358.4 M350 273 H358"
        className="shed-tiles"
      />
      <path d="M348 270 H360" className="shed-ridge" />
      <path d="M349.6 276.7 H355.4" className="tool-handle" />
      <path
        d="M355.4 275.8 v1.8 M355.4 275.9 h0.9 M355.4 276.7 h0.9 M355.4 277.5 h0.9"
        className="tool-metal"
      />
      <path d="M361.3 266.6 v5.4 M360.6 266.6 h1.4" className="tool-handle" />
      <rect x={360.6} y={271.8} width="1.4" height="2.1" rx="0.5" className="tool-blade" />
      <rect x={363} y={271.4} width="2.3" height="2.3" rx="0.8" className="watering-can" />
      <path d="M365.2 272.2 l1.3 -0.9 M363.4 271.4 q0.75 -1.1 1.5 0" className="watering-spout" />
    </g>
  ),
  // Three slatted bins, from fresh greens to ripe dark soil where a seedling already sprouts.
  compost: () => (
    <g>
      {[0, 1, 2].map((i) => {
        const x = 300 + i * 7.5;
        return (
          <g key={i}>
            <rect x={x + 0.5} y={250.6} width="6.5" height="5" rx="1" className="compost-shadow" />
            <rect x={x} y={250} width="6.5" height="5" rx="1" className="compost" />
            <rect
              x={x + 0.9}
              y={250.9}
              width="4.7"
              height="3.2"
              rx="0.6"
              className={`compost-heap compost-heap-${i}`}
            />
            <path d={`M${x + 0.8} 250.45 h4.9`} className="compost-lid" />
            <path d={`M${x + 2.4} 251 v3 M${x + 4.1} 251 v3`} className="compost-slat" />
          </g>
        );
      })}
      {[
        [301.6, 251.8],
        [303.4, 252.9],
        [305, 251.7],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.55" className="compost-greens" />
      ))}
      <path
        d="M318.3 253.6 v-1.6 M318.3 252.4 q-0.9 -0.7 -1.5 -0.2 M318.3 252.2 q0.8 -0.8 1.4 -0.3"
        className="compost-sprout"
      />
    </g>
  ),
  // Cabinets on a shared cable, each with a sunlit lid, a shaded side and a charge gauge that
  // fills one cell after the other.
  sharedBatteries: () => (
    <g>
      <path d="M320.5 205.2 H372.5" className="battery-cable" />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 316 + i * 13;
        return (
          <g key={i}>
            <rect x={x + 0.6} y={198.8} width="9" height="6" rx="2" className="battery-shadow" />
            <Box box={[x, 198, 9, 6]} className="battery" />
            <path d={`M${x + 7.6} 199 v4`} className="battery-shade" />
            <path d={`M${x + 1.4} 198.6 h6.2`} className="battery-lid" />
            <path d={`M${x + 3.5} 199.5 l1.8 1.6 -1.4 0 1.8 1.6`} className="bolt" />
            {[0, 1, 2].map((c) => (
              <rect
                key={c}
                x={x + 1.4 + c * 1.5}
                y={202.6}
                width="1.1"
                height="0.8"
                rx="0.3"
                className="battery-cell"
                style={{ animationDelay: `${(c + i * 0.4) * 0.6}s` }}
              />
            ))}
          </g>
        );
      })}
    </g>
  ),
  // Two hives on their stands, lids catching the sun above the stacked boxes, a landing board at
  // each entrance, a lavender clump beside them and golden bees going to and fro.
  beehives: () => (
    <g>
      {[0, 1].map((i) => {
        const x = 381 + i * 6;
        const y = 197.5 + i * 1.5;
        return (
          <g key={i}>
            <rect x={x + 0.6} y={y + 0.7} width="4.6" height="5" rx="1.4" className="hive-shadow" />
            <Box box={[x, y, 4.6, 5]} className="hive" />
            <path
              d={`M${x + 0.4} ${y + 2.6} h3.8 M${x + 0.4} ${y + 3.8} h3.8`}
              className="hive-line"
            />
            <rect x={x - 0.2} y={y - 0.3} width="5" height="2" rx="0.6" className="hive-lid" />
            <path d={`M${x + 0.3} ${y - 0.15} h4`} className="hive-lid-light" />
            <rect x={x + 1.1} y={y + 5} width="2.4" height="0.9" rx="0.3" className="hive-board" />
            <path d={`M${x + 1.5} ${y + 4.7} h1.6`} className="hive-entrance" />
          </g>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={379.4 + (i % 3) * 0.8}
          cy={202.6 + Math.floor(i / 3) * 0.9 + (i % 2) * 0.3}
          r="0.55"
          className="hive-lavender"
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 378 + noise(i, 9) * 16;
        const cy = 191 + noise(i, 10) * 18;
        return (
          <g key={i} className="bee" style={{ animationDelay: `${-noise(i, 4) * 4}s` }}>
            <ellipse cx={cx - 0.3} cy={cy - 0.55} rx="0.55" ry="0.35" className="bee-wing" />
            <ellipse cx={cx + 0.3} cy={cy - 0.55} rx="0.55" ry="0.35" className="bee-wing" />
            <ellipse cx={cx} cy={cy} rx="0.85" ry="0.6" className="bee-body" />
            <path d={`M${cx - 0.1} ${cy - 0.5} v1`} className="bee-stripe" />
          </g>
        );
      })}
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
  // Five market stalls under striped awnings: each casts its shadow on the avenue, its roof
  // folds along a sunlit ridge and its front hangs in scallops.
  market: () => {
    const [x, y] = OUTER_AVENUES.northEast;
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const x0 = x + 16 + i * 32;
          const y0 = y + 5;
          const stripe = i % 2 ? 'awning-stripe gold' : 'awning-stripe';
          const clip = `market-awning-${i}`;
          return (
            <g key={i}>
              <rect
                x={x0 + 0.9}
                y={y0 + 1.2}
                width="22"
                height="13.4"
                rx="4"
                className="awning-shadow"
              />
              <path
                d={`M${x0} ${y0 + 12} ${Array.from({ length: 5 }, () => 'a2.2 2.2 0 0 0 4.4 0').join(' ')} Z`}
                className={`awning-scallop ${stripe}`}
              />
              <clipPath id={clip}>
                <Box box={[x0, y0, 22, 12]} className="" />
              </clipPath>
              <Box box={[x0, y0, 22, 12]} className="awning" />
              <g clipPath={`url(#${clip})`}>
                {[0, 1, 2, 3, 4].map((k) => (
                  <rect
                    key={k}
                    x={x0 + k * 4.4 + 1.1}
                    y={y0}
                    width="2.2"
                    height="12"
                    className={stripe}
                  />
                ))}
                <rect x={x0} y={y0 + 6} width="22" height="6" className="awning-shade" />
              </g>
              <path d={`M${x0 + 1.5} ${y0 + 6} H${x0 + 20.5}`} className="awning-ridge" />
              <Box box={[x0, y0, 22, 12]} className="awning-edge" />
            </g>
          );
        })}
      </g>
    );
  },

  // Café parasols in alternating cream and sage panels, each with its shadow on the avenue and a
  // sunlit edge, and a bicycle waiting for its repair beside them.
  repairCafe: () => {
    const [x, y] = OUTER_AVENUES.southEast;
    const panels = 8;
    const wedge = (cx: number, cy: number, k: number) => {
      const a0 = (k / panels) * Math.PI * 2;
      const a1 = ((k + 1) / panels) * Math.PI * 2;
      const r = 5;
      return `M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
    };
    const bx = x + 64;
    const by = y + 11;
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const cx = x + 14 + i * 13;
          const cy = y + 11;
          return (
            <g key={i}>
              <circle cx={cx + 0.9} cy={cy + 1.1} r="5.1" className="parasol-shadow" />
              {Array.from({ length: panels }, (_, k) => (
                <path
                  key={k}
                  d={wedge(cx, cy, k)}
                  className={k % 2 ? 'parasol-panel sage' : 'parasol-panel'}
                />
              ))}
              <circle cx={cx} cy={cy} r="5" className="parasol" />
              <path
                d={`M${cx - 4.3} ${cy - 1.6} a4.6 4.6 0 0 1 3 -3.2`}
                className="parasol-light"
              />
              <circle cx={cx} cy={cy} r="0.7" className="parasol-cap" />
            </g>
          );
        })}
        <g className="repair-bike">
          <circle cx={bx - 2.6} cy={by} r="1.7" className="bike-wheel" />
          <circle cx={bx + 2.6} cy={by} r="1.7" className="bike-wheel" />
          <path
            d={`M${bx - 2.6} ${by} L${bx - 0.6} ${by - 1.6} H${bx + 1.6} L${bx + 2.6} ${by} M${bx - 0.6} ${by - 1.6} L${bx} ${by} L${bx + 1.6} ${by - 1.6} M${bx + 1.4} ${by - 2.4} h0.9`}
            className="bike-frame"
          />
        </g>
      </g>
    );
  },

  // Four rain tanks linked by a pipe, each with its shadow, a hooped rim catching the sun and
  // clear water where a ripple spreads.
  rainwater: () => (
    <g>
      <path d="M440 236 H476" className="cistern-pipe" />
      {[0, 1, 2, 3].map((i) => {
        const cx = 440 + i * 12;
        return (
          <g key={i}>
            <circle cx={cx + 0.7} cy={236.8} r="3.6" className="cistern-shadow" />
            <circle cx={cx} cy={236} r="3.4" className="cistern" />
            <circle cx={cx} cy={236} r="2.85" className="cistern-hoop" />
            <path d={`M${cx - 2.9} ${235.2} a3 3 0 0 1 2.1 -2.2`} className="cistern-light" />
            <circle cx={cx} cy={236} r="2.2" className="cistern-water" />
            <circle
              cx={cx}
              cy={236}
              r="1.2"
              className="cistern-ripple"
              style={{ animationDelay: `${-i * 1.1}s` }}
            />
            <path d={`M${cx - 1.3} ${235.1} q0.6 -0.7 1.4 -0.8`} className="cistern-glint" />
          </g>
        );
      })}
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
  // Solar shelters over the avenue: each casts its shadow on the road, stands on two slim posts
  // and carries blue glass cells under a gold rim that catches the sun.
  solarCanopy: () => {
    const [x, y, w] = OUTER_AVENUES.southWest;
    return (
      <g>
        <defs>
          <linearGradient id="canopy-glass" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#a7c4e6" />
            <stop offset="0.45" stopColor="#4c6fa3" />
            <stop offset="1" stopColor="#33467a" />
          </linearGradient>
        </defs>
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${x + 8 + i * ((w - 26) / 6)} ${y + 6})`}>
            <rect x="1.4" y="2" width="18" height="10" rx="1" className="canopy-shadow" />
            <circle cx="3" cy="9.6" r="0.9" className="canopy-post" />
            <circle cx="15" cy="9.6" r="0.9" className="canopy-post" />
            <rect width="18" height="10" rx="1" className="canopy-panel" />
            <path d="M0.8 5h16.4M4.6 0.6v8.8M9 0.6v8.8M13.4 0.6v8.8" className="canopy-grid" />
            <path d="M1.2 0.7h15.6" className="canopy-edge" />
            <path d="M3.4 8.6l3.6 -7.2h1.4l-3.6 7.2z" className="canopy-glint" />
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
