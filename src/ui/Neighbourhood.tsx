import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { GeneratorId } from '../game/generators';
import type { Phase } from '../game/phases';
import type { UpgradeId } from '../game/upgrades';
import { t } from '../i18n/fr';
import {
  ARCOLOGY_SITE,
  BLOCKS,
  BUILDINGS,
  CAMERAS,
  CAR_PARKS,
  COURTYARD,
  FARM_SITES,
  GARDEN_ROOFS,
  GREENHOUSE_SITES,
  MIRROR_TOWER,
  MIRRORS,
  PANEL_SPOTS,
  PLANTER,
  POT_SPOTS,
  STREETS,
  TREES,
  WORLD,
  cameraLevel,
  cameraTransform,
  centre,
  clickLevel,
  upgradeLevel,
  visibleElements,
  type Box,
  type Building,
} from './neighbourhood';

const CONCRETE = [0xa7, 0xa3, 0x9c];
const SAGE = [0x8f, 0xae, 0x8b];
const GROUND = [0xd8, 0xd3, 0xc8];
const MEADOW = [0xd3, 0xe0, 0xc6];
const PAVING = [0xe9, 0xe3, 0xd6];

function mix(from: number[], to: number[], amount: number): string {
  const channels = from.map((c, i) => Math.round(c + ((to[i] ?? c) - c) * amount));
  return `rgb(${channels.join(' ')})`;
}

/** Arcology terraces appear at these units owned. */
const ARCOLOGY_RINGS = [1, 3, 6, 12, 25];

/** Pollen motes drifting over the map from phase 2: [x, y, delay in s]. */
const POLLEN: [number, number, number][] = [
  [90, 330, 0],
  [210, 280, 2.5],
  [320, 310, 5],
  [420, 260, 1.2],
  [510, 330, 3.8],
  [40, 250, 6.3],
  [270, 220, 7.6],
  [560, 200, 4.4],
];

/**
 * Elements built after the map first appeared play their entrance; those already there when the
 * game loads are simply drawn.
 */
const LiveContext = createContext<{ current: boolean }>({ current: false });

/** One element of the map: grows into place with a golden ring when it is newly built. */
function Appear({
  at,
  size,
  children,
}: {
  at: [number, number];
  size: number;
  children: ReactNode;
}) {
  const live = useContext(LiveContext);
  const [animate] = useState(() => live.current);
  if (!animate) return <g>{children}</g>;
  return (
    <g>
      <g className="appear">{children}</g>
      <circle className="appear-ring" cx={at[0]} cy={at[1]} r={size} />
    </g>
  );
}

/**
 * A generator's elements, with its name as a tooltip. When one of its ×2 upgrades is bought,
 * every element shimmers once.
 */
function Layer({
  id,
  shown,
  level,
  reduced,
  children,
}: {
  id: GeneratorId;
  /** Elements of this generator on the map. */
  shown: number;
  level: number;
  reduced: boolean;
  children: ReactNode;
}) {
  const ref = useRef<SVGGElement>(null);
  const previous = useRef(level);
  useEffect(() => {
    const was = previous.current;
    previous.current = level;
    const element = ref.current;
    if (level <= was || reduced || !element || typeof element.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.animate(
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.3) drop-shadow(0 0 3px rgb(244 192 99 / 0.95))', offset: 0.3 },
        { filter: 'brightness(1)' },
      ],
      { duration: 1800, easing: 'ease-out' },
    );
  }, [level, reduced]);
  return (
    <g ref={ref} data-generator={id} data-level={level}>
      {/* No name before the first unit, so the map never spoils a generator not yet revealed. */}
      {shown > 0 && <title>{t.generators[id].name}</title>}
      {children}
    </g>
  );
}

function Shadow({ box: [x, y, w, h], storeys }: { box: Box; storeys: number }) {
  return (
    <rect
      className="shadow"
      x={x}
      y={y}
      width={w}
      height={h}
      rx="2"
      style={{ '--storeys': storeys } as CSSProperties}
    />
  );
}

