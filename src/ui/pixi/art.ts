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
  }: { courtyardGreen: number; wastelands: Box[]; carParks: Box[] },
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
  for (const box of wastelands) parts.push(wastelandArt(box));
  return { box: [0, 0, width, height], svg: parts.join('') };
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
 * carries a garden keeps only its edge; living roofs turn it to sedum.
 */
export function buildingArt(
  ctx: ArtContext,
  box: Box,
  storeys: number,
  { bare = false, sedum = false }: { bare?: boolean; sedum?: boolean } = {},
): Art {
  const [x, y, w, h] = box;
  const facade = Math.min(storeys * 1.5 + 2, h * 0.28);
  const top = h - facade;
  const seed = hash(x, y);
  const roof = sedum
    ? mix('#9dbb83', ctx.palette.foliageLight, 0.15)
    : mix(CONCRETE, SAGE, ctx.greenness * 0.45);
  const lit = ctx.lit;
  const parts: string[] = [
    `<defs>${litGradient('roof', shade(roof, 0.22), shade(roof, -0.08), lit)}
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c968d"/><stop offset="1" stop-color="#7f7a72"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f1e6"/><stop offset=".5" stop-color="#b9cfd2"/><stop offset="1" stop-color="#8aa6ad"/></linearGradient>
      <radialGradient id="tank" cx=".35" cy=".35"><stop offset="0" stop-color="#f2efe8"/><stop offset="1" stop-color="#a39d93"/></radialGradient>
      ${sedum ? `<pattern id="sedum" width="5" height="4.4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="${shade(roof, -0.14)}"/><circle cx="3.6" cy="3.2" r=".7" fill="${shade(roof, 0.12)}"/><circle cx="3.3" cy="1" r=".42" fill="${LILAC}"/><circle cx="1.3" cy="3.4" r=".36" fill="${GOLD_SOFT}"/><circle cx="4.6" cy="2.2" r=".3" fill="#fffaf0"/></pattern>` : ''}
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
      const fill = s === 0 ? GOLD_SOFT : s < 4 ? '#f0e6cf' : '#d9d2c2';
      parts.push(
        `<rect x="${r(x + 2.4 + k * 3.2)}" y="${r(wy - rowGap * 0.3)}" width="1.9" height="${r(Math.max(0.5, rowGap * 0.55))}" rx=".2" fill="${fill}" opacity=".92"/>`,
      );
    }
  }
  parts.push(
    `<rect x="${x}" y="${y + top - 0.2}" width="${w}" height=".7" fill="#5e5a54" opacity=".45"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${top}" rx="2" fill="url(#roof)"/>`,
  );
  if (sedum) {
    parts.push(
      `<rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${top - 3}" rx="1.5" fill="url(#sedum)"/>`,
    );
  }
  // Parapet: a light rim on the sun's side, a dark one on the other.
  parts.push(
    `<rect x="${x + 1.6}" y="${y + 1.6}" width="${w - 3.2}" height="${top - 3.2}" rx="1.2" fill="none" stroke="${shade(roof, -0.18)}" stroke-width=".55" opacity=".7"/>`,
    `<path d="M${lit === 1 ? x + 0.6 : x + w - 0.6} ${y + top - 1}V${y + 0.6}${lit === 1 ? `H${x + w - 1}` : `H${x + 1}`}" stroke="#fff" stroke-width=".7" opacity=".55" fill="none"/>`,
  );
  if (!bare && !sedum) {
    // Seams of the roof membrane.
    const seams = Math.floor(w / 9);
    for (let i = 1; i < seams; i++) {
      parts.push(
        `<path d="M${r(x + (w / seams) * i)} ${y + 2.5}V${r(y + top - 2.5)}" stroke="${shade(roof, -0.1)}" stroke-width=".25" opacity=".6"/>`,
      );
    }
    const wide = w >= h;
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

/** A rooftop kitchen garden: wooden beds of leafy rows, tomatoes and flowers, a little path. */
export function gardenArt(ctx: ArtContext, box: Box, level: number): Art {
  const [x, y, w, h] = box;
  const horizontal = w >= h;
  const span = horizontal ? h : w;
  const length = horizontal ? w : h;
  const rows = Math.max(1, Math.min(Math.floor((span - 4) / 4.5), 3 + level));
  const gap = (span - 4) / rows;
  const leaf = ctx.palette.foliage;
  const leafLight = mix(ctx.palette.foliage, '#c8e0a8', 0.45);
  const parts = [
    `<defs><linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a4e"/><stop offset="1" stop-color="#6e533d"/></linearGradient></defs>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#c9b48f"/>`,
    `<rect x="${x + 0.8}" y="${y + 0.8}" width="${w - 1.6}" height="${h - 1.6}" rx="1.6" fill="none" stroke="#a88a5e" stroke-width=".6"/>`,
  ];
  for (let i = 0; i < rows; i++) {
    const offset = 2 + gap * i;
    const bx = horizontal ? x + 2.5 : x + offset + 0.4;
    const by = horizontal ? y + offset + 0.4 : y + 2.5;
    const bw = horizontal ? w - 5 : gap - 0.8;
    const bh = horizontal ? gap - 0.8 : h - 5;
    parts.push(
      `<rect x="${r(bx)}" y="${r(by)}" width="${r(bw)}" height="${r(bh)}" rx=".6" fill="url(#soil)" stroke="#b08b5c" stroke-width=".35"/>`,
    );
    const kind = level >= 3 && i % 3 === 2 ? 'blossom' : level >= 1 && i % 2 ? 'tomato' : 'leafy';
    const plants = Math.floor((length - 6) / 2.4);
    for (let k = 0; k < plants; k++) {
      const along = 3.5 + k * 2.4;
      const across = (horizontal ? bh : bw) / 2;
      const px = horizontal ? x + along : bx + across;
      const py = horizontal ? by + across : y + along;
      const size = Math.min(across * 0.95, 1.25) * (0.85 + ((k * 7 + i) % 3) * 0.1);
      parts.push(
        `<circle cx="${r(px)}" cy="${r(py)}" r="${r(size)}" fill="${leaf}"/><circle cx="${r(px - 0.3 * ctx.lit)}" cy="${r(py - 0.3)}" r="${r(size * 0.55)}" fill="${leafLight}"/>`,
      );
      if (kind === 'tomato' && k % 2 === 0) {
        parts.push(`<circle cx="${r(px + 0.5)}" cy="${r(py + 0.3)}" r=".45" fill="#d4573b"/>`);
      }
      if (kind === 'blossom' && k % 2 === 1) {
        parts.push(
          `<circle cx="${r(px)}" cy="${r(py)}" r=".55" fill="${LILAC}"/><circle cx="${r(px)}" cy="${r(py)}" r=".2" fill="${GOLD}"/>`,
        );
      }
    }
  }
  return { box, svg: parts.join('') };
}

/** A balcony solar panel: dark cells catching the sky, a thin frame, gilded when upgraded. */
export function panelArt(ctx: ArtContext, x: number, y: number, level: number): Art {
  const frame = level >= 1 ? GOLD : '#d9d6cf';
  const svg = `<defs><linearGradient id="cells" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5d7d97"/><stop offset=".45" stop-color="#2f4a63"/><stop offset="1" stop-color="#253b50"/></linearGradient>
    <linearGradient id="sky" x1="${ctx.lit === 1 ? 0 : 1}" y1="0" x2="${ctx.lit === 1 ? 1 : 0}" y2="1"><stop offset="0" stop-color="${ctx.palette.sky}" stop-opacity=".75"/><stop offset=".5" stop-color="${ctx.palette.sky}" stop-opacity="0"/></linearGradient></defs>
    <rect x="${x + 0.5}" y="${y + 0.9}" width="11" height="8" rx=".8" fill="#3b3328" opacity=".25"/>
    <rect x="${x}" y="${y}" width="11" height="8" rx=".8" fill="url(#cells)" stroke="${frame}" stroke-width=".5"/>
    <path d="M${x} ${y + 2.67}h11M${x} ${y + 5.33}h11M${x + 2.75} ${y}v8M${x + 5.5} ${y}v8M${x + 8.25} ${y}v8" stroke="#9bb3c6" stroke-width=".18" opacity=".7"/>
    <rect x="${x}" y="${y}" width="11" height="8" rx=".8" fill="url(#sky)"/>`;
  return { box: [x - 0.5, y - 0.5, 12.5, 10], svg };
}

/** A terracotta pot of heliotrope seen from above: its rim, leaves, lilac petals, gold heart. */
export function potArt(ctx: ArtContext, x: number, y: number, level: number): Art {
  const petals = 3 + Math.min(level, 4);
  const parts = [
    `<defs><radialGradient id="pot" cx=".4" cy=".35"><stop offset="0" stop-color="#e09a74"/><stop offset="1" stop-color="#a95a3b"/></radialGradient></defs>`,
    `<circle cx="${x + 0.6}" cy="${y + 0.8}" r="3.6" fill="#3b3328" opacity=".22"/>`,
    `<circle cx="${x}" cy="${y}" r="3.5" fill="url(#pot)"/>`,
    `<circle cx="${x}" cy="${y}" r="2.8" fill="#5a3f2c"/>`,
    `<circle cx="${x}" cy="${y}" r="2.6" fill="${ctx.palette.foliage}"/>`,
  ];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    parts.push(
      `<ellipse cx="${r(x + Math.cos(a) * 1.5)}" cy="${r(y + Math.sin(a) * 1.5)}" rx="1.3" ry=".7" transform="rotate(${r((a * 180) / Math.PI)} ${r(x + Math.cos(a) * 1.5)} ${r(y + Math.sin(a) * 1.5)})" fill="${mix(ctx.palette.foliage, '#c8e0a8', 0.35)}"/>`,
    );
  }
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    parts.push(
      `<circle cx="${r(x + Math.cos(a) * 1.2)}" cy="${r(y + Math.sin(a) * 1.2)}" r="1" fill="${LILAC}"/><circle cx="${r(x + Math.cos(a) * 1.2 - 0.25)}" cy="${r(y + Math.sin(a) * 1.2 - 0.25)}" r=".4" fill="#dccbee"/>`,
    );
  }
  parts.push(`<circle cx="${x}" cy="${y}" r=".75" fill="${GOLD}"/>`);
  return { box: [x - 4.5, y - 4.5, 9.5, 9.5], svg: parts.join('') };
}

