// Day and night on the map (docs/game-design.md §9.6): decoration only, from the player's own
// clock. Production never depends on it, so nobody is punished for playing at night.

export type Daylight = 'day' | 'evening' | 'night';

/** Evening from 18 h, night from 21 h to 6 h, day otherwise. */
export function daylightOf(hour: number): Daylight {
  if (hour >= 21 || hour < 6) return 'night';
  if (hour >= 18) return 'evening';
  return 'day';
}
