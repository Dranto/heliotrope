// Layout choices of this browser: the map view, the panels folded away, the side menu. They are
// display conveniences, kept out of the save so they never travel with an exported game.
import { useCallback, useState } from 'react';

const PREFIX = 'heliotrope.layout.';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Private windows and full storage only lose the convenience.
  }
}

/** A layout preference remembered in this browser, like `useState`. */
export function useLayoutPref<T>(key: string, fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState(() => read(key, fallback));
  const set = useCallback(
    (next: T) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );
  return [value, set];
}

/** Whether a panel is unfolded, remembered in this browser, and the switch that folds it. */
export function usePanelOpen(panel: string): [boolean, () => void] {
  const [open, setOpen] = useLayoutPref(`open.${panel}`, true);
  return [open, () => setOpen(!open)];
}
