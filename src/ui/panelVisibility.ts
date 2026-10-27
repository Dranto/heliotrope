// Which side panels the stylesheet hides (App.css §10.3 and M25), so the app does not render them
// at every tick for nothing (docs/performance-plan.md, lot 1). Keep in step with those rules.
import { useSyncExternalStore } from 'react';

/** The panels of the side menu that can sleep while hidden. */
export type SleepingPanel =
  'cooperatives' | 'restoration' | 'garden' | 'orchard' | 'greatWorks' | 'bioregion';

/** The tab of the phone layout (§10.3) that shows each panel. */
const PANEL_TAB: Record<SleepingPanel, 'build' | 'improve' | 'living' | 'region'> = {
  cooperatives: 'build',
  restoration: 'improve',
  garden: 'living',
  orchard: 'living',
  greatWorks: 'region',
  bioregion: 'region',
};

/** The layer of the side menu (M25) that shows each panel on medium screens. */
const TAB_LAYER = { build: 'city', improve: 'city', living: 'living', region: 'region' } as const;

export type Screen = 'phone' | 'medium' | 'wide';

const PHONE = '(max-width: 40rem)';
const MEDIUM = '(min-width: 40.01rem) and (max-width: 109.99rem)';

/** Whether the stylesheet hides `panel` on this screen with this tab open. */
export function isPanelHidden(panel: SleepingPanel, screen: Screen, tab: string): boolean {
  if (screen === 'wide') return false;
  if (screen === 'phone') return tab !== PANEL_TAB[panel];
  const layer = tab in TAB_LAYER ? TAB_LAYER[tab as keyof typeof TAB_LAYER] : 'city';
  return layer !== TAB_LAYER[PANEL_TAB[panel]];
}

function screenNow(): Screen {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'wide';
  if (window.matchMedia(PHONE).matches) return 'phone';
  return window.matchMedia(MEDIUM).matches ? 'medium' : 'wide';
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const queries = [window.matchMedia(PHONE), window.matchMedia(MEDIUM)];
  queries.forEach((q) => q.addEventListener?.('change', listener));
  return () => queries.forEach((q) => q.removeEventListener?.('change', listener));
}

/** The screen size class, as the stylesheet's media queries see it. */
export function useScreen(): Screen {
  return useSyncExternalStore(subscribe, screenNow, () => 'wide');
}
