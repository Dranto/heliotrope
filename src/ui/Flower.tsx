import {
  memo,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { formatNumber, formatPercent } from '../game/format';
import { visualSeason } from '../game/phases';
import { clickValue } from '../game/production';
import { clickHeliotrope } from '../game/tick';
import { isFlying, isPollenOpen } from '../game/pollen';
import { bouquetSize } from '../game/effects';
import { arrivedFeature } from '../game/introductions';
import './pollen.css';
import { t } from '../i18n';
import {
  MAX_POT_BANDS,
  flowerStage,
  florets,
  floretPath,
  leafPaths,
  type FlowerStage,
  type Head,
} from './flower';
import {
  BASE,
  crownPaths,
  leafOut,
  limbLight,
  limbPath,
  treeAge,
  treeShape,
  treeSkeleton,
  type SaplingLeaf,
} from './tree';
import { clickLevel } from './neighbourhood';
import { guideStep } from '../game/guide';
import { useGameState, useGameStore } from './useGame';
import { COROLLAS } from './decorMap';

interface Floater {
  id: number;
  x: number;
  y: number;
  /** Sideways drift, from -1 to 1, so quick clicks on one spot fan out instead of piling up. */
  drift: number;
  text: string;
}

let nextFloaterId = 0;

/** The pollen gauge (§5.6): a golden ring on the planter around the foot of the tree. */
const GAUGE = { rx: 40, ry: 10.5 } as const;
const GAUGE_PATH = `M${BASE.x} ${BASE.y - GAUGE.ry} A${GAUGE.rx} ${GAUGE.ry} 0 1 1 ${BASE.x} ${BASE.y + GAUGE.ry} A${GAUGE.rx} ${GAUGE.ry} 0 1 1 ${BASE.x} ${BASE.y - GAUGE.ry}`;

/** Florets are drawn from one corolla of size 10, scaled to each floret. */
const COROLLA = floretPath(10);

/** Pollen motes around the crown in full bloom (stage 5 and up): [dx, dy, delay in s]. */
const MOTES: [number, number, number][] = [
  [-0.8, 0.1, 0],
  [0.7, -0.3, 1.6],
  [-0.2, -0.75, 3.1],
  [0.9, 0.35, 4.4],
  [0.15, 0.5, 5.7],
];

/** Gilded sprigs planted around the foot of the tree, one per click upgrade (§5.2 has ten). */
const SPRIGS = 11;

/** Size of the arrival rings (§10.8) as they leave the crown. */
const ARRIVAL_RADIUS = 36;

function motionReduced(setting: boolean): boolean {
  return setting || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

function LeafArt({ x, y, length, angle }: SaplingLeaf) {
  const { blade, veins } = leafPaths(length);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} className="leaf-art">
      <path d={blade} className="leaf" />
      <path d={veins} className="leaf-veins" />
    </g>
  );
}

function HeadArt({ head, solar }: { head: Head; solar: boolean }) {
  const list = useMemo(() => florets(head), [head]);
  return (
    <g className="head">
      <ellipse
        cx={head.x}
        cy={head.y + head.radius * 0.12}
        rx={head.radius * 0.95}
        ry={head.radius * 0.55}
        className="head-shade"
      />
      {list.map((f, i) =>
        f.bud ? (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${((i * 41) % 60) - 30})`}>
            <ellipse rx={f.size * 0.42} ry={f.size * 0.58} className="bud" />
          </g>
        ) : (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${(i * 37) % 72})`}>
            <path
              d={COROLLA}
              transform={`scale(${f.size / 10})`}
              fill={`url(#corolla-${f.shade})`}
              className="corolla"
            />
            <circle r={f.size * 0.24} className="eye" />
            <circle r={f.size * 0.11} className={solar ? 'pistil solar' : 'pistil'} />
          </g>
        ),
      )}
    </g>
  );
}

/** A gilded sprig at the foot of the tree, leaning outwards: two small leaves and a bud. */
function Sprig({ index }: { index: number }) {
  // Spread along the front of the planter, from the middle outwards.
  const side = index % 2 === 0 ? 1 : -1;
  const step = Math.ceil(index / 2);
  const a = Math.PI / 2 + side * step * 0.27;
  const x = BASE.x + Math.cos(a) * (GAUGE.rx + 5);
  const y = BASE.y + Math.sin(a) * (GAUGE.ry + 2.5);
  return (
    <g
      transform={`translate(${round(x)} ${round(y)}) rotate(${round(-side * step * 9)}) scale(0.8)`}
      className="ornament"
    >
      <path d="M0 0 C-5 -2 -8 -7 -7 -11 C-3 -9 -1 -5 0 0Z" />
      <path d="M0 0 C5 -2 8 -7 7 -11 C3 -9 1 -5 0 0Z" />
      <circle cy="-8" r="1.8" />
    </g>
  );
}

