import { CRY_SHAPES, lengthOf, monkeyCry, notesFor, SoundEngine, type SoundName } from './sound';

/** Just enough of the Web Audio API to count the notes played. */
class FakeContext {
  static oscillators = 0;
  currentTime = 0;
  state = 'running';
  destination = {};
  resume = () => Promise.resolve();
  createGain() {
    const param = {
      value: 1,
      setValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime() {},
    };
    return { gain: param, connect: (node: unknown) => node };
  }
  createOscillator() {
    FakeContext.oscillators++;
    const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
    return {
      type: 'sine',
      frequency: param,
      connect: (node: unknown) => node,
      start() {},
      stop() {},
    };
  }
}

describe('sounds', () => {
  beforeEach(() => {
    FakeContext.oscillators = 0;
  });

  it('keeps every sound short and soft', () => {
    const names: SoundName[] = [
      'click',
      'build',
      'upgrade',
      'restore',
      'project',
      'butterfly',
      'milestone',
      'season',
      'bird',
    ];
    for (const name of names) {
      for (const n of notesFor(name, 0.99)) {
        expect(n.gain).toBeLessThanOrEqual(0.07);
        expect(n.at + n.length).toBeLessThanOrEqual(3.5);
        expect(n.frequency).toBeGreaterThan(0);
      }
    }
  });

  it('plays one oscillator per note, and nothing when muted', () => {
    const engine = new SoundEngine(FakeContext as unknown as typeof AudioContext);
    engine.play('restore');
    expect(FakeContext.oscillators).toBe(notesFor('restore').length);
    engine.setVolume(0);
    engine.play('click');
    expect(FakeContext.oscillators).toBe(notesFor('restore').length);
  });

  it('stays silent without Web Audio', () => {
    expect(() => new SoundEngine(undefined).play('click')).not.toThrow();
  });

  it('draws every monkey cry shape, each with its own pitch, loudness and pace', () => {
    // The first draw picks the shape; the next ones set pitch, loudness and pace.
    const seeded = (first: number, rest: number) => {
      let calls = 0;
      return () => (calls++ === 0 ? first : rest);
    };
    const shapes = CRY_SHAPES.map((_, i) => monkeyCry(seeded((i + 0.5) / CRY_SHAPES.length, 0.5)));
    expect(new Set(shapes.map((notes) => JSON.stringify(notes))).size).toBe(CRY_SHAPES.length);
    for (const notes of shapes) {
      expect(notes.length).toBeGreaterThan(0);
      expect(lengthOf(notes)).toBeLessThanOrEqual(1.5);
      for (const n of notes) {
        expect(n.gain).toBeLessThanOrEqual(0.07);
        expect(n.frequency).toBeGreaterThan(0);
      }
    }
    const low = monkeyCry(seeded(0.25, 0));
    const high = monkeyCry(seeded(0.25, 0.99));
    expect(high[0]!.frequency).toBeGreaterThan(low[0]!.frequency);
    expect(high[0]!.gain).toBeGreaterThan(low[0]!.gain);
    expect(lengthOf(high)).toBeGreaterThan(lengthOf(low));
  });

  it('lets a new monkey cry in only once the last one is half over', () => {
    const engine = new SoundEngine(FakeContext as unknown as typeof AudioContext);
    expect(engine.playCry(() => 0.5)).toBe(true);
    const played = FakeContext.oscillators;
    expect(engine.playCry(() => 0.5)).toBe(false);
    expect(FakeContext.oscillators).toBe(played);
    const context = (engine as unknown as { context: FakeContext }).context;
    context.currentTime = 2;
    expect(engine.playCry(() => 0.5)).toBe(true);
    engine.setVolume(0);
    context.currentTime = 10;
    expect(engine.playCry()).toBe(false);
  });
});
