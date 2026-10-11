// Where the return in images (docs/game-design.md §9.1, M17) points on the map: one place per
// building that grew while the player was away, the garden beds that ripened and the heliotrope
// for the Seeds. World units of neighbourhood.ts.
import type { GeneratorId } from '../game/generators';
import type { OfflineReport } from '../game/offline';
import { BED_PLACES } from './gardenMap';
import {
  ARCOLOGY_SITE,
  centre,
  FARM_SITES,
  GARDEN_ROOFS,
  GREENHOUSE_SITES,
  MIRROR_TOWER,
  PANEL_SPOTS,
  PLANTER,
  POT_SPOTS,
  TREES,
} from './neighbourhood';

export const RETURN_ANCHORS: Record<GeneratorId, [number, number]> = {
  pot: POT_SPOTS[0]!,
  balconyPanel: PANEL_SPOTS[1]!,
  rooftopGarden: centre(GARDEN_ROOFS[4]!),
  greenhouse: centre(GREENHOUSE_SITES[0]!),
  verticalFarm: centre(FARM_SITES[0]!.box),
  mirrorPlant: [MIRROR_TOWER.x, MIRROR_TOWER.y],
  urbanCanopy: [TREES[6]!.x, TREES[6]!.y],
  arcology: centre(ARCOLOGY_SITE),
};

export type ReturnMark = { kind: 'built' | 'ripe' | 'seeds'; x: number; y: number };

/** The marks of a report, in the order they appear: buildings, beds, then the Seeds. */
export function returnMarks(report: OfflineReport): ReturnMark[] {
  return [
    ...report.built.map((id) => ({
      kind: 'built' as const,
      x: RETURN_ANCHORS[id][0],
      y: RETURN_ANCHORS[id][1],
    })),
    ...report.ripened.flatMap((i) => {
      const place = BED_PLACES[i];
      return place ? [{ kind: 'ripe' as const, x: place[0], y: place[1] }] : [];
    }),
    ...(report.seedsRipened || report.seasons > 0
      ? [{ kind: 'seeds' as const, x: PLANTER.x, y: PLANTER.y - 6 }]
      : []),
  ];
}

/** Seconds of one sweep of the sun, and between two marks. */
export const SWEEP_SECONDS = 1.1;
export const MARK_STEP_SECONDS = 0.45;

/** Sweeps of the sun: one per hour away, at least one, at most four. */
export function returnSweeps(offlineSeconds: number): number {
  return Math.max(1, Math.min(4, Math.ceil(offlineSeconds / 3600)));
}

/** Seconds the whole replay lasts, to take it off the map afterwards. */
export function replaySeconds(marks: number, sweeps: number): number {
  return sweeps * SWEEP_SECONDS + marks * MARK_STEP_SECONDS + 2.5;
}
