// Where the great works stand on the map (docs/game-design.md §6.6), and the encoding of their
// stages that keeps the map from redrawing at every tick. Pure data and helpers.
import { WORK_IDS, type WorkId } from '../game/greatWorks';
import type { Box } from './neighbourhood';

/** Grey blocks of the outskirts the works are built on, in world coordinates (182 × 124). */
export const WORK_PLACES: Record<Exclude<WorkId, 'tram'>, Box> = {
  river: [428, -126, 182, 124],
  hall: [12, -126, 182, 124],
  tower: [428, 474, 182, 124],
};

export function encodeStages(stages: Record<WorkId, number>): string {
  return WORK_IDS.map((id) => `${id}:${stages[id]}`).join();
}

export function parseStages(encoded: string): Record<WorkId, number> {
  const stages = Object.fromEntries(WORK_IDS.map((id) => [id, 0])) as Record<WorkId, number>;
  for (const part of encoded.split(',')) {
    const [id, value] = part.split(':');
    if (id && (WORK_IDS as readonly string[]).includes(id))
      stages[id as WorkId] = Number(value) || 0;
  }
  return stages;
}
