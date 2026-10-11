// The Bioregion drawn around the city (docs/game-design.md §7.4, §10.4): beyond the suburbs, a
// plain of fields between four hills, crossed by the river that runs through the city. Each
// level of a regional site turns more of it into wetlands, agrivoltaic meadows, food forests or
// old-growth forest; the collectors dig ponds, open streams and fit the city with tanks and swales.
import { memo } from 'react';
import type { CollectorId, SiteId } from '../game/bioregion';
import { t } from '../i18n';
import {
  CANALS,
  HILLS,
  LAND,
  RAIN,
  RIVER,
  SUBURBS,
  SUBURBS_RADIUS,
  landHash,
  landShown,
  type Crown,
  type Field,
  type Marsh,
  type Point,
  type Terrace,
} from './bioregionMap';
import { Appear } from './Neighbourhood';
import { centre, type Box } from './neighbourhood';
import './bioregion.css';

function roundedRect([x, y, w, h]: Box, r: number): string {
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

/** The plain greens as the regional sites grow: from dry farmland to a living landscape. */
function landColour(sites: Record<SiteId, number>): string {
  const levels = Object.values(sites).reduce((sum, level) => sum + level, 0);
  const amount = Math.min(1, levels / 30);
  const from = [0xec, 0xe4, 0xcd];
  const to = [0xd9, 0xe6, 0xc0];
  return `rgb(${from.map((c, i) => Math.round(c + (to[i]! - c) * amount)).join(' ')})`;
}

const [LX, LY, LW, LH] = LAND;
/** The land, with the suburbs left open in its middle. */
const LAND_PATH = `M${LX} ${LY}H${LX + LW}V${LY + LH}H${LX}Z ${roundedRect(SUBURBS, SUBURBS_RADIUS)}`;

export function FieldArt({ field: { box, crop, angle } }: { field: Field }) {
  const [x, y, w, h] = box;
  const hedge = landHash(x, y) % 2 === 0;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="14" className={`field crop-${crop}`} />
      <rect
        x={x + 6}
        y={y + 6}
        width={w - 12}
        height={h - 12}
        rx="10"
        fill="url(#land-furrows)"
        transform={angle ? `rotate(90 ${x + w / 2} ${y + h / 2})` : undefined}
      />
      {/* A hedgerow of round shrubs along the south edge of some fields. */}
      {hedge &&
        Array.from({ length: Math.floor(w / 16) }, (_, i) => (
          <circle
            key={i}
            cx={x + 8 + i * 16}
            cy={y + h + 5}
            r={4 + ((i * 3) % 3)}
            className="hedge"
          />
        ))}
    </g>
  );
}

/** Agrivoltaic meadow: a flowering meadow under rows of raised solar panels. */
export function Meadow({ box: [x, y, w, h] }: { box: Box }) {
  const rows = [0.22, 0.5, 0.78].map((f) => y + h * f);
  return (
    <g className="agri-meadow">
      <rect x={x} y={y} width={w} height={h} rx="14" className="meadow-ground" />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx="8" fill="url(#land-flowers)" />
      {rows.map((ry) => (
        <g key={ry}>
          <rect x={x + 12} y={ry - 2} width={w - 24} height="7" rx="1.5" className="agri-shade" />
          <rect x={x + 12} y={ry - 5} width={w - 24} height="7" rx="1.5" className="agri-panel" />
          <path d={`M${x + 12} ${ry - 5}H${x + w - 12}`} className="agri-edge" />
        </g>
      ))}
      <circle cx={x + w * 0.3} cy={y + h * 0.36} r="2.6" className="sheep" />
      <circle cx={x + w * 0.66} cy={y + h * 0.64} r="2.6" className="sheep" />
    </g>
  );
}

/** Food forest: several layers of fruit trees, shrubs and fruit, in irregular clumps. */
export function FoodForest({ box: [x, y, w, h] }: { box: Box }) {
  const crowns: [number, number, number, number][] = [];
  for (let i = 0; i < 9; i++) {
    const hash = landHash(x + i * 13, y + i * 7);
    crowns.push([
      x + 14 + ((hash * 7 + i * 29) % (w - 28)),
      y + 14 + ((hash * 3 + i * 17) % (h - 28)),
      9 + (hash % 6),
      hash % 3,
    ]);
  }
  return (
    <g className="food-forest">
      <rect x={x} y={y} width={w} height={h} rx="14" className="forest-floor" />
      {crowns.map(([cx, cy, r, kind]) => (
        <g key={`${cx},${cy}`}>
          <circle cx={cx + 2} cy={cy + 3} r={r} className="crown-shadow" />
          <circle cx={cx} cy={cy} r={r} className={`crown fruit-${kind}`} />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.45} className="crown-light" />
          <circle cx={cx + r * 0.35} cy={cy + r * 0.1} r="1.8" className={`fruit fruit-${kind}`} />
        </g>
      ))}
    </g>
  );
}

