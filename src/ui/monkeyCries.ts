// The recorded monkey cries of the Options' easter egg (§6.3): short clips cut from freely
// licensed recordings (credits in sounds/monkeys/CREDITS.md), fetched only once the option is on.

/** URLs of the clips, hashed by the build so the service worker keeps them once fetched. */
export const CRY_URLS: string[] = Object.values(
  import.meta.glob<string>('./sounds/monkeys/*.mp3', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
);

/** Loudness of a cry at full intensity; the clips peak at -3 dB. */
export const CRY_GAIN = 0.1;

export interface CryVoice {
  /** Which clip plays. */
  index: number;
  /** Playback rate, ×0.8 to ×1.25: a higher, quicker cry or a lower, slower one. */
  rate: number;
  /** Gain, ×0.6 to ×1 of CRY_GAIN. */
  gain: number;
}

/** How the next cry sounds: a clip other than the last one, its pitch and its intensity drawn. */
export function cryVoice(
  count: number,
  last: number,
  random: () => number = Math.random,
): CryVoice {
  let index = Math.floor(random() * count);
  if (count > 1 && index === last) index = (index + 1 + Math.floor(random() * (count - 1))) % count;
  return { index, rate: 0.8 + random() * 0.45, gain: CRY_GAIN * (0.6 + random() * 0.4) };
}
