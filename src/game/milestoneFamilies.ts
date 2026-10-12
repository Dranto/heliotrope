// Milestones that count (docs/game-design.md §9.16, M37): each Milestone reached leaves a small
// gift tied to its family on the map, gathered with a click, a family whose Milestones are all reached gives a lasting bonus and a
// colour of the heliotrope, and the next Milestone of each family shows its progress. Pure.
import {
  ACHIEVEMENT_FAMILIES,
  ACHIEVEMENT_LIST,
  achievementProgress,
  ACHIEVEMENTS,
  isMeasuredInPowers,
  type AchievementDef,
  type AchievementFamily,
  type AchievementId,
} from './achievements';
import { earnWater, isBioregionOpen, waterPerSecond } from './bioregion';
import type { Bonus } from './bonuses';
import { growGarden } from './garden';
import { earnLight } from './light';
import { addPollen } from './pollen';
import { clickValue } from './production';
import type { GameState } from './state';

/** What a Milestone leaves when it is reached, by family. */
export type MilestoneGift = 'light' | 'pollen' | 'garden' | 'water';

export const MILESTONE_GIFTS: Record<AchievementFamily, MilestoneGift> = {
  light: 'light',
  buildings: 'light',
  upgrades: 'light',
  clicks: 'pollen',
  butterflies: 'pollen',
  neighbourhood: 'garden',
  seasons: 'garden',
  bioregion: 'water',
};

/** Gifts waiting on the map at most: the later ones are not kept. */
export const MAX_WAITING_GIFTS = 8;

/** The gift a Milestone leaves. */
export function milestoneGift(id: AchievementId): MilestoneGift {
  return MILESTONE_GIFTS[ACHIEVEMENTS[id].family];
}

/** A puff of Light: as much as this many clicks on the heliotrope (§5.2). */
export const GIFT_LIGHT_CLICKS = 10;
/** A step of the pollen gauge (§5.6). */
export const GIFT_POLLEN = 0.05;
/** The crops of the courtyard garden grow this many seconds at once (§9.7). */
export const GIFT_GARDEN_SECONDS = 10 * 60;
/** A drop of Water: this many seconds of the Bioregion's Water (§7.4). */
export const GIFT_WATER_SECONDS = 30;

function give(state: GameState, gift: MilestoneGift): GameState {
  switch (gift) {
    case 'light':
      return earnLight(state, clickValue(state) * GIFT_LIGHT_CLICKS);
    case 'pollen':
      return addPollen(state, GIFT_POLLEN);
    case 'garden':
      return growGarden(state, GIFT_GARDEN_SECONDS);
    case 'water':
      return isBioregionOpen(state)
        ? earnWater(state, waterPerSecond(state) * GIFT_WATER_SECONDS)
        : state;
  }
}

/** Player action: gather every gift the Milestones left on the map, in the order they came. */
export function gatherMilestoneGifts(state: GameState): GameState {
  if (state.milestoneGifts.length === 0) return state;
  return state.milestoneGifts.reduce(give, { ...state, milestoneGifts: [] });
}

export function isMilestoneGift(value: unknown): value is MilestoneGift {
  return value === 'light' || value === 'pollen' || value === 'garden' || value === 'water';
}

/** The Milestones of a family that count for completing it: the hidden ones are a bonus. */
export function familyMilestones(family: AchievementFamily): AchievementDef[] {
  return ACHIEVEMENT_LIST.filter((a) => a.family === family && !a.hidden);
}

export function isMilestoneFamilyComplete(
  achievements: readonly AchievementId[],
  family: AchievementFamily,
): boolean {
  return familyMilestones(family).every((a) => achievements.includes(a.id));
}

export function completeMilestoneFamilies(
  achievements: readonly AchievementId[],
): AchievementFamily[] {
  return ACHIEVEMENT_FAMILIES.filter((family) => isMilestoneFamilyComplete(achievements, family));
}

/**
 * What a complete family gives, tied to its world: the clicks fill the pollen gauge, the
 * butterflies bring the Papillon back sooner, the neighbourhood raises every Milestone's bonus.
 */
export const MILESTONE_FAMILY_BONUSES: Record<AchievementFamily, readonly Bonus[]> = {
  light: [{ kind: 'global', bonus: 0.1 }],
  buildings: [{ kind: 'discount', fraction: 0.05 }],
  upgrades: [{ kind: 'synergyFactor', factor: 1.1 }],
  clicks: [{ kind: 'pollenFill', factor: 1.15 }],
  butterflies: [{ kind: 'butterflyInterval', factor: 0.9 }],
  neighbourhood: [{ kind: 'perAchievement', bonus: 0.002 }],
  seasons: [{ kind: 'offlineCap', seconds: 2 * 3600 }],
  bioregion: [{ kind: 'water', factor: 1.1 }],
};

export function milestoneFamilyBonuses(achievements: readonly AchievementId[]): Bonus[] {
  return completeMilestoneFamilies(achievements).flatMap((f) => MILESTONE_FAMILY_BONUSES[f]);
}

export interface NextMilestone {
  achievement: AchievementDef;
  /** Share of its goal reached, from 0 to 1; null when it cannot be measured. */
  progress: number | null;
}

/** The next Milestone of a family: the one not reached yet that is closest to its goal. */
export function nextMilestone(state: GameState, family: AchievementFamily): NextMilestone | null {
  let best: NextMilestone | null = null;
  for (const achievement of familyMilestones(family)) {
    if (state.achievements.includes(achievement.id)) continue;
    const progress = achievementProgress(state, achievement.condition);
    if (best === null || (progress ?? -1) > (best.progress ?? -1)) best = { achievement, progress };
  }
  return best;
}

/** A Milestone this close to its goal can be asked for by the neighbours (§9.11). */
export const CLOSE_MILESTONE = 0.75;

/**
 * The Milestone closest to its goal over every family, once it is close; the ones counted in
 * powers of ten are left out, as they can still be far.
 */
export function closeMilestone(state: GameState): AchievementId | null {
  let best: { id: AchievementId; progress: number } | null = null;
  for (const achievement of ACHIEVEMENT_LIST) {
    const { id, condition, hidden } = achievement;
    if (hidden || state.achievements.includes(id) || isMeasuredInPowers(condition)) continue;
    const progress = achievementProgress(state, condition);
    if (progress === null || progress < CLOSE_MILESTONE || progress >= 1) continue;
    if (best === null || progress > best.progress) best = { id, progress };
  }
  return best?.id ?? null;
}
