// The courtyard garden (docs/game-design.md §9.7, M14): a few beds at the foot of the
// heliotrope where the player sows a crop, watches it grow in real time and harvests it with a
// click. Crops grow online and offline alike and never wilt: they wait for the player. Two
// different crops side by side sometimes give a new variety for the seed bank, a lasting bonus.
// Names live in src/i18n, the drawings in src/ui.
import { unlockAchievements } from './achievements';
import { earnWater, isBioregionOpen, waterPerSecond } from './bioregion';
import { factorOf } from './bonuses';
import { effectSeconds } from './butterfly';
import { effectFactor } from './effects';
import { earnLight } from './light';
import { lightPerSecond } from './production';
import { nextRandom } from './random';
import { VARIETIES, type CropId, type VarietyId } from './seedBank';
import type { GameState } from './state';

export { CROP_IDS, VARIETIES, VARIETY_IDS, type CropId, type VarietyId } from './seedBank';

export interface CropDef {
  id: CropId;
  /** Seconds of growth before it can be harvested. */
  seconds: number;
}

export const CROPS: Record<CropId, CropDef> = {
  radish: { id: 'radish', seconds: 3 * 60 },
  sunflower: { id: 'sunflower', seconds: 20 * 60 },
  beans: { id: 'beans', seconds: 60 * 60 },
  squash: { id: 'squash', seconds: 4 * 3600 },
};

/** Radishes: a puff of Light worth this many seconds of production (at least RADISH_MIN). */
export const RADISH_SECONDS = 120;
export const RADISH_MIN = 50;
/** Sunflowers call the Golden Butterfly: it comes within this many seconds. */
export const SUNFLOWER_BUTTERFLY_SECONDS = 10;
/** Squashes: Light and Water worth this many seconds of production. */
export const SQUASH_SECONDS = 30 * 60;

/** Baskets each harvest fills for the great works (§6.6, M20): the longer the crop, the more. */
export const BASKETS: Record<CropId, number> = { radish: 1, sunflower: 2, beans: 3, squash: 5 };

/** Beds in the courtyard: three at first, one more for each step of the game reached. */
export const MAX_PLOTS = 6;

/** Chance that harvesting a crop next to a different, ripe or growing one gives their variety. */
export const VARIETY_CHANCE = 0.25;

export interface Plot {
  /** What grows in the bed; null when it is bare. */
  crop: CropId | null;
  /** Seconds of growth so far. */
  grown: number;
}

export interface GardenState {
  /** Every bed, the locked ones bare; MAX_PLOTS long. Kept across Seasons and Cycles. */
  plots: Plot[];
  /** Harvests over the whole game (Milestones). */
  harvests: number;
  /** Varieties of the seed bank, in order of discovery. */
  varieties: VarietyId[];
  /** Baskets of harvests kept for the great works (§6.6, M20), spent there. */
  baskets: number;
}

export function createGardenState(): GardenState {
  return {
    plots: Array.from({ length: MAX_PLOTS }, () => ({ crop: null, grown: 0 })),
    harvests: 0,
    varieties: [],
    baskets: 0,
  };
}

export function isCropId(value: unknown): value is CropId {
  return typeof value === 'string' && Object.hasOwn(CROPS, value);
}

/** The garden opens with the first heliotrope in a pot. */
export function isGardenOpen(state: GameState): boolean {
  return state.generators.pot > 0 || state.seasons > 0 || state.garden.harvests > 0;
}

/**
 * Crops the player can sow: radishes from the start, sunflowers once ten pots stand around the
 * courtyard, climbing beans from the second Season, squashes once the Bioregion is open.
 */
export function isCropUnlocked(state: GameState, id: CropId): boolean {
  switch (id) {
    case 'radish':
      return true;
    case 'sunflower':
      return state.generators.pot >= 10 || state.seasons > 0;
    case 'beans':
      return state.seasons > 0;
    case 'squash':
      return isBioregionOpen(state);
  }
}

/**
 * Beds open: three, then one more after the first Season, with four parcels restored, and once
 * the Bioregion is open.
 */
export function openPlots(state: GameState): number {
  return (
    3 +
    Number(state.seasons > 0) +
    Number(state.parcels.length >= 4) +
    Number(isBioregionOpen(state))
  );
}

/**
 * How fast crops grow: the summer shower waters them (×2, §9.6), and the rain gardens parcel
 * (§6.1) keeps the soil moist (×1.25).
 */
export function growthSpeed(state: GameState): number {
  const shower = effectFactor(state.effects, 'shower');
  const rain = state.parcels.includes('rainGardens') ? 1.25 : 1;
  return shower * rain * factorOf(state, 'gardenGrowth');
}

export function isRipe(plot: Plot): boolean {
  return plot.crop !== null && plot.grown >= CROPS[plot.crop].seconds;
}

/** Share of its growth a crop has done, from 0 to 1. */
export function plotGrowth(plot: Plot): number {
  return plot.crop === null ? 0 : Math.min(1, plot.grown / CROPS[plot.crop].seconds);
}

/** Seconds of play before a crop is ripe, at the speed in force now. */
export function secondsToRipe(state: GameState, plot: Plot): number {
  if (plot.crop === null) return 0;
  return Math.max(0, CROPS[plot.crop].seconds - plot.grown) / growthSpeed(state);
}