function Roof({ box: [x, y, w, h], fill }: { box: Box; fill: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" fill={fill} />
      <rect className="parapet" x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="1" />
      <rect className="vent" x={x + w - 11} y={y + h - 10} width="6" height="5" rx="1" />
    </g>
  );
}

function Wasteland({ box: [x, y, w, h] }: { box: Box }) {
  return (
    <g className="wasteland">
      <rect x={x} y={y} width={w} height={h} rx="3" />
      {[0.2, 0.45, 0.7, 0.85].map((fx, i) => (
        <circle key={fx} cx={x + w * fx} cy={y + h * [0.3, 0.7, 0.4, 0.75][i]!} r="1.6" />
      ))}
    </g>
  );
}

function CarPark({ box: [x, y, w, h] }: { box: Box }) {
  return (
    <g className="carpark">
      <rect x={x} y={y} width={w} height={h} rx="3" />
      {Array.from({ length: Math.floor((w - 8) / 10) }, (_, i) => (
        <path key={i} d={`M${x + 8 + i * 10} ${y + 4} v14 M${x + 8 + i * 10} ${y + h - 18} v14`} />
      ))}
    </g>
  );
}

function Garden({ box: [x, y, w, h], level }: { box: Box; level: number }) {
  const horizontal = w >= h;
  const span = horizontal ? h : w;
  const rows = Math.min(Math.floor((span - 4) / 4.5), 3 + level);
  const gap = (span - 4) / rows;
  // Each row of plants is a dotted line; ripe tomatoes then flowers join them with upgrades.
  const kinds = (i: number) =>
    level >= 3 && i % 3 === 2 ? 'blossom' : level >= 1 && i % 2 ? 'tomato' : 'leafy';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="2" className="bed" />
      {Array.from({ length: rows }, (_, i) => {
        const offset = 2 + gap * i + gap / 2;
        const d = horizontal
          ? `M${x + 3} ${y + offset} H${x + w - 3}`
          : `M${x + offset} ${y + 3} V${y + h - 3}`;
        return (
          <g key={i}>
            <path d={d} className="row foliage-stroke" />
            {kinds(i) !== 'leafy' && <path d={d} className={`row-fruit ${kinds(i)}-stroke`} />}
          </g>
        );
      })}
    </g>
  );
}

function Panel({ x, y, level }: { x: number; y: number; level: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="panel-art">
      <rect width="11" height="8" rx="0.8" className={level >= 1 ? 'framed' : undefined} />
      <path d="M0 4h11M3.7 0v8M7.3 0v8" />
      {level >= 3 && <path className="glint" d="M1 7 L5 1" />}
    </g>
  );
}

function Pot({ x, y, level }: { x: number; y: number; level: number }) {
  const petals = 3 + Math.min(level, 4);
  return (
    <g>
      <circle cx={x} cy={y} r="3.4" className="pot" />
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * 1.6}
            cy={y + Math.sin(a) * 1.6}
            r="1.4"
            className="petal"
          />
        );
      })}
      <circle cx={x} cy={y} r="0.8" className="heart" />
    </g>
  );
}

function Greenhouse({ box: [x, y, w, h], level }: { box: Box; level: number }) {
  const ribs = 3 + Math.min(level, 5);
  const inner: Box = [x + 4, y + 4, w - 8, h - 8];
  return (
    <g className="greenhouse">
      <Shadow box={inner} storeys={1} />
      <rect x={inner[0]} y={inner[1]} width={inner[2]} height={inner[3]} rx="8" className="glass" />
      {[0.3, 0.7].map((f) => (
        <rect
          key={f}
          x={inner[0] + 6}
          y={inner[1] + inner[3] * f - 3}
          width={inner[2] - 12}
          height="6"
          rx="3"
          className="foliage-light"
          opacity="0.8"
        />
      ))}
      {level >= 2 && (
        <rect
          x={inner[0]}
          y={inner[1]}
          width={inner[2]}
          height={inner[3]}
          rx="8"
          className="warmth"
        />
      )}
      {Array.from({ length: ribs }, (_, i) => {
        const rx = inner[0] + (inner[2] / (ribs + 1)) * (i + 1);
        return <path key={i} className="rib" d={`M${rx} ${inner[1]} V${inner[1] + inner[3]}`} />;
      })}
      <path className="ridge" d={`M${inner[0]} ${y + h / 2} H${inner[0] + inner[2]}`} />
    </g>
  );
}

