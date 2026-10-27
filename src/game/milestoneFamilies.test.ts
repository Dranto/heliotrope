import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, achievementProgress, type AchievementId } from './achievements';
import { factorOf, globalBonus } from './bonuses';
import { withAllIntroduced } from './introductions';
import {
  completeMilestoneFamilies,
  familyMilestones,
  isMilestoneFamilyComplete,
  nextMilestone,
} from './milestoneFamilies';
import { createInitialState, type GameState } from './state';

function second(extra: Partial<GameState> = {}): GameState {
  return { ...withAllIntroduced(createInitialState(0)), seasons: 1, ...extra };
}

const ids = (family: Parameters<typeof familyMilestones>[0]): AchievementId[] =>
  familyMilestones(family).map((a) => a.id);

describe('the families of Milestones (M37)', () => {
  it('are complete once every Milestone but the hidden ones is reached', () => {
    const upgrades = ids('upgrades');
    expect(isMilestoneFamilyComplete(upgrades.slice(1), 'upgrades')).toBe(false);
    expect(isMilestoneFamilyComplete(upgrades, 'upgrades')).toBe(true);
    const clicks = ids('clicks');
    expect(clicks).not.toContain('sleepingSeed');
    expect(completeMilestoneFamilies([...upgrades, ...clicks])).toEqual(['upgrades', 'clicks']);
  });

  it('give a lasting bonus', () => {
    const state = second();
    const complete = { ...state, achievements: ids('clicks') };
    expect(factorOf(complete, 'pollenFill') / factorOf(state, 'pollenFill')).toBeCloseTo(1.15);
  });

  it('show the next Milestone closest to its goal, with its progress', () => {
    const state = second({ clicks: 60 });
    const next = nextMilestone({ ...state, achievements: ['clicks.10'] }, 'clicks');
    expect(next?.achievement.id).toBe('clicks.100');
    expect(next?.progress).toBeCloseTo(0.6);
    const light = achievementProgress(
      { ...state, allTimeLight: 1e6 },
      ACHIEVEMENTS['light.12'].condition,
    );
    expect(light).toBeCloseTo(0.5);
  });

  it('count for the laurels of the Canopy', () => {
    const state = second();
    const laurels = {
      ...state,
      canopy: { ...state.canopy, levels: { ...state.canopy.levels, laurels: 2 } },
    };
    const complete = { ...laurels, achievements: [...ids('clicks'), ...ids('upgrades')] };
    const without = { ...state, achievements: complete.achievements };
    expect(globalBonus(complete) - globalBonus(without)).toBeCloseTo(0.12);
  });
});