interface TreeProps {
  seed: number;
  age: number;
  leaves: number;
  stage: FlowerStage;
  sprigs: number;
  bands: number;
  plantRef: RefObject<SVGGElement | null>;
  headsRef: RefObject<SVGGElement | null>;
}

/**
 * The tree itself, redrawn only when it grows, leafs out, blooms or gains a sprig or a seed, not
 * on every tick.
 */
const Tree = memo(function Tree({
  seed,
  age,
  leaves,
  stage,
  sprigs,
  bands,
  plantRef,
  headsRef,
}: TreeProps) {
  const skeleton = useMemo(() => treeSkeleton(seed), [seed]);
  const shape = useMemo(
    () => treeShape(skeleton, age, leaves, stage),
    [skeleton, age, leaves, stage],
  );
  const solar = stage >= 6;
  const centre = shape.crown;
  const wood = useMemo(() => shape.limbs.map(limbPath).join(''), [shape.limbs]);
  const crown = useMemo(() => crownPaths(shape.clusters), [shape.clusters]);

  return (
    <>
      {solar && (
        <g className="rays" style={{ transformOrigin: `${centre.x}px ${centre.y}px` }}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const from = centre.radius + 4;
            const to = centre.radius + (i % 2 ? 14 : 24);
            return (
              <path
                key={i}
                d={`M${round(centre.x + Math.cos(a) * from)} ${round(centre.y + Math.sin(a) * from * 0.8)} L${round(centre.x + Math.cos(a) * to)} ${round(centre.y + Math.sin(a) * to * 0.8)}`}
              />
            );
          })}
        </g>
      )}

      <g className="pit">
        <ellipse cx={BASE.x} cy={BASE.y + 0.6} rx="19" ry="4.6" className="soil" />
        {shape.roots.map((root) => (
          <path key={root.d} d={root.d} className="foot-root" strokeWidth={root.width} />
        ))}
        {Array.from({ length: bands }, (_, k) => (
          <circle
            key={k}
            className="season-seed"
            cx={BASE.x + (k - (bands - 1) / 2) * 8}
            cy={BASE.y + 6.4}
            r="1.7"
          />
        ))}
      </g>
      {Array.from({ length: sprigs }, (_, i) => (
        <Sprig key={i} index={i} />
      ))}

      <g ref={plantRef} className="plant">
        <g className="plant-idle">
          <g className="wood">
            <path d={wood} className="limb" />
            {shape.limbs
              .filter((s) => s.depth <= 2 && s.w0 > 1.6)
              .map((s) => (
                <path
                  key={s.index}
                  d={limbLight(s)}
                  className="limb-light"
                  strokeWidth={round(s.w0 * 0.22)}
                />
              ))}
          </g>
          {shape.seedling && (
            <g className="sprout">
              <path
                className="leaf"
                d={`M${BASE.x} ${BASE.y - 10} C${BASE.x - 6} ${BASE.y - 20} ${BASE.x - 20} ${BASE.y - 18} ${BASE.x - 22} ${BASE.y - 8} C${BASE.x - 14} ${BASE.y - 4} ${BASE.x - 5} ${BASE.y - 6} ${BASE.x} ${BASE.y - 10}Z`}
              />
              <path
                className="leaf"
                d={`M${BASE.x} ${BASE.y - 10} C${BASE.x + 6} ${BASE.y - 22} ${BASE.x + 20} ${BASE.y - 22} ${BASE.x + 23} ${BASE.y - 12} C${BASE.x + 15} ${BASE.y - 6} ${BASE.x + 5} ${BASE.y - 7} ${BASE.x} ${BASE.y - 10}Z`}
              />
            </g>
          )}
          {shape.leaves.map((leaf) => (
            <LeafArt key={`${leaf.x},${leaf.y}`} {...leaf} />
          ))}
          <g
            ref={headsRef}
            className="heads"
            style={{ transformOrigin: `${centre.x}px ${centre.y}px` }}
          >
            {/* The crown in three passes, so its tufts read as one mass of leaves lit from the
                upper left: the shade under every tuft, then the leaves, then the light. */}
            <g className="crown">
              <path d={crown.shade} className="crown-shade" />
              {crown.tones.map((d, k) => (
                <path key={k} d={d} className={`crown-leaves tone-${k}`} />
              ))}
              <path d={crown.light} className="crown-light" />
            </g>
            {shape.heads.map((head) => (
              <HeadArt key={`${head.x},${head.y}`} head={head} solar={solar} />
            ))}
            {stage >= 5 &&
              MOTES.map(([dx, dy, delay]) => (
                <circle
                  key={dx}
                  className="mote"
                  cx={round(centre.x + dx * centre.radius)}
                  cy={round(centre.y + dy * centre.radius)}
                  r="1.6"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
          </g>
        </g>
      </g>
    </>
  );
});

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The clickable heliotrope tree, standing in the home courtyard of the map (docs/game-design.md
 * §10.1, §10.4). It grows over the whole game, one Season after another, from a seed of its own;
 * the Light of the current Season leafs it out and makes it bloom through seven stages. Each
 * click upgrade plants a gilded sprig at its foot, and each Season completed a golden seed.
 */
