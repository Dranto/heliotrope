import { lightPerSecond } from './production';
import type { GameState } from './state';

/**
 * Production curve of one Season (design doc §10.5): Light per second sampled every `step`
 * seconds of the Season, from its start. The step doubles whenever the curve is full, so a long
 * Season keeps its whole shape in a bounded number of points.
 */
export interface SeasonCurve {
  /** Season number, the first one being 1. */
  season: number;
  /** Seconds of the Season between two points. */
  step: number;
  points: number[];
}

/** Seconds between two points at the start of a Season. */
export const CURVE_FIRST_STEP = 30;
/** Points kept per Season before the step doubles. */
export const CURVE_MAX_POINTS = 120;
/** Seasons kept, the current one included. */
export const CURVES_KEPT = 6;

export function emptyCurve(season: number): SeasonCurve {
  return { season, step: CURVE_FIRST_STEP, points: [] };
}

/** Every other point, at twice the step. */
function halve(curve: SeasonCurve): SeasonCurve {
  return {
    ...curve,
    step: curve.step * 2,
    points: curve.points.filter((_, i) => i % 2 === 0),
  };
}

/**
 * Add the points due by `state.seasonSeconds` to the current Season's curve, all at the present
 * production: a long offline catch-up draws a flat stretch rather than inventing a shape.
 */
export function recordProduction(state: GameState): GameState {
  const curves = state.history;
  let curve = curves[curves.length - 1];
  if (!curve || curve.points.length * curve.step > state.seasonSeconds) return state;
  const rate = lightPerSecond(state);
  let points = curve.points;
  while (points.length * curve.step <= state.seasonSeconds) {
    if (points.length >= CURVE_MAX_POINTS) {
      curve = halve({ ...curve, points });
      points = curve.points;
      continue;
    }
    points = [...points, rate];
  }
  return { ...state, history: [...curves.slice(0, -1), { ...curve, points }] };
}

/** Close the current Season's curve and open the next one (§7 new Season or §7.4 Cycle). */
export function startCurve(history: SeasonCurve[], season: number): SeasonCurve[] {
  return [...history, emptyCurve(season)].slice(-CURVES_KEPT);
}

function isCurve(value: unknown): value is SeasonCurve {
  if (typeof value !== 'object' || value === null) return false;
  const { season, step, points } = value as Record<string, unknown>;
  return (
    typeof season === 'number' &&
    Number.isInteger(season) &&
    season >= 1 &&
    typeof step === 'number' &&
    Number.isFinite(step) &&
    step >= CURVE_FIRST_STEP &&
    Array.isArray(points) &&
    points.length <= CURVE_MAX_POINTS &&
    points.every((p) => typeof p === 'number' && Number.isFinite(p) && p >= 0)
  );
}

/** The curves of a save that are well-formed, at most the last CURVES_KEPT. */
export function validHistory(value: unknown): SeasonCurve[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const curves = value.filter(isCurve);
  return curves.length === value.length ? curves.slice(-CURVES_KEPT) : null;
}
