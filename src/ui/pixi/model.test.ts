import {
  PHASE_SUN,
  appearScale,
  approachSun,
  blendCamera,
  easeInOut,
  hull,
  palette,
  shadowPolygon,
  sunAt,
  textureResolution,
} from './model';

describe('sun and shadows', () => {
  it('keeps the sun of the phase still with reduced motion', () => {
    expect(sunAt(3, 37, true)).toEqual(PHASE_SUN[3]);
  });

  it('swings the sun slowly around the phase position', () => {
    const base = PHASE_SUN[2];
    const angle = (s: { x: number; y: number }) => Math.atan2(s.y, s.x);
    const later = sunAt(2, 22.5, false);
    expect(Math.abs(angle(later) - angle(base))).toBeGreaterThan(0.1);
    expect(Math.abs(angle(later) - angle(base))).toBeLessThan(0.2);
    expect(sunAt(2, 0, false).x).toBeCloseTo(base.x);
    expect(sunAt(2, 90, false).x).toBeCloseTo(base.x);
  });

  it('eases the sun towards its target, whatever the frame rate', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 1, y: 1 };
    const oneStep = approachSun(from, to, 0.5);
    const twoSteps = approachSun(approachSun(from, to, 0.25), to, 0.25);
    expect(oneStep.x).toBeCloseTo(twoSteps.x);
    expect(oneStep.x).toBeGreaterThan(0);
    expect(oneStep.x).toBeLessThan(1);
  });

  it('casts a box shadow from the footprint along the sun', () => {
    const polygon = shadowPolygon([0, 0, 10, 4], 2, { x: 1, y: 1 });
    const points = Array.from({ length: polygon.length / 2 }, (_, i) => [
      polygon[2 * i],
      polygon[2 * i + 1],
    ]);
    // A box moved by (2, 2): the hull has the far corners of both boxes.
    expect(points).toEqual(
      expect.arrayContaining([
        [0, 0],
        [10, 0],
        [12, 6],
        [2, 6],
      ]),
    );
    expect(points).toHaveLength(6);
  });

  it('computes a convex hull without inner points', () => {
    expect(
      hull([
        [0, 0],
        [2, 0],
        [1, 1],
        [2, 2],
        [0, 2],
      ]),
    ).toHaveLength(4);
  });
});

describe('palette', () => {
  it('follows the season tint of the SVG scene', () => {
    expect(palette(2, 'autumn').foliage).toBe('#a65f3a');
    expect(palette(2, null).foliage).toBe('#2f6b4f');
    expect(palette(3, null).light).not.toBe(palette(1, null).light);
  });
});

describe('camera', () => {
  it('eases like the SVG camera transition', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(2)).toBe(1);
  });

  it('glides between two views, zooming evenly', () => {
    const from = { x: 0, y: 0, scale: 1 };
    const to = { x: 100, y: 50, scale: 4 };
    expect(blendCamera(from, to, 0)).toEqual(from);
    expect(blendCamera(from, to, 1)).toEqual(to);
    expect(blendCamera(from, to, 0.5).scale).toBeCloseTo(2);
  });
});

describe('textures', () => {
  it('draws sharp textures for the zoom and screen, within GPU limits', () => {
    expect(textureResolution(2.1, 1, 600)).toBe(2.5);
    expect(textureResolution(2.1, 2, 600)).toBe(4.5);
    // Never past what a 4096 px texture holds for the world.
    expect(textureResolution(5, 3, 600)).toBe(6.5);
    expect(textureResolution(0.2, 1, 600)).toBe(1);
  });
});

describe('entrance', () => {
  it('grows a new element past its size, then settles', () => {
    expect(appearScale(0)).toBeCloseTo(0.4);
    const peak = Math.max(...Array.from({ length: 90 }, (_, i) => appearScale(i / 100)));
    expect(peak).toBeGreaterThan(1);
    expect(appearScale(0.9)).toBe(1);
  });
});
