// Light and matter of the enriched map (docs/game-design.md §10.4), as two GPU filters:
// - the grade, over the whole world: a soft S-curve, shadows leaning to lilac ink and lights to
//   the phase's gold, an uneven wash of pigment fixed to the ground and a fine paper grain, so the
//   map reads as one painted sheet rather than flat vector shapes;
// - the relief, over what stands up (buildings, generators, trees): a rim of sunlight on the edges
//   that face the sun and a soft shade on the far edges, so every roof and crown gets its volume.
// Pixi-only and visual: the SVG fallback stays as it is.
import { Filter, GlProgram, UniformGroup } from 'pixi.js';
import type { Camera } from '../neighbourhood';
import {
  INK,
  channels,
  lightStrength,
  reliefWidth,
  towardSun,
  type Palette,
  type Sun,
} from './model';

/** The default filter vertex shader, also handing the fragment its position on the screen. */
const VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vScreen;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    vScreen = position;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    gl_Position = vec4(position, 0.0, 1.0);
    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

const GRADE = `in vec2 vTextureCoord;
in vec2 vScreen;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec3 uCamera;
uniform vec3 uWarm;
uniform vec3 uCool;
uniform float uStrength;
uniform float uGrain;
uniform vec2 uViewport;
uniform vec2 uSunSide;

float hash(vec2 p)
{
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p.yx + 19.19);
    return fract((p.x + p.y) * p.x);
}

float wash(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main(void)
{
    vec4 colour = texture(uTexture, vTextureCoord);
    if (colour.a <= 0.0) {
        finalColor = colour;
        return;
    }
    vec3 c = colour.rgb / colour.a;
    float luma = dot(c, vec3(0.299, 0.587, 0.114));

    // Deeper darks and mid-tones and a little more colour: depth without harshness. Only the
    // darkening half of an S-curve: the map is pale and pastel, its lights must not burn out.
    c = mix(c, min(c, c * c * (3.0 - 2.0 * c)), 0.6 * uStrength);
    float mid = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(mid), c, 1.0 + 0.16 * uStrength);

    // Shadows lean to lilac ink, lights to the gold of the hour.
    float dark = 1.0 - smoothstep(0.08, 0.62, luma);
    float bright = smoothstep(0.55, 1.0, luma);
    c = mix(c, c * (0.78 + 0.44 * uCool), dark * 0.55 * uStrength);
    c = mix(c, 1.0 - (1.0 - c) * (1.0 - uWarm * 0.32), bright * 0.15 * uStrength);

    // The sun's side of the map warms and brightens without washing out, the far side cools.
    vec2 across = vScreen / uViewport - 0.5;
    float side = clamp(dot(across, uSunSide) * 1.3 + 0.5, 0.0, 1.0);
    float body = (1.0 - bright * 0.8) * uStrength;
    c *= mix(vec3(1.0) - (1.0 - uCool) * 0.08, vec3(1.0) + uWarm * 0.1, side) * body
        + vec3(1.0 - body);

    // Pigment settling unevenly on the ground, fixed to the world as the camera moves.
    vec2 world = (vScreen - uCamera.xy) / uCamera.z;
    float pigment = wash(world / 42.0) * 0.6 + wash(world / 13.0 + 7.3) * 0.4;
    // Pale ground and haze stay clean: the wash and the grain show mostly in the colours.
    float clean = 1.0 - bright * 0.65;
    c *= 1.0 + (pigment - 0.5) * 0.11 * uStrength * clean;
    c.r += (pigment - 0.5) * 0.012 * uStrength * clean;

    // Paper grain, fine and still, in screen pixels.
    float grain = hash(floor(gl_FragCoord.xy)) - 0.5;
    float fibre = wash(gl_FragCoord.xy / 2.6) - 0.5;
    c += (grain * 0.55 + fibre * 0.45) * uGrain * clean;

    finalColor = vec4(clamp(c, 0.0, 1.0) * colour.a, colour.a);
}
`;

