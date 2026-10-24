// Detailed drawings of the enriched map (docs/game-design.md §10.4), authored as SVG and turned
// into WebGL textures. Each function returns the drawing of one element in world units, with
// the box it covers; light comes from the sun's side (`lit`). Pure strings, no DOM.
import {
  BLOCKS,
  COURTYARD,
  MIRROR_TOWER,
  PLANTER,
  STREETS,
  WORLD,
  centre,
  type Box,
} from '../neighbourhood';
import { PARCEL_PLACES } from '../restorationMap';
import type { Palette } from './model';

const PARCEL_RIVER = PARCEL_PLACES.river;

/** One drawing: SVG content in world units, and the part of the world it covers. */
export interface Art {
  box: Box;
  svg: string;
}

/** What every drawing needs to know about the scene. */
export interface ArtContext {
  palette: Palette;
  /** 1 when the sun shines from the left (shadows fall to the right), -1 from the right. */
  lit: 1 | -1;
  /** 0 with nothing built, 1 well into the city phase. */
  greenness: number;
}

export const GOLD = '#e9a93b';
export const GOLD_SOFT = '#f6d58f';
export const LILAC = '#b79ad6';
export const TERRACOTTA = '#c8734f';
const CONCRETE = '#a7a39c';
const SAGE = '#8fae8b';

/** A small stable number for a place on the map, so drawings vary without randomness. */
export function hash(x: number, y: number): number {
  return Math.abs(Math.round(x * 73 + y * 151)) % 97;
}

/** Colour between two hex colours. */
export function mix(from: string, to: string, amount: number): string {
  const a = parse(from);
  const b = parse(to);
  const c = a.map((v, i) => Math.round(v + (b[i]! - v) * amount));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function parse(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Lighter (positive) or darker (negative) version of a colour. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, '#ffffff', amount) : mix(hex, '#1f2a24', -amount);
}

/** A stable number from 0 to 1 for the `i`-th detail of a drawing seeded with `seed`. */
function rnd(seed: number, i: number): number {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function r(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Linear gradient lit from the sun's side: light edge towards the sun, dark away from it. */
function litGradient(id: string, from: string, to: string, lit: 1 | -1): string {
  const [x1, x2] = lit === 1 ? [0, 1] : [1, 0];
  return `<linearGradient id="${id}" x1="${x1}" y1="0" x2="${x2}" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;
}

/** Wraps drawings in a complete SVG document covering `box`, `res` pixels per world unit. */
export function svgDocument({ box: [x, y, w, h], svg }: Art, res: number): string {
  const pw = Math.max(1, Math.round(w * res));
  const ph = Math.max(1, Math.round(h * res));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="${r(x)} ${r(y)} ${r(w)} ${r(h)}">${svg}</svg>`;
}

// The ground ---------------------------------------------------------------------------------

/** Fine grain over a surface, so flat colours never look digital. */
const GRAIN = `<filter id="grain" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0.9 -0.35"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;

/**
 * The ground of the city: asphalt with lanes and worn tyre tracks, kerbed pavements, blocks that
 * turn to meadow, zebra crossings, the paved courtyard, waste ground and car parks still grey.
 */
export function groundArt(
  ctx: ArtContext,
  {
    courtyardGreen,
    wastelands,
    carParks,
    mirrorField = null,
  }: { courtyardGreen: number; wastelands: Box[]; carParks: Box[]; mirrorField?: Box | null },
): Art {
  const { greenness, palette } = ctx;
  const { width, height } = WORLD;
  const sw = STREETS.width;
  const block = mix('#d8d3c8', '#cfe0c0', greenness);
  const parts: string[] = [];
  parts.push(`<defs>${GRAIN}
    <linearGradient id="tar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c6c0b5"/><stop offset="1" stop-color="#b8b2a7"/></linearGradient>
    <pattern id="grass" width="9" height="8" patternUnits="userSpaceOnUse">
      <path d="M2 6.5l-.8-2.2M2 6.5l.4-2.5M2 6.5l1.5-1.8M6.5 3l-.7-2M6.5 3l.9-1.9" stroke="${palette.foliage}" stroke-width=".35" stroke-linecap="round" fill="none" opacity=".55"/>
      <circle cx="5.2" cy="6.8" r=".45" fill="${LILAC}"/><circle cx="8" cy="1.5" r=".35" fill="${GOLD_SOFT}"/><circle cx="1" cy="1.8" r=".3" fill="#fff8ea"/>
    </pattern>
    <pattern id="joints" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><path d="M0 0H3.2M0 0V3.2" stroke="#b4ab9b" stroke-width=".18" opacity=".55"/></pattern>
    <pattern id="setts" width="4" height="3" patternUnits="userSpaceOnUse"><rect x=".2" y=".2" width="3.6" height="1.3" rx=".3" fill="#efe8da"/><rect x="-1.8" y="1.7" width="3.6" height="1.1" rx=".3" fill="#e6ddcc"/><rect x="2.2" y="1.7" width="3.6" height="1.1" rx=".3" fill="#ece4d4"/></pattern>
  </defs>`);
  parts.push(`<rect width="${width}" height="${height}" fill="url(#tar)"/>`);
  // Worn tyre tracks and lane markings.
  for (const y of STREETS.horizontal) {
    parts.push(
      `<path d="M0 ${y + 6}H${width}M0 ${y + sw - 6}H${width}" stroke="#a49e93" stroke-width="2.6" opacity=".22"/>`,
      `<path d="M0 ${y + sw / 2}H${width}" stroke="#fffaf0" stroke-width=".7" stroke-dasharray="6 6" opacity=".7"/>`,
    );
  }
  for (const x of STREETS.vertical) {
    parts.push(
      `<path d="M${x + 6} 0V${height}M${x + sw - 6} 0V${height}" stroke="#a49e93" stroke-width="2.6" opacity=".22"/>`,
      `<path d="M${x + sw / 2} 0V${height}" stroke="#fffaf0" stroke-width=".7" stroke-dasharray="6 6" opacity=".7"/>`,
    );
  }
  // Manhole covers and drains.
  for (const [mx, my] of [
    [120, 161],
    [470, 311],
    [207, 60],
    [415, 380],
    [300, 311],
  ] as const) {
    parts.push(
      `<circle cx="${mx}" cy="${my}" r="1.8" fill="#a39d92" stroke="#8f897f" stroke-width=".3"/><circle cx="${mx}" cy="${my}" r="1.1" fill="none" stroke="#b9b3a8" stroke-width=".25"/>`,
    );
  }
  parts.push(`<rect width="${width}" height="${height}" filter="url(#grain)" opacity=".5"/>`);
  // Zebra crossings.
  for (const vx of STREETS.vertical) {
    for (const hy of STREETS.horizontal) {
      const stripes = (x0: number, y0: number, horizontal: boolean) =>
        Array.from({ length: 6 }, (_, i) =>
          horizontal
            ? `<rect x="${x0 + 2.5 + i * 3}" y="${y0}" width="1.6" height="4.6" rx=".3"/>`
            : `<rect x="${x0}" y="${y0 + 2.5 + i * 3}" width="4.6" height="1.6" rx=".3"/>`,
        ).join('');
      parts.push(
        `<g fill="#fbf7ee" opacity=".85">${stripes(vx, hy - 6.5, true)}${stripes(vx, hy + sw + 1.9, true)}${stripes(vx - 6.5, hy, false)}${stripes(vx + sw + 1.9, hy, false)}</g>`,
      );
    }
  }
  // Blocks: a kerb, a jointed pavement, then the soil of the block.
  for (const [x, y, w, h] of BLOCKS) {
    parts.push(
      `<rect x="${x + 0.6}" y="${y + 0.9}" width="${w - 1.2}" height="${h - 1.2}" rx="7" fill="#8f897f" opacity=".35"/>`,
      `<rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="${h - 1.2}" rx="7" fill="#e8e2d6"/>`,
      `<rect x="${x + 0.6}" y="${y + 0.6}" width="${w - 1.2}" height="${h - 1.2}" rx="7" fill="url(#joints)"/>`,
      `<rect x="${x + 3.6}" y="${y + 3.6}" width="${w - 7.2}" height="${h - 7.2}" rx="5" fill="${block}"/>`,
    );
    if (greenness > 0) {
      parts.push(
        `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="5" fill="url(#grass)" opacity="${r(Math.min(1, greenness * 1.2))}"/>`,
      );
    }
  }
  // The courtyard: warm setts that fill with grass as the pots spread.
  const [cx, cy, cw, ch] = COURTYARD;
  parts.push(
    `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="4" fill="#efe8da"/>`,
    `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="4" fill="url(#setts)"/>`,
    `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="4" fill="#cfe0c0" opacity="${r(courtyardGreen * 0.7)}"/>`,
    `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="4" fill="url(#grass)" opacity="${r(courtyardGreen)}"/>`,
    `<rect x="${cx + 0.4}" y="${cy + 0.4}" width="${cw - 0.8}" height="${ch - 0.8}" rx="4" fill="none" stroke="#d8cdb8" stroke-width=".8"/>`,
  );
  for (const box of carParks) parts.push(carParkArt(box));
  if (mirrorField) parts.push(mirrorFieldArt(ctx, mirrorField));
  for (const box of wastelands) parts.push(wastelandArt(box));
  return { box: [0, 0, width, height], svg: parts.join('') };
}

/**
 * The ground of the mirror field: a sunny meadow where the car park was, with gravel paths
 * around the tower along the rings of heliostats, and a few wild flowers.
 */
function mirrorFieldArt(ctx: ArtContext, [x, y, w, h]: Box): string {
  const { x: tx, y: ty } = MIRROR_TOWER;
  const meadow = mix('#cfe0b4', ctx.palette.foliageLight, 0.25);
  const rings = [26, 38, 50]
    .map(
      (radius) =>
        `<ellipse cx="${tx}" cy="${ty}" rx="${r(radius * 1.35)}" ry="${radius}" fill="none" stroke="#e6dcc6" stroke-width="2.4"/><ellipse cx="${tx}" cy="${ty}" rx="${r(radius * 1.35)}" ry="${radius}" fill="none" stroke="#f4ede0" stroke-width=".6" stroke-dasharray=".5 1.2"/>`,
    )
    .join('');
  const flowers = Array.from({ length: 40 }, (_, i) => {
    const fx = x + 4 + rnd(11, i) * (w - 8);
    const fy = y + 4 + rnd(29, i) * (h - 8);
    const fill = [LILAC, GOLD_SOFT, '#fffaf0'][i % 3];
    return `<circle cx="${r(fx)}" cy="${r(fy)}" r=".55" fill="${fill}"/>`;
  }).join('');
  return `<clipPath id="field"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/></clipPath><g clip-path="url(#field)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${meadow}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#grass)"/>${flowers}${rings}<path d="M${tx} ${ty}V${y + h}" stroke="#e6dcc6" stroke-width="2.4"/></g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#d9d3c7" stroke-width=".8"/>`;
}

const CAR_COLOURS = ['#8c8f94', '#6f7a86', '#b9b4aa', '#9a6b5a', '#5f6f66', '#d6d1c6'];

function carParkArt([x, y, w, h]: Box): string {
  const bays = Math.floor((w - 8) / 10);
  const parts = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#b3ada2"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#d9d3c7" stroke-width=".8"/>`,
  ];
  for (let i = 0; i < bays; i++) {
    const bx = x + 8 + i * 10;
    parts.push(
      `<path d="M${bx} ${y + 4}v14M${bx} ${y + h - 18}v14" stroke="#f4efe5" stroke-width=".5" opacity=".8"/>`,
    );
  }
  parts.push(
    `<path d="M${x + 6} ${y + h / 2}H${x + w - 6}" stroke="#f4efe5" stroke-width=".5" stroke-dasharray="3 3" opacity=".6"/>`,
  );
  for (let i = 0; i < bays - 1; i++) {
    for (const [row, cy] of [y + 5, y + h - 17].entries()) {
      const seed = hash(x + i * 10, cy);
      if (seed % 4 === 0) continue;
      const colour = CAR_COLOURS[seed % CAR_COLOURS.length]!;
      const tx = x + 9.5 + i * 10;
      const front = row ? 7.6 : 1.4;
      const back = row ? 1.2 : 8.6;
      parts.push(
        `<g transform="translate(${tx} ${cy})"><rect x=".5" y=".9" width="7" height="12" rx="2.2" fill="#3b3328" opacity=".25"/><rect width="7" height="12" rx="2.2" fill="${colour}"/><rect x=".9" y="${front}" width="5.2" height="3" rx="1" fill="#3e4a52"/><rect x="1.2" y="${back}" width="4.6" height="2.2" rx=".8" fill="#4a565e"/><rect x="1.4" y="${r(Math.min(front, back) + 3.2)}" width="4.2" height="2.6" rx=".6" fill="${shade(colour, 0.25)}"/><path d="M1.6 ${front + 0.5}l1.4 2" stroke="#fff" stroke-width=".4" opacity=".5"/></g>`,
      );
    }
  }
  return parts.join('');
}

