// The great works on the map (docs/game-design.md §6.6, M20): the solar tram runs on the ring
// road around the city; the reopened river, the food hall and the seed tower each take a grey
// block of the outskirts beside it. Each stage built adds to the drawing; a work still to start
// shows its site as a dotted golden outline. Drawn in SVG over both maps.
import { memo, type ReactNode } from 'react';
import { WORK_IDS, type WorkId } from '../game/greatWorks';
import { t } from '../i18n';
import { Appear } from './Neighbourhood';
import { centre, WORLD } from './neighbourhood';
import { parseStages, WORK_PLACES } from './greatWorksMap';
import './greatWorks.css';

/** The tram line: the middle of the ring road around the city. */
const RING = 11;
const LINE = `M${-RING} ${-RING}H${WORLD.width + RING}V${WORLD.height + RING}H${-RING}Z`;

/** Stations in the middle of each side of the ring road. */
const STATIONS: [number, number, boolean][] = [
  [WORLD.width / 2, -RING, true],
  [WORLD.width + RING, WORLD.height / 2, false],
  [WORLD.width / 2, WORLD.height + RING, true],
  [-RING, WORLD.height / 2, false],
];

/** Points along the ring road, every `step` world units, for masts. */
function alongRing(step: number): [number, number][] {
  const { width: w, height: h } = WORLD;
  const points: [number, number][] = [];
  for (let x = 0; x <= w; x += step) points.push([x, -RING], [x, h + RING]);
  for (let y = step; y < h; y += step) points.push([-RING, y], [w + RING, y]);
  return points;
}

function Tram({ stage, reduced }: { stage: number; reduced: boolean }) {
  return (
    <g className="gw-tram-line">
      <path className="gw-sleeper" d={LINE} />
      <path className="gw-rail" d={LINE} transform="translate(-1.4 -1.4)" />
      <path className="gw-rail" d={LINE} transform="translate(1.4 1.4)" />
      {stage >= 2 && (
        <g>
          <path className="gw-wire" d={LINE} />
          {alongRing(50).map(([x, y]) => (
            <g key={`${x} ${y}`} transform={`translate(${x} ${y})`}>
              <circle className="gw-mast" r={1} />
              <circle className="gw-vine" cx={1.2} cy={-0.8} r={1.3} />
              <circle className="gw-vine" cx={-0.9} cy={0.9} r={1} />
            </g>
          ))}
        </g>
      )}
      {stage >= 3 &&
        STATIONS.map(([x, y, across]) => (
          <g key={`${x} ${y}`} transform={`translate(${x} ${y}) rotate(${across ? 0 : 90})`}>
            <rect className="gw-platform" x={-14} y={-7.5} width={28} height={4} rx={1} />
            <rect className="gw-platform" x={-14} y={3.5} width={28} height={4} rx={1} />
            <rect className="gw-roof" x={-10} y={-8.5} width={20} height={3.2} rx={1.2} />
            <rect className="gw-roof" x={-10} y={5.3} width={20} height={3.2} rx={1.2} />
          </g>
        ))}
      {stage >= 4 && (
        <g className="gw-tram">
          <TramCar />
          {!reduced && (
            <animateMotion dur="120s" repeatCount="indefinite" rotate="auto" path={LINE} />
          )}
        </g>
      )}
    </g>
  );
}

/** A two-car solar tram seen from above, its roof planted. */
function TramCar() {
  return (
    <g>
      <rect className="gw-tram" x={-13} y={-2.6} width={12.4} height={5.2} rx={2.2} />
      <rect className="gw-tram" x={0.6} y={-2.6} width={12.4} height={5.2} rx={2.2} />
      <rect className="gw-tram-roof" x={-11} y={-1.5} width={8.4} height={3} rx={1} />
      <rect className="gw-tram-roof" x={2.6} y={-1.5} width={8.4} height={3} rx={1} />
      <circle className="gw-window" cx={-12} cy={0} r={0.7} />
      <circle className="gw-window" cx={12} cy={0} r={0.7} />
    </g>
  );
}

