import {
  beatSeconds,
  colourCutoff,
  DEFAULT_MUSIC,
  musicVoices,
  musicVolume,
  notesAt,
  type MusicScene,
} from './music';
import { returnMarks, returnSweeps } from './returnMap';

const scene = (patch: Partial<MusicScene> = {}): MusicScene => ({
  phase: 1,
  districts: 0,
  drops: false,
  drone: false,
  season: null,
  daylight: 'day',
  ...patch,
});

describe('the music of the neighbourhood (§6.3, M17)', () => {
  it('adds a voice with each phase, each district and the wetlands and old forest', () => {
    expect(musicVoices(scene()).map((v) => v.kind)).toEqual(['ground']);
    expect(musicVoices(scene({ phase: 3 })).map((v) => v.kind)).toEqual([
      'ground',
      'melody',
      'bells',
    ]);
    expect(musicVoices(scene({ phase: 3, districts: 8 }))).toHaveLength(11);
    const kinds = musicVoices(scene({ drops: true, drone: true })).map((v) => v.kind);
    expect(kinds).toEqual(['ground', 'drops', 'drone']);
  });

  it('slows down in winter and in the evening, and darkens at night', () => {
    expect(beatSeconds(scene({ season: 'summer' }))).toBeLessThan(
      beatSeconds(scene({ season: 'winter' })),
    );
    expect(beatSeconds(scene({ daylight: 'evening' }))).toBeGreaterThan(beatSeconds(scene()));
    expect(colourCutoff(scene({ daylight: 'night' }))).toBeLessThan(colourCutoff(scene()));
  });

  it('plays notes on the scale, resting off its beats', () => {
    const [ground] = musicVoices(scene());
    expect(notesAt(ground!, 1, () => 0)).toEqual([]);
    expect(notesAt(ground!, 2, () => 0.99)).toEqual([]);
    expect(notesAt(ground!, 2, () => 0)).toEqual([261.63 / 2]);
    const drone = musicVoices(scene({ drone: true })).at(-1)!;
    expect(notesAt(drone, 8, () => 0)).toHaveLength(2);
  });

  it('is soft on a computer, silent on a phone, until the player chooses', () => {
    expect(musicVolume({ music: null, muted: false }, false)).toBe(DEFAULT_MUSIC);
    expect(musicVolume({ music: null, muted: false }, true)).toBe(0);
    expect(musicVolume({ music: 0.8, muted: false }, true)).toBe(0.8);
    expect(musicVolume({ music: 0.8, muted: true }, false)).toBe(0);
  });
});

describe('the return in images on the map (§9.1, M17)', () => {
  it('marks each building, each ripe bed, then the heliotrope', () => {
    const marks = returnMarks({
      built: ['pot', 'arcology'],
      ripened: [2],
      seedsRipened: true,
      seasons: 0,
      weathers: [],
    });
    expect(marks.map((m) => m.kind)).toEqual(['built', 'built', 'ripe', 'seeds']);
    expect(returnSweeps(60)).toBe(1);
    expect(returnSweeps(8 * 3600)).toBe(4);
  });
});
