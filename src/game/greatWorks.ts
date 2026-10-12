// The great works (docs/game-design.md §6.6, M20): works of the whole city, built stage by stage
// and kept forever, each stage paid with several resources at once (Light, Water, baskets from
// the courtyard garden, honey from the hives) and asking for species back in the Herbier. What is paid stays paid, so a
// stage can be filled over several Seasons and Cycles. Each stage adds a synergy between two
// systems. Names live in src/i18n, the drawings in src/ui.
import { isIntroduced } from './introductions';
import { unlockAchievements } from './achievements';
import { isBioregionOpen } from './bioregion';
import type { Bonus } from './bonuses';
import type { GameState } from './state';

export const WORK_IDS = ['tram', 'river', 'hall', 'tower'] as const;
export type WorkId = (typeof WORK_IDS)[number];

/** What one stage asks for. Species are a condition: they are not spent. */
export interface StageCost {
  light: number;
  water: number;
  baskets: number;
  /** Jars of honey from the orchard's hives (§9.8, M22), asked by the last stages. */
  honey: number;
  species: number;
}

/** The resources a stage is paid with, in the order the player gives them. */
export const PAYMENTS = ['light', 'water', 'baskets', 'honey'] as const;
export type Payment = (typeof PAYMENTS)[number];

/**
 * The ladder every work climbs: each stage costs about one late Season of effort (§8), the
 * Light a thousand times more each time, the Water ten times.
 */
export const STAGE_COSTS: readonly StageCost[] = [
  { light: 1e12, water: 2e5, baskets: 5, honey: 0, species: 0 },
  { light: 1e15, water: 2e6, baskets: 15, honey: 0, species: 8 },
  { light: 1e18, water: 2e7, baskets: 30, honey: 3, species: 14 },
  { light: 1e21, water: 2e8, baskets: 60, honey: 8, species: 20 },
];

export interface WorkDef {
  id: WorkId;
  /** Bonuses each stage adds once built, in order; the work has as many stages. */
  stages: readonly (readonly Bonus[])[];
}

export const WORKS: Record<WorkId, WorkDef> = {
  // The solar tram on the ring road: rails, green catenaries, stations, then the first tram. The
  // neighbouring districts (§6.4) strengthen each other.
  tram: {
    id: 'tram',
    stages: [
      [{ kind: 'perDistrict', bonus: 0.01 }],
      [{ kind: 'perDistrict', bonus: 0.01 }],
      [{ kind: 'perDistrict', bonus: 0.01 }],
      [{ kind: 'perDistrict', bonus: 0.03 }],
    ],
  },
  // The river reopened north of the city: the slab broken, its banks, footbridges, a bathing spot.
  river: {
    id: 'river',
    stages: [
      [{ kind: 'water', factor: 1.1 }],
      [{ kind: 'water', factor: 1.1 }],
      [{ kind: 'water', factor: 1.1 }],
      [
        { kind: 'water', factor: 1.25 },
        { kind: 'visitInterval', factor: 0.9 },
      ],
    ],
  },
  // The food hall: its frame, the stalls, then the common kitchen. The garden grows faster, and
  // the beans' harvest lasts longer (§9.7).
  hall: {
    id: 'hall',
    stages: [
      [{ kind: 'gardenGrowth', factor: 1.15 }],
      [{ kind: 'gardenGrowth', factor: 1.15 }],
      [
        { kind: 'gardenGrowth', factor: 1.15 },
        { kind: 'effectDuration', effect: 'beans', factor: 1.5 },
      ],
    ],
  },
  // The seed tower: foundations, floors of crops, a seed bank, the belvedere seen from afar.
  tower: {
    id: 'tower',
    stages: [
      [{ kind: 'global', bonus: 0.03 }],
      [{ kind: 'global', bonus: 0.03 }],
      [{ kind: 'global', bonus: 0.03 }],
      [
        { kind: 'global', bonus: 0.05 },
        { kind: 'offlineCap', seconds: 2 * 3600 },
      ],
    ],
  },
};

export interface WorkProgress {
  /** Stages built, kept forever. */
  stage: number;
  /** What is already paid towards the next stage. */
  paid: Record<Payment, number>;
}

export interface GreatWorksState {
  works: Record<WorkId, WorkProgress>;
}

function emptyPaid(): Record<Payment, number> {
  return { light: 0, water: 0, baskets: 0, honey: 0 };
}