/** The river reopened across its block: the slab, then water, banks, footbridges and a deck. */
function River({ stage }: { stage: number }) {
  const bed = 'M-6 30C30 26 52 58 90 62S150 86 188 92';
  return (
    <g>
      {stage === 1 ? (
        <g>
          <path className="gw-slab" d={bed} strokeWidth={22} stroke="#b4ada0" fill="none" />
          <path className="gw-crack" d="M30 30l6 8-4 6M74 56l-3 9 6 4M128 76l5 7-3 8" />
          <path className="gw-water" d="M33 38l3-2 1 4ZM72 63l3 1-2 3ZM131 82l3 1-1 3Z" />
        </g>
      ) : (
        <g>
          <path d={bed} fill="none" stroke="#a9cf86" strokeWidth={30} strokeLinecap="round" />
          <path d={bed} fill="none" stroke="#7fbfd6" strokeWidth={18} strokeLinecap="round" />
          <path
            d={bed}
            fill="none"
            stroke="#b9e0ea"
            strokeWidth={4}
            strokeDasharray="10 14"
            strokeLinecap="round"
          />
          {[
            [18, 18],
            [60, 44],
            [104, 88],
            [150, 70],
            [170, 104],
          ].map(([x, y]) => (
            <path
              key={`${x}`}
              className="gw-reed"
              d={`M${x} ${y}v-5M${x! + 2} ${y}v-4M${x! - 2} ${y}v-3`}
            />
          ))}
        </g>
      )}
      {stage >= 3 && (
        <g>
          <rect
            className="gw-bridge"
            x={44}
            y={36}
            width={5}
            height={30}
            rx={1}
            transform="rotate(-18 46 51)"
          />
          <rect
            className="gw-bridge"
            x={130}
            y={64}
            width={5}
            height={30}
            rx={1}
            transform="rotate(-12 132 79)"
          />
        </g>
      )}
      {stage >= 4 && (
        <g>
          <rect className="gw-deck" x={86} y={68} width={26} height={9} rx={1.5} />
          <circle className="gw-swimmer" cx={96} cy={60} r={1.6} />
          <circle className="gw-swimmer" cx={104} cy={63} r={1.4} />
          <circle className="gw-swimmer" cx={78} cy={58} r={1.5} />
          <rect x={88} y={70} width={6} height={4} rx={0.8} fill="#e0627a" />
          <rect x={100} y={70} width={6} height={4} rx={0.8} fill="#f2c335" />
        </g>
      )}
    </g>
  );
}

const STALL_COLOURS = ['#e0627a', '#f2c335', '#6fa35a', '#ec8c2e', '#8a5bb8', '#4f9fbf'];

/** The food hall: a timber frame, then stalls under it, then its roof and common kitchen. */
function Hall({ stage, reduced }: { stage: number; reduced: boolean }) {
  return (
    <g>
      <rect className="gw-ground" x={14} y={14} width={154} height={96} rx={4} fill="#e9dfca" />
      {stage >= 2 &&
        [0, 1, 2].flatMap((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <g key={`${row} ${col}`} transform={`translate(${30 + col * 27} ${30 + row * 30})`}>
              <rect
                className="gw-stall"
                x={-9}
                y={-6}
                width={18}
                height={10}
                rx={1.5}
                fill={STALL_COLOURS[(row * 5 + col) % STALL_COLOURS.length]}
              />
              <circle className="gw-produce" cx={-4} cy={6.5} r={1.8} fill="#ec8c2e" />
              <circle className="gw-produce" cx={1} cy={6.5} r={1.8} fill="#6fa35a" />
              <circle className="gw-produce" cx={5.5} cy={6.5} r={1.6} fill="#e0627a" />
            </g>
          )),
        )}
      {stage >= 3 && (
        <g>
          <path className="gw-hall-roof" d="M14 14H98V62H14Z" />
          <path className="gw-hall-glass" d="M98 14H168V62H98Z" />
          <path d="M14 38H98M56 14V62" stroke="#8a4428" strokeWidth={0.6} />
          {[110, 124, 138, 152].map((x) => (
            <path key={x} d={`M${x} 14V62`} stroke="#9cc0cc" strokeWidth={0.5} />
          ))}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              className="gw-table"
              x={34 + i * 40}
              y={90}
              width={26}
              height={8}
              rx={2}
            />
          ))}
          <circle
            className={reduced ? undefined : 'gw-smoke'}
            cx={40}
            cy={22}
            r={3}
            fill="rgb(255 255 255 / 0.7)"
          />
        </g>
      )}
      <g>
        {[14, 56, 98, 140, 168].map((x) => (
          <path key={x} className="gw-beam" d={`M${x} 14V110`} opacity={stage >= 3 ? 0.35 : 1} />
        ))}
        {[14, 62, 110].map((y) => (
          <path key={y} className="gw-beam" d={`M14 ${y}H168`} opacity={stage >= 3 ? 0.35 : 1} />
        ))}
      </g>
    </g>
  );
}