function wastelandArt([x, y, w, h]: Box): string {
  const seed = hash(x, y);
  const parts = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#cdc5b6"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" filter="url(#grain)" opacity=".8"/>`,
    `<ellipse cx="${x + w * 0.66}" cy="${y + h * 0.58}" rx="${w * 0.14}" ry="${h * 0.1}" fill="#b5ad9e" opacity=".55"/>`,
    `<ellipse cx="${x + w * 0.25}" cy="${y + h * 0.22}" rx="${w * 0.1}" ry="${h * 0.07}" fill="#bdb5a5" opacity=".6"/>`,
    `<path d="M${x + w * 0.1} ${y + h * 0.35}l${w * 0.18} ${h * 0.12}l${w * 0.12} ${-h * 0.08}l${w * 0.2} ${h * 0.22}l${w * 0.15} ${-h * 0.05}" fill="none" stroke="#9c9383" stroke-width=".5" stroke-linejoin="round"/>`,
    `<path d="M${x + w * 0.6} ${y + h * 0.1}l${w * 0.05} ${h * 0.15}l-${w * 0.04} ${h * 0.12}" fill="none" stroke="#9c9383" stroke-width=".4"/>`,
    // A broken fence along the edge.
    `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="2.5" fill="none" stroke="#8d8578" stroke-width=".45" stroke-dasharray="2.4 1.2 .6 1.2"/>`,
  ];
  const rubble = [0.2, 0.45, 0.7, 0.85, 0.32, 0.6, 0.12, 0.9];
  const rows = [0.3, 0.7, 0.4, 0.75, 0.82, 0.2, 0.86, 0.5];
  rubble.forEach((fx, i) => {
    const rx = x + w * fx;
    const ry = y + h * rows[i]!;
    const size = 1.1 + ((seed + i) % 3) * 0.5;
    parts.push(
      `<path d="M${r(rx - size)} ${r(ry + size * 0.4)}l${r(size * 0.6)} ${r(-size)}l${r(size * 1.1)} ${r(size * 0.2)}l${r(size * 0.4)} ${r(size * 0.9)}z" fill="#9f9686" stroke="#857c6e" stroke-width=".2"/>`,
    );
  });
  [0.14, 0.52, 0.78, 0.36, 0.9].forEach((fx, i) => {
    const tx = x + w * fx;
    const ty = y + h * [0.62, 0.48, 0.24, 0.9, 0.7][i]!;
    parts.push(
      `<path d="M${r(tx)} ${r(ty)}l-2 -3M${r(tx)} ${r(ty)}l0 -3.6M${r(tx)} ${r(ty)}l2 -3M${r(tx)} ${r(ty)}l-1 -2.2" stroke="#7d8a5e" stroke-width=".45" stroke-linecap="round" fill="none"/>`,
    );
  });
  return parts.join('');
}

/** One block of the outskirts, tiled around the world: grey, flat, a little faded. */
export function outskirtsTileArt(tile: { width: number; height: number; buildings: Box[] }): Art {
  const { width, height, buildings } = tile;
  const parts = [
    // Blurred in the drawing itself: far away, out of focus, at no cost per frame.
    `<filter id="far"><feGaussianBlur stdDeviation="1.6"/></filter><g filter="url(#far)">`,
    `<rect x="-4" y="-4" width="${width + 8}" height="${height + 8}" fill="#c4bfb5"/>`,
    `<rect x="24" y="24" width="182" height="124" rx="7" fill="#d4cfc4" stroke="#e4ded2" stroke-width="2"/>`,
  ];
  for (const [x, y, w, h] of buildings) {
    parts.push(
      `<rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="2" fill="#8f8a82" opacity=".5"/>`,
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#b3aea5"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="1" fill="none" stroke="#c6c1b8" stroke-width=".8"/>`,
    );
  }
  parts.push('</g>');
  return { box: [0, 0, width, height], svg: parts.join('') };
}

// Buildings ----------------------------------------------------------------------------------

/**
 * A building from above: its south facade (windows on every storey, some lit by the sun), then
 * the roof, lit from the sun's side, with parapet, membrane seams and equipment. A roof that
 * carries a garden keeps only its edge; living roofs turn it to sedum, or, in their second future
 * (§6.5), to rows of vegetables.
 */
