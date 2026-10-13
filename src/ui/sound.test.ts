import { CRY_GAIN, CRY_URLS, cryVoice } from './monkeyCries';
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

  it('ships the recorded cries and never plays the same one twice in a row', () => {
    expect(CRY_URLS.length).toBeGreaterThanOrEqual(6);
    let last = -1;
    let draws = 0;
    const random = () => ((draws = (draws * 7 + 3) % 11) + 0.5) / 11;
    for (let i = 0; i < 200; i++) {
      const voice = cryVoice(CRY_URLS.length, last, random);
      expect(voice.index).not.toBe(last);
      expect(voice.index).toBeGreaterThanOrEqual(0);
      expect(voice.index).toBeLessThan(CRY_URLS.length);
      expect(voice.rate).toBeGreaterThanOrEqual(0.8);
      expect(voice.rate).toBeLessThanOrEqual(1.25);
      expect(voice.gain).toBeGreaterThanOrEqual(CRY_GAIN * 0.6);
      expect(voice.gain).toBeLessThanOrEqual(CRY_GAIN);
      last = voice.index;
    }
  });

  it('plays a recorded cry once loaded, at its drawn rate', async () => {
    const started: number[] = [];
    class LoadingContext extends FakeContext {
      decodeAudioData = () => Promise.resolve({ duration: 1 });
      createBufferSource() {
        return {
          buffer: null,
          playbackRate: { value: 1 },
          connect: (node: unknown) => node,
          start() {
            started.push(this.playbackRate.value);
          },
        };
      }
    }
    vi.stubGlobal('fetch', () =>
      Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }),
    );
    const engine = new SoundEngine(LoadingContext as unknown as typeof AudioContext);
    await engine.loadCries(['a.mp3', 'b.mp3']);
    vi.unstubAllGlobals();
    const oscillators = FakeContext.oscillators;
    expect(engine.playCry(() => 0)).toBe(true);
    expect(FakeContext.oscillators).toBe(oscillators);
    expect(started).toEqual([0.8]);
  });
});
