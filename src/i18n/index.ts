// The texts of the current language (docs/game-design.md §14 Q1). The UI calls `setLanguage`
// from the saved settings before rendering, then reads every text through `t`. French is in the
// main bundle; English is fetched the first time it is chosen (docs/performance-plan.md, lot 4).
import { setNumberLanguage, type Language } from '../game/format';
import { fr, type Texts } from './fr';

export type { Texts, UpgradeText, GeneratorText } from './fr';

const loaded: Partial<Record<Language, Texts>> = { fr };
const loading: Partial<Record<Language, Promise<void>>> = {};
const listeners = new Set<() => void>();

/** Texts of the current language. A live binding: `setLanguage` swaps it. */
export let t: Texts = fr;
let shown: Language = 'fr';

/** Fetches a language's texts once; resolves when `setLanguage` can show them. */
export function loadLanguage(language: Language): Promise<void> {
  if (loaded[language]) return Promise.resolve();
  loading[language] ??= import('./en').then(({ en }) => {
    loaded.en = en;
    listeners.forEach((listener) => listener());
  });
  return loading[language]!;
}

/**
 * Shows `language` when its texts are here; otherwise keeps the current ones, fetches them and
 * tells the subscribers (see `subscribeTexts`) once they arrive.
 */
export function setLanguage(language: Language): void {
  const texts = loaded[language];
  if (!texts) {
    // Offline before the texts were ever cached: the game stays in the current language until the
    // next start, without an error at every render.
    loadLanguage(language).catch(() => {});
    return;
  }
  t = texts;
  shown = language;
  setNumberLanguage(language);
}

/** The language of the texts on screen, which lags a choice until its texts arrive. */
export function shownLanguage(): Language {
  return shown;
}

/** Called when a language's texts arrive, so the UI renders again with them. */
export function subscribeTexts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** How many languages are loaded: changes when one arrives (for useSyncExternalStore). */
export function textsVersion(): number {
  return Object.keys(loaded).length;
}
