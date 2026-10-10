import { afterEach, describe, expect, it, vi } from 'vitest';

/** A fresh copy of the module, which asks the device about WebGL only once. */
async function load() {
  vi.resetModules();
  return import('./rendererPref');
}

describe('map renderer choice (§10.4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('draws the WebGL map by default where the graphics card draws it', async () => {
    vi.stubGlobal('WebGLRenderingContext', function WebGLRenderingContext() {});
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ getExtension: () => null } as never);
    const { mapRenderer } = await load();
    expect(mapRenderer()).toEqual({ renderer: 'pixi', chosen: false });
    // Slow emulated WebGL is refused, so those devices keep the SVG map.
    expect(getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: true });
  });

  it('keeps the SVG map where WebGL would be slow or missing', async () => {
    vi.stubGlobal('WebGLRenderingContext', function WebGLRenderingContext() {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { mapRenderer } = await load();
    expect(mapRenderer()).toEqual({ renderer: 'svg', chosen: false });
  });

  it('follows the choice made in the options', async () => {
    const { mapRenderer, setMapRenderer } = await load();
    setMapRenderer('pixi');
    expect(mapRenderer()).toEqual({ renderer: 'pixi', chosen: true });
    setMapRenderer('svg');
    expect(mapRenderer()).toEqual({ renderer: 'svg', chosen: true });
  });
});
