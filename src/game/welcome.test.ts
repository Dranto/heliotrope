import { guideStep } from './guide';
import { isReportEmpty, offlineReport } from './offline';
import { deserialize, serialize } from './save';
import { createInitialState, DEFAULT_SETTINGS, type GameState } from './state';
import { buyGenerator, buyUpgrade, clickHeliotrope } from './tick';
import { availableUpgrades } from './production';

const fresh = () => createInitialState(0);

describe('The guided first minute (§10.6, M17)', () => {
  it('points at the flower, then the first building, then the first upgrade', () => {
    let state = fresh();
    expect(guideStep(state)).toEqual({ kind: 'flower' });
    state = clickHeliotrope(state);
    // Not enough Light for a pot yet: nothing to point at.
    expect(guideStep(state)).toBeNull();
    state = { ...state, resources: { ...state.resources, light: 1e3 } };
    expect(guideStep(state)).toEqual({ kind: 'building', generator: 'pot' });
    state = buyGenerator(state, 'pot');
    state = { ...state, resources: { ...state.resources, light: 1e6 } };
    const upgrade = guideStep(state);
    expect(upgrade?.kind).toBe('upgrade');
    if (upgrade?.kind !== 'upgrade') return;
    expect(availableUpgrades(state).map((u) => u.id)).toContain(upgrade.upgrade);
    expect(guideStep(buyUpgrade(state, upgrade.upgrade))).toBeNull();
  });

  it('never shows after the first Season', () => {
    expect(guideStep({ ...fresh(), seasons: 1 })).toBeNull();
    expect(guideStep({ ...fresh(), cycles: 1 })).toBeNull();
  });
});

describe('The return in images (§9.1, M17)', () => {
  const before: GameState = {
    ...fresh(),
    generators: { ...fresh().generators, pot: 10, balconyPanel: 2 },
    garden: {
      ...fresh().garden,
      plots: [
        { crop: 'radish', grown: 10 },
        { crop: 'radish', grown: 1e6 },
        ...fresh().garden.plots.slice(2),
      ],
    },
  };

  it('lists the buildings that grew, the beds that ripened and the Seeds', () => {
    const after: GameState = {
      ...before,
      generators: { ...before.generators, pot: 14 },
      garden: {
        ...before.garden,
        plots: before.garden.plots.map((p) => ({ ...p, grown: p.grown + 1e6 })),
      },
      seasonSeconds: 3600,
    };
    const report = offlineReport(before, after);
    expect(report).toEqual({
      built: ['pot'],
      ripened: [0],
      seedsRipened: true,
      seasons: 0,
      weathers: [],
    });
    expect(isReportEmpty(report)).toBe(false);
    expect(isReportEmpty(offlineReport(before, before))).toBe(true);
  });

  it('after Seasons started by the sower, shows every building standing', () => {
    const after: GameState = {
      ...before,
      seasons: 2,
      generators: { ...fresh().generators, pot: 3 },
      seasonSeconds: 0,
    };
    const report = offlineReport(before, after);
    expect(report.built).toEqual(['pot']);
    expect(report.seasons).toBe(2);
    expect(report.seedsRipened).toBe(false);
  });
});

describe('Music and reminder settings (§6.3, §10.6, M17)', () => {
  it('default to music chosen by the device and no reminder, and survive a save', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ music: null, reminders: false });
    const state = { ...fresh(), settings: { ...DEFAULT_SETTINGS, music: 0.6, reminders: true } };
    expect(deserialize(serialize(state), 0)!.settings).toEqual(state.settings);
    const raw = JSON.parse(serialize(state));
    raw.version = 18;
    raw.settings = { ...raw.settings, music: 4, reminders: 'yes' };
    expect(deserialize(JSON.stringify(raw), 0)!.settings).toMatchObject({
      music: null,
      reminders: false,
    });
  });
});