function Farm({ site: { box, storeys }, level }: { site: Building; level: number }) {
  const [x, y, w, h] = box;
  const terraces = Math.min(3 + Math.min(level, 3), Math.floor(Math.min(w, h) / 11));
  return (
    <g className="farm">
      <Shadow box={box} storeys={storeys * 1.6} />
      {Array.from({ length: terraces }, (_, i) => {
        const inset = i * 5;
        return (
          <rect
            key={i}
            x={x + inset}
            y={y + inset}
            width={w - inset * 2}
            height={h - inset * 2}
            rx={Math.max(1.5, 5 - i)}
            className={i % 2 ? 'farm-glass' : 'foliage-light'}
          />
        );
      })}
      {Array.from({ length: Math.ceil(terraces / 2) }, (_, k) => {
        const inset = k * 10 + 2.5;
        return (
          <rect
            key={k}
            x={x + inset}
            y={y + inset}
            width={w - inset * 2}
            height={h - inset * 2}
            rx="1.5"
            className="row foliage-stroke"
          />
        );
      })}
      <rect
        x={x + w / 2 - 5}
        y={y + h / 2 - 5}
        width="10"
        height="10"
        rx="2"
        className="skylight"
      />
    </g>
  );
}

function MirrorField({ count, level }: { count: number; level: number }) {
  const shown = MIRRORS.slice(0, count);
  return (
    <g>
      {level >= 2 &&
        shown
          .filter((_, i) => i % 3 === 0)
          .map(({ x, y }) => (
            <path
              key={`${x},${y}`}
              className="beam"
              d={`M${x} ${y} L${MIRROR_TOWER.x} ${MIRROR_TOWER.y}`}
            />
          ))}
      {shown.map(({ x, y, angle }) => (
        <Appear key={`${x},${y}`} at={[x, y]} size={5}>
          <rect
            x="-4.4"
            y="-1.8"
            width="8.8"
            height="3.6"
            rx="0.6"
            className={level >= 1 ? 'mirror gilded' : 'mirror'}
            transform={`translate(${x} ${y}) rotate(${angle})`}
          />
        </Appear>
      ))}
      <Appear at={[MIRROR_TOWER.x, MIRROR_TOWER.y]} size={12}>
        <circle cx={MIRROR_TOWER.x} cy={MIRROR_TOWER.y} r="11" fill="url(#hearth)" />
        <circle cx={MIRROR_TOWER.x} cy={MIRROR_TOWER.y} r="5.5" className="tower" />
        <circle cx={MIRROR_TOWER.x} cy={MIRROR_TOWER.y} r="2.2" className="heart" />
      </Appear>
    </g>
  );
}

function TreeArt({ x, y, r, level }: { x: number; y: number; r: number; level: number }) {
  return (
    <g>
      <circle cx={x + r * 0.35} cy={y + r * 0.35} r={r} className="tree-shadow" />
      <circle cx={x} cy={y} r={r} className="foliage" opacity="0.88" />
      <circle
        cx={x - r * 0.28}
        cy={y - r * 0.28}
        r={r * 0.62}
        className="foliage-light"
        opacity="0.9"
      />
      {level >= 2 &&
        [0, 2.1, 4.2].map((a) => (
          <circle
            key={a}
            cx={x + Math.cos(a) * r * 0.55}
            cy={y + Math.sin(a) * r * 0.55}
            r="1.3"
            className="blossom"
          />
        ))}
    </g>
  );
}