export function buildingArt(
  ctx: ArtContext,
  box: Box,
  storeys: number,
  {
    bare = false,
    sedum: meadow = false,
    kitchen = false,
  }: { bare?: boolean; sedum?: boolean; kitchen?: boolean } = {},
): Art {
  // The kitchen-garden roofs are planted too: everything that skips the bare membrane skips it.
  const sedum = meadow || kitchen;
  const [x, y, w, h] = box;
  const facade = Math.min(storeys * 1.5 + 2, h * 0.28);
  const top = h - facade;
  const seed = hash(x, y);
  const roof = kitchen
    ? '#b48f68'
    : sedum
      ? mix('#9dbb83', ctx.palette.foliageLight, 0.15)
      : mix(CONCRETE, SAGE, ctx.greenness * 0.45);
  const lit = ctx.lit;
  const parts: string[] = [
    `<defs>${litGradient('roof', shade(roof, 0.22), shade(roof, -0.08), lit)}
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c968d"/><stop offset="1" stop-color="#7f7a72"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f1e6"/><stop offset=".5" stop-color="#b9cfd2"/><stop offset="1" stop-color="#8aa6ad"/></linearGradient>
      <radialGradient id="tank" cx=".35" cy=".35"><stop offset="0" stop-color="#f2efe8"/><stop offset="1" stop-color="#a39d93"/></radialGradient>
      <pattern id="gravel" width="1.8" height="1.6" patternUnits="userSpaceOnUse"><circle cx=".4" cy=".5" r=".2" fill="${shade(roof, -0.12)}"/><circle cx="1.3" cy="1.2" r=".16" fill="${shade(roof, 0.18)}"/></pattern>
      ${meadow ? `<pattern id="sedum" width="5" height="4.4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="${shade(roof, -0.14)}"/><circle cx="3.6" cy="3.2" r=".7" fill="${shade(roof, 0.12)}"/><circle cx="3.3" cy="1" r=".42" fill="${LILAC}"/><circle cx="1.3" cy="3.4" r=".36" fill="${GOLD_SOFT}"/><circle cx="4.6" cy="2.2" r=".3" fill="#fffaf0"/></pattern>` : ''}
    </defs>`,
    // Facade, then storeys of windows.
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#wall)"/>`,
  ];
  const rows = Math.max(1, Math.min(storeys, Math.floor(facade / 1.6)));
  const rowGap = facade / (rows + 0.4);
  for (let i = 0; i < rows; i++) {
    const wy = y + top + rowGap * (i + 0.55);
    const count = Math.floor((w - 4) / 3.2);
    for (let k = 0; k < count; k++) {
      const s = (seed + i * 7 + k * 13) % 11;
      const fill = s === 0 ? GOLD_SOFT : s < 4 ? '#f0e6cf' : '#c9d6d6';
      const wx = x + 2.4 + k * 3.2;
      const wh = Math.max(0.5, rowGap * 0.55);
      parts.push(
        `<rect x="${r(wx - 0.2)}" y="${r(wy - rowGap * 0.3 - 0.2)}" width="2.3" height="${r(wh + 0.4)}" rx=".25" fill="#6d6860" opacity=".6"/>`,
        `<rect x="${r(wx)}" y="${r(wy - rowGap * 0.3)}" width="1.9" height="${r(wh)}" rx=".2" fill="${fill}" opacity=".95"/>`,
      );
      // Window boxes in flower as the city turns green.
      if (rnd(seed + i, k) < ctx.greenness * 0.45) {
        const bloom = [LILAC, GOLD_SOFT, TERRACOTTA, '#f2bfd3'][(k + i) % 4]!;
        parts.push(
          `<rect x="${r(wx - 0.3)}" y="${r(wy - rowGap * 0.3 + wh - 0.1)}" width="2.5" height=".55" rx=".2" fill="${ctx.palette.foliage}"/><circle cx="${r(wx + 0.4)}" cy="${r(wy - rowGap * 0.3 + wh + 0.05)}" r=".3" fill="${bloom}"/><circle cx="${r(wx + 1.5)}" cy="${r(wy - rowGap * 0.3 + wh + 0.1)}" r=".26" fill="${bloom}"/>`,
        );
      }
    }
  }
  // Ivy climbing the corners of the facade.
  if (ctx.greenness > 0.25) {
    const reach = Math.min(1, (ctx.greenness - 0.25) * 1.6);
    for (const [cx, k] of [
      [x + 0.8, 0],
      [x + w - 0.8, 1],
    ] as const) {
      if ((seed + k) % 3 === 2) continue;
      for (let j = 0; j < Math.ceil(facade * reach); j += 1.1) {
        parts.push(
          `<circle cx="${r(cx + (rnd(seed, j * 7 + k) - 0.5) * 1.2)}" cy="${r(y + h - 0.6 - j)}" r="${r(0.55 + rnd(seed, j + k * 13) * 0.35)}" fill="${j % 2.2 < 1.1 ? ctx.palette.foliage : shade(ctx.palette.foliage, 0.18)}"/>`,
        );
      }
    }
  }
  parts.push(
    `<rect x="${x}" y="${y + top - 0.2}" width="${w}" height=".7" fill="#5e5a54" opacity=".45"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${top}" rx="2" fill="url(#roof)"/>`,
  );
  if (!sedum) {
    parts.push(
      `<rect x="${x + 1.6}" y="${y + 1.6}" width="${w - 3.2}" height="${top - 3.2}" rx="1.2" fill="url(#gravel)" opacity=".55"/>`,
    );
  }
  if (kitchen) {
    // Rows of vegetables across the roof, in three greens, with a plank walkway.
    const wide = w >= top;
    const span = wide ? top - 4 : w - 4;
    const rows = Math.max(2, Math.floor(span / 3.2));
    const greens = [ctx.palette.foliage, '#8fae5a', '#5e9471'];
    for (let i = 0; i < rows; i++) {
      const f = (i + 0.5) / rows;
      const d = wide
        ? `M${x + 3} ${r(y + 2 + span * f)}H${x + w - 3}`
        : `M${r(x + 2 + span * f)} ${y + 3}V${y + top - 3}`;
      parts.push(
        `<path d="${d}" stroke="${shade(roof, -0.14)}" stroke-width="2.2" stroke-linecap="round"/>`,
        `<path d="${d}" stroke="${greens[(i + seed) % 3]}" stroke-width="1.6" stroke-dasharray="1.3 .7" stroke-linecap="round"/>`,
      );
    }
  }
  if (meadow) {
    // Drifts of sedum in several greens and russets, a fine carpet of rosettes and flowers,
    // and a gravel walkway for the gardeners.
    const tones = [
      shade(roof, -0.12),
      shade(roof, 0.14),
      mix(roof, '#c98f6a', 0.35),
      mix(roof, '#e1d27a', 0.3),
    ];
    const blotches: string[] = [];
    const count = Math.round((w * top) / 60);
    for (let i = 0; i < count; i++) {
      blotches.push(
        `<ellipse cx="${r(x + 2 + rnd(seed, i) * (w - 4))}" cy="${r(y + 2 + rnd(seed, i + 300) * (top - 4))}" rx="${r(2.5 + rnd(seed, i + 600) * 3.5)}" ry="${r(1.8 + rnd(seed, i + 900) * 2.4)}" fill="${tones[i % tones.length]}" opacity=".9"/>`,
      );
    }
    const path =
      w >= top
        ? `M${x + 3} ${r(y + top / 2)}H${x + w - 3}`
        : `M${r(x + w / 2)} ${y + 3}V${y + top - 3}`;
    parts.push(
      `<clipPath id="roofclip"><rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${top - 3}" rx="1.5"/></clipPath>`,
      `<g clip-path="url(#roofclip)">${blotches.join('')}</g>`,
      `<rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${top - 3}" rx="1.5" fill="url(#sedum)" opacity=".45"/>`,
      `<path d="${path}" stroke="#ddd3bf" stroke-width="1.6" stroke-linecap="round"/><path d="${path}" stroke="#f1eadb" stroke-width=".5" stroke-dasharray=".4 .8" stroke-linecap="round"/>`,
    );
  }
  // Parapet: a light rim on the sun's side, a dark one on the other, and the strip of roof it
  // shades just inside the sunny edge.
  parts.push(
    `<path d="M${lit === 1 ? x + 2.1 : x + w - 2.1} ${y + top - 2}V${y + 2.1}${lit === 1 ? `H${x + w - 2}` : `H${x + 2}`}" stroke="#3b3328" stroke-width="1" opacity=".14" fill="none"/>`,
    `<rect x="${x + 1.6}" y="${y + 1.6}" width="${w - 3.2}" height="${top - 3.2}" rx="1.2" fill="none" stroke="${shade(roof, -0.18)}" stroke-width=".55" opacity=".7"/>`,
    `<path d="M${lit === 1 ? x + 0.6 : x + w - 0.6} ${y + top - 1}V${y + 0.6}${lit === 1 ? `H${x + w - 1}` : `H${x + 1}`}" stroke="#fff" stroke-width=".7" opacity=".55" fill="none"/>`,
  );
  if (!bare && !sedum) {
    // Strips of the roof membrane, every other one a shade lighter, between their seams.
    const seams = Math.floor(w / 9);
    for (let i = 0; i < seams; i++) {
      const sx = x + (w / seams) * i;
      if (i % 2 === 1) {
        parts.push(
          `<rect x="${r(sx)}" y="${y + 2.4}" width="${r(w / seams)}" height="${r(top - 4.8)}" fill="${shade(roof, 0.05)}" opacity=".6"/>`,
        );
      }
      if (i > 0) {
        parts.push(
          `<path d="M${r(sx)} ${y + 2.5}V${r(y + top - 2.5)}" stroke="${shade(roof, -0.12)}" stroke-width=".35" opacity=".7"/>`,
        );
      }
    }
    const wide = w >= h;
    // Large roofs get what a real one carries: the stair head the caretaker comes up through,
    // a paver path from it to the vent, and a cluster of exhaust stacks.
    if (w > 50 && top > 34) {
      const hx = x + 5;
      const hy = y + 5;
      const vx = x + w - 8;
      const vy = y + top - 5;
      parts.push(
        `<path d="M${hx + 5} ${hy + 8}V${r(vy)}H${r(vx - 4)}" stroke="#e3dccd" stroke-width="2.2" stroke-dasharray="1.6 .5" fill="none" opacity=".85"/>`,
        `<rect x="${hx + 1.2 * -lit + 1}" y="${hy + 1.3}" width="10" height="7.5" rx=".8" fill="#3b3328" opacity=".22"/>`,
        `<rect x="${hx}" y="${hy}" width="10" height="7.5" rx=".8" fill="#bcb6ab" stroke="#8f897f" stroke-width=".3"/>`,
        `<rect x="${hx + 0.6}" y="${hy + 0.6}" width="8.8" height="4.6" rx=".5" fill="#d9d4ca"/>`,
        `<rect x="${hx + 3.4}" y="${hy + 5.4}" width="3.2" height="2.1" rx=".2" fill="#8a7259"/>`,
      );
      const sx = x + w * 0.82;
      const sy = y + top * 0.3;
      for (const [dx, dy, rr] of [
        [0, 0, 2.2],
        [5.2, 1.1, 1.8],
        [1.8, 5, 1.5],
      ] as const) {
        parts.push(
          `<circle cx="${r(sx + dx + 0.6)}" cy="${r(sy + dy + 0.7)}" r="${rr + 0.3}" fill="#3b3328" opacity=".2"/><circle cx="${r(sx + dx)}" cy="${r(sy + dy)}" r="${rr}" fill="#cfc9be" stroke="#8f897f" stroke-width=".3"/><circle cx="${r(sx + dx)}" cy="${r(sy + dy)}" r="${r(rr * 0.5)}" fill="#6d6860"/>`,
        );
      }
    }
    if (seed % 3 === 0 && w > 30) {
      // Glass skylights.
      const n = wide ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const sx = wide ? x + w * 0.16 + i * 9 : x + w / 2 - 3;
        const sy = wide ? y + top / 2 - 3 : y + top * 0.18 + i * 9;
        parts.push(
          `<rect x="${r(sx + 0.6)}" y="${r(sy + 0.8)}" width="7" height="5.4" rx=".6" fill="#3b3328" opacity=".18"/><rect x="${r(sx)}" y="${r(sy)}" width="7" height="5.4" rx=".6" fill="url(#glass)" stroke="#e8e3d8" stroke-width=".4"/><path d="M${r(sx + 3.5)} ${r(sy)}v5.4" stroke="#e8e3d8" stroke-width=".3"/>`,
        );
      }
    }
    if (seed % 3 === 1 && w > 24 && top > 16) {
      const tx = x + w * 0.28;
      const ty = y + top * 0.42;
      parts.push(
        `<circle cx="${r(tx + 0.9)}" cy="${r(ty + 1.1)}" r="3.8" fill="#3b3328" opacity=".2"/><circle cx="${r(tx)}" cy="${r(ty)}" r="3.8" fill="url(#tank)" stroke="#8f897f" stroke-width=".3"/><circle cx="${r(tx)}" cy="${r(ty)}" r="1.6" fill="none" stroke="#8f897f" stroke-width=".3"/><circle cx="${r(tx - 1)}" cy="${r(ty - 1)}" r=".8" fill="#fff" opacity=".6"/>`,
      );
    }
    if (seed % 2 === 0 && w > 40) {
      for (const ox of [0, 7]) {
        const ux = x + w * 0.6 + ox;
        parts.push(
          `<rect x="${r(ux + 0.6)}" y="${y + 5.8}" width="5.4" height="4.4" rx=".6" fill="#3b3328" opacity=".2"/><rect x="${r(ux)}" y="${y + 5}" width="5.4" height="4.4" rx=".6" fill="#d4cfc6" stroke="#9c968c" stroke-width=".3"/><circle cx="${r(ux + 2.7)}" cy="${y + 7.2}" r="1.5" fill="#a9a399"/><path d="M${r(ux + 1.4)} ${y + 7.2}h2.6M${r(ux + 2.7)} ${y + 5.9}v2.6" stroke="#d4cfc6" stroke-width=".25"/>`,
        );
      }
    }
    // Planters and a potted tree on the roofs of a greener city.
    if (ctx.greenness > 0.35 && top > 14 && w > 26 && seed % 4 !== 3) {
      const py = y + top - 6;
      const count = Math.min(3, Math.floor((w - 20) / 9));
      for (let i = 0; i < count; i++) {
        const px = x + 4 + i * 8.5;
        parts.push(
          `<rect x="${r(px + 0.5)}" y="${r(py + 0.6)}" width="7" height="3.2" rx=".5" fill="#3b3328" opacity=".22"/><rect x="${r(px)}" y="${r(py)}" width="7" height="3.2" rx=".5" fill="#b4895a"/><rect x="${r(px + 0.45)}" y="${r(py + 0.45)}" width="6.1" height="2.3" rx=".35" fill="${ctx.palette.foliage}"/><circle cx="${r(px + 1.5)}" cy="${r(py + 1.5)}" r=".8" fill="${shade(ctx.palette.foliage, 0.25)}"/><circle cx="${r(px + 3.4)}" cy="${r(py + 1.4)}" r=".7" fill="${shade(ctx.palette.foliage, 0.1)}"/><circle cx="${r(px + 5.3)}" cy="${r(py + 1.5)}" r=".55" fill="${i % 2 ? GOLD_SOFT : LILAC}"/><circle cx="${r(px + 2.5)}" cy="${r(py + 0.9)}" r=".4" fill="${i % 2 ? LILAC : GOLD_SOFT}"/>`,
        );
      }
      if (ctx.greenness > 0.6) {
        const tx = x + w * 0.5 + 3;
        const ty = y + top * 0.3 + 2;
        parts.push(
          `<circle cx="${r(tx + 1)}" cy="${r(ty + 1.2)}" r="3" fill="#3b3328" opacity=".2"/><circle cx="${r(tx)}" cy="${r(ty)}" r="2.1" fill="${TERRACOTTA}"/><circle cx="${r(tx)}" cy="${r(ty)}" r="2.8" fill="${shade(ctx.palette.foliage, -0.08)}"/><circle cx="${r(tx - 0.6 * lit)}" cy="${r(ty - 0.6)}" r="1.6" fill="${mix(ctx.palette.foliage, ctx.palette.foliageLight, 0.55)}"/>`,
        );
      }
    }
    const vx = x + w - 11;
    const vy = y + top - 10;
    if (top > 12) {
      parts.push(
        `<rect x="${vx + 0.6}" y="${vy + 0.8}" width="6" height="5" rx="1" fill="#3b3328" opacity=".2"/><rect x="${vx}" y="${vy}" width="6" height="5" rx="1" fill="#c9c3b9" stroke="#958f85" stroke-width=".3"/><path d="M${vx + 1} ${vy + 1.5}h4M${vx + 1} ${vy + 2.5}h4M${vx + 1} ${vy + 3.5}h4" stroke="#958f85" stroke-width=".25"/>`,
      );
    }
  }
  return { box, svg: parts.join('') };
}