/** The seed tower from above: its foundations, green floors, a ring of seeds, the belvedere. */
function Tower({ stage }: { stage: number }) {
  const cx = 91;
  const cy = 62;
  return (
    <g>
      {stage >= 4 && <ellipse className="gw-shadow" cx={cx + 34} cy={cy + 20} rx={44} ry={20} />}
      <rect className="gw-found" x={cx - 40} y={cy - 40} width={80} height={80} rx={8} />
      {stage === 1 &&
        [-28, -9, 9, 28].flatMap((dx) =>
          [-28, -9, 9, 28].map((dy) => (
            <circle key={`${dx} ${dy}`} cx={cx + dx} cy={cy + dy} r={2.2} fill="#9f957f" />
          )),
        )}
      {stage >= 2 &&
        [34, 26, 18].map((r) => (
          <g key={r}>
            <rect className="gw-floor" x={cx - r} y={cy - r} width={2 * r} height={2 * r} rx={5} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = (i / 8) * Math.PI * 2 + r * 0.1;
              return (
                <circle
                  key={i}
                  className="gw-floor-leaf"
                  cx={cx + Math.cos(a) * r}
                  cy={cy + Math.sin(a) * r}
                  r={2.4}
                />
              );
            })}
          </g>
        ))}
      {stage >= 3 &&
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle
              key={i}
              className="gw-seed"
              cx={cx + Math.cos(a) * 11}
              cy={cy + Math.sin(a) * 11}
              r={1.6}
            />
          );
        })}
      {stage >= 4 && (
        <g>
          <circle className="gw-tower-top" cx={cx} cy={cy} r={8} />
          <circle cx={cx} cy={cy} r={3} fill="#e3b14a" />
        </g>
      )}
    </g>
  );
}

const ART: Record<
  Exclude<WorkId, 'tram'>,
  (props: { stage: number; reduced: boolean }) => ReactNode
> = {
  river: River,
  hall: Hall,
  tower: Tower,
};

/** Every great work on the map, at the stage it has reached; `open` shows the sites to start. */
export const GreatWorksLayer = memo(function GreatWorksLayer({
  stages,
  open,
  reduced,
}: {
  /** Stages built of each work, joined as "tram:2,river:0,…" so the layer only redraws on a change. */
  stages: string;
  open: boolean;
  reduced: boolean;
}) {
  if (!open) return null;
  const built = parseStages(stages);
  return (
    <g className="great-works" aria-hidden="true">
      {built.tram > 0 && (
        <Appear at={[WORLD.width / 2, -RING]} size={60}>
          <g data-work="tram" data-stage={built.tram}>
            <title>{t.greatWorks.names.tram}</title>
            <Tram stage={built.tram} reduced={reduced} />
          </g>
        </Appear>
      )}
      {WORK_IDS.filter((id): id is Exclude<WorkId, 'tram'> => id !== 'tram').map((id) => {
        const box = WORK_PLACES[id];
        const [x, y, w, h] = box;
        const stage = built[id];
        if (stage === 0) {
          return (
            <rect
              key={id}
              className="gw-site"
              x={x + 4}
              y={y + 4}
              width={w - 8}
              height={h - 8}
              rx={6}
            />
          );
        }
        const Art = ART[id];
        return (
          <Appear key={`${id}:${stage}`} at={centre(box)} size={60}>
            <g data-work={id} data-stage={stage} transform={`translate(${x} ${y})`}>
              <title>{t.greatWorks.names[id]}</title>
              <rect width={w} height={h} rx={6} fill="#d7e8c4" />
              <Art stage={stage} reduced={reduced} />
            </g>
          </Appear>
        );
      })}
    </g>
  );
});
