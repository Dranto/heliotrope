// The texts of the current language (docs/game-design.md §14 Q1). The UI calls `setLanguage`
// from the saved settings before rendering, then reads every text through `t`.
import { setNumberLanguage, type Language } from '../game/format';
import { en } from './en';
import { fr, type Texts } from './fr';

export type { Texts, UpgradeText, GeneratorText } from './fr';

const TEXTS: Record<Language, Texts> = { fr, en };

/** Texts of the current language. A live binding: `setLanguage` swaps it. */
export let t: Texts = fr;

export function setLanguage(language: Language): void {
  t = TEXTS[language];
  setNumberLanguage(language);
}