/**
 * A glass greenhouse on a former waste ground: a vaulted roof whose ribs catch the light, rows
 * of plants seen through the glass, warm inside once upgraded.
 */
export function greenhouseArt(ctx: ArtContext, box: Box, level: number): Art {
  const [x, y, w, h] = box;
  const ix = x + 4;
  const iy = y + 4;
  const iw = w - 8;
  const ih = h - 8;
  const ribs = 3 + Math.min(level, 5);
  const leaf = ctx.palette.foliage;
  const parts = [
    `<defs>
      <linearGradient id="vault" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4faf6" stop-opacity=".5"/><stop offset=".46" stop-color="#bcd8d2" stop-opacity=".12"/><stop offset=".54" stop-color="#5f8f88" stop-opacity=".22"/><stop offset="1" stop-color="#d8ebe4" stop-opacity=".3"/></linearGradient>
      <radialGradient id="warm" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="${GOLD_SOFT}" stop-opacity=".55"/><stop offset="1" stop-color="${GOLD_SOFT}" stop-opacity="0"/></radialGradient>
    </defs>`,
    // Gravel apron around the greenhouse.
    `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="4" fill="#ddd3bf"/>`,
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="#b9cfae"/>`,
    `<rect x="${ix + 2}" y="${iy + 2}" width="${iw - 4}" height="${ih - 4}" rx="5" fill="#8a6a4e" opacity=".35"/>`,
  ];
  // Rows of plants inside.
  const beds = Math.max(2, Math.floor(ih / 7));
  for (let i = 0; i < beds; i++) {
    const by = iy + 3 + ((ih - 6) / beds) * (i + 0.5);
    parts.push(
      `<path d="M${ix + 5} ${r(by)}H${ix + iw - 5}" stroke="${leaf}" stroke-width="3.4" stroke-linecap="round" opacity=".85"/><path d="M${ix + 5} ${r(by - 0.6)}H${ix + iw - 5}" stroke="${mix(leaf, '#c8e0a8', 0.5)}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray=".1 2.2" opacity=".9"/>`,
    );
  }
  if (level >= 2) {
    parts.push(`<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="url(#warm)"/>`);
  }
  parts.push(
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="url(#vault)"/>`,
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="7" fill="none" stroke="#f7f4ec" stroke-width="1.1"/>`,
    `<rect x="${ix + 1}" y="${iy + 1}" width="${iw - 2}" height="${ih - 2}" rx="6" fill="none" stroke="#6f958d" stroke-width=".4" opacity=".6"/>`,
  );
  for (let i = 0; i < ribs; i++) {
    const rx = ix + (iw / (ribs + 1)) * (i + 1);
    parts.push(
      `<path d="M${r(rx)} ${iy}V${iy + ih}" stroke="#f7f4ec" stroke-width=".45" opacity=".9"/>`,
    );
  }
  parts.push(
    `<path d="M${ix} ${y + h / 2}H${ix + iw}" stroke="#ffffff" stroke-width=".9"/>`,
    `<path d="M${ix} ${y + h / 2 + 0.8}H${ix + iw}" stroke="#7f9c95" stroke-width=".4" opacity=".6"/>`,
  );
  return { box, svg: parts.join('') };
}

