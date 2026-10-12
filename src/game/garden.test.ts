import { factorOf } from './bonuses';
import {
  canSow,
  CROPS,
  growGarden,
  growthSpeed,
  harvest,
  isCropUnlocked,
  isRipe,
  neighbourPlots,
  openPlots,
  possibleVarieties,
  RADISH_MIN,
  secondsToRipe,
  sow,
  SUNFLOWER_BUTTERFLY_SECONDS,
  varietyOf,
  VARIETIES,
  VARIETY_IDS,
} from './garden';
import { applyOfflineProgress } from './offline';
import { generatorMultiplier, lightPerSecond } from './production';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';
import { withAllIntroduced } from './introductions';

/** A new game whose mechanics are all introduced (§10.8), to test them directly. */
const openGame = (now: number) => withAllIntroduced(createInitialState(now));
function started(extra: Partial<GameState> = {}): GameState {
  const fresh = openGame(0);
  return { ...fresh, generators: { ...fresh.generators, pot: 1 }, ...extra };
}

function ripeAt(state: GameState, index: number, crop: keyof typeof CROPS): GameState {
  const plots = state.garden.plots.map((p, i) =>
    i === index ? { crop, grown: CROPS[crop].seconds } : p,
  );
  return { ...state, garden: { ...state.garden, plots } };
}

