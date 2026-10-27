import { useEffect, useRef } from 'react';
import { GENERATOR_IDS } from '../game/generators';
import { phaseOf } from '../game/phases';
import type { GameState } from '../game/state';
import { VISIT_KINDS } from '../game/visits';
import { CRY_URLS } from './monkeyCries';
import { sounds, type SoundName } from './sound';

/** Seconds between two birdsongs, once the neighbourhood wakes up (phase 2). */
const BIRD_MIN_SECONDS = 25;
const BIRD_MAX_SECONDS = 60;

function units(state: GameState): number {
  return GENERATOR_IDS.reduce((sum, id) => sum + state.generators[id], 0);
}

/** What the sounds listen to: counters that only grow within a Season. */
function counters(state: GameState): Record<Exclude<SoundName, 'bird'>, number> {
  return {
    click: state.clicks,
    build: units(state),
    upgrade: state.upgrades.length,
    restore: state.parcels.length,
    project: state.projects.length,
    // A welcomed visit (§9.6) trills like a caught butterfly.
    butterfly: state.butterflies + VISIT_KINDS.reduce((sum, kind) => sum + state.visits[kind], 0),
    milestone: state.achievements.length,
    season: state.seasons,
    harvest: state.garden.harvests,
  };
}

/** Rarest first: when one action changes several counters, only the most special one sounds. */
const PRIORITY = [
  'season',
  'restore',
  'project',
  'milestone',
  'butterfly',
  'harvest',
  'upgrade',
  'build',
  'click',
] as const;

/**
 * Plays the discreet sounds of §10.2 by watching the game state: a pluck per click, a soft chord
 * per purchase, an arpeggio when a parcel is restored, birds from phase 2. Nothing plays for
 * what was already there when the game loaded.
 */
export function useSounds(state: GameState): void {
  const { volume, muted, monkeyCries } = state.settings;
  useEffect(() => sounds.setVolume(muted ? 0 : volume), [volume, muted]);
  useEffect(() => {
    if (monkeyCries) void sounds.loadCries(CRY_URLS);
  }, [monkeyCries]);

  const previous = useRef(counters(state));
  useEffect(() => {
    const now = counters(state);
    const before = previous.current;
    previous.current = now;
    const changed = PRIORITY.find((name) => now[name] > before[name]);
    if (changed === 'click' && monkeyCries) sounds.playCry();
    else if (changed) sounds.play(changed, changed === 'click' ? Math.random() : 0);
  }, [state, monkeyCries]);

  const awake = phaseOf(state) >= 2 && !muted && volume > 0;
  useEffect(() => {
    if (!awake) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const seconds = BIRD_MIN_SECONDS + Math.random() * (BIRD_MAX_SECONDS - BIRD_MIN_SECONDS);
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') sounds.play('bird', Math.random());
        schedule();
      }, seconds * 1000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [awake]);
}
