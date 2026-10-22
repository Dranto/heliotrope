import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_FAMILIES } from './achievements';
import {
  DECOR_IDS,
  DECOR_SLOTS,
  FLOWER_COLOURS,
  FLOWER_CONDITIONS,
  familyColour,
  isDecorId,
  isFlowerColour,
  validDecorSlots,
} from './decor';

describe('validDecorSlots', () => {
  it('gives empty slots for anything that is not an array', () => {
    for (const raw of [undefined, null, 'bench', 3, { 0: 'bench' }]) {
      expect(validDecorSlots(raw)).toEqual(Array(DECOR_SLOTS).fill(null));
    }
  });

  it('keeps known pieces in place and empties unknown ones', () => {
    const slots = validDecorSlots(['bench', 'statue', null, 'fountain', 7]);
    expect(slots).toHaveLength(DECOR_SLOTS);
    expect(slots.slice(0, 5)).toEqual(['bench', null, null, 'fountain', null]);
    expect(slots.slice(5)).toEqual([null, null, null]);
  });

  it('drops slots past DECOR_SLOTS', () => {
    const raw = Array(DECOR_SLOTS + 3).fill('planter');
    expect(validDecorSlots(raw)).toEqual(Array(DECOR_SLOTS).fill('planter'));
  });
});

describe('decor type guards', () => {
  it('accept only the listed ids', () => {
    for (const id of DECOR_IDS) expect(isDecorId(id)).toBe(true);
    for (const colour of FLOWER_COLOURS) expect(isFlowerColour(colour)).toBe(true);
    for (const value of ['', 'Bench', 'purple', null, undefined, 1]) {
      expect(isDecorId(value)).toBe(false);
      expect(isFlowerColour(value)).toBe(false);
    }
  });
});

describe('familyColour', () => {
  it('gives each Milestone family its own colour, unlocked by that family', () => {
    const colours = ACHIEVEMENT_FAMILIES.map(familyColour);
    expect(new Set(colours).size).toBe(ACHIEVEMENT_FAMILIES.length);
    for (const family of ACHIEVEMENT_FAMILIES) {
      expect(FLOWER_CONDITIONS[familyColour(family)]).toEqual({ kind: 'milestoneFamily', family });
    }
  });
});
