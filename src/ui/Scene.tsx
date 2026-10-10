import { BUTTERFLY_VISIBLE_SECONDS, catchButterfly, type CatchResult } from '../game/butterfly';
import { phaseOf, visualSeason } from '../game/phases';
import { lightPerSecond } from '../game/production';
import { t } from '../i18n/fr';
import { Journal } from './Journal';
import { useGameState, useGameStore } from './useGame';

const CONCRETE = [0xa7, 0xa3, 0x9c];
const SAGE = [0x8f, 0xae, 0x8b];

function mix(from: number[], to: number[], amount: number): string {
  const channels = from.map((c, i) => Math.round(c + ((to[i] ?? c) - c) * amount));
  return `rgb(${channels.join(' ')})`;
}

/** Tall buildings that become vertical farms, by index in BUILDINGS. */
const FARM_BUILDINGS = [5, 1, 3];

/** Street trees of the urban canopy: [x, crown radius]. */
const TREES: [number, number][] = [
  [104, 17],
  [184, 19],
  [244, 16],
  [56, 15],
  [312, 18],
  [-2, 16],
];

/** Pollen motes drifting up from phase 2: [x, y, delay in s]. */
const POLLEN: [number, number, number][] = [
  [60, 200, 0],
  [140, 170, 2.5],
  [210, 190, 5],
  [280, 160, 1.2],
  [340, 200, 3.8],
  [30, 150, 6.3],
  [180, 140, 7.6],
];

/** Background buildings: [x, width, height]. */
const BUILDINGS: [number, number, number][] = [
  [10, 56, 120],
  [72, 44, 160],
  [122, 70, 105],
  [198, 48, 150],
  [252, 64, 128],
  [322, 66, 170],
];

/** The Golden Butterfly (§9.2), drawn with fine lines like the rest of the botanical motifs. */
function ButterflyArt() {
  return (
    <svg viewBox="0 0 48 40" aria-hidden="true">
      <g className="wings">
        <path d="M24 20C18 6 6 2 4 9c-2 7 8 12 20 11Z" />
        <path d="M24 20C30 6 42 2 44 9c2 7-8 12-20 11Z" />
        <path d="M24 21c-8 1-15 6-12 11 3 4 9 0 12-11Z" />
        <path d="M24 21c8 1 15 6 12 11-3 4-9 0-12-11Z" />
      </g>
      <path className="body" d="M24 12v20M24 12c-1-4-4-6-6-7M24 12c1-4 4-6 6-7" />
    </svg>
  );
}

function Butterfly({ onCatch }: { onCatch: (result: CatchResult) => void }) {
  const store = useGameStore();
  const state = useGameState();
  const { visible } = state.butterfly;
  if (visible <= 0) return null;
  // Resume the flight where it is, e.g. after a reload.
  const delay = -(BUTTERFLY_VISIBLE_SECONDS - visible);

  function capture() {
    const result = catchButterfly(store.getState());
    if (!result) return;
    store.dispatch(() => result.state);
    onCatch(result);
  }

  return (
    <button
      // A new flight for each visit.
      key={state.rngSeed}
      type="button"
      className="butterfly"
      aria-label={t.butterfly.catch}
      style={{ animationDelay: `${delay}s` }}
      onClick={capture}
    >
      <ButterflyArt />
    </button>
  );
}

/**
 * The neighbourhood scene (docs/game-design.md §6, §10.4). The grey city slowly takes on colour
 * as production grows, each generator type adds its own touch to the picture, the sky follows
 * the phase (dawn, noon, late afternoon) and, after the first Season, the season's tint. The
 * Golden Butterfly flies across it and the neighbourhood journal sits underneath.
 */