const RELIEF = `in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
// Same precision as in the vertex shader, or the program does not link.
uniform highp vec4 uInputSize;
uniform vec2 uToward;
uniform vec3 uRim;
uniform float uRimStrength;
uniform float uShade;

void main(void)
{
    vec4 colour = texture(uTexture, vTextureCoord);
    if (colour.a <= 0.0) {
        finalColor = colour;
        return;
    }
    vec2 step = uToward * uInputSize.zw;
    float lit = clamp(colour.a - texture(uTexture, vTextureCoord + step).a, 0.0, 1.0) * 0.6
        + clamp(colour.a - texture(uTexture, vTextureCoord + step * 2.0).a, 0.0, 1.0) * 0.4;
    float far = clamp(colour.a - texture(uTexture, vTextureCoord - step).a, 0.0, 1.0) * 0.6
        + clamp(colour.a - texture(uTexture, vTextureCoord - step * 2.0).a, 0.0, 1.0) * 0.4;
    vec3 c = colour.rgb / colour.a;
    // Sunlit rim, blended as a screen so dark roofs and pale ones both catch it.
    c = mix(c, 1.0 - (1.0 - c) * (1.0 - uRim), lit * uRimStrength);
    c *= 1.0 - far * uShade;
    finalColor = vec4(c * colour.a, colour.a);
}
`;

export class GradeFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: GRADE, name: 'heliotrope-grade' }),
      resources: {
        grade: new UniformGroup({
          uCamera: { value: new Float32Array([0, 0, 1]), type: 'vec3<f32>' },
          uWarm: { value: new Float32Array(channels(0xffecba)), type: 'vec3<f32>' },
          uCool: { value: new Float32Array(channels(INK)), type: 'vec3<f32>' },
          uStrength: { value: 1, type: 'f32' },
          uGrain: { value: 0.07, type: 'f32' },
          uViewport: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
          uSunSide: { value: new Float32Array([-0.7, -0.7]), type: 'vec2<f32>' },
        }),
      },
      resolution: 'inherit',
      antialias: 'inherit',
    });
  }

  private get uniforms() {
    return (this.resources.grade as UniformGroup).uniforms as {
      uCamera: Float32Array;
      uWarm: Float32Array;
      uCool: Float32Array;
      uStrength: number;
      uGrain: number;
      uViewport: Float32Array;
      uSunSide: Float32Array;
    };
  }

  /** The screen's size and the side the sun lights from. */
  light(sun: Sun, width: number, height: number): void {
    this.uniforms.uViewport.set([Math.max(1, width), Math.max(1, height)]);
    this.uniforms.uSunSide.set(towardSun(sun, 1));
  }

  /** Where the world lies on screen: its origin's position and the zoom. */
  place(x: number, y: number, scale: number): void {
    this.uniforms.uCamera.set([x, y, scale]);
  }

  tone(palette: Palette): void {
    this.uniforms.uWarm.set(channels(palette.light));
    this.uniforms.uStrength = lightStrength(palette);
  }
}

export class ReliefFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: RELIEF, name: 'heliotrope-relief' }),
      resources: {
        relief: new UniformGroup({
          uToward: { value: new Float32Array([-1, -1]), type: 'vec2<f32>' },
          uRim: { value: new Float32Array(channels(0xfff1c8)), type: 'vec3<f32>' },
          uRimStrength: { value: 0.55, type: 'f32' },
          uShade: { value: 0.3, type: 'f32' },
        }),
      },
      resolution: 'inherit',
      antialias: 'inherit',
      padding: 4,
    });
  }

  private get uniforms() {
    return (this.resources.relief as UniformGroup).uniforms as {
      uToward: Float32Array;
      uRim: Float32Array;
      uRimStrength: number;
      uShade: number;
    };
  }

  /** Lights the edges facing `sun`, in the colour of the hour, at the camera's zoom. */
  light(sun: Sun, camera: Camera, palette: Palette): void {
    this.uniforms.uToward.set(towardSun(sun, reliefWidth(camera.scale)));
    this.uniforms.uRim.set(channels(palette.sun));
    this.uniforms.uRimStrength = 0.8 * lightStrength(palette);
  }
}
