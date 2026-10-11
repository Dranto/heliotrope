// The optional reminders (docs/game-design.md §10.6, M17, decision D8): off by default, a
// notification when the Seeds become ripe or a crop of the garden is ready, only while the game
// is open in a hidden tab or a closed PWA window still running. The game never asks to come back
// at a set time.
import { useEffect, useRef } from 'react';
import { isRipe } from '../game/garden';
import { areSeedsRipe } from '../game/seasons';
import type { GameState } from '../game/state';
import { t } from '../i18n';

/** Whether this browser can show notifications at all. */
export function canNotify(): boolean {
  return typeof Notification === 'function';
}

/** Ask the browser for the permission; true when the reminders can be shown. */
export async function askReminders(): Promise<boolean> {
  if (!canNotify()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission().catch(() => 'denied')) === 'granted';
}

async function notify(title: string): Promise<void> {
  if (!canNotify() || Notification.permission !== 'granted') return;
  const options = {
    body: t.reminders.body,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    tag: title,
  };
  // An installed PWA shows it through its service worker, a tab directly.
  const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  if (registration) await registration.showNotification(title, options).catch(() => undefined);
  else new Notification(title, options);
}

function ripeBeds(state: GameState): number {
  return state.garden.plots.filter(isRipe).length;
}

/** Notifies, when the reminders are on and the page is hidden, of what just became ready. */
export function useReminders(state: GameState): void {
  const seeds = areSeedsRipe(state);
  const beds = ripeBeds(state);
  const before = useRef({ seeds, beds });
  const on = state.settings.reminders;
  useEffect(() => {
    const was = before.current;
    before.current = { seeds, beds };
    if (!on || document.visibilityState !== 'hidden') return;
    if (seeds && !was.seeds) void notify(t.reminders.seeds);
    if (beds > was.beds) void notify(t.reminders.crops);
  }, [on, seeds, beds]);
}