export function MarshArt({ x, y, rx, ry, angle }: Marsh) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`} className="marsh">
      <ellipse cx={x} cy={y} rx={rx} ry={ry} className="marsh-ground" />
      <ellipse cx={x - rx * 0.3} cy={y} rx={rx * 0.32} ry={ry * 0.42} className="marsh-pool" />
      <ellipse cx={x + rx * 0.35} cy={y + 2} rx={rx * 0.2} ry={ry * 0.3} className="marsh-pool" />
      <path
        className="reeds"
        d={Array.from({ length: 9 }, (_, i) => {
          const rx0 = x - rx * 0.75 + (i * rx * 1.5) / 8;
          const ry0 = y + (i % 2 ? ry * 0.45 : -ry * 0.4);
          return `M${rx0} ${ry0}l-2 -7M${rx0} ${ry0}l1.5 -8M${rx0} ${ry0}l3.5 -5`;
        }).join('')}
      />
    </g>
  );
}

export function Hills() {
  return (
    <g className="hills">
      {HILLS.map((hill) => (
        <g key={`${hill.x},${hill.y}`}>
          <ellipse cx={hill.x} cy={hill.y} rx={hill.rx} ry={hill.ry} className="hill" />
          {[0.78, 0.55, 0.32].map((f) => (
            <ellipse
              key={f}
              cx={hill.x + hill.rx * 0.06 * (1 - f)}
              cy={hill.y - hill.ry * 0.08 * (1 - f)}
              rx={hill.rx * f}
              ry={hill.ry * f}
              className="contour"
            />
          ))}
        </g>
      ))}
    </g>
  );
}

export function Pond({ x, y, r }: Crown) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + 5} className="pond-bank" />
      <circle cx={x} cy={y} r={r} className="pond" />
      <path
        d={`M${x - r * 0.5} ${y - r * 0.2}q${r * 0.25} -3 ${r * 0.5} 0`}
        className="pond-glint"
      />
    </g>
  );
}

export function OldCrown({ x, y, r }: Crown) {
  return (
    <g>
      <circle cx={x + 3} cy={y + 4} r={r} className="crown-shadow" />
      <circle cx={x} cy={y} r={r} className="old-crown" />
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.45} className="crown-light" />
    </g>
  );
}

/** A terrace of the hillsides: a dry-stone wall and, above it, two rows of vines. */
export function TerraceArt({ d }: Terrace) {
  return (
    <g>
      <path d={d} className="terrace-wall" />
      <path d={d} className="terrace-vines" transform="translate(0 -9)" />
      <path d={d} className="terrace-vines" transform="translate(5 -18)" />
    </g>
  );
}

export function Tank({ at: [x, y] }: { at: Point }) {
  return (
    <g>
      <circle cx={x + 0.6} cy={y + 0.9} r="3.2" className="tank-shadow" />
      <circle cx={x} cy={y} r="3.2" className="tank" />
      <circle cx={x - 0.9} cy={y - 0.9} r="1.1" className="tank-light" />
    </g>
  );
}

export function Swale({ box: [x, y, w, h] }: { box: Box }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1.5" className="swale" />
      <path d={`M${x + 2} ${y + h / 2}H${x + w - 2}`} className="swale-water" />
    </g>
  );
}

/** Patterns the land's fields and meadows are painted with. */
export function LandPatterns() {
  return (
    <>
      <pattern id="land-furrows" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 4H8" className="furrow" />
      </pattern>
      <pattern id="land-flowers" width="18" height="16" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="5" r="1.1" className="flower-a" />
        <circle cx="13" cy="11" r="1" className="flower-b" />
        <path d="M9 4l-1 -3M9 4l1 -3" className="grass-blade" />
      </pattern>
    </>
  );
}

/** The plain itself: its colour, the hedge around the suburbs, the hills and the farmed fields. */
export function LandGround({ sites, fields }: { sites: Record<SiteId, number>; fields: Field[] }) {
  return (
    <>
      <path d={LAND_PATH} fillRule="evenodd" className="land" fill={landColour(sites)} />
      <path d={roundedRect(SUBURBS, SUBURBS_RADIUS)} className="hedge-line" />
      <Hills />
      {fields.map((field) => (
        <FieldArt key={field.box.join()} field={field} />
      ))}
    </>
  );
}

export interface BioregionLandProps {
  sites: Record<SiteId, number>;
  collectors: Record<CollectorId, number>;
  /** Water is being gathered: a shower crosses the land now and then. */
  raining: boolean;
  reduced: boolean;
}

/**
 * The land of the Bioregion, drawn under the city and its suburbs. Each element that a purchase
 * brings plays the map's entrance (a soft growth and a golden ring).
 */
export const BioregionLand = memo(function BioregionLand({
  sites,
  collectors,
  raining,
  reduced,
}: BioregionLandProps) {
  const shown = landShown(sites, collectors);

  return (
    <g className="bioregion-land" aria-hidden="true">
      <defs>
        <LandPatterns />
        <radialGradient
          id="land-haze"
          gradientUnits="userSpaceOnUse"
          cx="300"
          cy="225"
          r="1400"
          gradientTransform="translate(300 225) scale(1 0.8) translate(-300 -225)"
        >
          <stop offset="72%" stopColor="#fbf6ec" stopOpacity="0" />
          <stop offset="100%" stopColor="#fbf6ec" stopOpacity="0.75" />
        </radialGradient>
      </defs>
      <LandGround sites={sites} fields={shown.fields} />
      <g data-site="meadows">
        {sites.meadows > 0 && <title>{t.bioregion.sites.meadows.name}</title>}
        {shown.meadows.map(({ box }) => (
          <Appear key={box.join()} at={centre(box)} size={box[2] / 2}>
            <Meadow box={box} />
          </Appear>
        ))}
      </g>
      <g data-site="foodForests">
        {sites.foodForests > 0 && <title>{t.bioregion.sites.foodForests.name}</title>}
        {shown.gardens.map(({ box }) => (
          <Appear key={box.join()} at={centre(box)} size={box[2] / 2}>
            <FoodForest box={box} />
          </Appear>
        ))}
      </g>
      <g data-collector="streams">
        {shown.streams.map((d) => (
          <g key={d}>
            <path d={d} className="stream-bank" />
            <path d={d} className="stream" />
            {!reduced && <path d={d} className="stream-ripple" />}
          </g>
        ))}
      </g>
      <g className="river">
        {RIVER.map((d) => (
          <path key={`bed${d}`} d={d} className="river-bed" />
        ))}
        {CANALS.map(([[x0, y0], [, y1]]) => (
          <path key={`${x0},${y0}`} d={`M${x0} ${y0}V${y1}`} className="canal" />
        ))}
        {RIVER.map((d) => (
          <path key={`water${d}`} d={d} className="river-water" />
        ))}
        {!reduced && RIVER.map((d) => <path key={`ripple${d}`} d={d} className="river-ripple" />)}
      </g>
      <g data-site="wetlands">
        {sites.wetlands > 0 && <title>{t.bioregion.sites.wetlands.name}</title>}
        {shown.marshes.map((marsh) => (
          <Appear key={`${marsh.x},${marsh.y}`} at={[marsh.x, marsh.y]} size={marsh.rx}>
            <MarshArt {...marsh} />
          </Appear>
        ))}
      </g>
      <g data-collector="ponds">
        {shown.ponds.map((pond) => (
          <Appear key={`${pond.x},${pond.y}`} at={[pond.x, pond.y]} size={pond.r + 6}>
            <Pond {...pond} />
          </Appear>
        ))}
      </g>
      <g data-site="oldForest">
        {sites.oldForest > 0 && <title>{t.bioregion.sites.oldForest.name}</title>}
        {shown.crowns.map((crown) => (
          <Appear key={`${crown.x},${crown.y}`} at={[crown.x, crown.y]} size={crown.r + 2}>
            <OldCrown {...crown} />
          </Appear>
        ))}
      </g>
      <g data-site="hillsides">
        {sites.hillsides > 0 && <title>{t.bioregion.sites.hillsides.name}</title>}
        {shown.terraces.map((terrace) => (
          <Appear key={terrace.d} at={[terrace.at[0], terrace.at[1]]} size={terrace.size}>
            <TerraceArt {...terrace} />
          </Appear>
        ))}
      </g>
      <path d={LAND_PATH} fillRule="evenodd" className="haze" />
      {raining && !reduced && (
        <g className="shower">
          <ellipse cx="0" cy="0" rx="260" ry="150" className="shower-shadow" />
          <path className="rain" d={RAIN} />
        </g>
      )}
    </g>
  );
});

export interface CityWaterProps {
  roofTanks: number;
  swales: number;
}

/** Collectors in the city itself: tanks on the roofs and planted swales along the kerbs. */
export const CityWater = memo(function CityWater({ roofTanks, swales }: CityWaterProps) {
  const { tanks, swales: ditches } = landShown(
    { wetlands: 0, meadows: 0, foodForests: 0, oldForest: 0, hillsides: 0 },
    { roofTanks, swales, ponds: 0, streams: 0 },
  );
  return (
    <g className="city-water" aria-hidden="true">
      <g data-collector="swales">
        {ditches.map((box) => (
          <Appear key={box.join()} at={centre(box)} size={box[2] / 3}>
            <Swale box={box} />
          </Appear>
        ))}
      </g>
      <g data-collector="roofTanks">
        {tanks.map((point) => (
          <Appear key={point.join()} at={[point[0], point[1]]} size={5}>
            <Tank at={point} />
          </Appear>
        ))}
      </g>
    </g>
  );
});
