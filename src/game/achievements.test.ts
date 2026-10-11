import {
  ACHIEVEMENT_BONUS,
  ACHIEVEMENT_LIST,
  achievementBonus,
  isAchievementId,
  unlockAchievement,
  unlockAchievements,
} from './achievements';
import { catchButterfly } from './butterfly';
import { GENERATOR_IDS } from './generators';
import { PARCEL_IDS } from './parcels';
import { clickValue, globalMultiplier, lightPerSecond } from './production';
import { PROJECT_IDS } from './projects';
import { lightForSeeds, SEED_RIPENING_SECONDS, startNewSeason } from './seasons';
import { createInitialState, type GameState } from './state';
import { TALENT_IDS } from './talents';
import { buyGenerator, clickHeliotrope, tick } from './tick';
import { CLICK_UPGRADE_IDS, SYNERGY_IDS, type UpgradeId } from './upgrades';

function withState(patch: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...patch };
}

const owned = (patch: Partial<GameState['generators']>) => ({
  ...createInitialState(0).generators,
  ...patch,
});

describe('Milestone data (§9.3)', () => {
  it('has about 100 Milestones with unique ids', () => {
    expect(ACHIEVEMENT_LIST.length).toBeGreaterThanOrEqual(95);
    expect(ACHIEVEMENT_LIST.length).toBeLessThanOrEqual(110);
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
    expect(next.achievements).toEqual([
      'light.3',
      'light.6',
      'pot.1',
      'pot.50',
      'onlyPots',
      'clicks.10',
      'clicks.100',
    ]);
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
    let state = buyGenerator(withState({ resources: { water: 0, light: 15 } }), 'pot');
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

describe('Milestones of the later systems', () => {
  const all = (count: number) => owned(Object.fromEntries(GENERATOR_IDS.map((id) => [id, count])));

  it('counts upgrades, synergies and click upgrades bought this Season', () => {
    const upgrades = [...SYNERGY_IDS.slice(0, 1), ...CLICK_UPGRADE_IDS] as UpgradeId[];
    const next = unlockAchievements(withState({ upgrades }));
    expect(next.achievements).toEqual(['upgrades.10', 'firstThread', 'goldenHands']);
    const web = unlockAchievements(withState({ upgrades: [...SYNERGY_IDS] }));
    expect(web.achievements).toContain('goldenWeb');
  });

  it('counts parcels, projects, talents and cooperative purchases', () => {
    const state = createInitialState(0);
    const next = unlockAchievements(
      withState({
        parcels: [...PARCEL_IDS],
        projects: PROJECT_IDS.slice(0, 8),
        talents: TALENT_IDS.slice(0, 9),
        cooperatives: {
          ...state.cooperatives,
          purchases: { ...state.cooperatives.purchases, gardeners: 60, roofers: 40 },
        },
      }),
    );
    expect(next.achievements).toEqual([
      'parcels.1',
      'parcels.4',
      'parcels.8',
      'projects.1',
      'projects.8',
      'talents.1',
      'talents.9',
      'cooperatives.100',
    ]);
  });

  it('reads the production and the value of a click right now', () => {
    const rich = withState({ generators: all(100), seeds: 100 });
    expect(lightPerSecond(rich)).toBeGreaterThan(1e6);
    expect(unlockAchievements(rich).achievements).toEqual(
      expect.arrayContaining(['rate.3', 'rate.6', 'patchwork', 'wildGarden']),
    );
    const pollinating = withState({ effects: [{ kind: 'pollination', remaining: 5 }] });
    expect(clickValue(pollinating)).toBe(100);
    expect(unlockAchievements(pollinating).achievements).not.toContain('clickValue.3');
  });

  it('rewards playing with pots only, or with no building at all', () => {
    expect(
      unlockAchievements(withState({ generators: owned({ pot: 50 }) })).achievements,
    ).toContain('onlyPots');
    expect(
      unlockAchievements(withState({ generators: owned({ pot: 50, balconyPanel: 1 }) }))
        .achievements,
    ).not.toContain('onlyPots');
    expect(unlockAchievements(withState({ totalLight: 1000 })).achievements).toContain(
      'sleepingSeed',
    );
    expect(
      unlockAchievements(withState({ totalLight: 1000, generators: owned({ pot: 1 }) }))
        .achievements,
    ).not.toContain('sleepingSeed');
  });

  it('measures play time and the pace of a Season', () => {
    const swift = withState({ totalLight: 2e9, seasonSeconds: 29 * 60, playSeconds: 3600 });
    expect(unlockAchievements(swift).achievements).toEqual(
      expect.arrayContaining(['swiftSeason', 'playHours.1']),
    );
    expect(unlockAchievements({ ...swift, seasonSeconds: 31 * 60 }).achievements).not.toContain(
      'swiftSeason',
    );
    expect(unlockAchievements(withState({ seasonSeconds: 4 * 3600 })).achievements).toContain(
      'longSeason',
    );
  });

  it('unlocks Pollen d’or with a click during a Pollinisation', () => {
    const calm = clickHeliotrope(createInitialState(0));
    expect(calm.achievements).not.toContain('goldenPollen');
    const pollinating = withState({ effects: [{ kind: 'pollination', remaining: 5 }] });
    expect(clickHeliotrope(pollinating).achievements).toContain('goldenPollen');
  });

  it('unlocks De justesse when the butterfly is caught in its last seconds', () => {
    const flying = (visible: number) => withState({ butterfly: { nextIn: 0, visible } });
    expect(catchButterfly(flying(8))!.state.achievements).not.toContain('justInTime');
    expect(catchButterfly(flying(1.5))!.state.achievements).toContain('justInTime');
  });

  it('unlocks Moisson tardive when a Season brings 50 Seeds at once', () => {
    const big = withState({
      allTimeLight: lightForSeeds(60),
      seeds: 10,
      seasons: 1,
      seasonSeconds: SEED_RIPENING_SECONDS,
    });
    expect(startNewSeason(big).achievements).toContain('lateHarvest');
    const small = withState({
      allTimeLight: lightForSeeds(30),
      seeds: 10,
      seasons: 1,
      seasonSeconds: SEED_RIPENING_SECONDS,
    });
    expect(startNewSeason(small).achievements).not.toContain('lateHarvest');
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
      seasonSeconds: SEED_RIPENING_SECONDS,
      achievements: ['light.3', 'light.6'],
    });
    const next = startNewSeason(state);
    expect(next.achievements).toEqual(['light.3', 'light.6', 'earlySowing', 'seasons.1']);
  });
});