/** A grey tower turned vertical farm: stepped terraces planted at their rims around an atrium. */
export function farmArt(ctx: ArtContext, box: Box, level: number): Art {
  const [x, y, w, h] = box;
  const terraces = Math.min(3 + Math.min(level, 3), Math.floor(Math.min(w, h) / 11));
  const leaf = ctx.palette.foliage;
  const parts = [
    `<defs>${litGradient('deck', mix(ctx.palette.foliageLight, '#ffffff', 0.25), mix(ctx.palette.foliageLight, ctx.palette.foliage, 0.35), ctx.lit)}
      <linearGradient id="fglass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f7f2"/><stop offset="1" stop-color="#a9c4c0"/></linearGradient></defs>`,
  ];
  for (let i = 0; i < terraces; i++) {
    const inset = i * 5;
    const tx = x + inset;
    const ty = y + inset;
    const tw = w - inset * 2;
    const th = h - inset * 2;
    const rx = Math.max(1.5, 5 - i);
    parts.push(
      `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="${rx}" fill="${i % 2 ? 'url(#fglass)' : 'url(#deck)'}"/>`,
      // The planted rim of each terrace, with leaves spilling over.
      `<rect x="${tx + 1.3}" y="${ty + 1.3}" width="${tw - 2.6}" height="${th - 2.6}" rx="${rx}" fill="none" stroke="${leaf}" stroke-width="2"/>`,
      `<rect x="${tx + 1.3}" y="${ty + 1.3}" width="${tw - 2.6}" height="${th - 2.6}" rx="${rx}" fill="none" stroke="${mix(leaf, '#c8e0a8', 0.5)}" stroke-width="1.1" stroke-dasharray=".1 1.6" stroke-linecap="round"/>`,
      `<rect x="${tx + 2.6}" y="${ty + 2.6}" width="${tw - 5.2}" height="${th - 5.2}" rx="${rx}" fill="none" stroke="#3b3328" stroke-width=".4" opacity=".18"/>`,
    );
    if (level >= 2 && i % 2 === 0) {
      parts.push(
        `<rect x="${tx + 1.3}" y="${ty + 1.3}" width="${tw - 2.6}" height="${th - 2.6}" rx="${rx}" fill="none" stroke="${LILAC}" stroke-width=".8" stroke-dasharray=".1 4.3" stroke-linecap="round"/>`,
      );
    }
  }
  const [cx, cy] = centre(box);
  parts.push(
    `<rect x="${cx - 5.5}" y="${cy - 5.5}" width="11" height="11" rx="2" fill="url(#fglass)" stroke="#f7f4ec" stroke-width=".6"/><path d="M${cx} ${cy - 5.5}v11M${cx - 5.5} ${cy}h11" stroke="#f7f4ec" stroke-width=".4"/>`,
  );
  return { box, svg: parts.join('') };
}