/** A petal pointing up from (0, 0), `length` long. */
function petal(length: number, width: number): string {
  return `M0 0 C${-width} ${-length * 0.35} ${-width * 0.6} ${-length * 0.9} 0 ${-length} C${width * 0.6} ${-length * 0.9} ${width} ${-length * 0.35} 0 0Z`;
}

/** The living arcology: a rosette of planted and glazed terraces that opens ring by ring. */
function Arcology({ rings, level }: { rings: number; level: number }) {
  const [cx, cy] = centre(ARCOLOGY_SITE);
  return (
    <g className="arcology" transform={`translate(${cx} ${cy}) scale(1.25 0.95)`}>
      <circle cx="8" cy="8" r="54" className="shadow-soft" />
      {Array.from({ length: rings }, (_, i) => {
        const count = 8;
        const length = 56 - i * 9;
        return (
          <Appear key={i} at={[0, 0]} size={length}>
            {Array.from({ length: count }, (_, k) => (
              <path
                key={k}
                d={petal(length, length * 0.42)}
                transform={`rotate(${(k * 360) / count + (i % 2) * 22.5})`}
                className={i % 2 ? 'terrace glass-terrace' : 'terrace foliage-light'}
              />
            ))}
          </Appear>
        );
      })}
      {level >= 1 &&
        Array.from({ length: 8 }, (_, k) => {
          const a = ((k * 45 - 90) * Math.PI) / 180;
          return (
            <circle
              key={k}
              cx={Math.cos(a) * 44}
              cy={Math.sin(a) * 44}
              r="2.4"
              className="blossom"
            />
          );
        })}
      <circle r="9" className="water" />
      <circle r="3" className="heart" />
    </g>
  );
}

function Planter({ blooms }: { blooms: number }) {
  const petals = 5 + blooms * 2;
  const radius = 2.6 + blooms * 0.7;
  return (
    <g className="planter">
      <circle cx={PLANTER.x} cy={PLANTER.y} r="10" className="planter-ring" />
      {Array.from({ length: petals }, (_, i) => {
        const a = (i / petals) * Math.PI * 2;
        return (
          <circle
            key={`${blooms}-${i}`}
            cx={PLANTER.x + Math.cos(a) * radius}
            cy={PLANTER.y + Math.sin(a) * radius}
            r={1.8 + blooms * 0.15}
            className="petal"
          />
        );
      })}
      <circle cx={PLANTER.x} cy={PLANTER.y} r="1.4" className="heart" />
    </g>
  );
}

/** Synergies (§5.3) draw a golden flow between the two generators they link. */
const FLOWS: Record<string, string> = {
  sharedCompost: 'M273 111 C273 150 268 160 268 195',
  usefulShade: 'M342 190 C360 165 400 158 446 156',
  recoveredHeat: 'M513 386 C440 360 340 340 271 365',
};

export interface NeighbourhoodProps {
  generators: Record<GeneratorId, number>;
  upgrades: readonly UpgradeId[];
  phase: Phase;
  /** 0 with nothing built, 1 well into the city phase, rounded so the map redraws rarely. */
  greenness: number;
  reduced: boolean;
}

/**
 * The neighbourhood seen from above (docs/game-design.md §6, §10.4): a grey city block grid in
 * which every generator has its places. Each purchase builds the next element with a soft
 * entrance, ×2 upgrades refine a generator's elements, and the camera pulls back from the home
 * courtyard to the neighbourhood and then the whole city as the Season progresses.
 */
