// Pure helpers of the enriched WebGL map (docs/game-design.md §10.4): the sun that moves the
// shadows, the shadow shapes, the palette of each phase and season, the camera glide and the
// texture sharpness. Framework-free and Pixi-free, so they stay testable.
import type { ParcelId } from '../../game/parcels';
import type { Phase, VisualSeason } from '../../game/phases';
import type { Box, Camera } from '../neighbourhood';

/** Parcels (§6.1) the WebGL map draws itself; it takes the others from the SVG scene (sources.tsx). */
export const PIXI_PARCELS: readonly ParcelId[] = ['river', 'livingRoofs'];

/** Shadow offset for one storey, in world units: points away from the sun. */
export interface Sun {
  x: number;
  y: number;
}

/**
 * The sun of each phase, as in the SVG scene: dawn light from the east-south-east, noon from
 * the south, late afternoon from the west. Same offsets per storey as the CSS `--sun-x/y`.
 */
export const PHASE_SUN: Record<Phase, Sun> = {
  1: { x: -2.2, y: 1.4 },
  2: { x: 0.6, y: 1.2 },
  3: { x: 2.4, y: 1.6 },
};

/** Seconds of one slow swing of the sun around its phase position. */
export const SUN_PERIOD = 90;

/**
 * The sun at `seconds` of play: it swings slowly around the phase's position (a few degrees,
 * shadows lengthening and shortening a little), so the city feels lit by a real afternoon.
 * With reduced motion it stays still.
 */
export function sunAt(phase: Phase, seconds: number, reduced: boolean): Sun {
  const base = PHASE_SUN[phase];
  if (reduced) return base;
  const swing = Math.sin((seconds / SUN_PERIOD) * Math.PI * 2);
  const angle = Math.atan2(base.y, base.x) + swing * 0.14;
  const length = Math.hypot(base.x, base.y) * (1 + swing * 0.08);
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
}

/** Moves `from` towards `to` by the part of the way `dt` seconds of a `tau` easing cover. */
export function approachSun(from: Sun, to: Sun, dt: number, tau = 1.2): Sun {
  const k = 1 - Math.exp(-dt / tau);
  return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
}

/**
 * The shadow a box `height` storeys high casts on the ground under `sun`: the convex hull of
 * its footprint and the footprint moved along the sun. Flat list of points, clockwise.
 */
export function shadowPolygon([x, y, w, h]: Box, height: number, sun: Sun): number[] {
  const dx = sun.x * height;
  const dy = sun.y * height;
  const corners: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const points = [...corners, ...corners.map(([px, py]): [number, number] => [px + dx, py + dy])];
  return hull(points).flat();
}

/** Convex hull (monotone chain), clockwise in screen coordinates (y down). */
export function hull(points: [number, number][]): [number, number][] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Colours of the scene for a phase and a visual season, as numbers for Pixi and hex for SVG. */
export interface Palette {
  foliage: string;
  foliageLight: string;
  /** Warm light washing over the map from the sun's side, and its far side. */
  light: number;
  lightAlpha: number;
  shade: number;
  shadeAlpha: number;
  /** Colour of the sun's bloom and of the pollen. */
  sun: number;
  /** Sky reflected by water and glass. */
  sky: string;
  water: string;
  /** How dark the shadows are. */
  shadowAlpha: number;
}

const PHASE_LIGHT: Record<Phase, Pick<Palette, 'light' | 'lightAlpha' | 'sun' | 'sky'>> = {
  1: { light: 0xf6c4b4, lightAlpha: 0.32, sun: 0xffd9b8, sky: '#f3dccf' },
  2: { light: 0xffecba, lightAlpha: 0.28, sun: 0xfff1c8, sky: '#d9ece8' },
  3: { light: 0xf5b46e, lightAlpha: 0.34, sun: 0xffd08a, sky: '#f4d2a4' },
};

const SEASON_TINT: Record<VisualSeason, Partial<Palette>> = {
  spring: { foliage: '#3d7a56', foliageLight: '#e8b8d0' },
  summer: { light: 0xf8d58d, lightAlpha: 0.36 },
  autumn: { light: 0xf2c49a, lightAlpha: 0.36, foliage: '#a65f3a', foliageLight: '#e2a04a' },
  winter: {
    light: 0xdfe6ea,
    lightAlpha: 0.4,
    foliage: '#4c6b5e',
    foliageLight: '#dde7e4',
    sky: '#e4ecef',
    shadowAlpha: 0.26,
  },
};

export function palette(phase: Phase, season: VisualSeason | null): Palette {
  return {
    foliage: '#2f6b4f',
    foliageLight: '#8fae8b',
    shade: 0x6a5a8a,
    shadeAlpha: 0.1,
    water: '#3f8a92',
    shadowAlpha: 0.4,
    ...PHASE_LIGHT[phase],
    ...(season ? SEASON_TINT[season] : {}),
  };
}

/** Same easing as the SVG camera's CSS transition: cubic-bezier(0.65, 0, 0.35, 1). */
export function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
}

/** Seconds the camera takes to glide from one view to the next, like the SVG one. */
export const CAMERA_GLIDE = 1.1;

/** Camera part of the way (`t`, 0 to 1, already eased) from `from` to `to`. */
export function blendCamera(from: Camera, to: Camera, t: number): Camera {
  // Zoom in log space so the glide feels even whatever the zoom.
  const scale = Math.exp(Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * t);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, scale };
}

/** Largest texture side every WebGL device draws. */
export const MAX_TEXTURE = 4096;

/**
 * Pixels per world unit of the drawings: sharp at the camera's zoom on this screen, rounded up
 * to a step so a small resize does not redraw them, and bounded so a world-sized texture fits.
 */
export function textureResolution(cameraScale: number, pixelRatio: number, worldSide: number) {
  const wanted = Math.ceil(cameraScale * Math.min(pixelRatio, 2.5) * 2) / 2;
  return Math.max(1, Math.min(wanted, 8, Math.floor((MAX_TEXTURE / worldSide) * 2) / 2));
}

/**
 * Size of a newly built element during its entrance (`t` in seconds): it grows past its size
 * and settles, like a bud opening. 1 once the entrance is over.
 */
export function appearScale(t: number, duration = 0.9): number {
  if (t >= duration) return 1;
  const p = Math.max(0, t / duration);
  // Damped spring from 0.4 to 1.
  return 1 - 0.6 * Math.exp(-5 * p) * Math.cos(p * Math.PI * 2.2);
}