/** Move the garden forward by dtSeconds: every crop grows, none ever wilts. */
export function growGarden(state: GameState, dtSeconds: number): GameState {
  const { plots } = state.garden;
  if (!plots.some((p) => p.crop !== null && !isRipe(p))) return state;
  const step = dtSeconds * growthSpeed(state);
  return {
    ...state,
    garden: {
      ...state.garden,
      plots: plots.map((plot) =>
        plot.crop === null || isRipe(plot)
          ? plot
          : { ...plot, grown: Math.min(CROPS[plot.crop].seconds, plot.grown + step) },
      ),
    },
  };
}

export function canSow(state: GameState, index: number, crop: CropId): boolean {
  const plot = state.garden.plots[index];
  return (
    plot !== undefined &&
    index < openPlots(state) &&
    plot.crop === null &&
    isCropUnlocked(state, crop) &&
    isGardenOpen(state)
  );
}

function withPlot(state: GameState, index: number, plot: Plot): GameState {
  const plots = state.garden.plots.map((p, i) => (i === index ? plot : p));
  return { ...state, garden: { ...state.garden, plots } };
}

/** Player action: sow a crop in a bare bed. Sowing is free; only time ripens it. */
export function sow(state: GameState, index: number, crop: CropId): GameState {
  if (!canSow(state, index, crop)) return state;
  return withPlot(state, index, { crop, grown: 0 });
}

/** The variety two crops can give, if they differ. */
export function varietyOf(a: CropId, b: CropId): VarietyId | null {
  if (a === b) return null;
  const found = Object.values(VARIETIES).find(
    ({ parents: [x, y] }) => (x === a && y === b) || (x === b && y === a),
  );
  return found?.id ?? null;
}

/** Beds next to `index` in the courtyard: the beds sit three a side. */
export function neighbourPlots(index: number): number[] {
  const side = Math.floor(index / 3) * 3;
  return [index - 1, index + 1].filter((i) => i >= side && i < side + 3);
}

/** Varieties a harvest could give now: different crops in the beds beside it, not yet found. */
export function possibleVarieties(state: GameState, index: number): VarietyId[] {
  const crop = state.garden.plots[index]?.crop;
  if (!crop) return [];
  const found = new Set<VarietyId>();
  for (const i of neighbourPlots(index)) {
    const other = state.garden.plots[i]?.crop;
    const variety = other ? varietyOf(crop, other) : null;
    if (variety && !state.garden.varieties.includes(variety)) found.add(variety);
  }
  return [...found];
}

export type HarvestGain =
  | { kind: 'light'; light: number; water: number }
  | { kind: 'butterfly' }
  | { kind: 'effect'; seconds: number };

export interface HarvestResult {
  state: GameState;
  crop: CropId;
  gain: HarvestGain;
  /** The variety discovered by this harvest, if any. */
  variety: VarietyId | null;
}

/** Player action: harvest a ripe crop; the bed is left bare for the next sowing. */
export function harvest(state: GameState, index: number): HarvestResult | null {
  const plot = state.garden.plots[index];
  if (!plot || !isRipe(plot) || plot.crop === null) return null;
  const crop = plot.crop;
  let next = withPlot(state, index, { crop: null, grown: 0 });
  let gain: HarvestGain;
  switch (crop) {
    case 'radish': {
      const light = Math.max(RADISH_MIN, lightPerSecond(state) * RADISH_SECONDS);
      next = earnLight(next, light);
      gain = { kind: 'light', light, water: 0 };
      break;
    }
    case 'sunflower': {
      const { butterfly } = next;
      // A butterfly already on screen stays; otherwise the next one comes at once.
      if (butterfly.visible <= 0) {
        next = {
          ...next,
          butterfly: {
            ...butterfly,
            nextIn: Math.min(butterfly.nextIn, SUNFLOWER_BUTTERFLY_SECONDS),
          },
        };
      }
      gain = { kind: 'butterfly' };
      break;
    }
    case 'beans': {
      const seconds = effectSeconds(state, 'beans');
      next = {
        ...next,
        effects: [
          ...next.effects.filter((e) => e.kind !== 'beans'),
          { kind: 'beans', remaining: seconds },
        ],
      };
      gain = { kind: 'effect', seconds };
      break;
    }
    case 'squash': {
      const light = lightPerSecond(state) * SQUASH_SECONDS;
      const water = waterPerSecond(state) * SQUASH_SECONDS;
      next = earnWater(earnLight(next, light), water);
      gain = { kind: 'light', light, water };
      break;
    }
  }
  let variety: VarietyId | null = null;
  const possible = possibleVarieties(state, index);
  if (possible.length > 0) {
    const [roll, rngSeed] = nextRandom(next.rngSeed);
    next = { ...next, rngSeed };
    if (roll < VARIETY_CHANCE)
      variety = possible[Math.floor((roll / VARIETY_CHANCE) * possible.length)]!;
  }
  next = {
    ...next,
    garden: {
      ...next.garden,
      harvests: next.garden.harvests + 1,
      baskets: next.garden.baskets + BASKETS[crop],
      varieties: variety ? [...next.garden.varieties, variety] : next.garden.varieties,
    },
  };
  return { state: unlockAchievements(next), crop, gain, variety };
}

/** Keep only what a save can hold: known crops, growth within the crop's time. */
export function validPlots(raw: unknown): Plot[] {
  const plots = createGardenState().plots;
  if (!Array.isArray(raw)) return plots;
  return plots.map((bare, i) => {
    const plot = raw[i] as Record<string, unknown> | undefined;
    const crop = plot?.crop;
    const grown = plot?.grown;
    if (!isCropId(crop) || typeof grown !== 'number' || !Number.isFinite(grown) || grown < 0) {
      return bare;
    }
    return { crop, grown: Math.min(grown, CROPS[crop].seconds) };
  });
}
