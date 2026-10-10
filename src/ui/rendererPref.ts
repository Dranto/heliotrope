// Which renderer draws the map in this browser (docs/game-design.md §10.4): the enriched WebGL
// map where the device draws it well, otherwise the SVG scene; the player can choose either in
// the Options. A display choice, kept out of the save like the layout.
import { useSyncExternalStore } from 'react';

export type MapRenderer = 'svg' | 'pixi';

/** 'auto' until the player chooses in the Options. */
type Choice = MapRenderer | 'auto';

const KEY = 'heliotrope.layout.renderer';
const listeners = new Set<() => void>();

let fallback: Choice = 'auto';

function read(): Choice {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === '"pixi"' ? 'pixi' : stored === '"svg"' ? 'svg' : 'auto';
  } catch {
    return fallback;
  }
}

let capable: boolean | null = null;

/**
 * Whether the device has WebGL backed by a graphics card: browsers refuse the context when it
 * would only be emulated, slowly, by the processor. Asked once.
 */
export function drawsWebGLWell(): boolean {
  if (capable !== null) return capable;
  capable = false;
  if (typeof window === 'undefined' || !('WebGLRenderingContext' in window)) return capable;
  try {
    const canvas = document.createElement('canvas');
    const options = { failIfMajorPerformanceCaveat: true };
    const gl = (canvas.getContext('webgl2', options) ?? canvas.getContext('webgl', options)) as
      WebGLRenderingContext | WebGL2RenderingContext | null;
    capable = gl !== null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    capable = false;
  }
  return capable;
}

/** The renderer that draws the map, and whether the player chose it. */
export function mapRenderer(): { renderer: MapRenderer; chosen: boolean } {
  return resolve(read());
}

function resolve(choice: Choice): { renderer: MapRenderer; chosen: boolean } {
  if (choice !== 'auto') return { renderer: choice, chosen: true };
  return { renderer: drawsWebGLWell() ? 'pixi' : 'svg', chosen: false };
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

/** The map renderer, shared by every component that reads it. */
export function useMapRenderer(): { renderer: MapRenderer; chosen: boolean } {
  return resolve(useSyncExternalStore(subscribe, read, () => 'auto'));
}