describe('Courtyard garden (§9.7, M14)', () => {
  it('opens three beds with the first pot, more as the game goes on', () => {
    expect(openPlots(started())).toBe(3);
    expect(openPlots(started({ seasons: 1 }))).toBe(4);
    expect(openPlots(started({ seasons: 2 }))).toBe(5);
    expect(canSow(openGame(0), 0, 'radish')).toBe(false);
    expect(canSow(started(), 3, 'radish')).toBe(false);
  });

  it('unlocks crops step by step', () => {
    expect(isCropUnlocked(started(), 'radish')).toBe(true);
    expect(isCropUnlocked(started(), 'sunflower')).toBe(false);
    expect(isCropUnlocked(started(), 'beans')).toBe(false);
    expect(isCropUnlocked(started({ seasons: 1 }), 'beans')).toBe(true);
    expect(isCropUnlocked(started({ seasons: 2 }), 'squash')).toBe(true);
  });

  it('grows a crop with elapsed time and never lets it wilt', () => {
    const sown = sow(started(), 0, 'radish');
    expect(sown.garden.plots[0]).toMatchObject({ crop: 'radish', grown: 0 });
    expect(sow(sown, 0, 'radish')).toBe(sown);
    const half = growGarden(sown, 90);
    expect(isRipe(half.garden.plots[0]!)).toBe(false);
    expect(secondsToRipe(half, half.garden.plots[0]!)).toBeCloseTo(90);
    const late = growGarden(half, 10_000);
    expect(isRipe(late.garden.plots[0]!)).toBe(true);
    expect(late.garden.plots[0]!.grown).toBe(CROPS.radish.seconds);
  });

  it('grows the same whether the time comes in one step or many', () => {
    const sown = sow(started(), 0, 'radish');
    let many = sown;
    for (let i = 0; i < 60; i++) many = growGarden(many, 1);
    expect(many.garden.plots[0]!.grown).toBeCloseTo(growGarden(sown, 60).garden.plots[0]!.grown);
  });

  it('grows during offline progress too', () => {
    const sown = { ...sow(started(), 0, 'radish'), lastUpdate: 0 };
    const { state } = applyOfflineProgress(sown, 10 * 60 * 1000);
    expect(isRipe(state.garden.plots[0]!)).toBe(true);
  });

  it('grows twice as fast under the summer shower, faster with the rain gardens', () => {
    expect(growthSpeed(started({ effects: [{ kind: 'shower', remaining: 30 }] }))).toBe(2);
    expect(growthSpeed(started({ parcels: ['rainGardens'] }))).toBe(1.25);
  });

  it('radishes give a puff of Light, never less than a few clicks', () => {
    const result = harvest(ripeAt(started(), 0, 'radish'), 0)!;
    expect(result.gain).toEqual({ kind: 'light', light: RADISH_MIN, water: 0 });
    expect(result.state.resources.light).toBe(RADISH_MIN);
    expect(result.state.garden.plots[0]!.crop).toBeNull();
    expect(result.state.garden.harvests).toBe(1);
    expect(result.state.achievements).toContain('harvests.1');
  });

  it('only harvests a ripe crop', () => {
    expect(harvest(sow(started(), 0, 'radish'), 0)).toBeNull();
    expect(harvest(started(), 0)).toBeNull();
  });

  it('sunflowers bring the Golden Butterfly at once', () => {
    const state = ripeAt(started({ seasons: 1 }), 0, 'sunflower');
    const next = harvest({ ...state, butterfly: { nextIn: 200, visible: 0 } }, 0)!;
    expect(next.state.butterfly.nextIn).toBe(SUNFLOWER_BUTTERFLY_SECONDS);
  });

  it('beans double rooftop gardens and greenhouses for a while', () => {
    const state = ripeAt(started({ seasons: 1 }), 0, 'beans');
    const next = harvest(state, 0)!.state;
    expect(next.effects.find((e) => e.kind === 'beans')?.remaining).toBe(20 * 60);
    expect(generatorMultiplier(next, 'greenhouse') / generatorMultiplier(state, 'greenhouse')).toBe(
      2,
    );
  });

  it('squashes give half an hour of Light and Water', () => {
    const fresh = started({ seasons: 2 });
    const state = ripeAt(
      {
        ...fresh,
        generators: { ...fresh.generators, pot: 50 },
        collectors: { ...fresh.collectors, roofTanks: 2 },
      },
      0,
      'squash',
    );
    const result = harvest(state, 0)!;
    expect(result.gain.kind).toBe('light');
    if (result.gain.kind !== 'light') return;
    expect(result.gain.light).toBeCloseTo(lightPerSecond(state) * 1800);
    expect(result.gain.water).toBeGreaterThan(0);
  });

  it('pairs every two different crops with one variety', () => {
    expect(varietyOf('radish', 'radish')).toBeNull();
    expect(varietyOf('beans', 'squash')).toBe('threeSisters');
    expect(varietyOf('squash', 'beans')).toBe('threeSisters');
    expect(new Set(VARIETY_IDS.map((id) => VARIETIES[id].parents.join()))).toHaveProperty(
      'size',
      10,
    );
  });

  it('looks for varieties in the beds beside, three beds a side', () => {
    expect(neighbourPlots(0)).toEqual([1]);
    expect(neighbourPlots(2)).toEqual([1]);
    expect(neighbourPlots(3)).toEqual([4]);
    const state = sow(sow(started({ seasons: 1 }), 1, 'radish'), 0, 'sunflower');
    expect(possibleVarieties(state, 0)).toEqual(['flameRadish']);
  });

  it('sometimes gives a variety, kept in the seed bank with its bonus', () => {
    let found: GameState | null = null;
    for (let seed = 0; seed < 50 && !found; seed++) {
      const state = ripeAt(sow(started({ seasons: 1, rngSeed: seed }), 1, 'beans'), 0, 'radish');
      const result = harvest(state, 0)!;
      if (result.variety) found = result.state;
    }
    expect(found).not.toBeNull();
    expect(found!.garden.varieties).toEqual(['blackRadish']);
    expect(found!.achievements).toContain('firstVariety');
    expect(generatorMultiplier(found!, 'pot')).toBeCloseTo(
      generatorMultiplier({ ...found!, garden: { ...found!.garden, varieties: [] } }, 'pot') * 1.5,
    );
  });

  it('a found variety is not given twice', () => {
    const base = sow(started({ seasons: 1 }), 1, 'beans');
    const state = { ...base, garden: { ...base.garden, varieties: ['blackRadish' as const] } };
    expect(possibleVarieties(ripeAt(state, 0, 'radish'), 0)).toEqual([]);
  });

  it('the varieties read as ordinary bonuses', () => {
    const state = started({ garden: { ...started().garden, varieties: ['redSunflower'] } });
    expect(factorOf(state, 'butterflyInterval')).toBeCloseTo(0.95);
  });

  it('the garden carries over to the next Season', () => {
    const state = sow(started(), 0, 'radish');
    const next = tick(state, 30);
    expect(next.garden.plots[0]!.grown).toBeCloseTo(30);
  });

  it('round-trips through a save and migrates a v15 save with bare beds', () => {
    const state = {
      ...sow(started(), 0, 'radish'),
      garden: {
        ...sow(started(), 0, 'radish').garden,
        harvests: 4,
        varieties: ['threeSisters' as const],
      },
    };
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.garden).toEqual(state.garden);
    const { garden: _garden, ...rest } = state;
    const old = deserialize(JSON.stringify({ ...rest, version: 15 }), 0)!;
    expect(old.garden.plots.every((p) => p.crop === null)).toBe(true);
    expect(old.garden.harvests).toBe(0);
  });

  it('a save cannot hold an unknown crop or more growth than the crop needs', () => {
    const raw = JSON.parse(serialize(started()));
    raw.garden.plots[0] = { crop: 'durian', grown: 5 };
    raw.garden.plots[1] = { crop: 'radish', grown: 1e9 };
    const loaded = deserialize(JSON.stringify(raw), 0)!;
    expect(loaded.garden.plots[0]!.crop).toBeNull();
    expect(loaded.garden.plots[1]!.grown).toBe(CROPS.radish.seconds);
  });
});