// Generators ---------------------------------------------------------------------------------

/**
 * A rooftop kitchen garden: a timber deck around raised wooden beds of lettuces, staked tomatoes,
 * lavender and sunflowers as it is upgraded, with a rain barrel and a gravel path between beds.
 */
export function gardenArt(ctx: ArtContext, box: Box, level: number): Art {
  const [x, y, w, h] = box;
  const horizontal = w >= h;
  const span = horizontal ? h : w;
  const length = horizontal ? w : h;
  const rows = Math.max(1, Math.min(Math.floor((span - 4) / 4.5), 3 + level));
  const gap = (span - 4) / rows;
  const leaf = ctx.palette.foliage;
  const leafLight = mix(ctx.palette.foliage, ctx.palette.foliageLight, 0.7);
  const sx = -0.6 * ctx.lit;
  const seed = hash(x, y);
  const plankDir = horizontal ? `M0 0H6` : `M0 0V6`;
  const parts = [
    `<defs><linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d5d43"/><stop offset="1" stop-color="#5f4532"/></linearGradient>
    <pattern id="deck" width="${horizontal ? 6 : 1.6}" height="${horizontal ? 1.6 : 6}" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#d2bb92"/><path d="${horizontal ? 'M0 1.55H6M3 0V1.6' : 'M1.55 0V6M0 3H1.6'}" stroke="#a88a5e" stroke-width=".14"/><path d="${plankDir}" stroke="#e3d0aa" stroke-width=".25" opacity=".7"/></pattern>
    <pattern id="tilth" width="1.4" height="1.4" patternUnits="userSpaceOnUse"><circle cx=".4" cy=".5" r=".16" fill="#9a7a5c"/><circle cx="1.1" cy="1.1" r=".12" fill="#4a3526"/></pattern></defs>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#deck)"/>`,
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="1.7" fill="none" stroke="#8f7148" stroke-width=".7"/>`,
    `<rect x="${x + 1.1}" y="${y + 1.1}" width="${w - 2.2}" height="${h - 2.2}" rx="1.3" fill="none" stroke="#efe0bf" stroke-width=".25" opacity=".8"/>`,
  ];
  for (let i = 0; i < rows; i++) {
    const offset = 2 + gap * i;
    const bx = horizontal ? x + 2.5 : x + offset + 0.4;
    const by = horizontal ? y + offset + 0.4 : y + 2.5;
    const bw = horizontal ? w - 5 : gap - 0.8;
    const bh = horizontal ? gap - 0.8 : h - 5;
    // The bed: a wooden frame lit on the sun's side, crumbly soil inside.
    parts.push(
      `<rect x="${r(bx + 0.35)}" y="${r(by + 0.45)}" width="${r(bw)}" height="${r(bh)}" rx=".6" fill="#3b3328" opacity=".25"/>`,
      `<rect x="${r(bx)}" y="${r(by)}" width="${r(bw)}" height="${r(bh)}" rx=".6" fill="#b4895a"/>`,
      `<rect x="${r(bx + 0.45)}" y="${r(by + 0.45)}" width="${r(bw - 0.9)}" height="${r(bh - 0.9)}" rx=".4" fill="url(#soil)"/>`,
      `<rect x="${r(bx + 0.45)}" y="${r(by + 0.45)}" width="${r(bw - 0.9)}" height="${r(bh - 0.9)}" rx=".4" fill="url(#tilth)" opacity=".7"/>`,
      `<path d="M${r(bx + 0.3)} ${r(by + 0.25)}H${r(bx + bw - 0.3)}" stroke="#e2c497" stroke-width=".22"/>`,
    );
    const kinds = ['leafy', 'tomato', 'leafy', 'lavender', 'tomato', 'sunflower'] as const;
    const kind = kinds[(i + seed) % Math.min(kinds.length, 2 + level)]!;
    const step = kind === 'sunflower' ? 3.2 : kind === 'lavender' ? 1.6 : 2.4;
    const plants = Math.floor((length - 6) / step);
    const across = (horizontal ? bh : bw) / 2;
    for (let k = 0; k < plants; k++) {
      const along = 3.5 + k * step;
      const px = horizontal ? x + along : bx + across;
      const py = horizontal ? by + across : y + along;
      const size = Math.min(across * 0.9, 1.3) * (0.85 + ((k * 7 + i) % 3) * 0.1);
      if (kind === 'leafy') {
        // A lettuce: a rosette of pale leaves around a bright heart.
        parts.push(
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(size)}" fill="${leaf}"/>`,
          `<circle cx="${r(px + sx * 0.2)}" cy="${r(py - 0.2)}" r="${r(size * 0.7)}" fill="${mix(leafLight, '#d8ecb0', 0.3)}"/>`,
          `<circle cx="${r(px + sx * 0.25)}" cy="${r(py - 0.25)}" r="${r(size * 0.32)}" fill="#eef6d6"/>`,
        );
      } else if (kind === 'tomato') {
        // A staked tomato plant: jagged leaves and red fruit.
        parts.push(
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(size * 1.05)}" fill="${shade(leaf, -0.1)}"/>`,
          `<circle cx="${r(px + sx * 0.3)}" cy="${r(py - 0.3)}" r="${r(size * 0.6)}" fill="${leafLight}" opacity=".8"/>`,
          `<circle cx="${r(px)}" cy="${r(py)}" r=".22" fill="#c9a776"/>`,
        );
        if (k % 2 === 0) {
          parts.push(
            `<circle cx="${r(px + 0.55)}" cy="${r(py + 0.35)}" r=".48" fill="#d4573b"/><circle cx="${r(px + 0.42)}" cy="${r(py + 0.22)}" r=".15" fill="#ffd2c2"/>`,
          );
        }
        if (k % 3 === 1)
          parts.push(`<circle cx="${r(px - 0.5)}" cy="${r(py + 0.5)}" r=".4" fill="#e9893f"/>`);
      } else if (kind === 'lavender') {
        // Lavender: a soft grey-green cushion topped with lilac spikes.
        parts.push(
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(size * 0.85)}" fill="#8aa58a"/>`,
          `<circle cx="${r(px + 0.2)}" cy="${r(py - 0.2)}" r="${r(size * 0.5)}" fill="${LILAC}"/>`,
          `<circle cx="${r(px - 0.35)}" cy="${r(py + 0.25)}" r="${r(size * 0.32)}" fill="#9a7cc0"/>`,
        );
      } else {
        // A sunflower: a ring of gold petals around a brown heart, facing the sun.
        const fr = Math.min(across * 0.95, 1.5);
        parts.push(
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(fr * 1.05)}" fill="${leaf}"/>`,
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(fr * 0.85)}" fill="${GOLD}"/>`,
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(fr * 0.85)}" fill="none" stroke="${GOLD_SOFT}" stroke-width="${r(fr * 0.25)}" stroke-dasharray="${r(fr * 0.3)} ${r(fr * 0.25)}"/>`,
          `<circle cx="${r(px)}" cy="${r(py)}" r="${r(fr * 0.42)}" fill="#6b4a2a"/>`,
        );
      }
    }
  }
  // A rain barrel in a corner of the deck.
  if (span >= 12 && length >= 30) {
    const kx = x + w - 1.8;
    const ky = y + 1.8;
    parts.push(
      `<circle cx="${r(kx + 0.4)}" cy="${r(ky + 0.5)}" r="1.1" fill="#3b3328" opacity=".28"/><circle cx="${r(kx)}" cy="${r(ky)}" r="1.1" fill="#8b6a46" stroke="#5f4630" stroke-width=".2"/><circle cx="${r(kx)}" cy="${r(ky)}" r=".78" fill="${ctx.palette.water}"/><circle cx="${r(kx + sx * 0.25)}" cy="${r(ky - 0.25)}" r=".3" fill="${ctx.palette.sky}" opacity=".8"/>`,
    );
  }
  return { box, svg: parts.join('') };
}

