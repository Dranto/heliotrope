// Places and stages of the courtyard garden on the map (docs/game-design.md §9.7). Pure data and
// helpers, next to the plan in neighbourhood.ts, so the drawing stays testable.
import { CROPS, type CropId } from '../game/garden';

/** Growth stages drawn: sown, sprouting, growing, ripe. */
export type CropStage = 0 | 1 | 2 | 3;

export function cropStage(growth: number): CropStage {
  if (growth >= 1) return 3;
  if (growth >= 0.5) return 2;
  if (growth >= 0.15) return 1;
  return 0;
}

/**
 * Centre of each bed in world units: three to the left of the planter, three to the right, in
 * the paving between the two rows of pots (neighbourhood.ts POT_SPOTS, PLANTER).
 */
export const BED_PLACES: readonly [number, number][] = [
  [268, 236],
  [278, 236],
  [288, 236],
  [334, 236],
  [344, 236],
  [354, 236],
];
export const BED_SIZE = { width: 8, height: 16 } as const;

export interface BedMark {
  crop: CropId | null;
  stage: CropStage;
}

/** Encode the beds shown on the map, so the layer only redraws when a stage changes. */
export function encodeBeds(beds: readonly BedMark[]): string {
  return beds.map((b) => `${b.crop ?? ''}:${b.stage}`).join();
}

export function decodeBeds(code: string): BedMark[] {
  if (code === '') return [];
  return code.split(',').map((part) => {
    const [crop, stage] = part.split(':');
    return {
      crop: crop && Object.hasOwn(CROPS, crop) ? (crop as CropId) : null,
      stage: Number(stage) as CropStage,
    };
  });
}
