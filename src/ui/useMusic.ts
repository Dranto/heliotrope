import { useEffect, useState } from 'react';
import { phaseOf, visualSeason } from '../game/phases';
import type { GameState } from '../game/state';
import { daylightOf } from './daylight';
import { music, musicVolume } from './music';

/** A touch screen without a mouse: the music stays off until the player turns it on. */
function isPhone(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

function useHour(): number {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return hour;
}

/** Plays the music of the neighbourhood (§6.3) from the game state and the Options. */
export function useMusic(state: GameState): void {
  const volume = musicVolume(state.settings, isPhone());
  useEffect(() => music.setVolume(volume), [volume]);

  const phase = phaseOf(state);
  const districts = state.districts.length;
  const drops = state.sites.wetlands > 0;
  const drone = state.sites.oldForest > 0;
  const season = visualSeason(state);
  const daylight = daylightOf(useHour());
  useEffect(
    () => music.setScene({ phase, districts, drops, drone, season, daylight }),
    [phase, districts, drops, drone, season, daylight],
  );

  useEffect(() => {
    const resume = () => music.resume();
    const visibility = () => music.setPaused(document.visibilityState === 'hidden');
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
}
