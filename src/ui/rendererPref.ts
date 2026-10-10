// Which renderer draws the map in this browser (docs/game-design.md §10.4): the SVG scene, or
// the experimental enriched WebGL one. A display choice, kept out of the save like the layout.
import { useSyncExternalStore } from 'react';

export type MapRenderer = 'svg' | 'pixi';

const KEY = 'heliotrope.layout.renderer';
const listeners = new Set<() => void>();

let fallback: MapRenderer = 'svg';

function read(): MapRenderer {
  try {
    return localStorage.getItem(KEY) === '"pixi"' ? 'pixi' : 'svg';
  } catch {
    return fallback;
  }
}

export function mapRenderer(): MapRenderer {
  return read();
}

export function setMapRenderer(value: MapRenderer): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private windows and full storage only lose the choice on reload.
    fallback = value;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The map renderer chosen in the Options, shared by every component that reads it. */
export function useMapRenderer(): MapRenderer {
  return useSyncExternalStore(subscribe, mapRenderer, () => 'svg');
}