/**
 * A balcony solar panel: a grid of deep blue cells with silver busbars, the sky sliding over its
 * glass, a thin frame on its stand, gilded when upgraded.
 */
export function panelArt(ctx: ArtContext, x: number, y: number, level: number): Art {
  const frame = level >= 1 ? GOLD : '#dcd9d2';
  const parts = [
    `<defs><linearGradient id="cells" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f7393"/><stop offset=".45" stop-color="#26405a"/><stop offset="1" stop-color="#1c3146"/></linearGradient>
    <linearGradient id="sky" x1="${ctx.lit === 1 ? 0 : 1}" y1="0" x2="${ctx.lit === 1 ? 1 : 0}" y2="1"><stop offset="0" stop-color="${ctx.palette.sky}" stop-opacity=".8"/><stop offset=".35" stop-color="${ctx.palette.sky}" stop-opacity=".1"/><stop offset=".62" stop-color="#ffffff" stop-opacity="0"/><stop offset=".7" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".78" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`,
    `<rect x="${x + 0.7}" y="${y + 1.1}" width="11" height="8" rx=".8" fill="#3b3328" opacity=".28"/>`,
    `<rect x="${x}" y="${y}" width="11" height="8" rx=".7" fill="${frame}"/>`,
    `<rect x="${x + 0.45}" y="${y + 0.45}" width="10.1" height="7.1" rx=".4" fill="url(#cells)"/>`,
  ];
  // Six by four cells, with their thin silver lines.
  const cells: string[] = [];
  for (let i = 1; i < 6; i++) cells.push(`M${r(x + 0.45 + (10.1 / 6) * i)} ${y + 0.45}v7.1`);
  for (let k = 1; k < 4; k++) cells.push(`M${x + 0.45} ${r(y + 0.45 + (7.1 / 4) * k)}h10.1`);
  parts.push(
    `<path d="${cells.join('')}" stroke="#a9bfd1" stroke-width=".16" opacity=".75"/>`,
    `<path d="M${x + 0.45} ${y + 2.2}h10.1M${x + 0.45} ${y + 5.8}h10.1" stroke="#cfdbe6" stroke-width=".08" opacity=".6"/>`,
    `<rect x="${x + 0.45}" y="${y + 0.45}" width="10.1" height="7.1" rx=".4" fill="url(#sky)"/>`,
  );
  if (level >= 3) {
    parts.push(
      `<rect x="${x}" y="${y}" width="11" height="8" rx=".7" fill="none" stroke="${GOLD_SOFT}" stroke-width=".18" opacity=".9"/>`,
    );
  }
  return { box: [x - 0.5, y - 0.5, 12.5, 10], svg: parts.join('') };
}

/**
 * A terracotta pot of heliotrope seen from above: its rim catching the sun, dark soil, pointed
 * veined leaves, and a dome of florets, deep violet at the heart and lilac at the edge, that
 * fills out with each upgrade, hearts turning gold.
 */
export function potArt(ctx: ArtContext, x: number, y: number, level: number): Art {
  const leaf = ctx.palette.foliage;
  const sx = -0.6 * ctx.lit;
  const parts = [
    `<defs><radialGradient id="pot" cx="${r(0.5 + sx * 0.25)}" cy=".3"><stop offset="0" stop-color="#eaa883"/><stop offset=".6" stop-color="#c8734f"/><stop offset="1" stop-color="#9a4f33"/></radialGradient>
    <radialGradient id="dome" cx="${r(0.5 + sx * 0.2)}" cy=".35"><stop offset="0" stop-color="#d9c6ef"/><stop offset=".6" stop-color="${LILAC}"/><stop offset="1" stop-color="#7d5aa6"/></radialGradient></defs>`,
    `<circle cx="${x + 0.7}" cy="${y + 0.9}" r="3.7" fill="#3b3328" opacity=".24"/>`,
    `<circle cx="${x}" cy="${y}" r="3.5" fill="url(#pot)"/>`,
    `<path d="M${r(x - 3.1 * ctx.lit)} ${y - 1.2}A3.3 3.3 0 0 1 ${x + 1.1 * ctx.lit} ${y - 3.2}" stroke="#ffe3cf" stroke-width=".45" fill="none" opacity=".7" stroke-linecap="round"/>`,
    `<circle cx="${x}" cy="${y}" r="2.75" fill="#4a3324"/>`,
    `<circle cx="${x}" cy="${y}" r="2.75" fill="none" stroke="#7a4a30" stroke-width=".3"/>`,
  ];
  // Leaves radiating from the stem, each with its midrib.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 360 + 15;
    const tone = i % 2 ? shade(leaf, 0.12) : leaf;
    parts.push(
      `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C.9 -.8 1.1 -2.2 0 -3.2C-1.1 -2.2 -.9 -.8 0 0Z" fill="${tone}"/><path d="M0 -.2V-2.9" stroke="${mix(leaf, '#e6f0d2', 0.5)}" stroke-width=".14"/></g>`,
    );
  }
  // The dome of florets, laid out on the golden angle.
  const florets = 10 + Math.min(level, 5) * 4;
  parts.push(
    `<circle cx="${x}" cy="${y}" r="${r(1.2 + Math.min(level, 5) * 0.12)}" fill="url(#dome)"/>`,
  );
  for (let i = 0; i < florets; i++) {
    const a = i * 2.39996;
    const d = 1.75 * Math.sqrt((i + 0.5) / florets);
    const fx = x + Math.cos(a) * d;
    const fy = y + Math.sin(a) * d;
    const colour = mix('#7d5aa6', '#dccbee', d / 1.75);
    parts.push(
      `<circle cx="${r(fx)}" cy="${r(fy)}" r=".36" fill="${colour}"/>`,
      level >= 3 && i % 3 === 0
        ? `<circle cx="${r(fx)}" cy="${r(fy)}" r=".12" fill="${GOLD}"/>`
        : `<circle cx="${r(fx + sx * 0.1)}" cy="${r(fy - 0.1)}" r=".12" fill="#ffffff" opacity=".55"/>`,
    );
  }
  return { box: [x - 4.5, y - 4.5, 9.5, 9.5], svg: parts.join('') };
}

/**
 * A glass greenhouse on a former waste ground: a vaulted roof of panes on white ribs that catch
 * the light, the sky sliding over the glass, beds of tomatoes and flowers seen through it, a
 * central path to the door, vents opened once upgraded and a warm glow inside.
 */
