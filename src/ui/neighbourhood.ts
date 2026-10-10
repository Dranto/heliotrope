// Layout and pure helpers of the top-down neighbourhood scene (docs/game-design.md §6, §10.4).
// Framework-free so the mapping from game state to what the map shows stays testable.
import type { GeneratorId } from '../game/generators';
import type { Phase } from '../game/phases';
import { CLICK_UPGRADE_IDS, GENERATOR_UPGRADE_TIERS, type UpgradeId } from '../game/upgrades';

/** The map is drawn in a 600 × 450 world; the camera frames part of it. */
export const WORLD = { width: 600, height: 450 } as const;

/** Units owned at which the next element of a generator appears on the map. */
export const APPEAR_THRESHOLDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 30, 35, 40, 45, 50, 60, 70, 80, 90,
  100, 115, 130, 150, 175, 200, 250, 300, 350, 400, 500,
] as const;

/**
 * How many of a generator's `slots` the map shows for `owned` units. Every early unit adds an
 * element; later ones keep adding elements at wider and wider steps, so a purchase still changes
 * the picture late in a Season. `density` elements appear per step (trees come in groves).
 */
export function visibleElements(owned: number, slots: number, density = 1): number {
  let steps = 0;
  for (const threshold of APPEAR_THRESHOLDS) {
    if (owned < threshold) break;
    steps++;
  }
  return Math.min(slots, steps * density);
}

/** Number of ×2 upgrades (§5.1) bought for a generator: each one refines its elements. */
export function upgradeLevel(upgrades: readonly UpgradeId[], id: GeneratorId): number {
  let level = 0;
  for (let tier = 1; tier <= GENERATOR_UPGRADE_TIERS.length; tier++) {
    if (upgrades.includes(`${id}.${tier}` as UpgradeId)) level++;
  }
  return level;
}

/** Number of click upgrades (§5.2) bought: the courtyard heliotrope blooms with each. */
export function clickLevel(upgrades: readonly UpgradeId[]): number {
  return CLICK_UPGRADE_IDS.filter((id) => upgrades.includes(id)).length;
}

/** The three views of the map (§6): the home courtyard, the neighbourhood, the whole city. */
export type View = Phase;
export const VIEWS: readonly View[] = [1, 2, 3];

/**
 * Part of the world each view keeps fully in sight, whatever the shape of the screen: the home
 * block and its streets, the blocks around it, the whole city.
 */
export const VIEW_FRAMES: Record<View, Box> = {
  1: [204, 158, 214, 156],
  2: [96, 56, 430, 338],
  3: [0, 0, 600, 450],
};

export interface Camera {
  /** World point at the centre of the view. */
  x: number;
  y: number;
  scale: number;
}

/** View each generator needs so that its first elements are in sight. */
const GENERATOR_RING: Record<GeneratorId, View> = {
  pot: 1,
  balconyPanel: 1,
  rooftopGarden: 1,
  greenhouse: 2,
  verticalFarm: 2,
  mirrorPlant: 3,
  urbanCanopy: 2,
  arcology: 3,
};

/**
 * The furthest view the player can switch to. It follows the phase, and opens early when the
 * player owns a generator whose place is further out, so a purchase is never built out of reach.
 */
export function furthestView(phase: Phase, generators: Record<GeneratorId, number>): View {
  let level: View = phase;
  for (const id of Object.keys(GENERATOR_RING) as GeneratorId[]) {
    if (generators[id] > 0 && GENERATOR_RING[id] > level) level = GENERATOR_RING[id];
  }
  return level;
}

/** Room taken over the map by the flower and the controls, in screen units. */
export interface Insets {
  top: number;
  left: number;
  bottom: number;
}

/**
 * Camera that shows the whole frame of `view` in a `width` × `height` screen, as large as it
 * fits beside `insets`. The rest of the screen shows the city around it.
 */
export function fitCamera(
  view: View,
  width: number,
  height: number,
  insets: Insets = { top: 0, left: 0, bottom: 0 },
): Camera {
  const [fx, fy, fw, fh] = VIEW_FRAMES[view];
  // An inset only counts when keeping it free still leaves most of the screen to the frame.
  const left = insets.left < width * 0.4 ? insets.left : 0;
  const top = insets.top < height * 0.2 ? insets.top : 0;
  const bottom = insets.bottom + top < height * 0.45 ? insets.bottom : 0;
  const scale = Math.min((width - left) / fw, (height - top - bottom) / fh);
  // Centre the frame in the free area, then express it as the world point at the screen centre.
  const freeX = left + (width - left) / 2;
  const freeY = top + (height - top - bottom) / 2;
  return {
    x: round(fx + fw / 2 - (freeX - width / 2) / scale),
    y: round(fy + fh / 2 - (freeY - height / 2) / scale),
    scale: Math.round(scale * 1000) / 1000,
  };
}

