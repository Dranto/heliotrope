// The music of the neighbourhood (docs/game-design.md §6.3, M17): generative, synthesised with the
// Web Audio API like the sounds (no audio file), on the same pentatonic scale so the sounds always
// fit in. A few slow notes on the Balcony, then one more voice for each phase, each neighbouring
// district and some sites of the Bioregion (drops for the wetlands, a low drone for the old
// forest). Tempo and colour follow the visual season and the evening. Without Web Audio (tests,
// old browsers) every call is a no-op.
import type { Phase, VisualSeason } from '../game/phases';
import type { Settings } from '../game/state';
import type { Daylight } from './daylight';

/** C major pentatonic from C4, in Hz: the sounds' scale an octave lower. */
const SCALE = [261.63, 293.66, 329.63, 392, 440];

/** Volume of the music until the player sets it, on a computer; a phone starts silent. */
export const DEFAULT_MUSIC = 0.35;

/** What the music listens to. */
export interface MusicScene {
  phase: Phase;
  /** Neighbouring districts restored (§6.4). */
  districts: number;
  /** The wetlands are raised (§7.4): drops of water. */
  drops: boolean;
  /** The old forest is raised (§7.4): a low drone. */
  drone: boolean;
  season: VisualSeason | null;
  daylight: Daylight;
}

export type VoiceKind = 'ground' | 'melody' | 'bells' | 'district' | 'drops' | 'drone';

export interface Voice {
  kind: VoiceKind;
  /** Octave factor over the scale: 0.5 an octave lower, 2 an octave higher. */
  register: number;
  /** The voice may play every this many beats. */
  every: number;
  /** Chance it plays when it may. */
  chance: number;
  gain: number;
  /** Beats the note rings. */
  length: number;
  type: OscillatorType;
}

/** The voices playing for a scene, the quietest base first. */
export function musicVoices(scene: MusicScene): Voice[] {
  const voices: Voice[] = [
    { kind: 'ground', register: 0.5, every: 2, chance: 0.8, gain: 0.05, length: 4, type: 'sine' },
  ];
  if (scene.phase >= 2) {
    voices.push({
      kind: 'melody',
      register: 1,
      every: 1,
      chance: 0.35,
      gain: 0.03,
      length: 1.5,
      type: 'triangle',
    });
  }
  if (scene.phase >= 3) {
    voices.push({
      kind: 'bells',
      register: 2,
      every: 1,
      chance: 0.2,
      gain: 0.016,
      length: 3,
      type: 'sine',
    });
  }
  for (let i = 0; i < scene.districts; i++) {
    voices.push({
      kind: 'district',
      register: [1, 0.5, 2][i % 3]!,
      every: 1 + (i % 3),
      chance: 0.15,
      gain: 0.014,
      length: 2,
      type: i % 2 === 0 ? 'triangle' : 'sine',
    });
  }
  if (scene.drops) {
    voices.push({
      kind: 'drops',
      register: 4,
      every: 1,
      chance: 0.25,
      gain: 0.012,
      length: 0.3,
      type: 'sine',
    });
  }
  if (scene.drone) {
    voices.push({
      kind: 'drone',
      register: 0.25,
      every: 8,
      chance: 1,
      gain: 0.03,
      length: 9,
      type: 'sine',
    });
  }
  return voices;
}

const SEASON_BEAT: Record<VisualSeason, number> = {
  spring: 0.9,
  summer: 0.8,
  autumn: 1.05,
  winter: 1.3,
};
const DAYLIGHT_SLOWER: Record<Daylight, number> = { day: 1, evening: 1.15, night: 1.35 };

/** Seconds per beat: livelier in summer, slower in winter and in the evening. */
export function beatSeconds(scene: Pick<MusicScene, 'season' | 'daylight'>): number {
  return (
    (scene.season ? SEASON_BEAT[scene.season] : SEASON_BEAT.spring) *
    DAYLIGHT_SLOWER[scene.daylight]
  );
}

