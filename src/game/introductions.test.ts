import {
  FEATURE_IDS,
  INTRO_GAP_SECONDS,
  createIntroState,
  isFeatureId,
  isIntroduced,
  validIntro,
  withAllIntroduced,
} from './introductions';

describe('the mechanics introduced one at a time', () => {
  it('starts with nothing introduced', () => {
    expect(createIntroState()).toEqual({ introduced: [], sinceLast: 0 });
    expect(isIntroduced({ intro: createIntroState() }, FEATURE_IDS[0])).toBe(false);
  });

  it('recognises only the known mechanics', () => {
    for (const id of FEATURE_IDS) expect(isFeatureId(id)).toBe(true);
    expect(isFeatureId('journal')).toBe(false);
    expect(isFeatureId('')).toBe(false);
    expect(isFeatureId(3)).toBe(false);
    expect(isFeatureId(null)).toBe(false);
  });

  it('marks every mechanic introduced, without an arrival still running', () => {
    const state = withAllIntroduced({ intro: createIntroState(), other: 1 });
    expect(state.other).toBe(1);
    expect(state.intro.introduced).toEqual([...FEATURE_IDS]);
    expect(state.intro.sinceLast).toBe(INTRO_GAP_SECONDS);
    for (const id of FEATURE_IDS) expect(isIntroduced(state, id)).toBe(true);
  });
});

describe('a saved introduction state', () => {
  it('is refused when it is not an object with a list', () => {
    expect(validIntro(undefined)).toBeNull();
    expect(validIntro(null)).toBeNull();
    expect(validIntro('garden')).toBeNull();
    expect(validIntro({ sinceLast: 3 })).toBeNull();
    expect(validIntro({ introduced: 'garden', sinceLast: 3 })).toBeNull();
  });

  it('keeps the known mechanics once each, in their order', () => {
    const [a, b] = FEATURE_IDS;
    expect(validIntro({ introduced: [b, 'journal', a, b, 7, a], sinceLast: 5 })).toEqual({
      introduced: [b, a],
      sinceLast: 5,
    });
  });

  it('falls back to a full gap when the time since the last one is unusable', () => {
    for (const sinceLast of [undefined, '5', -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validIntro({ introduced: [], sinceLast })?.sinceLast).toBe(INTRO_GAP_SECONDS);
    }
    expect(validIntro({ introduced: [], sinceLast: 0 })?.sinceLast).toBe(0);
  });
});
