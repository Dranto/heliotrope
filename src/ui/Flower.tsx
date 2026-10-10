import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { formatNumber } from '../game/format';
import { visualSeason } from '../game/phases';
import { clickValue } from '../game/production';
import { clickHeliotrope } from '../game/tick';
import { t } from '../i18n/fr';
import {
  ARCH_ORNAMENTS,
  MAX_POT_BANDS,
  SOIL,
  flowerShape,
  flowerStage,
  florets,
  floretPath,
  leafPaths,
  stemPath,
  type FlowerStage,
  type Head,
  type Leaf,
} from './flower';
import { clickLevel } from './neighbourhood';
import { useGameState, useGameStore } from './useGame';

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
}

let nextFloaterId = 0;

/** Florets are drawn from one corolla of size 10, scaled to each floret. */
const COROLLA = floretPath(10);

/** Pollen motes around the solar heliotrope (stage 5 and up): [dx, dy, delay in s]. */
const MOTES: [number, number, number][] = [
  [-38, 10, 0],
  [30, -6, 1.6],
  [-12, -30, 3.1],
  [44, 18, 4.4],
  [6, 24, 5.7],
];

function motionReduced(setting: boolean): boolean {
  return setting || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

function LeafArt({ x, y, length, angle }: Leaf) {
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
        rx={head.radius * 0.9}
        ry={head.radius * 0.5}
        className="head-shade"
      />
      {list.map((f, i) =>
        f.bud ? (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${((i * 41) % 60) - 30})`}>
            <ellipse rx={f.size * 0.42} ry={f.size * 0.58} className="bud" />
            <ellipse
              cx={-f.size * 0.12}
              cy={-f.size * 0.2}
              rx={f.size * 0.14}
              ry={f.size * 0.22}
              className="bud-light"
            />
          </g>
        ) : (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${(i * 37) % 72})`}>
            <path
              d={COROLLA}
              transform={`scale(${f.size / 10})`}
              fill={`url(#corolla-${f.shade})`}
              className="corolla"
            />
            <circle r={f.size * 0.26} className="eye" />
            <circle r={f.size * 0.1} className={solar ? 'pistil solar' : 'pistil'} />
          </g>
        ),
      )}
    </g>
  );
}