export const Neighbourhood = memo(function Neighbourhood({
  generators,
  upgrades,
  phase,
  greenness,
  reduced,
}: NeighbourhoodProps) {
  const live = useRef(false);
  useEffect(() => {
    live.current = true;
  }, []);

  const level = (id: GeneratorId) => upgradeLevel(upgrades, id);
  const camera = CAMERAS[cameraLevel(phase, generators)];
  const roofFill = mix(CONCRETE, SAGE, greenness * 0.45);
  const gardens = visibleElements(generators.rooftopGarden, GARDEN_ROOFS.length);
  const greenhouses = visibleElements(generators.greenhouse, GREENHOUSE_SITES.length);
  const farms = visibleElements(generators.verticalFarm, FARM_SITES.length);
  const pots = visibleElements(generators.pot, POT_SPOTS.length);
  const panels = visibleElements(generators.balconyPanel, PANEL_SPOTS.length);
  const mirrors = visibleElements(generators.mirrorPlant, MIRRORS.length, 2);
  const trees = visibleElements(generators.urbanCanopy, TREES.length, 4);
  const rings = ARCOLOGY_RINGS.filter((owned) => generators.arcology >= owned).length;
  const flows = Object.keys(FLOWS).filter((id) => upgrades.includes(id as UpgradeId));
  const [, , courtW] = COURTYARD;

  const greyRoofs = BUILDINGS.filter(
    ({ box }) => !GARDEN_ROOFS.slice(0, gardens).some((g) => inside(g, box)),
  );
  const greyFarms = FARM_SITES.slice(farms);

  return (
    <LiveContext.Provider value={live}>
      <svg viewBox={`0 0 ${WORLD.width} ${WORLD.height}`} role="img" aria-label={t.sceneLabel}>
        <defs>
          <radialGradient id="hearth">
            <stop offset="0%" stopColor="#FFF4D6" />
            <stop offset="50%" stopColor="#F4C063" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E9A93B" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cloud">
            <stop offset="0%" stopColor="#3b3328" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3b3328" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="daylight" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" className="light-a" />
            <stop offset="100%" className="light-b" />
          </linearGradient>
          <radialGradient id="vignette" r="75%">
            <stop offset="70%" stopColor="#fbf6ec" stopOpacity="0" />
            <stop offset="100%" stopColor="#fbf6ec" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        <g className="camera" style={{ transform: cameraTransform(camera) }}>
          <rect width={WORLD.width} height={WORLD.height} className="asphalt" />
          {STREETS.horizontal.map((y) => (
            <path key={y} className="lane" d={`M0 ${y + STREETS.width / 2} H${WORLD.width}`} />
          ))}
          {STREETS.vertical.map((x) => (
            <path key={x} className="lane" d={`M${x + STREETS.width / 2} 0 V${WORLD.height}`} />
          ))}
          {BLOCKS.map(([x, y, w, h]) => (
            <rect
              key={`${x},${y}`}
              x={x + 2}
              y={y + 2}
              width={w - 4}
              height={h - 4}
              rx="6"
              fill={mix(GROUND, MEADOW, greenness)}
              className="block"
            />
          ))}
          <rect
            x={COURTYARD[0]}
            y={COURTYARD[1]}
            width={courtW}
            height={COURTYARD[3]}
            rx="4"
            fill={mix(PAVING, MEADOW, Math.min(1, pots / POT_SPOTS.length))}
          />

          {CAR_PARKS.map((box, i) =>
            i === 1 && mirrors > 0 ? null : <CarPark key={i} box={box} />,
          )}
          {generators.arcology === 0 && <Wasteland box={ARCOLOGY_SITE} />}
          {GREENHOUSE_SITES.slice(greenhouses).map((box) => (
            <Wasteland key={box.join()} box={box} />
          ))}

          {[...BUILDINGS, ...greyFarms].map(({ box, storeys }) => (
            <Shadow key={box.join()} box={box} storeys={storeys} />
          ))}
          {[...greyRoofs, ...greyFarms].map(({ box }) => (
            <Roof key={box.join()} box={box} fill={roofFill} />
          ))}
          {/* Roofs that carry a garden keep their grey edge under the beds. */}
          {BUILDINGS.filter((b) => !greyRoofs.includes(b)).map(({ box }) => (
            <rect
              key={box.join()}
              x={box[0]}
              y={box[1]}
              width={box[2]}
              height={box[3]}
              rx="2"
              fill={roofFill}
            />
          ))}

          <Layer
            id="rooftopGarden"
            shown={gardens}
            level={level('rooftopGarden')}
            reduced={reduced}
          >
            {GARDEN_ROOFS.slice(0, gardens).map((box) => (
              <Appear key={box.join()} at={centre(box)} size={Math.max(box[2], box[3]) / 2}>
                <Garden box={box} level={level('rooftopGarden')} />
              </Appear>
            ))}
          </Layer>
          <Layer id="balconyPanel" shown={panels} level={level('balconyPanel')} reduced={reduced}>
            {PANEL_SPOTS.slice(0, panels).map(([x, y]) => (
              <Appear key={`${x},${y}`} at={[x + 5.5, y + 4]} size={8}>
                <Panel x={x} y={y} level={level('balconyPanel')} />
              </Appear>
            ))}
          </Layer>
          <Layer id="pot" shown={pots} level={level('pot')} reduced={reduced}>
            {POT_SPOTS.slice(0, pots).map(([x, y]) => (
              <Appear key={`${x},${y}`} at={[x, y]} size={6}>
                <Pot x={x} y={y} level={level('pot')} />
              </Appear>
            ))}
          </Layer>
          <Layer id="greenhouse" shown={greenhouses} level={level('greenhouse')} reduced={reduced}>
            {GREENHOUSE_SITES.slice(0, greenhouses).map((box) => (
              <Appear key={box.join()} at={centre(box)} size={Math.max(box[2], box[3]) / 2}>
                <Greenhouse box={box} level={level('greenhouse')} />
              </Appear>
            ))}
          </Layer>
          <Layer id="verticalFarm" shown={farms} level={level('verticalFarm')} reduced={reduced}>
            {FARM_SITES.slice(0, farms).map((site) => (
              <Appear
                key={site.box.join()}
                at={centre(site.box)}
                size={Math.max(site.box[2], site.box[3]) / 2}
              >
                <Farm site={site} level={level('verticalFarm')} />
              </Appear>
            ))}
          </Layer>
          {mirrors > 0 && (
            <Layer id="mirrorPlant" shown={mirrors} level={level('mirrorPlant')} reduced={reduced}>
              <MirrorField count={mirrors} level={level('mirrorPlant')} />
            </Layer>
          )}
          {rings > 0 && (
            <Layer id="arcology" shown={rings} level={level('arcology')} reduced={reduced}>
              <Arcology rings={rings} level={level('arcology')} />
            </Layer>
          )}

          <Planter blooms={clickLevel(upgrades)} />

          {flows.map((id) => (
            <path key={id} className="flow" d={FLOWS[id]} />
          ))}

          <Layer id="urbanCanopy" shown={trees} level={level('urbanCanopy')} reduced={reduced}>
            {TREES.slice(0, trees).map((tree) => (
              <Appear key={`${tree.x},${tree.y}`} at={[tree.x, tree.y]} size={tree.r + 3}>
                <TreeArt {...tree} level={level('urbanCanopy')} />
              </Appear>
            ))}
          </Layer>
        </g>

        <g className="clouds" aria-hidden="true">
          <ellipse className="cloud" cx="120" cy="140" rx="150" ry="70" fill="url(#cloud)" />
          <ellipse className="cloud slow" cx="-200" cy="330" rx="180" ry="80" fill="url(#cloud)" />
        </g>
        <rect
          width={WORLD.width}
          height={WORLD.height}
          fill="url(#daylight)"
          className="daylight"
        />
        <rect width={WORLD.width} height={WORLD.height} fill="url(#vignette)" />

        {phase >= 2 &&
          POLLEN.map(([x, y, delay]) => (
            <circle
              key={x}
              className="pollen"
              cx={x}
              cy={y}
              r="2"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
      </svg>
    </LiveContext.Provider>
  );
});

/** Whether `inner` lies within `outer`. */
function inside([x, y, w, h]: Box, [ox, oy, ow, oh]: Box): boolean {
  return x >= ox && y >= oy && x + w <= ox + ow && y + h <= oy + oh;
}
