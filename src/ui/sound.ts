// Discreet sounds (docs/game-design.md §1, §10.2), synthesised with the Web Audio API so the game
// ships no audio files. Every sound is short, soft and tuned to one pentatonic scale, so they
// never clash when they overlap. Without Web Audio (tests, old browsers) every call is a no-op.

/** C major pentatonic, in Hz, from C5. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

export type SoundName =
  | 'click'
  | 'build'
  | 'upgrade'
  | 'restore'
  | 'project'
  | 'butterfly'
  | 'milestone'
  | 'season'
  | 'harvest'
  | 'work'
  | 'alliance'
  | 'greet'
  | 'bird';

interface Note {
  /** Hz. */
  frequency: number;
  /** Seconds after the sound starts. */
  at: number;
  /** Seconds the note rings. */
  length: number;
  gain: number;
  type?: OscillatorType;
  /** Hz the pitch glides to. */
  glide?: number;
}

const note = (degree: number, at: number, length: number, gain: number, type?: OscillatorType) => ({
  frequency: SCALE[degree]!,
  at,
  length,
  gain,
  type,
});

/** The notes of each sound. `variant` (0 to 1) shifts the click so repeated clicks sing. */
export function notesFor(name: SoundName, variant = 0): Note[] {
  switch (name) {
    case 'click':
      return [note(Math.floor(variant * 5), 0, 0.25, 0.07)];
    case 'build':
      return [note(2, 0, 0.35, 0.07, 'triangle'), note(4, 0.07, 0.45, 0.06, 'triangle')];
    case 'upgrade':
      return [note(5, 0, 0.4, 0.05), note(7, 0.06, 0.4, 0.045), note(9, 0.12, 0.6, 0.04)];
    case 'restore':
      return [0, 2, 4, 5, 7, 9].map((degree, i) => note(degree, i * 0.11, 1.6, 0.06, 'triangle'));
    case 'project':
      return [
        note(3, 0, 1.2, 0.06),
        { frequency: SCALE[3]! * 2.76, at: 0, length: 0.6, gain: 0.015 },
        note(5, 0.18, 1.2, 0.05),
      ];
    case 'butterfly':
      return [9, 8, 7, 9].map((degree, i) => note(degree, i * 0.07, 0.3, 0.035));
    case 'milestone':
      return [note(4, 0, 0.8, 0.05), note(7, 0.14, 1, 0.05)];
    case 'season':
      return [0, 2, 4, 7].map((degree, i) => note(degree, i * 0.25, 2.4, 0.05, 'triangle'));
    // M25: a crop or a fruit picked, a stage of a great work or a hive, an alliance woken.
    case 'harvest':
      return [note(4, 0, 0.3, 0.06, 'triangle'), note(6, 0.09, 0.5, 0.05, 'triangle')];
    case 'work':
      return [note(0, 0, 1.4, 0.06, 'triangle'), note(4, 0.1, 1.4, 0.05), note(7, 0.2, 1.6, 0.04)];
    case 'alliance':
      return [note(5, 0, 1, 0.045), note(7, 0.12, 1, 0.04), note(9, 0.24, 1.4, 0.035)];
    // M35: a species greeted on the map, two light notes rising.
    case 'greet':
      return [note(6, 0, 0.35, 0.035), note(8, 0.08, 0.5, 0.03)];
    case 'bird': {
      const base = 2600 + variant * 900;
      return [0, 0.16, 0.3].map((at, i) => ({
        frequency: base + i * 120,
        glide: base + 700,
        at,
        length: 0.09,
        gain: 0.012,
      }));
    }
  }
}

type AudioContextClass = typeof AudioContext;

export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.5;

  constructor(private readonly Context: AudioContextClass | undefined = globalThis.AudioContext) {}

  /** 0 silences every sound. */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.05);
    }
  }

  play(name: SoundName, variant = 0): void {
    if (this.volume <= 0) return;
    const context = this.ensureContext();
    if (!context || !this.master) return;
    // Browsers keep audio suspended until the first click or key press.
    if (context.state === 'suspended') void context.resume().catch(() => undefined);
    const start = context.currentTime + 0.01;
    for (const n of notesFor(name, variant)) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = n.type ?? 'sine';
      oscillator.frequency.setValueAtTime(n.frequency, start + n.at);
      if (n.glide) {
        oscillator.frequency.exponentialRampToValueAtTime(n.glide, start + n.at + n.length);
      }
      // Soft attack, long exponential release: a plucked or struck sound, never a beep.
      envelope.gain.setValueAtTime(0.0001, start + n.at);
      envelope.gain.exponentialRampToValueAtTime(n.gain, start + n.at + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + n.at + n.length);
      oscillator.connect(envelope).connect(this.master);
      oscillator.start(start + n.at);
      oscillator.stop(start + n.at + n.length + 0.05);
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (!this.Context) return null;
    try {
      this.context = new this.Context();
    } catch {
      return null;
    }
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.context.destination);
    return this.context;
  }
}

export const sounds = new SoundEngine();