export function Scene({ onCatch }: { onCatch: (result: CatchResult) => void }) {
  const state = useGameState();
  const phase = phaseOf(state);
  const season = visualSeason(state);
  const { pot, balconyPanel, rooftopGarden, greenhouse, verticalFarm, mirrorPlant, urbanCanopy } =
    state.generators;
  // 0 with nothing built, 1 around 100 000 Light/s, well into the city phase.
  const greenness = Math.min(1, Math.log10(1 + lightPerSecond(state)) / 5);
  const buildingFill = mix(CONCRETE, SAGE, greenness * 0.6);
  const gardens = Math.min(rooftopGarden, BUILDINGS.length);
  const greenhouses = Math.min(greenhouse, 2);
  const farms = Math.min(verticalFarm, FARM_BUILDINGS.length);
  const trees = Math.min(urbanCanopy, TREES.length);

  return (
    <figure className="panel scene" data-phase={phase} data-season={season ?? 'none'}>
      <figcaption className="scene-caption">
        <span>{t.phases[phase]}</span>
        {season && <span className="scene-season">{t.visualSeasons[season]}</span>}
      </figcaption>
      <svg viewBox="0 0 400 260" role="img" aria-label={t.sceneLabel}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="sky-top" />
            <stop offset="70%" className="sky-bottom" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF4D6" />
            <stop offset="45%" stopColor="#F4C063" />
            <stop offset="100%" stopColor="#E9A93B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="260" fill="url(#sky)" />
        <circle className="sun" cx="300" cy="62" r="46" fill="url(#sun)" />

        {state.generators.arcology > 0 && (
          <g className="grow arcology">
            <path d="M128 220 C122 160 132 90 150 40 C156 26 172 26 178 40 C196 90 206 160 200 220 Z" />
            {[60, 90, 120, 150, 180].map((y) => (
              <path
                key={y}
                d={`M${142 - (y - 40) / 12} ${y} Q164 ${y + 8} ${186 + (y - 40) / 12} ${y}`}
              />
            ))}
          </g>
        )}

        {mirrorPlant > 0 && (
          <g className="grow mirror-tower">
            <path d="M232 220 V58 M226 220 L232 72 L238 220" />
            <circle cx="232" cy="56" r="4.5" />
            <path className="rays" d="M232 56 L208 34 M232 56 L256 34 M232 56 L232 26" />
          </g>
        )}

        {BUILDINGS.map(([x, w, h], i) => (
          <g key={x}>
            <rect x={x} y={220 - h} width={w} height={h} rx="3" fill={buildingFill} />
            {Array.from({ length: Math.floor(h / 26) }, (_, row) => (
              <line
                key={row}
                x1={x + 8}
                x2={x + w - 8}
                y1={232 - h + row * 26}
                y2={232 - h + row * 26}
                className="window-line"
              />
            ))}
            {FARM_BUILDINGS.indexOf(i) > -1 && FARM_BUILDINGS.indexOf(i) < farms && (
              <g className="grow">
                {Array.from({ length: Math.floor(h / 26) }, (_, row) => (
                  <rect
                    key={row}
                    x={x + 4}
                    y={228 - h + row * 26}
                    width={w - 8}
                    height="7"
                    rx="3.5"
                    className={row % 2 ? 'foliage-light' : 'foliage'}
                  />
                ))}
              </g>
            )}
            {i < gardens && (
              <g className="grow">
                <rect x={x + 2} y={214 - h} width={w - 4} height="7" rx="3.5" className="foliage" />
                <circle cx={x + w * 0.3} cy={210 - h} r="7" className="foliage-light" />
                <circle cx={x + w * 0.65} cy={208 - h} r="9" className="foliage" />
              </g>
            )}
          </g>
        ))}

        {Array.from({ length: greenhouses }, (_, i) => {
          const [x, w, h] = BUILDINGS[i === 0 ? 2 : 4]!;
          const cx = x + w / 2;
          return (
            <path
              key={i}
              className="greenhouse grow"
              d={`M${cx - 26} ${220 - h} V${206 - h} A26 22 0 0 1 ${cx + 26} ${206 - h} V${220 - h} Z`}
            />
          );
        })}

        {TREES.slice(0, trees).map(([x, r]) => (
          <g key={x} className="grow">
            <rect x={x + 7} y={214 - r} width="2.4" height={r + 8} rx="1" fill="#5B4636" />
            <circle cx={x + 8} cy={212 - r * 1.4} r={r} className="foliage" opacity="0.92" />
            <circle cx={x + 8 - r * 0.4} cy={214 - r * 1.2} r={r * 0.6} className="foliage-light" />
          </g>
        ))}

        {/* Balcony */}
        <rect x="0" y="220" width="400" height="40" fill="#EFE6D4" />
        <line x1="0" y1="221" x2="400" y2="221" className="rail" />
        {Array.from({ length: 21 }, (_, i) => (
          <line key={i} x1={i * 20} x2={i * 20} y1="221" y2="260" className="rail thin" />
        ))}

        {Array.from({ length: Math.min(balconyPanel, 4) }, (_, i) => (
          <g key={i} className="grow" transform={`translate(${300 + i * 24} 190) skewX(-12)`}>
            <rect width="20" height="28" rx="2" fill="#2E4A5C" />
            <path d="M0 9.5 H20 M0 19 H20 M10 0 V28" stroke="#8FB3C9" strokeWidth="0.8" />
            <path d="M2 28 C4 20 8 22 9 14" stroke="#2F6B4F" strokeWidth="1.4" fill="none" />
          </g>
        ))}

        {Array.from({ length: Math.min(pot, 10) }, (_, i) => (
          <g key={i} className="grow" transform={`translate(${24 + i * 26} 202)`}>
            <path d="M-7 4 H7 L5 18 H-5 Z" fill="#C8734F" />
            <path d="M0 4 V-6" stroke="#2F6B4F" strokeWidth="1.4" />
            <circle cx="-3" cy="-8" r="3.2" fill="#B79AD6" />
            <circle cx="3" cy="-8" r="3.2" fill="#9C7CC4" />
            <circle cx="0" cy="-12" r="3.2" fill="#B79AD6" />
          </g>
        ))}

        {phase >= 2 &&
          POLLEN.map(([x, y, delay]) => (
            <circle
              key={x}
              className="pollen"
              cx={x}
              cy={y}
              r="1.6"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
      </svg>
      <Butterfly onCatch={onCatch} />
      <Journal />
    </figure>
  );
}