/** Width of the clickable heliotrope on screen, whatever the view: never too small to touch. */
export const FLOWER_SIZE = { min: 136, perScale: 75, max: 290, share: 0.24 } as const;
/** Height of the flower drawing for its width (its arch is 200 × 260). */
const FLOWER_RATIO = 260 / 200;
/** Part of the drawing's height above the bottom of its pot. */
const POT_BASE = 0.96;

/**
 * Where the flower stands on screen: its pot on the courtyard planter, its arch rising above the
 * home block, sized with the zoom so its sprigs and glow keep room to show. `x`, `y` is the
 * drawing's top-left corner in screen units.
 */
export function flowerFrame(
  camera: Camera,
  width: number,
  height: number,
  at: { x: number; y: number },
): { x: number; y: number; width: number } {
  // On a narrow map the smallest flower still leaves most of the city in sight.
  const min = Math.min(FLOWER_SIZE.min, width * FLOWER_SIZE.share);
  const size = Math.min(FLOWER_SIZE.max, Math.max(min, camera.scale * FLOWER_SIZE.perScale));
  const sx = width / 2 + (at.x - camera.x) * camera.scale;
  const sy = height / 2 + (at.y - camera.y) * camera.scale;
  return {
    x: round(sx - size / 2),
    y: round(sy - size * FLOWER_RATIO * POT_BASE),
    width: Math.round(size),
  };
}