const SEASON_CUTOFF: Record<VisualSeason, number> = {
  spring: 2600,
  summer: 3200,
  autumn: 2000,
  winter: 1400,
};
const DAYLIGHT_CUTOFF: Record<Daylight, number> = { day: 1, evening: 0.8, night: 0.6 };

/** Hz of the low-pass filter: brighter in summer, darker in winter and at night. */
export function colourCutoff(scene: Pick<MusicScene, 'season' | 'daylight'>): number {
  return (
    (scene.season ? SEASON_CUTOFF[scene.season] : SEASON_CUTOFF.spring) *
    DAYLIGHT_CUTOFF[scene.daylight]
  );
}

/** The volume the music plays at: muted with the sounds, silent on a phone until chosen. */
export function musicVolume(settings: Pick<Settings, 'music' | 'muted'>, phone: boolean): number {
  if (settings.muted) return 0;
  return settings.music ?? (phone ? 0 : DEFAULT_MUSIC);
}

/** The degrees and pitch of the notes a voice plays at one beat; empty when it rests. */
export function notesAt(voice: Voice, beat: number, random: () => number): number[] {
  if (beat % voice.every !== 0 || random() >= voice.chance) return [];
  if (voice.kind === 'drone') return [SCALE[0]! * voice.register, SCALE[3]! * voice.register];
  const degree = Math.floor(random() * SCALE.length);
  return [SCALE[degree]! * voice.register];
}

type AudioContextClass = typeof AudioContext;

/** Seconds of notes scheduled ahead, and how often the scheduler wakes. */
const LOOKAHEAD = 1.2;
const WAKE_MS = 250;

export class MusicEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private volume = 0;
  private paused = false;
  private scene: MusicScene | null = null;
  private voices: Voice[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private beat = 0;
  private nextBeat = 0;

  constructor(private readonly Context: AudioContextClass | undefined = globalThis.AudioContext) {}

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.4);
    }
    this.update();
  }

  setScene(scene: MusicScene): void {
    this.scene = scene;
    this.voices = musicVoices(scene);
    if (this.filter && this.context) {
      this.filter.frequency.setTargetAtTime(colourCutoff(scene), this.context.currentTime, 2);
    }
  }

  /** A hidden tab keeps quiet. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.update();
  }

  /** Browsers keep audio suspended until a click or a key press: call this from one. */
  resume(): void {
    if (this.context?.state === 'suspended') void this.context.resume().catch(() => undefined);
  }

  private update(): void {
    const playing = this.volume > 0 && !this.paused && this.scene !== null;
    if (playing && this.timer === undefined) {
      const context = this.ensureContext();
      if (!context) return;
      this.resume();
      this.nextBeat = context.currentTime + 0.1;
      this.timer = setInterval(() => this.schedule(), WAKE_MS);
    } else if (!playing && this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private schedule(): void {
    const context = this.context;
    if (!context || !this.filter || !this.scene) return;
    const seconds = beatSeconds(this.scene);
    // After a long pause (a suspended context), start again from now rather than catch up.
    if (this.nextBeat < context.currentTime) this.nextBeat = context.currentTime + 0.05;
    while (this.nextBeat < context.currentTime + LOOKAHEAD) {
      for (const voice of this.voices) {
        for (const frequency of notesAt(voice, this.beat, Math.random)) {
          this.play(context, voice, frequency, this.nextBeat, voice.length * seconds);
        }
      }
      this.beat++;
      this.nextBeat += seconds;
    }
  }

  private play(context: AudioContext, voice: Voice, frequency: number, at: number, length: number) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = voice.type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (voice.kind === 'drops')
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, at + length);
    // Slow swells for the drone and the ground, soft plucks for the rest.
    const attack = voice.kind === 'drone' || voice.kind === 'ground' ? length / 3 : 0.02;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(voice.gain, at + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(envelope).connect(this.filter!);
    oscillator.start(at);
    oscillator.stop(at + length + 0.05);
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
    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.scene ? colourCutoff(this.scene) : 2600;
    this.filter.connect(this.master).connect(this.context.destination);
    return this.context;
  }
}

export const music = new MusicEngine();