/** One heliostat: a mirror catching the sky, gilded once upgraded, on its post. */
export function mirrorArt(ctx: ArtContext, gilded: boolean): Art {
  const svg = `<defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${ctx.palette.sky}"/><stop offset="1" stop-color="#5f8496"/></linearGradient></defs>
    <rect x="-4.6" y="-1.9" width="9.2" height="3.8" rx=".6" fill="url(#m)" stroke="${gilded ? GOLD : '#9fb0b6'}" stroke-width=".5"/>
    <path d="M-4.4 0h8.8" stroke="#ffffff" stroke-width=".2" opacity=".6"/>`;
  return { box: [-5.2, -2.5, 10.4, 5], svg };
}

/** The mirror field's tower, its receiver glowing gold. */
export function towerArt(): Art {
  const { x, y } = MIRROR_TOWER;
  const svg = `<defs><radialGradient id="rcv" cx=".4" cy=".4"><stop offset="0" stop-color="#fff4d6"/><stop offset=".6" stop-color="${GOLD}"/><stop offset="1" stop-color="#b27422"/></radialGradient></defs>
    <circle cx="${x + 1.5}" cy="${y + 1.8}" r="6" fill="#3b3328" opacity=".25"/>
    <circle cx="${x}" cy="${y}" r="5.8" fill="#e8e2d6" stroke="${GOLD}" stroke-width=".7"/>
    <circle cx="${x}" cy="${y}" r="3.6" fill="url(#rcv)"/>`;
  return { box: [x - 7, y - 7, 15, 15], svg };
}

