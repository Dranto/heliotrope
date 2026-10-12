import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_LIST,
  ACHIEVEMENTS,
  achievementProgress,
  unlockAchievement,
  unlockAchievements,
  type AchievementId,
} from './achievements';
import { canChoose, chooseAlliance, isAwake } from './alliances';
import { factorOf, globalBonus } from './bonuses';
import { familyColour, isFlowerColourUnlocked } from './decor';
import { FAMILIES } from './families';
import { withAllIntroduced } from './introductions';
import {
  closeMilestone,
  completeMilestoneFamilies,
  familyMilestones,
  gatherMilestoneGifts,
  GIFT_GARDEN_SECONDS,
  GIFT_LIGHT_CLICKS,
  GIFT_POLLEN,
  isMilestoneFamilyComplete,
  MAX_WAITING_GIFTS,
  nextMilestone,
} from './milestoneFamilies';
import { clickValue } from './production';
import { isRequestMet, validRequests, type Request } from './requests';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';

function second(extra: Partial<GameState> = {}): GameState {
  return { ...withAllIntroduced(createInitialState(0)), seasons: 1, ...extra };
}

const ids = (family: Parameters<typeof familyMilestones>[0]): AchievementId[] =>
  familyMilestones(family).map((a) => a.id);

describe('the gift of each Milestone (M37)', () => {
  it('waits on the map, then gives a puff of Light for the light, buildings and upgrades', () => {
    const state = unlockAchievement(second(), 'mosaic');
    expect(state.milestoneGifts).toEqual(['light']);
    expect(state.resources.light).toBe(0);
    const gathered = gatherMilestoneGifts(state);
    expect(gathered.milestoneGifts).toEqual([]);
    expect(gathered.resources.light).toBeCloseTo(clickValue(state) * GIFT_LIGHT_CLICKS);
    expect(gatherMilestoneGifts(gathered)).toBe(gathered);
  });

  it('gives a step of the pollen gauge for the clicks and the butterflies', () => {
    const state = unlockAchievement(second(), 'goldenPollen');
    const gathered = gatherMilestoneGifts(state);
    expect(gathered.pollen.gauge - state.pollen.gauge).toBeCloseTo(GIFT_POLLEN);
  });

  it('makes the garden grow for the neighbourhood and the Seasons', () => {
    const fresh = second();
    const plots = fresh.garden.plots.map((p, i) =>
      i === 0 ? { ...p, crop: 'squash' as const, grown: 0 } : p,
    );
    const state = unlockAchievement({ ...fresh, garden: { ...fresh.garden, plots } }, 'hello');
    const gathered = gatherMilestoneGifts(state);
    expect(gathered.garden.plots[0]!.grown).toBeGreaterThanOrEqual(GIFT_GARDEN_SECONDS);
  });

  it('comes with every Milestone unlocked by the state, a few at most, kept in the save', () => {
    const many = ACHIEVEMENT_LIST.slice(0, 20).map((a) => a.id);
    const state = second();
    const after = many.reduce(unlockAchievement, state);
    expect(after.milestoneGifts).toHaveLength(MAX_WAITING_GIFTS);
    expect(deserialize(serialize(after), 0)!.milestoneGifts).toEqual(after.milestoneGifts);
    const clicked = unlockAchievements(second({ clicks: 10 }));
    expect(clicked.milestoneGifts).toContain('pollen');
  });
});

describe('the families of Milestones (M37)', () => {
  it('are complete once every Milestone but the hidden ones is reached', () => {
    const upgrades = ids('upgrades');
    expect(isMilestoneFamilyComplete(upgrades.slice(1), 'upgrades')).toBe(false);
    expect(isMilestoneFamilyComplete(upgrades, 'upgrades')).toBe(true);
    const clicks = ids('clicks');
    expect(clicks).not.toContain('sleepingSeed');
    expect(completeMilestoneFamilies([...upgrades, ...clicks])).toEqual(['upgrades', 'clicks']);
  });

  it('give a lasting bonus and a colour of the heliotrope', () => {
    const state = second();
    const complete = { ...state, achievements: ids('clicks') };
    expect(factorOf(complete, 'pollenFill') / factorOf(state, 'pollenFill')).toBeCloseTo(1.15);
    const colour = familyColour('clicks');
    expect(isFlowerColourUnlocked(state, colour)).toBe(false);
    expect(isFlowerColourUnlocked(complete, colour)).toBe(true);
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

describe('what else reads the Milestones (M37)', () => {
  it('the neighbours ask for a Milestone close to its goal', () => {
    const state = second({ clicks: 90, achievements: ['clicks.10'] });
    expect(closeMilestone(state)).toBe('clicks.100');
    expect(closeMilestone({ ...state, clicks: 20 })).toBeNull();
    const request: Request = {
      need: { kind: 'milestone', id: 'clicks.100', count: 1 },
      base: 0,
      hand: 'quarter',
      from: null,
    };
    const open = { ...state, requests: { ...state.requests, open: [request] } };
    expect(isRequestMet(open, request)).toBe(false);
    const reached = unlockAchievements({ ...open, clicks: 100 });
    expect(isRequestMet(reached, request)).toBe(true);
    expect(validRequests({ ...state.requests, open: [request] }, state.requests).open).toEqual([
      request,
    ]);
  });

  it('the garlands wake with a family of Milestones and two of the Herbier', () => {
    const state = second({
      seasons: 3,
      achievements: ids('upgrades'),
      species: [...FAMILIES.pollinators],
    });
    expect(isAwake(state, 'garlands')).toBe(false);
    const awake = { ...state, species: [...FAMILIES.pollinators, ...FAMILIES.night] };
    expect(isAwake(awake, 'garlands')).toBe(true);
    if (canChoose(awake, 'garlands')) {
      expect(chooseAlliance(awake, 'garlands').alliances.chosen).toContain('garlands');
    }
  });
});