export function greenhouseArt(ctx: ArtContext, box: Box, level: number): Art {
  const [x, y, w, h] = box;
  const ix = x + 4;
  const iy = y + 4;
  const iw = w - 8;
  const ih = h - 8;
  const ribs = 4 + Math.min(level, 5);
  const leaf = ctx.palette.foliage;
  const leafLight = mix(leaf, ctx.palette.foliageLight, 0.65);
  const frame = level >= 3 ? '#f3e2b8' : '#f7f4ec';
  const lit = ctx.lit;
  const parts = [
    `<defs>
      <linearGradient id="vault" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6fbf8" stop-opacity=".38"/><stop offset=".44" stop-color="#cfe4de" stop-opacity=".06"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".02"/><stop offset=".56" stop-color="#5f8f88" stop-opacity=".18"/><stop offset="1" stop-color="#cfe4dc" stop-opacity=".26"/></linearGradient>
      <linearGradient id="skyglass" x1="${lit === 1 ? 0 : 1}" y1="0" x2="${lit === 1 ? 1 : 0}" y2=".4"><stop offset="0" stop-color="${ctx.palette.sky}" stop-opacity=".55"/><stop offset=".45" stop-color="${ctx.palette.sky}" stop-opacity="0"/></linearGradient>
      <radialGradient id="warm" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="${GOLD_SOFT}" stop-opacity=".38"/><stop offset="1" stop-color="${GOLD_SOFT}" stop-opacity="0"/></radialGradient>
      <pattern id="gravel" width="2.2" height="2" patternUnits="userSpaceOnUse"><rect width="2.2" height="2" fill="#ded4c0"/><circle cx=".5" cy=".6" r=".28" fill="#c8bca6"/><circle cx="1.6" cy="1.4" r=".24" fill="#efe7d8"/><circle cx="1.5" cy=".3" r=".16" fill="#b9ad97"/></pattern>
    </defs>`,
    // Gravel apron, a lawn edge, then the greenhouse's own soil.
    `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="4" fill="url(#gravel)"/>`,
    `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="4" fill="none" stroke="${mix(leaf, '#cfe0c0', 0.6)}" stroke-width="1.2"/>`,
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="#b7cfa9"/>`,
    `<rect x="${ix + 2}" y="${iy + 2}" width="${iw - 4}" height="${ih - 4}" rx="5" fill="#6e533d" opacity=".8"/>`,
  ];
  // Beds of plants on either side of a central path.
  const mid = iy + ih / 2;
  parts.push(
    `<rect x="${ix + 3}" y="${r(mid - 1.4)}" width="${iw - 6}" height="2.8" rx="1" fill="#e6dccb"/>`,
  );
  const beds = Math.max(2, Math.floor(ih / 7));
  const crops = ['#d4573b', LILAC, '#e9893f', GOLD, '#d4573b', '#f2bfd3'];
  for (let i = 0; i < beds; i++) {
    const by = iy + 3 + ((ih - 6) / beds) * (i + 0.5);
    if (Math.abs(by - mid) < 2.4) continue;
    parts.push(
      `<path d="M${ix + 5} ${r(by)}H${ix + iw - 5}" stroke="${shade(leaf, -0.12)}" stroke-width="3.6" stroke-linecap="round"/>`,
      `<path d="M${ix + 5} ${r(by - 0.5)}H${ix + iw - 5}" stroke="${leafLight}" stroke-width="2" stroke-linecap="round" stroke-dasharray=".1 2.1"/>`,
    );
    const fruit = crops[(i + Math.min(level, 3)) % crops.length]!;
    if (level >= 1) {
      parts.push(
        `<path d="M${ix + 6} ${r(by + 0.6)}H${ix + iw - 6}" stroke="${fruit}" stroke-width=".9" stroke-linecap="round" stroke-dasharray=".1 ${3.4 - Math.min(level, 4) * 0.4}"/>`,
      );
    }
  }
  if (level >= 2) {
    parts.push(`<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="url(#warm)"/>`);
  }
  // The glass: a vault of panes, the sky reflected, ribs and a bright ridge.
  parts.push(
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="url(#vault)"/>`,
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="url(#skyglass)"/>`,
  );
  const panes: string[] = [];
  for (let i = 0; i < ribs; i++) {
    const rx = ix + (iw / (ribs + 1)) * (i + 1);
    panes.push(`M${r(rx)} ${iy + 0.4}V${iy + ih - 0.4}`);
  }
  for (const f of [0.22, 0.36, 0.64, 0.78])
    panes.push(`M${ix + 1.5} ${r(iy + ih * f)}H${ix + iw - 1.5}`);
  parts.push(
    `<path d="${panes.join('')}" stroke="${frame}" stroke-width=".42" opacity=".95"/>`,
    `<path d="${panes.join('')}" stroke="#5f8f88" stroke-width=".12" opacity=".35" transform="translate(.25 .25)"/>`,
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="none" stroke="${frame}" stroke-width="1.2"/>`,
    `<rect x="${ix + 1}" y="${iy + 1}" width="${iw - 2}" height="${ih - 2}" rx="6" fill="none" stroke="#6f958d" stroke-width=".35" opacity=".6"/>`,
    `<path d="M${ix + 1} ${r(mid)}H${ix + iw - 1}" stroke="#ffffff" stroke-width=".8"/>`,
    `<path d="M${ix + 1} ${r(mid + 0.8)}H${ix + iw - 1}" stroke="#7f9c95" stroke-width=".35" opacity=".6"/>`,
  );
  // Roof vents, propped open once upgraded.
  if (level >= 1) {
    const vents = Math.min(1 + level, 5);
    for (let i = 0; i < vents; i++) {
      const vx = ix + (iw / (vents + 1)) * (i + 1) - 2;
      parts.push(
        `<rect x="${r(vx + 0.3)}" y="${r(mid - 3.9)}" width="4" height="2.6" fill="#3b3328" opacity=".22"/><rect x="${r(vx)}" y="${r(mid - 4.3)}" width="4" height="2.6" fill="#e8f3f0" stroke="${frame}" stroke-width=".3" opacity=".9"/>`,
      );
    }
  }
  // The door and its step, at the end towards the street.
  const dx = lit === 1 ? ix - 0.6 : ix + iw - 2.4;
  parts.push(
    `<rect x="${r(dx)}" y="${r(mid - 2.2)}" width="3" height="4.4" rx=".5" fill="#e8f3f0" stroke="${frame}" stroke-width=".5"/>`,
  );
  return { box, svg: parts.join('') };
}

/**
 * A grey tower turned vertical farm, seen from above: stepped terraces of warm decking, each
 * casting its shade on the one below, their rims overflowing with shrubs, small trees at the
 * corners, glass railings, and a glazed atrium at the top, ringed with solar louvres once upgraded.
 */
export function farmArt(ctx: ArtContext, box: Box, level: number): Art {
  const [x, y, w, h] = box;
  const terraces = Math.min(3 + Math.min(level, 3), Math.floor(Math.min(w, h) / 11));
  const leaf = ctx.palette.foliage;
  const leafLight = mix(leaf, ctx.palette.foliageLight, 0.7);
  const lit = ctx.lit;
  const sx = -0.6 * lit;
  const seed = hash(x, y);
  const parts = [
    `<defs>${litGradient('deck', '#ecdcbc', '#c9b08a', lit)}${litGradient('stone', '#f1ece2', '#cfc6b6', lit)}
      <linearGradient id="fglass" x1="${lit === 1 ? 0 : 1}" y1="0" x2="${lit === 1 ? 1 : 0}" y2="1"><stop offset="0" stop-color="#fbfdfb"/><stop offset=".4" stop-color="${ctx.palette.sky}"/><stop offset="1" stop-color="#8fb0ae"/></linearGradient>
      <pattern id="boards" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 1.9H2" stroke="#a88a5e" stroke-width=".12" opacity=".6"/></pattern></defs>`,
  ];
  for (let i = 0; i < terraces; i++) {
    const inset = i * 5;
    const tx = x + inset;
    const ty = y + inset;
    const tw = w - inset * 2;
    const th = h - inset * 2;
    const rx = Math.max(1.5, 5 - i);
    const deck = i % 2 ? 'url(#stone)' : 'url(#deck)';
    parts.push(
      `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${rx}" fill="${deck}"/>`,
    );
    if (i % 2 === 0) {
      parts.push(
        `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${rx}" fill="url(#boards)"/>`,
      );
    }
    // The terrace above casts its shade on this one, away from the sun.
    if (i + 1 < terraces) {
      parts.push(
        `<rect x="${r(tx + 5 + 1.4 * lit)}" y="${r(ty + 6.4)}" width="${tw - 10}" height="${th - 10}" rx="${Math.max(1.5, 4 - i)}" fill="#3b3328" opacity=".22"/>`,
      );
    }
    // Glass railing along the edge.
    parts.push(
      `<rect x="${tx + 0.3}" y="${ty + 0.3}" width="${tw - 0.6}" height="${th - 0.6}" rx="${rx}" fill="none" stroke="#ffffff" stroke-width=".35" opacity=".85"/>`,
    );
    // Shrubs spilling over the planted rim.
    const inner = 1.6;
    const perimeter = 2 * (tw + th - 4 * inner);
    const count = Math.floor(perimeter / 2.3);
    for (let k = 0; k < count; k++) {
      const [px, py] = alongRect(tx + inner, ty + inner, tw - inner * 2, th - inner * 2, k / count);
      const cr = 0.95 + rnd(seed + i, k) * 0.65;
      parts.push(
        `<circle cx="${r(px)}" cy="${r(py)}" r="${r(cr)}" fill="${mix(shade(leaf, -0.14), leafLight, rnd(seed, k + i * 50) * 0.3)}"/>`,
        `<circle cx="${r(px + sx * 0.35)}" cy="${r(py - 0.35)}" r="${r(cr * 0.5)}" fill="${leafLight}" opacity=".85"/>`,
      );
      if (level >= 2 && (k + i) % 5 === 0) {
        parts.push(
          `<circle cx="${r(px + 0.3)}" cy="${r(py + 0.2)}" r=".5" fill="${i % 2 ? GOLD_SOFT : LILAC}"/>`,
        );
      }
    }
    // A small tree at two corners of each terrace.
    for (const [cx, cy] of [
      [tx + 3.2, ty + 3.2],
      [tx + tw - 3.2, ty + th - 3.2],
    ] as const) {
      parts.push(
        `<circle cx="${r(cx + 0.6 * lit)}" cy="${r(cy + 0.8)}" r="2.2" fill="#3b3328" opacity=".2"/><circle cx="${r(cx)}" cy="${r(cy)}" r="2.2" fill="${shade(leaf, -0.12)}"/><circle cx="${r(cx + sx * 0.5)}" cy="${r(cy - 0.5)}" r="1.4" fill="${mix(leaf, leafLight, 0.5)}"/><circle cx="${r(cx + sx * 0.8)}" cy="${r(cy - 0.8)}" r=".6" fill="${leafLight}"/>`,
      );
    }
  }
  // The atrium's glass roof, its mullions, and solar louvres around it.
  const [cx, cy] = centre(box);
  const top = Math.min(w, h) - (terraces - 1) * 10;
  if (level >= 3 && top >= 26) {
    for (let k = 0; k < 4; k++) {
      parts.push(
        `<g transform="rotate(${k * 90} ${cx} ${cy})"><rect x="${cx - 7}" y="${cy - 9.2}" width="14" height="2.2" rx=".4" fill="#2f4a63" stroke="${GOLD}" stroke-width=".25"/><path d="M${cx - 7} ${cy - 8.1}h14" stroke="#9bb3c6" stroke-width=".12"/></g>`,
      );
    }
  }
  parts.push(
    `<rect x="${cx - 5.2}" y="${cy - 4.6}" width="11" height="11" rx="2" fill="#3b3328" opacity=".2"/>`,
    `<rect x="${cx - 5.5}" y="${cy - 5.5}" width="11" height="11" rx="2" fill="url(#fglass)" stroke="#f7f4ec" stroke-width=".7"/>`,
    `<path d="M${cx} ${cy - 5.5}v11M${cx - 5.5} ${cy}h11M${cx - 2.75} ${cy - 5.5}v11M${cx + 2.75} ${cy - 5.5}v11" stroke="#f7f4ec" stroke-width=".3"/>`,
    `<path d="M${cx - 4.5} ${cy + 3}l7.5 -7.5" stroke="#ffffff" stroke-width=".8" opacity=".55"/>`,
  );
  return { box, svg: parts.join('') };
}

/** Point at `t` (0 to 1) along the outline of a box, clockwise from its top-left corner. */
function alongRect(x: number, y: number, w: number, h: number, t: number): [number, number] {
  let d = t * 2 * (w + h);
  if (d < w) return [x + d, y];
  d -= w;
  if (d < h) return [x + w, y + d];
  d -= h;
  if (d < w) return [x + w - d, y + h];
  d -= w;
  return [x, y + h - d];
}

/**
 * One heliostat: four mirror facets on a frame, reflecting a bright sky with a glint of sun
 * across them, silver at first and gilded once upgraded.
 */