/**
 * A street tree from above: a lobed crown in three depths of leaves, lit from the sun's side,
 * with leaf texture. Lime, plane and flowering cherry alternate along the streets.
 */
export function treeArt(ctx: ArtContext, kind: number, radius: number, level: number): Art {
  const { foliage, foliageLight } = ctx.palette;
  const lobes = kind === 1 ? 7 : 6;
  const flowering = kind === 2 ? level >= 1 : level >= 2;
  const base =
    kind === 0 ? foliage : kind === 1 ? mix(foliage, '#5d8a4a', 0.4) : shade(foliage, -0.05);
  const mid = mix(base, foliageLight, 0.35);
  const light = mix(base, foliageLight, 0.75);
  const lx = -0.3 * ctx.lit * radius;
  const ly = -0.3 * radius;
  const parts = [
    `<defs><radialGradient id="crown" cx="${0.5 - 0.18 * ctx.lit}" cy=".32" r=".7"><stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${shade(base, -0.15)}"/></radialGradient></defs>`,
  ];
  const lobeR = radius * (kind === 1 ? 0.52 : 0.58);
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + kind;
    parts.push(
      `<circle cx="${r(Math.cos(a) * radius * 0.45)}" cy="${r(Math.sin(a) * radius * 0.45)}" r="${r(lobeR)}" fill="${shade(base, -0.12)}"/>`,
    );
  }
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + kind + 0.4;
    parts.push(
      `<circle cx="${r(Math.cos(a) * radius * 0.36)}" cy="${r(Math.sin(a) * radius * 0.36)}" r="${r(lobeR * 0.95)}" fill="url(#crown)"/>`,
    );
  }
  // Leaf clusters catching the light.
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4 + kind;
    const d = radius * (0.15 + ((i * 37) % 10) / 22);
    const cx = Math.cos(a) * d + lx * 0.5;
    const cy = Math.sin(a) * d + ly * 0.5;
    parts.push(
      `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(radius * 0.13)}" fill="${light}" opacity=".7"/>`,
    );
  }
  parts.push(
    `<circle cx="${r(lx)}" cy="${r(ly)}" r="${r(radius * 0.22)}" fill="#fffbe8" opacity=".35"/>`,
  );
  if (flowering) {
    const petal = kind === 2 ? '#f2c4d6' : LILAC;
    for (let i = 0; i < 11; i++) {
      const a = i * 2.1 + kind;
      const d = radius * (0.25 + ((i * 53) % 10) / 16);
      parts.push(
        `<circle cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" r="${r(Math.max(0.55, radius * 0.1))}" fill="${petal}"/>`,
      );
    }
  }
  const pad = radius * 1.15;
  return { box: [-pad, -pad, pad * 2, pad * 2], svg: parts.join('') };
}