export function Flower() {
  const store = useGameStore();
  const state = useGameState();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [tilt, setTilt] = useState(0);
  const heads = useRef<SVGGElement>(null);
  const plant = useRef<SVGGElement>(null);
  const value = clickValue(state);
  const stage = flowerStage(state.totalLight);
  const age = treeAge(state.seasons, state.totalLight);
  const leaves = leafOut(state.seasons, state.totalLight);
  const crown = useMemo(
    () => treeShape(treeSkeleton(state.treeSeed), age, leaves, stage).crown,
    [state.treeSeed, age, leaves, stage],
  );
  const season = visualSeason(state);
  const reduced = state.settings.reducedMotion;
  const arrived = arrivedFeature(state);
  const pollenOpen = isPollenOpen(state);
  const flying = isFlying(state);
  const bouquet = bouquetSize(state.effects);

  // The plant stretches and glows once when it reaches a new stage during play.
  const previous = useRef(stage);
  useEffect(() => {
    const was = previous.current;
    previous.current = stage;
    const element = plant.current;
    if (stage <= was || !element || typeof element.animate !== 'function') return;
    if (motionReduced(reduced)) return;
    element.animate(
      [
        { transform: 'scale(0.9, 0.82)', filter: 'brightness(1)' },
        {
          transform: 'scale(1.02, 1.04)',
          filter: 'brightness(1.15) drop-shadow(0 0 8px rgb(246 213 143 / 0.95))',
          offset: 0.55,
        },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: 1600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }, [stage, reduced]);

  function harvest(event: MouseEvent<HTMLButtonElement>) {
    store.dispatch(clickHeliotrope);
    const element = heads.current;
    if (element && typeof element.animate === 'function' && !motionReduced(reduced)) {
      // The crown rustles and its florets open a little wider at each touch.
      element.animate(
        [
          { transform: 'scale(0.95)' },
          { transform: 'scale(1.035)', offset: 0.45 },
          { transform: 'scale(1)' },
        ],
        { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }
    const rect = event.currentTarget.getBoundingClientRect();
    // Keyboard activation (detail 0) has no pointer position: float from the crown.
    const fromPointer = event.detail > 0;
    // A little scatter, so quick clicks on the same spot never stack their numbers into one blur.
    const x =
      (fromPointer ? event.clientX - rect.left : rect.width / 2) + (Math.random() - 0.5) * 40;
    const y =
      (fromPointer ? event.clientY - rect.top : (rect.height * crown.y) / 260) +
      (Math.random() - 0.5) * 18;
    const drift = Math.random() * 2 - 1;
    const floater = { id: nextFloaterId++, x, y, drift, text: `+${formatNumber(value)}` };
    setFloaters((list) => [...list.slice(-12), floater]);
  }

  function follow(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientX - rect.left) / rect.width - 0.5;
    setTilt(Math.max(-1, Math.min(1, offset * 2)) * 6);
  }

  return (
    <section
      className="flower-panel"
      aria-label={t.light}
      data-season={season ?? 'none'}
      data-stage={stage}
      data-age={age}
      data-flight={flying || undefined}
    >
      {pollenOpen && (
        <div
          className="visually-hidden"
          role="meter"
          aria-label={t.pollen(formatPercent(state.pollen.gauge))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(state.pollen.gauge * 100)}
        />
      )}
      <button
        type="button"
        className="flower-button"
        data-guide={guideStep(state)?.kind === 'flower' || undefined}
        aria-label={t.clickFlower}
        onPointerMove={follow}
        onPointerLeave={() => setTilt(0)}
        onClick={harvest}
      >
        <svg viewBox="0 0 200 260" className="flower-art" aria-hidden="true">
          <defs>
            <radialGradient id="flower-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" className="halo-a" />
              <stop offset="60%" className="halo-b" />
              <stop offset="100%" className="halo-c" />
            </radialGradient>
            {COROLLAS[state.decor.flower].map(([a, b, c], i) => (
              <radialGradient key={i} id={`corolla-${i}`} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={a} />
                <stop offset="55%" stopColor={b} />
                <stop offset="100%" stopColor={c} />
              </radialGradient>
            ))}
            <linearGradient id="leaf-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5E9471" />
              <stop offset="100%" stopColor="#2F6B4F" />
            </linearGradient>
            <linearGradient id="bark-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8A6A4E" />
              <stop offset="45%" stopColor="#6B4E3A" />
              <stop offset="100%" stopColor="#4A3528" />
            </linearGradient>
          </defs>
          {/* Its shadow on the courtyard paving, and the glow of its light around the crown. */}
          <ellipse
            cx={BASE.x + 6}
            cy={BASE.y + 3}
            rx={round(28 + crown.radius * 0.7)}
            ry={round(6 + crown.radius * 0.12)}
            className="ground-shadow"
          />
          <circle
            cx={crown.x}
            cy={crown.y}
            r={round(crown.radius * 1.5 + 18)}
            fill="url(#flower-halo)"
            className="halo"
            style={{ opacity: 0.4 + stage * 0.08 }}
          />
          {/* A mechanic has just joined the game (§10.8): three golden rings spread from the
              crown, once, over a brief glow. */}
          {arrived && (
            <g key={arrived} className="arrival" aria-hidden="true">
              <circle cx={crown.x} cy={crown.y} r={ARRIVAL_RADIUS} className="arrival-glow" />
              <circle cx={crown.x} cy={crown.y} r={ARRIVAL_RADIUS} />
              <circle cx={crown.x} cy={crown.y} r={ARRIVAL_RADIUS} className="arrival-late" />
              <circle
                cx={crown.x}
                cy={crown.y}
                r={ARRIVAL_RADIUS}
                className="arrival-late arrival-last"
              />
            </g>
          )}
          {/* The pollen gauge (§5.6): a golden ring on the planter around the foot of the tree,
              filling with the clicks. It joins the tree with the first click upgrade (§10.8) and
              draws itself in. */}
          {pollenOpen && (
            <g className={arrived === 'pollen' ? 'pollen-gauge pollen-arriving' : 'pollen-gauge'}>
              <path d={GAUGE_PATH} className="pollen-track" pathLength={1} />
              <path
                d={GAUGE_PATH}
                className="pollen-fill"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={flying ? 0 : 1 - state.pollen.gauge}
              />
            </g>
          )}
          {/* A generous touch target around the tree, so a tap between two tufts still counts. */}
          <ellipse cx="100" cy="170" rx="62" ry="88" fill="transparent" className="flower-hit" />
          <g className="flower-sway" style={{ transform: `rotate(${tilt}deg)` }}>
            <Tree
              seed={state.treeSeed}
              age={age}
              leaves={leaves}
              stage={stage}
              sprigs={Math.min(clickLevel(state.upgrades), SPRIGS)}
              bands={Math.min(state.seasons, MAX_POT_BANDS)}
              plantRef={plant}
              headsRef={heads}
            />
          </g>
          {/* The bouquet (§5.7): a golden petal around the gauge for each effect running beside
              the first, over the planter. */}
          {bouquet > 1 && (
            <g className="bouquet-petals" data-count={bouquet}>
              {Array.from({ length: Math.min(bouquet - 1, 7) }, (_, i) => {
                const a = Math.PI + ((i + 0.5) / 7) * Math.PI;
                return (
                  <ellipse
                    key={i}
                    cx={round(BASE.x + Math.cos(a) * (GAUGE.rx + 9))}
                    cy={round(BASE.y - 2 + Math.sin(a) * (GAUGE.ry + 6))}
                    rx="3"
                    ry="5.5"
                  />
                );
              })}
            </g>
          )}
        </svg>
        {floaters.map((f) => (
          <span
            key={f.id}
            className="floater"
            style={{ left: f.x, top: f.y, '--drift': f.drift } as CSSProperties}
            onAnimationEnd={() => setFloaters((list) => list.filter((x) => x.id !== f.id))}
          >
            {f.text}
          </span>
        ))}
      </button>
    </section>
  );
}
