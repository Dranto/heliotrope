import { districtCost, offeredDistrict, type DistrictId } from './districts';
import { GENERATOR_IDS, GENERATORS, type GeneratorId } from './generators';
import type { ParcelId } from './parcels';
import {
  availableUpgrades,
  generatorCost,
  isGeneratorRevealed,
  lightPerSecond,
} from './production';
import type { ProjectId } from './projects';
import { offeredParcels, offeredProjects, parcelCost, projectCost } from './restoration';
import type { GameState } from './state';
import type { UpgradeId } from './upgrades';

/**
 * Seconds of production before `cost` Light is in reserve (design doc §10.5): 0 when it already
 * is, Infinity when nothing is produced yet.
 */
export function secondsToAfford(state: GameState, cost: number): number {
  const missing = cost - state.resources.light;
  if (missing <= 0) return 0;
  const rate = lightPerSecond(state);
  return rate > 0 ? missing / rate : Infinity;
}

/** Something the player can buy with Light, named by the UI. */
export type Goal =
  | { kind: 'generator'; id: GeneratorId; cost: number; discovered: boolean }
  | { kind: 'upgrade'; id: UpgradeId; cost: number }
  | { kind: 'parcel'; id: ParcelId; cost: number }
  | { kind: 'project'; id: ProjectId; cost: number }
  | { kind: 'district'; id: DistrictId; cost: number };

/** Every purchase on offer now, plus the next generator still to discover. */
function offers(state: GameState): Goal[] {
  const goals: Goal[] = [];
  const next = GENERATOR_IDS.find((id) => !isGeneratorRevealed(state, id));
  for (const id of GENERATOR_IDS) {
    if (isGeneratorRevealed(state, id)) {
      goals.push({ kind: 'generator', id, cost: generatorCost(state, id), discovered: true });
    } else if (id === next) {
      // Shown as a silhouette with its base price (§4): the far goal of the list.
      goals.push({ kind: 'generator', id, cost: GENERATORS[id].baseCost, discovered: false });
    }
  }
  for (const u of availableUpgrades(state)) goals.push({ kind: 'upgrade', id: u.id, cost: u.cost });
  for (const p of offeredParcels(state))
    goals.push({ kind: 'parcel', id: p.id, cost: parcelCost(state, p.id) });
  for (const p of offeredProjects(state))
    goals.push({ kind: 'project', id: p.id, cost: projectCost(state, p.id) });
  const district = offeredDistrict(state);
  if (district)
    goals.push({ kind: 'district', id: district.id, cost: districtCost(state, district.id) });
  return goals;
}

/**
 * The next goal shown under the Light counter (§2 golden rule, §10.5): the cheapest purchase on
 * offer that the reserve does not cover yet. Null when everything on offer is affordable.
 */
export function nextGoal(state: GameState): Goal | null {
  let best: Goal | null = null;
  for (const goal of offers(state)) {
    if (goal.cost <= state.resources.light) continue;
    if (best === null || goal.cost < best.cost) best = goal;
  }
  return best;
}
