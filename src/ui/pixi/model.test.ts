import {
  PHASE_SUN,
  QUALITY_TIERS,
  frameCap,
  nextTier,
  tierResolution,
  appearScale,
  approachSun,
  blendCamera,
  channels,
  easeInOut,
  hull,
  lightStrength,
  palette,
  reliefWidth,
  shadowPolygon,
  sunAt,
  textureResolution,
  towardSun,
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

describe('light', () => {
  it('lights the edges facing the sun: against the shadows, a set width', () => {
    const [x, y] = towardSun(PHASE_SUN[3], 2);
    expect(Math.hypot(x, y)).toBeCloseTo(2);
    // Late afternoon: shadows fall to the south-east, the lit edges face the north-west.
    expect(x).toBeLessThan(0);
    expect(y).toBeLessThan(0);
  });

  it('keeps the relief about a world unit wide, between one pixel and a soft edge', () => {
    expect(reliefWidth(0.3)).toBe(1);
    expect(reliefWidth(2)).toBeCloseTo(2.4);
    expect(reliefWidth(12)).toBe(4);
  });

  it('grades a little less in winter light', () => {
    expect(lightStrength(palette(2, null))).toBe(1);
    expect(lightStrength(palette(2, 'winter'))).toBeLessThan(0.9);
  });

  it('reads colours as channels for the shaders', () => {
    expect(channels(0xff8000)).toEqual([1, 128 / 255, 0]);
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

describe('frame pacing and quality (performance plan, lot 2)', () => {
  it('lets two frames of a 60 Hz screen through the ambient limit', () => {
    const cap = frameCap(false);
    expect(Math.floor(2 * (1000 / 60))).toBeGreaterThanOrEqual(1000 / cap);
    expect(frameCap(true)).toBe(0);
  });

  it('lowers the resolution, then stops there', () => {
    expect(tierResolution(2, 0)).toBe(2);
    expect(tierResolution(2, 1)).toBe(1.5);
    expect(tierResolution(2, 2)).toBe(1);
    expect(tierResolution(1, 1)).toBe(1);
    expect(tierResolution(2, 3)).toBe(1);
  });

  it('steps down one tier when calm frames come too far apart', () => {
    const fine = Array.from({ length: 60 }, (_, i) => (i % 10 === 0 ? 120 : 33));
    const slow = Array.from({ length: 30 }, () => 70);
    expect(nextTier(fine, 32, 0)).toBe(0);
    expect(nextTier(slow, 32, 0)).toBe(1);
    expect(nextTier(slow, 32, QUALITY_TIERS - 1)).toBe(QUALITY_TIERS - 1);
    expect(nextTier(slow.slice(0, 5), 32, 0)).toBe(0);
    expect(nextTier(slow.slice(0, 8), 32, 0)).toBe(1);
  });
});
