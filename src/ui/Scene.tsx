import { lightPerSecond } from '../game/tick';
import { t } from '../i18n/fr';
import { useGameState } from './useGame';

const CONCRETE = [0xa7, 0xa3, 0x9c];
const SAGE = [0x8f, 0xae, 0x8b];

function mix(from: number[], to: number[], amount: number): string {
  const channels = from.map((c, i) => Math.round(c + ((to[i] ?? c) - c) * amount));
  return `rgb(${channels.join(' ')})`;
}

/** Background buildings: [x, width, height]. */
const BUILDINGS: [number, number, number][] = [
  [10, 56, 120],
  [72, 44, 160],
  [122, 70, 105],
  [198, 48, 150],
  [252, 64, 128],
  [322, 66, 170],
];

/**
 * The balcony scene of phase 1 (docs/game-design.md §6). The grey city slowly takes on colour
 * as production grows, and each generator type adds its own touch to the picture.
 */
export function Scene() {
  const state = useGameState();
  const { pot, balconyPanel, rooftopGarden, greenhouse } = state.generators;
  // 0 with nothing built, 1 around 1 000 Light/s, the end of phase 1.
  const greenness = Math.min(1, Math.log10(1 + lightPerSecond(state)) / 3);
  const buildingFill = mix(CONCRETE, SAGE, greenness * 0.6);
  const gardens = Math.min(rooftopGarden, BUILDINGS.length);
  const greenhouses = Math.min(greenhouse, 2);

  return (
    <figure className="panel scene">
      <svg viewBox="0 0 400 260" role="img" aria-label={t.sceneLabel}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCE9C2" />
            <stop offset="70%" stopColor="#FBF6EC" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF4D6" />
            <stop offset="45%" stopColor="#F4C063" />
            <stop offset="100%" stopColor="#E9A93B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="260" fill="url(#sky)" />
        <circle className="sun" cx="300" cy="62" r="46" fill="url(#sun)" />

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
            {i < gardens && (
              <g className="grow">
                <rect x={x + 2} y={214 - h} width={w - 4} height="7" rx="3.5" fill="#2F6B4F" />
                <circle cx={x + w * 0.3} cy={210 - h} r="7" fill="#8FAE8B" />
                <circle cx={x + w * 0.65} cy={208 - h} r="9" fill="#2F6B4F" />
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
      </svg>
    </figure>
  );
}