/** A petal pointing up from (0, 0), `length` long. */
function petalPath(length: number, width: number): string {
  return `M0 0C${r(-width)} ${r(-length * 0.35)} ${r(-width * 0.6)} ${r(-length * 0.9)} 0 ${r(-length)}C${r(width * 0.6)} ${r(-length * 0.9)} ${r(width)} ${r(-length * 0.35)} 0 0Z`;
}

/** One ring of the living arcology: eight planted or glazed petal-shaped terraces. */
export function arcologyRingArt(ctx: ArtContext, ring: number, level: number): Art {
  const length = 56 - ring * 9;
  const glass = ring % 2 === 1;
  const leaf = ctx.palette.foliage;
  const parts = [
    `<defs><linearGradient id="t" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${glass ? '#cfe3df' : mix(leaf, ctx.palette.foliageLight, 0.55)}"/><stop offset="1" stop-color="${glass ? '#f4f8f4' : mix(leaf, ctx.palette.foliageLight, 0.85)}"/></linearGradient></defs>`,
  ];
  for (let k = 0; k < 8; k++) {
    const angle = (k * 360) / 8 + (ring % 2) * 22.5;
    parts.push(
      `<g transform="rotate(${angle})"><path d="${petalPath(length, length * 0.42)}" fill="url(#t)" stroke="${glass ? '#ffffff' : leaf}" stroke-width=".8"/><path d="M0 -4V${r(-length + 6)}" stroke="${glass ? '#ffffff' : leaf}" stroke-width=".5" opacity=".6"/></g>`,
    );
  }
  if (ring === 0 && level >= 1) {
    for (let k = 0; k < 8; k++) {
      const a = ((k * 45 - 90) * Math.PI) / 180;
      parts.push(
        `<circle cx="${r(Math.cos(a) * 44)}" cy="${r(Math.sin(a) * 44)}" r="2.4" fill="${LILAC}"/>`,
      );
    }
  }
  const pad = length + 2;
  return { box: [-pad, -pad, pad * 2, pad * 2], svg: parts.join('') };
}

/** The courtyard planter around the heliotrope's pot: a stone ring of blooms. */
export function planterArt(blooms: number): Art {
  const { x, y } = PLANTER;
  const petals = 6 + blooms * 3;
  const parts = [
    `<ellipse cx="${x + 0.6}" cy="${y + 1}" rx="17.5" ry="11" fill="#3b3328" opacity=".16"/>`,
    `<ellipse cx="${x}" cy="${y}" rx="17.5" ry="11" fill="#e9dfcc" stroke="#cbbb9f" stroke-width=".7"/>`,
    `<ellipse cx="${x}" cy="${y}" rx="15.2" ry="9" fill="#6e533d"/>`,
    `<ellipse cx="${x}" cy="${y}" rx="15.2" ry="9" fill="none" stroke="#2f6b4f" stroke-width="2.2" opacity=".85"/>`,
  ];
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const px = x + Math.cos(a) * 14;
    const py = y + Math.sin(a) * 8.3;
    const fill = i % 3 === 2 ? GOLD : LILAC;
    parts.push(
      `<circle cx="${r(px)}" cy="${r(py)}" r="${r(1.5 + blooms * 0.12)}" fill="${fill}"/><circle cx="${r(px - 0.4)}" cy="${r(py - 0.4)}" r=".5" fill="#ffffff" opacity=".55"/>`,
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