export function createGreatWorksState(): GreatWorksState {
  return {
    works: Object.fromEntries(
      WORK_IDS.map((id) => [id, { stage: 0, paid: emptyPaid() }]),
    ) as Record<WorkId, WorkProgress>,
  };
}

export function isWorkId(value: unknown): value is WorkId {
  return typeof value === 'string' && Object.hasOwn(WORKS, value);
}

/** The great works open with the Bioregion, whose Water they need, and stay open. */
export function areGreatWorksOpen(state: GameState): boolean {
  return isIntroduced(state, 'greatWorks') && (isBioregionOpen(state) || worksBuilt(state) > 0);
}

export function stageCount(id: WorkId): number {
  return WORKS[id].stages.length;
}

export function isWorkComplete(state: Pick<GameState, 'greatWorks'>, id: WorkId): boolean {
  return state.greatWorks.works[id].stage >= stageCount(id);
}

/** What the next stage of a work asks for; null once the work is complete. */
export function nextStageCost(state: Pick<GameState, 'greatWorks'>, id: WorkId): StageCost | null {
  const { stage } = state.greatWorks.works[id];
  return stage >= stageCount(id) ? null : (STAGE_COSTS[stage] ?? null);
}

/** Stages built over every work. */
export function stagesBuilt(state: Pick<GameState, 'greatWorks'>): number {
  return WORK_IDS.reduce((sum, id) => sum + state.greatWorks.works[id].stage, 0);
}

/** Works complete. */
export function worksBuilt(state: Pick<GameState, 'greatWorks'>): number {
  return WORK_IDS.filter((id) => isWorkComplete(state, id)).length;
}

/** What the player owns of each payment. */
function owned(state: GameState, payment: Payment): number {
  switch (payment) {
    case 'light':
      return state.resources.light;
    case 'water':
      return state.resources.water;
    case 'baskets':
      return state.garden.baskets;
    case 'honey':
      return state.orchard.honey;
  }
}

/** Still missing of each payment for the next stage of a work. */
export function missing(state: GameState, id: WorkId): Record<Payment, number> {
  const cost = nextStageCost(state, id);
  const { paid } = state.greatWorks.works[id];
  return {
    light: cost ? Math.max(0, cost.light - paid.light) : 0,
    water: cost ? Math.max(0, cost.water - paid.water) : 0,
    baskets: cost ? Math.max(0, cost.baskets - paid.baskets) : 0,
    honey: cost ? Math.max(0, cost.honey - paid.honey) : 0,
  };
}

/** Species of the Herbier still missing for the next stage of a work. */
export function speciesMissing(state: GameState, id: WorkId): number {
  const cost = nextStageCost(state, id);
  return cost ? Math.max(0, cost.species - state.species.length) : 0;
}

/** Something can be given now towards the next stage of a work. */
export function canContribute(state: GameState, id: WorkId): boolean {
  if (!areGreatWorksOpen(state) || nextStageCost(state, id) === null) return false;
  const left = missing(state, id);
  return PAYMENTS.some((p) => left[p] > 0 && owned(state, p) > 0) || isStageReady(state, id);
}

/** Everything is paid and the species are back: the stage can be built. */
export function isStageReady(state: GameState, id: WorkId): boolean {
  if (nextStageCost(state, id) === null) return false;
  const left = missing(state, id);
  return PAYMENTS.every((p) => left[p] <= 0) && speciesMissing(state, id) === 0;
}

/** Build the next stage of a work once it is ready. */
function build(state: GameState, id: WorkId): GameState {
  if (!isStageReady(state, id)) return state;
  const work = state.greatWorks.works[id];
  return withWork(state, id, { stage: work.stage + 1, paid: emptyPaid() });
}

function withWork(state: GameState, id: WorkId, work: WorkProgress): GameState {
  return { ...state, greatWorks: { works: { ...state.greatWorks.works, [id]: work } } };
}

/**
 * Player action: give what is owned towards the next stage of a work, up to what it still asks
 * for: Light, Water and baskets at once. What is given stays given. The stage is built as soon
 * as everything is paid and its species are back.
 */
export function contribute(state: GameState, id: WorkId): GameState {
  if (!canContribute(state, id)) return state;
  const left = missing(state, id);
  const give = {
    light: Math.min(left.light, state.resources.light),
    water: Math.min(left.water, state.resources.water),
    baskets: Math.min(left.baskets, state.garden.baskets),
    honey: Math.min(left.honey, state.orchard.honey),
  };
  const work = state.greatWorks.works[id];
  let next: GameState = {
    ...state,
    resources: {
      light: state.resources.light - give.light,
      water: state.resources.water - give.water,
    },
    garden: { ...state.garden, baskets: state.garden.baskets - give.baskets },
    orchard: { ...state.orchard, honey: state.orchard.honey - give.honey },
  };
  next = withWork(next, id, {
    stage: work.stage,
    paid: {
      light: work.paid.light + give.light,
      water: work.paid.water + give.water,
      baskets: work.paid.baskets + give.baskets,
      honey: work.paid.honey + give.honey,
    },
  });
  return unlockAchievements(build(next, id));
}

