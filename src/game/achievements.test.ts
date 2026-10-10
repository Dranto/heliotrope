import {
  ACHIEVEMENT_BONUS,
  ACHIEVEMENT_LIST,
  achievementBonus,
  isAchievementId,
  unlockAchievement,
  unlockAchievements,
} from './achievements';
import { GENERATOR_IDS } from './generators';
import { globalMultiplier } from './production';
import { startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { buyGenerator, tick } from './tick';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

const owned = (patch: Partial<GameState['generators']>) => ({
  ...createInitialState(0).generators,
  ...patch,
});

describe('Milestone data (§9.3)', () => {
  it('has about 40 Milestones with unique ids', () => {
    expect(ACHIEVEMENT_LIST.length).toBeGreaterThanOrEqual(38);
    expect(ACHIEVEMENT_LIST.length).toBeLessThanOrEqual(45);
    expect(new Set(ACHIEVEMENT_LIST.map((a) => a.id)).size).toBe(ACHIEVEMENT_LIST.length);
  });

  it('covers every family of the design doc', () => {
    const ids = ACHIEVEMENT_LIST.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['light.3', 'light.6', 'light.9']));
    for (const id of GENERATOR_IDS) {
      expect(ids).toEqual(expect.arrayContaining([`${id}.1`, `${id}.50`, `${id}.100`]));
    }
    expect(ids).toEqual(expect.arrayContaining(['clicks.100', 'clicks.1000', 'clicks.10000']));
    expect(ids).toEqual(expect.arrayContaining(['butterflies.1', 'butterflies.10']));
    expect(ids).toEqual(expect.arrayContaining(['seasons.1', 'seasons.5', 'seasons.10']));
    expect(ACHIEVEMENT_LIST.filter((a) => a.hidden).map((a) => a.id)).toContain(
      'slowPhotosynthesis',
    );
  });

  it('recognises Milestone ids', () => {
    expect(isAchievementId('pot.50')).toBe(true);
    expect(isAchievementId('pot.51')).toBe(false);
    expect(isAchievementId(3)).toBe(false);
  });
});

describe('unlockAchievements', () => {
  it('unlocks Milestones whose conditions are met, once, in list order', () => {
    const state = withState({ allTimeLight: 2e6, clicks: 150, generators: owned({ pot: 50 }) });
    const next = unlockAchievements(state);
    expect(next.achievements).toEqual(['light.3', 'light.6', 'pot.1', 'pot.50', 'clicks.100']);
    expect(unlockAchievements(next)).toBe(next);
    expect(state.achievements).toEqual([]);
  });

  it('unlocks the butterfly, Season and every-generator Milestones', () => {
    const all = owned(Object.fromEntries(GENERATOR_IDS.map((id) => [id, 10])));
    const next = unlockAchievements(withState({ butterflies: 10, seasons: 5, generators: all }));
    expect(next.achievements).toEqual(
      expect.arrayContaining(['butterflies.10', 'seasons.5', 'mosaic']),
    );
    expect(next.achievements).not.toContain('wildGarden');
  });

  it('unlocks the hidden slow photosynthesis after 10 minutes without buying', () => {
    let state = buyGenerator(withState({ resources: { light: 15 } }), 'pot');
    state = tick(state, 599);
    expect(state.achievements).not.toContain('slowPhotosynthesis');
    expect(buyGenerator(tick(state, 0.5), 'pot').idleSeconds).toBe(0);
    state = tick(state, 1);
    expect(state.achievements).toContain('slowPhotosynthesis');
  });

  it('does not count idle time with nothing built', () => {
    expect(tick(createInitialState(0), 900).achievements).not.toContain('slowPhotosynthesis');
  });

  it('unlocks action Milestones only through unlockAchievement', () => {
    const state = unlockAchievement(createInitialState(0), 'earlySowing');
    expect(state.achievements).toEqual(['earlySowing']);
    expect(unlockAchievement(state, 'earlySowing')).toBe(state);
  });
});

describe('Milestone bonus', () => {
  it('adds +1% global production per Milestone (§8)', () => {
    const state = withState({ achievements: ['light.3', 'pot.1', 'clicks.100'] });
    expect(achievementBonus(state)).toBeCloseTo(3 * ACHIEVEMENT_BONUS);
    expect(globalMultiplier(state)).toBeCloseTo(1.03);
  });

  it('keeps Milestones across Seasons and grants the hidden early sowing', () => {
    const state = withState({
      allTimeLight: 5e7,
      totalLight: 5e7,
      achievements: ['light.3', 'light.6'],
    });
    const next = startNewSeason(state);
    expect(next.achievements).toEqual(['light.3', 'light.6', 'earlySowing', 'seasons.1']);
  });
});
