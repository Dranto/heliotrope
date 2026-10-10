import { notesFor, SoundEngine, type SoundName } from './sound';

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
});