/** Share of a stage's cost the neighbours' helping hand pays (§9.15, M35). */
export const HAND_STAGE_SHARE = 0.25;

/** The work a helping hand lightens: the unfinished one closest to its next stage. */
export function handWork(state: GameState): WorkId | null {
  if (!areGreatWorksOpen(state)) return null;
  let best: WorkId | null = null;
  let bestShare = -1;
  for (const id of WORK_IDS) {
    const cost = nextStageCost(state, id);
    if (!cost) continue;
    const { paid } = state.greatWorks.works[id];
    const share = paid.light / cost.light;
    if (share > bestShare) [best, bestShare] = [id, share];
  }
  return best;
}

/**
 * A helping hand of the neighbours (M35): a quarter of the next stage's Light, Water, baskets
 * and honey paid for the work closest to it, no further than the stage asks.
 */
export function lightenStage(state: GameState): GameState {
  const id = handWork(state);
  if (!id) return state;
  const cost = nextStageCost(state, id)!;
  const work = state.greatWorks.works[id];
  const paid = Object.fromEntries(
    PAYMENTS.map((p) => [p, Math.min(cost[p], work.paid[p] + cost[p] * HAND_STAGE_SHARE)]),
  ) as Record<Payment, number>;
  return unlockAchievements(build(withWork(state, id, { stage: work.stage, paid }), id));
}

/**
 * Build every stage that became ready on its own: its species came back after it was paid.
 * Called by every tick; returns the same state when nothing changes.
 */
export function buildReadyStages(state: GameState): GameState {
  if (!areGreatWorksOpen(state)) return state;
  return WORK_IDS.reduce((s, id) => build(s, id), state);
}

/** Bonuses of every stage built. */
export function greatWorksBonuses(works: Readonly<Record<WorkId, { stage: number }>>): Bonus[] {
  return WORK_IDS.flatMap((id) => WORKS[id].stages.slice(0, works[id].stage).flat());
}

/**
 * Bonuses of a list of stages folded together for display: same kinds (and same effect) add up,
 * factors multiply, so a complete work reads as one line per effect.
 */
export function foldBonuses(bonuses: readonly Bonus[]): Bonus[] {
  const folded = new Map<string, Bonus>();
  for (const bonus of bonuses) {
    const key = [
      bonus.kind,
      'effect' in bonus ? bonus.effect : '',
      'generator' in bonus ? bonus.generator : '',
    ].join(':');
    const prev = folded.get(key);
    if (!prev) {
      folded.set(key, bonus);
      continue;
    }
    const merged: Record<string, unknown> = { ...prev };
    for (const [field, value] of Object.entries(bonus)) {
      if (typeof value !== 'number') continue;
      const before = (prev as unknown as Record<string, number>)[field] ?? 0;
      merged[field] = field === 'factor' ? before * value : before + value;
    }
    folded.set(key, merged as unknown as Bonus);
  }
  return [...folded.values()];
}

/** Keep only what a save can hold: stages within each work, payments within the next stage. */
export function validGreatWorks(raw: unknown): GreatWorksState {
  const state = createGreatWorksState();
  if (typeof raw !== 'object' || raw === null) return state;
  const works = (raw as Record<string, unknown>).works;
  if (typeof works !== 'object' || works === null) return state;
  for (const id of WORK_IDS) {
    const data = (works as Record<string, unknown>)[id] as Record<string, unknown> | undefined;
    if (!data) continue;
    const stage =
      Number.isInteger(data.stage) && (data.stage as number) > 0
        ? Math.min(data.stage as number, stageCount(id))
        : 0;
    const cost = STAGE_COSTS[stage];
    const paid = emptyPaid();
    const rawPaid = data.paid as Record<string, unknown> | undefined;
    if (cost && rawPaid) {
      for (const p of PAYMENTS) {
        const value = rawPaid[p];
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          paid[p] = Math.min(value, cost[p]);
        }
      }
    }
    state.works[id] = { stage, paid };
  }
  return state;
}