export function mirrorArt(ctx: ArtContext, gilded: boolean): Art {
  const frame = gilded ? GOLD : '#b9c4c8';
  const facets = [-4.2, -2.1, 0, 2.1]
    .map(
      (fx) => `<rect x="${fx + 0.1}" y="-1.55" width="1.9" height="3.1" rx=".2" fill="url(#m)"/>`,
    )
    .join('');
  const svg = `<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="${ctx.palette.sky}"/><stop offset=".75" stop-color="#6f93a6"/><stop offset="1" stop-color="#3f6276"/></linearGradient>
    <linearGradient id="glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
    <rect x="-4.6" y="-1.9" width="9.2" height="3.8" rx=".6" fill="${shade(frame, -0.25)}"/>
    <rect x="-4.45" y="-1.75" width="8.9" height="3.5" rx=".5" fill="${frame}"/>
    ${facets}
    <path d="M-1.4 -1.55l-1.6 3.1h1.1l1.6 -3.1z" fill="url(#glint)" opacity=".8"/>
    <path d="M-4.4 -1.7h8.8" stroke="#ffffff" stroke-width=".18" opacity=".7"/>`;
  return { box: [-5.2, -2.5, 10.4, 5], svg };
}

/**
 * The mirror field's tower from above: a stone plinth, the lattice of its shaft in rings, and
 * the receiver glowing gold at the top, rayed with the light the mirrors send it.
 */
export function towerArt(): Art {
  const { x, y } = MIRROR_TOWER;
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const inner = 4.2;
    const outer = i % 2 ? 7 : 8.6;
    return `M${r(x + Math.cos(a) * inner)} ${r(y + Math.sin(a) * inner)}L${r(x + Math.cos(a) * outer)} ${r(y + Math.sin(a) * outer)}`;
  }).join('');
  const lattice = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `M${r(x + Math.cos(a) * 3.8)} ${r(y + Math.sin(a) * 3.8)}L${r(x + Math.cos(a) * 6.4)} ${r(y + Math.sin(a) * 6.4)}`;
  }).join('');
  const svg = `<defs><radialGradient id="rcv" cx=".4" cy=".4"><stop offset="0" stop-color="#fffaf0"/><stop offset=".35" stop-color="#fff0c2"/><stop offset=".7" stop-color="${GOLD}"/><stop offset="1" stop-color="#b27422"/></radialGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="${GOLD_SOFT}" stop-opacity=".9"/><stop offset="1" stop-color="${GOLD_SOFT}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${x}" cy="${y}" r="9.5" fill="url(#halo)" opacity=".55"/>
    <circle cx="${x}" cy="${y}" r="7.4" fill="#e3dccd" stroke="#bdb39f" stroke-width=".5"/>
    <circle cx="${x}" cy="${y}" r="6.4" fill="#d1c8b6"/>
    <path d="${lattice}" stroke="#9e9584" stroke-width=".35"/>
    <circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="#9e9584" stroke-width=".3"/>
    <circle cx="${x}" cy="${y}" r="6.4" fill="none" stroke="${GOLD}" stroke-width=".5"/>
    <path d="${rays}" stroke="${GOLD_SOFT}" stroke-width=".35" stroke-linecap="round" opacity=".85"/>
    <circle cx="${x}" cy="${y}" r="3.9" fill="url(#rcv)" stroke="#fff4d6" stroke-width=".3"/>
    <circle cx="${x - 1}" cy="${y - 1.1}" r="1.1" fill="#ffffff" opacity=".75"/>`;
  return { box: [x - 10, y - 10, 20, 20], svg };
}

/**
 * A street tree from above: a lobed silhouette in deep shade, then clumps of leaves that each
 * catch the sun on one side, a fine speckle of leaves, and flowers once upgraded. Lime (dense,
 * small clumps), plane (broad mottled lobes) and flowering cherry alternate along the streets.
 */
export function treeArt(ctx: ArtContext, kind: number, radius: number, level: number): Art {
  const { foliage, foliageLight, blossom } = ctx.palette;
  const flowering = kind === 2 ? level >= 1 : level >= 2;
  const base =
    kind === 0 ? foliage : kind === 1 ? mix(foliage, '#5d8a4a', 0.4) : shade(foliage, -0.05);
  const dark = shade(base, -0.22);
  const mid = mix(base, foliageLight, 0.32);
  const light = mix(base, foliageLight, 0.78);
  const R = radius;
  // Towards the sun, in the drawing: up and to the lit side.
  const sx = -0.6 * ctx.lit;
  const sy = -0.8;
  const seed = kind * 31 + Math.round(R * 10);
  const parts = [
    `<defs><radialGradient id="crown" gradientUnits="userSpaceOnUse" cx="${r(sx * R * 0.4)}" cy="${r(sy * R * 0.4)}" r="${r(R * 1.35)}"><stop offset="0" stop-color="${light}"/><stop offset=".42" stop-color="${mid}"/><stop offset=".78" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
    <pattern id="leaves" width="2.6" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(${kind * 23})"><ellipse cx=".7" cy=".6" rx=".42" ry=".2" transform="rotate(35 .7 .6)" fill="${light}"/><ellipse cx="2" cy="1.7" rx=".38" ry=".18" transform="rotate(-30 2 1.7)" fill="${dark}"/></pattern></defs>`,
  ];
  // The silhouette: a ring of lobes in deep shade, its edge never a perfect circle.
  const lobes = kind === 1 ? 7 : kind === 2 ? 9 : 8;
  const lobeR = R * (kind === 1 ? 0.46 : 0.4);
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + rnd(seed, i) * 0.5;
    const d = R * (0.56 + rnd(seed, i + 9) * 0.1);
    parts.push(
      `<circle cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" r="${r(lobeR * (0.85 + rnd(seed, i + 20) * 0.3))}" fill="${dark}"/>`,
    );
  }
  // The body of the crown, lit as one volume.
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + 0.35 + rnd(seed, i + 40) * 0.4;
    parts.push(
      `<circle cx="${r(Math.cos(a) * R * 0.42)}" cy="${r(Math.sin(a) * R * 0.42)}" r="${r(lobeR * 1.05)}" fill="url(#crown)"/>`,
    );
  }
  parts.push(`<circle r="${r(R * 0.56)}" fill="url(#crown)"/>`);
  // Clumps of leaves, each with a shaded side and a sunlit side.
  const clumps = kind === 0 ? 17 : kind === 1 ? 11 : 14;
  const clumpR = R * (kind === 1 ? 0.25 : kind === 0 ? 0.18 : 0.2);
  for (let i = 0; i < clumps; i++) {
    const a = i * 2.39996 + seed;
    const d = R * 0.66 * Math.sqrt((i + 0.5) / clumps);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const cr = clumpR * (0.8 + rnd(seed, i + 60) * 0.4);
    const facing = Math.max(-1, Math.min(1, (x * sx + y * sy) / (R * 0.7)));
    parts.push(
      `<circle cx="${r(x - sx * cr * 0.3)}" cy="${r(y - sy * cr * 0.3)}" r="${r(cr)}" fill="${dark}" opacity=".45"/>`,
      `<circle cx="${r(x)}" cy="${r(y)}" r="${r(cr * 0.92)}" fill="${mix(base, mid, 0.5 + facing * 0.5)}"/>`,
      `<circle cx="${r(x + sx * cr * 0.32)}" cy="${r(y + sy * cr * 0.32)}" r="${r(cr * 0.45)}" fill="${light}" opacity="${r(0.25 + Math.max(0, facing) * 0.55)}"/>`,
    );
  }
  // Mottled bark-light of the plane tree; the leaf speckle over every crown.
  if (kind === 1) {
    for (let i = 0; i < 5; i++) {
      const a = i * 1.7 + seed;
      const d = R * 0.45 * rnd(seed, i + 80);
      parts.push(
        `<ellipse cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" rx="${r(R * 0.12)}" ry="${r(R * 0.07)}" transform="rotate(${r(a * 57)} ${r(Math.cos(a) * d)} ${r(Math.sin(a) * d)})" fill="${mix(light, '#f3ead0', 0.35)}" opacity=".45"/>`,
      );
    }
  }
  parts.push(`<circle r="${r(R * 0.82)}" fill="url(#leaves)" opacity=".35"/>`);
  parts.push(
    `<circle cx="${r(sx * R * 0.3)}" cy="${r(sy * R * 0.3)}" r="${r(R * 0.26)}" fill="#fffbe8" opacity=".14"/>`,
  );
  if (flowering) {
    const petal = kind === 2 ? blossom : kind === 0 ? LILAC : GOLD_SOFT;
    const count = kind === 2 ? 16 : 11;
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996 + kind + rnd(seed, i + 100) * 0.6;
      const d = R * 0.78 * Math.sqrt((i + 0.6) / count);
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      const pr = Math.max(0.45, R * (kind === 2 ? 0.075 : 0.065));
      parts.push(
        kind === 2
          ? `<g transform="translate(${r(x)} ${r(y)})" fill="${petal}">${[0, 72, 144, 216, 288].map((deg) => `<circle cx="${r(Math.cos((deg * Math.PI) / 180) * pr)}" cy="${r(Math.sin((deg * Math.PI) / 180) * pr)}" r="${r(pr * 0.75)}"/>`).join('')}<circle r="${r(pr * 0.45)}" fill="${GOLD}"/></g>`
          : `<circle cx="${r(x)}" cy="${r(y)}" r="${r(pr * 1.2)}" fill="${petal}"/><circle cx="${r(x - 0.2)}" cy="${r(y - 0.2)}" r="${r(pr * 0.5)}" fill="#ffffff" opacity=".5"/>`,
      );
    }
  }
  const pad = R * 1.2;
  return { box: [-pad, -pad, pad * 2, pad * 2], svg: parts.join('') };
}

/** A petal pointing up from (0, 0), `length` long. */
function petalPath(length: number, width: number): string {
  return `M0 0C${r(-width)} ${r(-length * 0.35)} ${r(-width * 0.6)} ${r(-length * 0.9)} 0 ${r(-length)}C${r(width * 0.6)} ${r(-length * 0.9)} ${r(width)} ${r(-length * 0.35)} 0 0Z`;
}