/** A gilded sprig on the arch, pointing outwards: two small leaves around a golden bud. */
function Ornament({
  x,
  y,
  rotation,
  crown,
}: {
  x: number;
  y: number;
  rotation: number;
  crown: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`} className="ornament">
      {crown ? (
        <path d={COROLLA} transform="translate(0 -1) scale(0.55)" />
      ) : (
        <>
          <path d="M0 0 C-5 -2 -8 -7 -7 -11 C-3 -9 -1 -5 0 0Z" />
          <path d="M0 0 C5 -2 8 -7 7 -11 C3 -9 1 -5 0 0Z" />
          <circle cy="-8" r="1.8" />
        </>
      )}
    </g>
  );
}

interface PlantProps {
  stage: FlowerStage;
  ornaments: number;
  bands: number;
  plantRef: RefObject<SVGGElement | null>;
  headsRef: RefObject<SVGGElement | null>;
}

/**
 * The plant itself, redrawn only when the stage, the click upgrades or the Seasons completed
 * change, not on every tick.
 */
const Plant = memo(function Plant({ stage, ornaments, bands, plantRef, headsRef }: PlantProps) {
  const shape = useMemo(() => flowerShape(stage), [stage]);
  const solar = stage >= 6;
  const main = shape.heads[0];
  const topX = main?.x ?? SOIL.x;

  return (
    <>
      {ARCH_ORNAMENTS.slice(0, ornaments).map(([x, y, rotation], i) => (
        <Ornament key={i} x={x} y={y} rotation={rotation} crown={i === 0} />
      ))}

      {stage >= 6 && main && (
        <g className="rays" style={{ transformOrigin: `${main.x}px ${main.y}px` }}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const from = main.radius + 8;
            const to = main.radius + (i % 2 ? 26 : 40);
            return (
              <path
                key={i}
                d={`M${main.x + Math.cos(a) * from} ${main.y + Math.sin(a) * from} L${main.x + Math.cos(a) * to} ${main.y + Math.sin(a) * to}`}
              />
            );
          })}
        </g>
      )}

      <g ref={plantRef} className="plant">
        <g className="plant-idle">
          <path className="stem" d={stemPath(shape.stemTop)} />
          <path className="stem-light" d={stemPath(shape.stemTop)} />
          {shape.branches.map((d) => (
            <g key={d}>
              <path className="stem branch" d={d} />
              <path className="stem-light" d={d} />
            </g>
          ))}
          {stage === 0 ? (
            <g className="sprout">
              <path
                className="leaf"
                d={`M${topX} ${shape.stemTop} C${topX - 6} ${shape.stemTop - 10} ${topX - 20} ${shape.stemTop - 8} ${topX - 22} ${shape.stemTop + 2} C${topX - 14} ${shape.stemTop + 6} ${topX - 5} ${shape.stemTop + 4} ${topX} ${shape.stemTop}Z`}
              />
              <path
                className="leaf"
                d={`M${topX} ${shape.stemTop} C${topX + 6} ${shape.stemTop - 12} ${topX + 20} ${shape.stemTop - 12} ${topX + 23} ${shape.stemTop - 2} C${topX + 15} ${shape.stemTop + 4} ${topX + 5} ${shape.stemTop + 3} ${topX} ${shape.stemTop}Z`}
              />
              <ellipse cx={topX} cy={shape.stemTop - 5} rx="3" ry="5" className="bud green" />
            </g>
          ) : (
            shape.leaves.map((leaf) => <LeafArt key={`${leaf.x},${leaf.y}`} {...leaf} />)
          )}
          <g
            ref={headsRef}
            className="heads"
            style={{ transformOrigin: `${topX}px ${main?.y ?? shape.stemTop}px` }}
          >
            {/* Side heads behind, main head in front. */}
            {[...shape.heads].reverse().map((head) => (
              <HeadArt key={`${head.x},${head.y}`} head={head} solar={solar} />
            ))}
            {stage >= 5 &&
              main &&
              MOTES.map(([dx, dy, delay]) => (
                <circle
                  key={dx}
                  className="mote"
                  cx={main.x + dx}
                  cy={main.y + dy}
                  r="1.6"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
          </g>
        </g>
      </g>

      <g className="pot-art">
        <path
          className="pot-body"
          d="M70 228 H130 C128.5 240 126 250 121 256 H79 C74 250 71.5 240 70 228Z"
        />
        <path className="pot-sheen" d="M76 231 C77 240 79 248 82 253" />
        <rect className="pot-rim" x="64" y="218" width="72" height="11" rx="3" />
        <ellipse className="soil" cx={SOIL.x} cy={SOIL.y - 2.5} rx="31" ry="2.6" />
        {Array.from({ length: bands }, (_, k) => (
          <circle
            key={k}
            className="season-seed"
            cx={SOIL.x + (k - (bands - 1) / 2) * 9}
            cy="224"
            r="1.7"
          />
        ))}
      </g>
    </>
  );
});

/**
 * The clickable heliotrope, framed by an Art nouveau arch (docs/game-design.md §10.1, §10.4). It
 * grows through seven stages with the Light earned this Season, each click upgrade gilds the
 * arch with a sprig, and each Season completed leaves a golden seed on the pot.
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
  const season = visualSeason(state);
  const reduced = state.settings.reducedMotion;

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
      // The florets open a little wider at each touch.
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
    // Keyboard activation (detail 0) has no pointer position: float from the blossoms.
    const fromPointer = event.detail > 0;
    const x = fromPointer ? event.clientX - rect.left : rect.width / 2;
    const y = fromPointer ? event.clientY - rect.top : rect.height / 3;
    const floater = { id: nextFloaterId++, x, y, text: `+${formatNumber(value)}` };
    setFloaters((list) => [...list.slice(-12), floater]);
  }

  function follow(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientX - rect.left) / rect.width - 0.5;
    setTilt(Math.max(-1, Math.min(1, offset * 2)) * 6);
  }

  const headY = flowerShape(stage).heads[0]?.y ?? SOIL.y - 30;

  return (
    <section
      className="flower-panel"
      aria-label={t.light}
      data-season={season ?? 'none'}
      data-stage={stage}
    >
      <button
        type="button"
        className="flower-button"
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
            <linearGradient id="arch-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F4ECDC" stopOpacity="0.2" />
            </linearGradient>
            {[
              ['#E6DAF5', '#B79AD6', '#8E6CBB'],
              ['#D9C6F0', '#A486CB', '#7A58A8'],
              ['#F0E6FA', '#C6ADE2', '#9B7CC6'],
            ].map(([a, b, c], i) => (
              <radialGradient key={i} id={`corolla-${i}`} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={a} />
                <stop offset="55%" stopColor={b} />
                <stop offset="100%" stopColor={c} />
              </radialGradient>
            ))}
            <clipPath id="arch-clip">
              <path d="M20 256 V100 C20 40 60 8 100 8 C140 8 180 40 180 100 V256 Z" />
            </clipPath>
            <linearGradient id="leaf-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5E9471" />
              <stop offset="100%" stopColor="#2F6B4F" />
            </linearGradient>
            <linearGradient id="pot-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B5603F" />
              <stop offset="40%" stopColor="#D58A63" />
              <stop offset="100%" stopColor="#A8553A" />
            </linearGradient>
          </defs>
          <path
            className="arch-fill"
            d="M20 256 V100 C20 40 60 8 100 8 C140 8 180 40 180 100 V256 Z"
            fill="url(#arch-fill)"
          />
          <circle
            cx="100"
            cy={headY}
            r={60 + stage * 9}
            fill="url(#flower-halo)"
            clipPath="url(#arch-clip)"
            className="halo"
            style={{ opacity: 0.45 + stage * 0.09 }}
          />
          <path
            className="arch"
            d="M20 256 V100 C20 40 60 8 100 8 C140 8 180 40 180 100 V256"
            fill="none"
          />
          <path
            className="arch-inner"
            d="M27 256 V101 C27 46 64 15 100 15 C136 15 173 46 173 101 V256"
            fill="none"
          />
          <g className="flower-sway" style={{ transform: `rotate(${tilt}deg)` }}>
            <Plant
              stage={stage}
              ornaments={clickLevel(state.upgrades)}
              bands={Math.min(state.seasons, MAX_POT_BANDS)}
              plantRef={plant}
              headsRef={heads}
            />
          </g>
        </svg>
        {floaters.map((f) => (
          <span
            key={f.id}
            className="floater"
            style={{ left: f.x, top: f.y }}
            onAnimationEnd={() => setFloaters((list) => list.filter((x) => x.id !== f.id))}
          >
            {f.text}
          </span>
        ))}
      </button>
    </section>
  );
}