/** SVG transform that frames `camera` in a `width` × `height` view. */
export function cameraTransform(
  { x, y, scale }: Camera,
  width: number = WORLD.width,
  height: number = WORLD.height,
): string {
  const tx = width / 2 - x * scale;
  const ty = height / 2 - y * scale;
  return `translate(${round(tx)}px, ${round(ty)}px) scale(${scale})`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A rectangle of the map: x, y, width, height. */
export type Box = readonly [number, number, number, number];

/** A grey building of the base city, with its height in storeys (for its shadow). */
export interface Building {
  box: Box;
  storeys: number;
}

/** Streets: two avenues across, two streets down. */
export const STREETS = {
  horizontal: [150, 300] as const,
  vertical: [196, 404] as const,
  width: 22,
};

/** City blocks between the streets. */
export const BLOCKS: Box[] = [0, 172, 322].flatMap((y, row) =>
  [0, 218, 426].map((x, col): Box => [x, y, [196, 186, 174][col]!, [150, 128, 128][row]!]),
);

/** The player's home block: buildings around a courtyard with the heliotrope planter. */
export const COURTYARD: Box = [260, 214, 102, 44];
export const PLANTER = { x: 311, y: 236 } as const;

export const BUILDINGS: Building[] = [
  // Home block.
  { box: [226, 180, 170, 30], storeys: 3 },
  { box: [226, 262, 170, 30], storeys: 3 },
  { box: [226, 214, 30, 44], storeys: 2 },
  { box: [366, 214, 30, 44], storeys: 2 },
  // West block.
  { box: [8, 180, 82, 56], storeys: 4 },
  { box: [100, 180, 88, 46], storeys: 3 },
  { box: [8, 244, 62, 48], storeys: 2 },
  // East block.
  { box: [434, 180, 56, 52], storeys: 3 },
  // North block.
  { box: [226, 8, 74, 62], storeys: 5 },
  { box: [308, 8, 88, 52], storeys: 4 },
  // North-east block.
  { box: [434, 8, 86, 56], storeys: 3 },
  { box: [528, 8, 64, 82], storeys: 5 },
  { box: [434, 72, 86, 70], storeys: 2 },
  { box: [528, 98, 64, 44], storeys: 2 },
  // South block.
  { box: [226, 408, 170, 34], storeys: 2 },
  // South-west block.
  { box: [8, 330, 92, 70], storeys: 3 },
  { box: [108, 330, 80, 50], storeys: 4 },
  { box: [8, 408, 180, 34], storeys: 1 },
];

/** Grey towers that become vertical farms (§4, generator 5), in order. */
export const FARM_SITES: Building[] = [
  { box: [328, 70, 68, 72], storeys: 6 },
  { box: [434, 240, 54, 52], storeys: 5 },
  { box: [324, 330, 72, 70], storeys: 4 },
];

/** Waste ground ("friches") that greenhouses (§4, generator 4) restore, in order. */
export const GREENHOUSE_SITES: Box[] = [
  [226, 80, 94, 62],
  [226, 330, 90, 70],
  [78, 244, 110, 48],
];

/** Car parks: the south-east one becomes the mirror field. */
export const CAR_PARKS: Box[] = [
  [498, 180, 94, 112],
  [434, 330, 158, 112],
];

/** The waste ground where the living arcology (§4, generator 8) rises. */
export const ARCOLOGY_SITE: Box = [8, 8, 180, 134];

/** Roofs that turn into kitchen gardens (§4, generator 3), nearest to home first. */
export const GARDEN_ROOFS: Box[] = [
  [230, 184, 76, 22],
  [230, 266, 76, 22],
  [229, 217, 24, 38],
  [369, 217, 24, 38],
  [104, 184, 80, 38],
  [438, 184, 48, 44],
  [12, 184, 74, 48],
  [438, 76, 78, 62],
  [112, 334, 72, 42],
  [230, 412, 162, 26],
];

/** Balcony solar panels (§4, generator 2): home roofs first, then a neighbour's. */
export const PANEL_SPOTS: [number, number][] = [
  [314, 186],
  [328, 186],
  [342, 186],
  [356, 186],
  [314, 278],
  [328, 278],
  [342, 278],
  [356, 278],
  [370, 186],
  [370, 278],
  [534, 16],
  [548, 16],
  [562, 16],
  [576, 16],
  [534, 28],
  [548, 28],
];

/** Potted heliotropes (§4, generator 1) around the courtyard, clear of the heliotrope's bed. */
export const POT_SPOTS: [number, number][] = [266, 278, 290, 332, 344, 356].flatMap((x) => [
  [x, 220] as [number, number],
  [x, 252] as [number, number],
]);

/** The mirror field (§4, generator 6): a central tower and rings of heliostats. */
export const MIRROR_TOWER = { x: 513, y: 386 } as const;

export interface Mirror {
  x: number;
  y: number;
  /** Degrees, so the mirror faces the tower. */
  angle: number;
}

export const MIRRORS: Mirror[] = [20, 32, 44, 56].flatMap((radius, ring) => {
  const count = 8 + ring * 6;
  const mirrors: Mirror[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + ring * 0.3;
    const x = MIRROR_TOWER.x + Math.cos(a) * radius * 1.35;
    const y = MIRROR_TOWER.y + Math.sin(a) * radius;
    const [px, py, pw, ph] = CAR_PARKS[1]!;
    if (x < px + 6 || x > px + pw - 6 || y < py + 5 || y > py + ph - 5) continue;
    mirrors.push({ x: round(x), y: round(y), angle: round((a * 180) / Math.PI + 90) });
  }
  return mirrors;
});

export interface Tree {
  x: number;
  y: number;
  r: number;
}

/**
 * Street trees of the urban canopy (§4, generator 7), along both kerbs of every street, ordered
 * from the home block outwards so the canopy spreads from the courtyard.
 */
export const TREES: Tree[] = (() => {
  const trees: Tree[] = [];
  const { horizontal, vertical, width } = STREETS;
  const crossing = (value: number, streets: readonly number[]) =>
    streets.some((s) => value > s - 8 && value < s + width + 8);
  for (const y of horizontal) {
    for (let x = 12; x < WORLD.width; x += 30) {
      if (crossing(x, vertical)) continue;
      trees.push({ x, y: y + 4, r: 0 }, { x: x + 15, y: y + width - 4, r: 0 });
    }
  }
  for (const x of vertical) {
    for (let y = 14; y < WORLD.height; y += 30) {
      if (crossing(y, horizontal)) continue;
      trees.push({ x: x + 4, y: y + 15, r: 0 }, { x: x + width - 4, y, r: 0 });
    }
  }
  return trees
    .map((tree, i) => ({ ...tree, r: 7 + ((i * 7) % 4) }))
    .sort((a, b) => distance(a) - distance(b));
})();

function distance({ x, y }: { x: number; y: number }): number {
  return Math.hypot(x - PLANTER.x, y - PLANTER.y);
}

/** Centre of a box, for the appearing ring. */
export function centre([x, y, w, h]: Box): [number, number] {
  return [x + w / 2, y + h / 2];
}