/**
 * One ring of the living arcology: eight petal-shaped terraces, planted or glazed. Planted
 * petals carry stepped beds edged with shrubs and a few trees; glazed ones, mullions and the sky.
 */
export function arcologyRingArt(ctx: ArtContext, ring: number, level: number): Art {
  const length = 56 - ring * 9;
  const glass = ring % 2 === 1;
  const leaf = ctx.palette.foliage;
  const leafLight = mix(leaf, ctx.palette.foliageLight, 0.7);
  const width = length * 0.42;
  const parts = [
    `<defs><linearGradient id="t" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${glass ? '#bfd8d4' : mix(leaf, ctx.palette.foliageLight, 0.45)}"/><stop offset="1" stop-color="${glass ? '#f6faf7' : mix(leaf, ctx.palette.foliageLight, 0.85)}"/></linearGradient>
    <linearGradient id="sky" x1="0" y1="1" x2="1" y2="0"><stop offset=".3" stop-color="${ctx.palette.sky}" stop-opacity="0"/><stop offset=".6" stop-color="${ctx.palette.sky}" stop-opacity=".7"/><stop offset=".75" stop-color="#ffffff" stop-opacity=".2"/></linearGradient></defs>`,
  ];
  const petal = (k: number): string => {
    const inner: string[] = [
      `<path d="${petalPath(length, width)}" fill="url(#t)" stroke="${glass ? '#ffffff' : shade(leaf, -0.1)}" stroke-width=".9"/>`,
    ];
    if (glass) {
      // Mullions across the glazing and the sky gliding over it.
      for (let f = 0.2; f < 0.95; f += 0.15) {
        const half = width * Math.sin(f * Math.PI) * 0.62;
        inner.push(
          `<path d="M${r(-half)} ${r(-length * f)}Q0 ${r(-length * f - 2)} ${r(half)} ${r(-length * f)}" stroke="#ffffff" stroke-width=".4" fill="none" opacity=".9"/>`,
        );
      }
      inner.push(
        `<path d="${petalPath(length, width)}" fill="url(#sky)"/>`,
        `<path d="M0 -3V${r(-length + 4)}" stroke="#ffffff" stroke-width=".6"/>`,
      );
    } else {
      // Stepped beds: smaller petals inside, each edged with shrubs.
      for (const s of [0.66]) {
        inner.push(
          `<path d="${petalPath(length * s, width * s)}" transform="translate(0 ${r(-length * (1 - s) * 0.5)})" fill="none" stroke="${shade(leaf, -0.05)}" stroke-width="1.3" opacity=".7"/>`,
        );
      }
      const shrubs = Math.round(length / 3.2);
      for (let i = 0; i < shrubs; i++) {
        const f = (i + 0.5) / shrubs;
        const side = i % 2 ? 1 : -1;
        const half = width * Math.sin(f * Math.PI) * 0.56;
        const sx = side * half * 0.88;
        const sy = -length * f;
        const cr = 1.2 + rnd(ring * 17 + k, i) * 0.7;
        inner.push(
          `<circle cx="${r(sx)}" cy="${r(sy)}" r="${r(cr)}" fill="${shade(leaf, -0.08)}"/><circle cx="${r(sx - 0.3)}" cy="${r(sy - 0.3)}" r="${r(cr * 0.5)}" fill="${leafLight}"/>`,
        );
      }
      // A tree near the tip of every other petal.
      if (k % 2 === 0) {
        const ty = -length * 0.72;
        inner.push(
          `<circle cx="0" cy="${r(ty)}" r="3" fill="${shade(leaf, -0.15)}"/><circle cx="-.6" cy="${r(ty - 0.6)}" r="2" fill="${mix(leaf, leafLight, 0.5)}"/><circle cx="-1" cy="${r(ty - 1)}" r=".8" fill="${leafLight}"/>`,
        );
      }
      inner.push(
        `<path d="M0 -4V${r(-length + 6)}" stroke="#eadfca" stroke-width=".8" opacity=".9"/>`,
      );
    }
    return inner.join('');
  };
  for (let k = 0; k < 8; k++) {
    const angle = (k * 360) / 8 + (ring % 2) * 22.5;
    parts.push(`<g transform="rotate(${angle})">${petal(k)}</g>`);
  }
  if (ring === 0 && level >= 1) {
    for (let k = 0; k < 16; k++) {
      const a = ((k * 22.5 - 90) * Math.PI) / 180;
      const d = k % 2 ? 40 : 46;
      parts.push(
        `<circle cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" r="2.2" fill="${k % 4 === 1 && level >= 3 ? GOLD : LILAC}"/><circle cx="${r(Math.cos(a) * d - 0.5)}" cy="${r(Math.sin(a) * d - 0.5)}" r=".8" fill="#ffffff" opacity=".5"/>`,
      );
    }
  }
  const pad = length + 2;
  return { box: [-pad, -pad, pad * 2, pad * 2], svg: parts.join('') };
}

/**
 * The courtyard planter around the heliotrope's pot: a stone ring with a lit rim, a bed of
 * leaves, and blooms of lilac and gold that multiply with click upgrades.
 */
export function planterArt(blooms: number): Art {
  const { x, y } = PLANTER;
  const petals = 8 + blooms * 4;
  const parts = [
    `<defs><linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efe0"/><stop offset="1" stop-color="#d6c8ad"/></linearGradient></defs>`,
    `<ellipse cx="${x + 0.8}" cy="${y + 1.3}" rx="17.8" ry="11.3" fill="#3b3328" opacity=".18"/>`,
    `<ellipse cx="${x}" cy="${y}" rx="17.5" ry="11" fill="url(#stone)" stroke="#c4b393" stroke-width=".6"/>`,
    `<ellipse cx="${x}" cy="${y - 0.3}" rx="16.6" ry="10.2" fill="none" stroke="#fffaf0" stroke-width=".5" opacity=".8"/>`,
    `<ellipse cx="${x}" cy="${y}" rx="15.2" ry="9" fill="#5e4532"/>`,
    `<ellipse cx="${x}" cy="${y + 0.4}" rx="15.2" ry="8.6" fill="none" stroke="#3b2a1e" stroke-width=".6" opacity=".5"/>`,
  ];
  // A ring of leaves, then the blooms.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const lx = x + Math.cos(a) * 13.3;
    const ly = y + Math.sin(a) * 7.6;
    parts.push(
      `<ellipse cx="${r(lx)}" cy="${r(ly)}" rx="2" ry="1.2" transform="rotate(${r((a * 180) / Math.PI + 90)} ${r(lx)} ${r(ly)})" fill="${i % 2 ? '#2f6b4f' : '#467f5c'}"/>`,
    );
  }
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + 0.2;
    const px = x + Math.cos(a) * 13.6;
    const py = y + Math.sin(a) * 8;
    const fill = i % 3 === 2 ? GOLD : i % 3 === 1 ? '#cdb4e4' : LILAC;
    const size = 1.3 + blooms * 0.1;
    parts.push(
      `<circle cx="${r(px)}" cy="${r(py)}" r="${r(size)}" fill="${fill}"/><circle cx="${r(px)}" cy="${r(py)}" r="${r(size * 0.35)}" fill="${i % 3 === 2 ? '#fff4d6' : GOLD_SOFT}"/>`,
    );
  }
  return { box: [x - 19, y - 13, 38, 26], svg: parts.join('') };
}

/** The river bed of the restored river (§6.1): banks, stones and reeds; the water is animated. */
export function riverBanksArt(ctx: ArtContext): Art {
  const [x, y, w, h] = PARCEL_RIVER;
  const parts = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#c9d8b4"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#grass)" opacity=".8"/>`,
    `<defs><pattern id="grass" width="9" height="8" patternUnits="userSpaceOnUse"><path d="M2 6.5l-.8-2.2M2 6.5l.4-2.5M2 6.5l1.5-1.8" stroke="${ctx.palette.foliage}" stroke-width=".35" fill="none" opacity=".6"/><circle cx="6" cy="3" r=".4" fill="${LILAC}"/></pattern></defs>`,
  ];
  for (let i = 0; i < 26; i++) {
    const sy = y + 6 + (h / 26) * i;
    const side = i % 2 ? x + 2.2 : x + w - 2.2;
    parts.push(
      `<path d="M${side} ${r(sy)}l-.8 -2.6M${side} ${r(sy)}l.2 -3M${side} ${r(sy)}l1 -2.4" stroke="${mix(ctx.palette.foliage, '#9a8a4a', 0.3)}" stroke-width=".4" stroke-linecap="round"/>`,
    );
  }
  return { box: [x, y, w, h], svg: parts.join('') };
}

/** Wooden footbridges over the river where the avenues cross it. */
export function footbridgeArt(sy: number): Art {
  const [x, , w] = PARCEL_RIVER;
  const sw = STREETS.width;
  const parts = [
    `<rect x="${x - 1}" y="${sy + 6.8}" width="${w + 2}" height="${sw - 12}" rx="1" fill="#3b3328" opacity=".2"/>`,
    `<rect x="${x - 1}" y="${sy + 6}" width="${w + 2}" height="${sw - 12}" rx="1" fill="#c79a6a"/>`,
  ];
  for (let i = 0; i < w + 2; i += 1.8) {
    parts.push(
      `<path d="M${r(x - 1 + i)} ${sy + 6}v${sw - 12}" stroke="#a87c50" stroke-width=".25"/>`,
    );
  }
  parts.push(
    `<path d="M${x - 1} ${sy + 6.5}H${x + w + 1}M${x - 1} ${sy + sw - 6.5}H${x + w + 1}" stroke="#8a6440" stroke-width=".7"/>`,
  );
  return { box: [x - 2, sy + 5, w + 4, sw - 9], svg: parts.join('') };
}

/** Bed of the river, as a path: it winds gently down the street. */
export function riverPath(): string {
  const [x, y, w, h] = PARCEL_RIVER;
  const mid = x + w / 2;
  let bed = `M${mid} ${y}`;
  for (let i = 0; i < 9; i++) {
    const y0 = y + (h / 9) * i;
    bed += ` C${mid + (i % 2 ? -4 : 4)} ${r(y0 + h / 27)} ${mid + (i % 2 ? -4 : 4)} ${r(y0 + (h / 27) * 2)} ${mid} ${r(y0 + h / 9)}`;
  }
  return bed;
}
