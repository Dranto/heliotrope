// The enriched WebGL map (docs/game-design.md §10.4), drawn with PixiJS from the same plan and
// game data as the SVG scene. Detailed SVG drawings become textures; the GPU adds what SVG
// cannot afford: soft shadows cast by a moving sun, drifting cloud shadows, living water, glints
// on glass, a warm bloom and pollen in the air. Visual only: it never touches the game state.
import type { LandscapeId } from '../../game/cityData';
import {
  Application,
  BlurFilter,
  CanvasSource,
  ColorMatrixFilter,
  Container,
  DisplacementFilter,
  Graphics,
  Sprite,
  Texture,
  TilingSprite,
  isWebGLSupported,
} from 'pixi.js';
import type { CollectorId, SiteId } from '../../game/bioregion';
import type { GeneratorId } from '../../game/generators';
import type { ParcelId } from '../../game/parcels';
import type { Phase, VisualSeason } from '../../game/phases';
import type { UpgradeId } from '../../game/upgrades';
import {
  ARCOLOGY_SITE,
  BUILDINGS,
  CAR_PARKS,
  FARM_SITES,
  GARDEN_ROOFS,
  GREENHOUSE_SITES,
  MIRROR_TOWER,
  MIRRORS,
  PANEL_SPOTS,
  PLANTER,
  POT_SPOTS,
  STREETS,
  TREES,
  WORLD,
  centre,
  clickLevel,
  upgradeLevel,
  visibleElements,
  type Box,
  type Camera,
} from '../neighbourhood';
import { CANALS, LAND, RAIN, RIVER, RIVER_NORTH, RIVER_SOUTH, landShown } from '../bioregionMap';
import { PARCEL_PLACES } from '../restorationMap';
import {
  arcologyRingArt,
  buildingArt,
  farmArt,
  footbridgeArt,
  gardenArt,
  greenhouseArt,
  groundArt,
  hash,
  mirrorArt,
  outskirtsTileArt,
  panelArt,
  planterArt,
  potArt,
  riverBanksArt,
  riverPath,
  svgDocument,
  towerArt,
  treeArt,
  type Art,
  type ArtContext,
} from './art';
import {
  CAMERA_GLIDE,
  appearScale,
  approachSun,
  blendCamera,
  easeInOut,
  palette,
  shadowPolygon,
  sunAt,
  textureResolution,
  type Palette,
  type Sun,
} from './model';
import { mapPicture } from '../mapPicture';
import { Snapshots } from './snapshot';
import { mapSources, type SourceGroup } from './sources';

/** A restored parcel this renderer draws itself: in its first future, one of PIXI_PARCELS. */
function drawsItself(props: MapProps, id: ParcelId): boolean {
  return props.parcels.includes(id) && !props.seconds?.includes(id);
}

/** Everything the map shows, as the SVG scene receives it. */
export interface MapProps {
  generators: Record<GeneratorId, number>;
  upgrades: readonly UpgradeId[];
  parcels: readonly ParcelId[];
  /** Parcels in their second future (§6.5): taken from the SVG scene, like the others. */
  seconds?: readonly ParcelId[];
  phase: Phase;
  season: VisualSeason | null;
  greenness: number;
  reduced: boolean;
  camera: Camera;
  width: number;
  height: number;
  sites: Record<SiteId, number>;
  collectors: Record<CollectorId, number>;
  /** Water is being gathered (§7.4): a shower crosses the land. */
  raining: boolean;
  /** The Bioregion is open: the land around the city is drawn. */
  bioregion: boolean;
  /** The landscape of the sister city lived in (§7.6), drawn on the land; none at home. */
  landscape?: LandscapeId | null;
  /** Gives up on devices that would draw it slowly, so the SVG map stays: the automatic choice. */
  strict?: boolean;
}

/** Shadows a little longer than the SVG scene's: real depth, now that their edges are soft. */
const SHADOW_LENGTH = 1.6;

/** Arcology terraces appear at these units owned, as in the SVG scene. */
const ARCOLOGY_RINGS = [1, 3, 6, 12, 25];

/** Synergies (§5.3) send golden motes between the two generators they link. */
const FLOWS: Record<string, [number, number, number, number, number, number, number, number]> = {
  sharedCompost: [273, 111, 273, 150, 268, 160, 268, 195],
  usefulShade: [342, 190, 360, 165, 400, 158, 446, 156],
  recoveredHeat: [513, 386, 440, 360, 340, 340, 271, 365],
};

/** Outskirts tile, as in the SVG scene: one grey block on the street grid. */
const OUTSKIRTS_TILE = {
  width: STREETS.vertical[1] - STREETS.vertical[0],
  height: STREETS.horizontal[1] - STREETS.horizontal[0],
  buildings: [
    [32, 30, 76, 52],
    [118, 30, 80, 40],
    [32, 92, 56, 48],
    [126, 80, 72, 60],
  ] as Box[],
};
const OUTSKIRTS_REACH = 1400;

type Group = 'buildings' | GeneratorId | 'planter' | 'river' | 'bridges' | SourceGroup;

/** One drawn element of the map: a texture placed in the world, and the shadow it casts. */
interface Item {
  key: string;
  group: Group;
  art: () => Art | null;
  /** Where the drawing's origin goes, for drawings made around (0, 0). */
  at?: [number, number];
  rotation?: number;
  scale?: [number, number];
  shadow?: Shadow;
  /** Size of the golden ring of its entrance. */
  ring?: number;
  /** Where that ring is drawn, when not at the drawing's centre. */
  ringAt?: [number, number];
  /** Unveiled by a circle widening from a point, instead of growing. */
  unveil?: { x: number; y: number; reach: number };
  /** Drawn in place, without an entrance. */
  still?: boolean;
  /** Most pixels per world unit of its texture. */
  maxRes?: number;
}

type Shadow =
  | { kind: 'box'; box: Box; height: number; radius?: number }
  | { kind: 'circle'; x: number; y: number; r: number; height: number; squash?: number };

interface Placed {
  item: Item;
  sprite: Sprite;
  textureKey: string | null;
  base: { x: number; y: number };
  born: number | null;
  /** The circle unveiling it, during its entrance. */
  mask?: Graphics;
}

interface Mote {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

const GENERATORS_DRAWN: GeneratorId[] = [
  'rooftopGarden',
  'balconyPanel',
  'pot',
  'greenhouse',
  'verticalFarm',
  'mirrorPlant',
  'arcology',
  'urbanCanopy',
];

/** Turns an SVG drawing into a mipmapped GPU texture. */
async function rasterize(art: Art, res: number): Promise<Texture> {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDocument(art, res))}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || Math.max(1, Math.round(art.box[2] * res));
  canvas.height = image.naturalHeight || Math.max(1, Math.round(art.box[3] * res));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const source = new CanvasSource({ resource: canvas, autoGenerateMipmaps: true });
  return new Texture({ source });
}

/** A soft round glow drawn once on a canvas: white centre fading out. */
function glowTexture(
  size = 128,
  stops: [number, number][] = [
    [0, 1],
    [0.35, 0.5],
    [1, 0],
  ],
) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  for (const [offset, alpha] of stops) gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

/** A band of light for glints sweeping over glass. */
function bandTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 8;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 128, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.42, 'rgba(255,255,255,0.15)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.58, 'rgba(255,255,255,0.15)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 8);
  return Texture.from(canvas);
}

/** Smooth noise for the water's ripples, tiling. */
function noiseTexture(size = 128): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const n1 = Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u) * 0.3;
      const n2 = Math.cos(v * 3 + Math.sin(u * 2) * 1.5) * 0.5 + Math.cos(u * 4 - v) * 0.3;
      const i = (y * size + x) * 4;
      image.data[i] = 128 + n1 * 90;
      image.data[i + 1] = 128 + n2 * 90;
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = Texture.from(canvas);
  texture.source.addressMode = 'repeat';
  return texture;
}

/** Light ripples on water: soft curved strokes, tiling. */
function rippleTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 96;
  const context = canvas.getContext('2d')!;
  context.strokeStyle = 'rgba(255,255,255,0.55)';
  context.lineCap = 'round';
  for (const [x, y, w] of [
    [10, 12, 16],
    [38, 30, 14],
    [18, 52, 20],
    [44, 70, 12],
    [8, 84, 10],
  ] as const) {
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + w / 2, y - 4, x + w, y);
    context.stroke();
  }
  const texture = Texture.from(canvas);
  texture.source.addressMode = 'repeat';
  return texture;
}

/** Full-screen gradient washing the warm light in from the sun's side. */
function daylightTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.25)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return Texture.from(canvas);
}

/** Edges fading to the cream of the page, and a light haze at the top: depth. */
function vignetteTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(128, 128, 96, 128, 128, 182);
  gradient.addColorStop(0, 'rgba(251,246,236,0)');
  gradient.addColorStop(1, 'rgba(251,246,236,0.32)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return Texture.from(canvas);
}

/**
 * Haze over the far countryside, as in the SVG scene: clear around the city, fading into the
 * cream of the page towards the edges of the land.
 */
function hazeTexture(): Texture {
  const [x, y, w, h] = LAND;
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = Math.round((400 * h) / w);
  const k = canvas.width / w;
  const context = canvas.getContext('2d')!;
  context.translate((WORLD.width / 2 - x) * k, (WORLD.height / 2 - y) * k);
  context.scale(1, 0.8);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1400 * k);
  gradient.addColorStop(0.72, 'rgba(251,246,236,0)');
  gradient.addColorStop(1, 'rgba(251,246,236,0.75)');
  context.fillStyle = gradient;
  context.fillRect(-canvas.width * 2, -canvas.height * 3, canvas.width * 4, canvas.height * 6);
  return Texture.from(canvas);
}

/** A stroked path as SVG, for the water courses drawn with Pixi's Graphics. */
function stroke(d: string, width: number, colour: string, cap = 'round'): string {
  return `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${Math.max(1, width)}" stroke-linecap="${cap}"/>`;
}

/** Seconds a restored parcel takes to be unveiled, as in the SVG scene. */
const UNVEIL = 2.4;

/** One crossing of the land by the shower, as in the SVG scene. */
const SHOWER_PERIOD = 70;

/** Point on a cubic Bézier curve. */
function bezier(c: readonly number[], t: number): [number, number] {
  const u = 1 - t;
  const x = u * u * u * c[0]! + 3 * u * u * t * c[2]! + 3 * u * t * t * c[4]! + t * t * t * c[6]!;
  const y = u * u * u * c[1]! + 3 * u * u * t * c[3]! + 3 * u * t * t * c[5]! + t * t * t * c[7]!;
  return [x, y];
}

/** Points along the river bed, for its sparkles. */
function riverPoints(): [number, number][] {
  const [x, y, w, h] = PARCEL_PLACES.river;
  const mid = x + w / 2;
  return Array.from({ length: 30 }, (_, i) => {
    const t = (i + 0.5) / 30;
    const k = t * 9;
    const wave = Math.sin((k % 1) * Math.PI) * 3 * (Math.floor(k) % 2 ? -1 : 1);
    return [mid + wave + ((i * 37) % 5) - 2.5, y + h * t];
  });
}

export class MapRenderer {
  private app = new Application();
  private ready = false;
  private destroyed = false;

  // Layers, from the ground up. `world` follows the camera; `screen` stays put.
  private world = new Container();
  private outskirts!: TilingSprite;
  private ground = new Sprite();
  private groundKey: string | null = null;
  private water = new Container();
  /** Shadows cast on the ground by buildings, and by trees on whatever lies under them. */
  private shadows = new Graphics();
  private shadowLayer = new Container();
  private treeShadows = new Graphics();
  private treeShadowLayer = new Container();
  /** The blurred shadows are kept as textures, redrawn only when the sun has moved. */
  private shadowCaches = [new Container(), new Container()];
  private shadowRes = 0;
  private items = new Container();
  private groups = new Map<Group, Container>();
  private effects = new Container();
  private clouds = new Container();
  private screen = new Container();
  private daylight!: Sprite;
  private bloom!: Sprite;
  private vignette!: Sprite;
  private pollen = new Container();
  private motes: Mote[] = [];
  /** The Bioregion around the city, under it: the plain and its sites, its water, haze, showers. */
  private land = new Container();
  private landWater = new Container();
  private landDisplacement!: Sprite;
  private landRipples!: TilingSprite;
  private landSparkles: { sprite: Sprite; offset: number }[] = [];
  private haze!: Sprite;
  private shower = new Container();
  private rain = new Graphics();
  private snapshots: Snapshots | null;

  private textures = new Map<
    string,
    { promise: Promise<Texture>; texture?: Texture; refs: number }
  >();
  private placed = new Map<string, Placed>();
  private rings: { g: Graphics; x: number; y: number; size: number; born: number }[] = [];
  private glints: { sprite: Sprite; box: Box; offset: number }[] = [];
  private sparkles: { sprite: Sprite; offset: number }[] = [];
  private flowMotes: { sprite: Sprite; curve: readonly number[]; offset: number }[] = [];
  private mirrorGlints: { sprite: Sprite; offset: number }[] = [];
  private towerGlow!: Sprite;
  private beams = new Graphics();
  private hearth!: Sprite;
  private displacement!: Sprite;
  private ripples!: TilingSprite;
  private glow!: Texture;
  private band!: Texture;

  private props: MapProps | null = null;
  private signature = '';
  private res = 0;
  private time = 0;
  private sun: Sun = { x: 0, y: 1 };
  private drawnSun: Sun = { x: NaN, y: NaN };
  private palette: Palette = palette(1, null);
  private camera: Camera | null = null;
  private glide: { from: Camera; to: Camera; start: number } | null = null;
  private levels = new Map<GeneratorId, number>();
  private flashes = new Map<GeneratorId, number>();
  private synced = false;
  private shadowsDirty = true;
  private pending = 0;

  /** `sources`: the hidden SVG holding the drawings taken from the SVG scene (see sources.tsx). */
  constructor(sources: SVGSVGElement | null = null) {
    this.snapshots = sources ? new Snapshots(sources) : null;
  }

  /**
   * Starts WebGL in `host`. False when the device cannot, or, when `strict`, when it would only
   * draw it slowly (no graphics card): the SVG map stays.
   */
  async init(host: HTMLElement, strict = false): Promise<boolean> {
    try {
      if (!isWebGLSupported(strict)) return false;
      await this.app.init({
        width: this.props?.width ?? 300,
        height: this.props?.height ?? 150,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        preference: 'webgl',
        eventFeatures: { move: false, globalMove: false, click: false, wheel: false },
        // The canvas is a picture: Tab must keep moving through the game's own controls.
        ...({ accessibilityOptions: { enabledByDefault: false, activateOnTab: false } } as object),
      });
    } catch {
      return false;
    }
    if (this.destroyed) {
      this.app.destroy(true, { children: true, texture: true });
      return false;
    }
    this.ready = true;
    // The photo mode reads the canvas right after drawing it (§6.5).
    mapPicture.renderNow = () => this.app.render();
    this.app.stage.eventMode = 'none';
    host.appendChild(this.app.canvas);
    this.build();
    this.app.ticker.add((ticker) => this.frame(ticker.deltaMS / 1000));
    const props = this.props;
    // Size and draw for the latest props, which may have changed while WebGL started.
    this.props = null;
    if (props) this.update(props);
    return true;
  }

  private build(): void {
    this.glow = glowTexture();
    this.band = bandTexture();
    this.outskirts = new TilingSprite({ texture: Texture.WHITE, width: 10, height: 10 });
    this.outskirts.alpha = 0.75;
    this.shadowLayer.addChild(this.shadows);
    this.shadowCaches[0]!.addChild(this.shadowLayer);
    this.shadowCaches[1]!.addChild(this.treeShadowLayer);
    this.shadowLayer.filters = [new BlurFilter({ strength: 3, quality: 3 })];
    this.treeShadowLayer.addChild(this.treeShadows);
    this.treeShadowLayer.filters = [new BlurFilter({ strength: 2, quality: 2 })];
    for (const group of [
      'river',
      'parcels',
      'buildings',
      'rooftopGarden',
      'balconyPanel',
      'pot',
      'greenhouse',
      'verticalFarm',
      'mirrorPlant',
      'arcology',
      'bridges',
      'planter',
      'cityWater',
      'urbanCanopy',
    ] as Group[]) {
      const container = new Container();
      this.groups.set(group, container);
      // Buildings cast on the ground, under every roof; trees on roofs and gardens too.
      if (group === 'buildings') this.items.addChild(this.shadowCaches[0]!);
      if (group === 'urbanCanopy') this.items.addChild(this.shadowCaches[1]!);
      // Water lies over the river's banks and in the arcology's heart, under its footbridges.
      if (group === 'bridges') this.items.addChild(this.water);
      this.items.addChild(container);
    }
    this.hearth = new Sprite(this.glow);
    this.hearth.anchor.set(0.5);
    this.hearth.tint = 0xf4c063;
    this.hearth.blendMode = 'screen';
    this.hearth.position.set(PLANTER.x, PLANTER.y);
    this.hearth.width = 78;
    this.hearth.height = 54;
    this.beams.blendMode = 'add';
    // The receiver of the mirror tower glows with the light sent to it.
    this.towerGlow = new Sprite(this.glow);
    this.towerGlow.anchor.set(0.5);
    this.towerGlow.tint = 0xffd88a;
    this.towerGlow.blendMode = 'add';
    this.towerGlow.position.set(MIRROR_TOWER.x, MIRROR_TOWER.y);
    this.towerGlow.visible = false;
    this.effects.addChild(this.beams, this.hearth, this.towerGlow);

    // Water: a living surface whose ripples bend the reflections.
    this.displacement = new Sprite(noiseTexture());
    this.displacement.texture.source.addressMode = 'repeat';
    this.displacement.scale.set(0.5);
    this.ripples = new TilingSprite({ texture: rippleTexture(), width: 30, height: WORLD.height });
    this.ripples.blendMode = 'add';
    this.ripples.alpha = 0.55;

    // Cloud shadows drifting slowly over the city.
    for (let i = 0; i < 3; i++) {
      const cloud = new Sprite(this.glow);
      cloud.anchor.set(0.5);
      cloud.tint = 0x3b3328;
      cloud.alpha = 0.12;
      cloud.width = 260 + i * 60;
      cloud.height = 140 + i * 30;
      this.clouds.addChild(cloud);
    }

    this.daylight = new Sprite(daylightTexture());
    this.bloom = new Sprite(this.glow);
    this.bloom.anchor.set(0.5);
    this.bloom.blendMode = 'add';
    this.vignette = new Sprite(vignetteTexture());
    this.screen.addChild(this.daylight, this.bloom, this.pollen, this.vignette);

    this.buildLand();
    this.world.addChild(
      this.outskirts,
      this.land,
      this.ground,
      this.items,
      this.effects,
      this.clouds,
    );
    this.app.stage.addChild(this.world, this.screen);
  }

  /** Layers of the Bioregion, in the SVG scene's order. */
  private buildLand(): void {
    for (const group of ['landGround', 'landSites', 'landWater', 'landTop'] as const) {
      if (group === 'landWater') {
        this.land.addChild(this.landWater);
        continue;
      }
      const container = new Container();
      this.groups.set(group, container);
      this.land.addChild(container);
    }
    this.landDisplacement = new Sprite(this.displacement.texture);
    // Broader swells than in the city: the countryside is seen from afar.
    this.landDisplacement.scale.set(2);
    const [x, y, w, h] = LAND;
    this.landRipples = new TilingSprite({ texture: this.ripples.texture, width: w, height: h });
    this.landRipples.position.set(x, y);
    this.landRipples.blendMode = 'add';
    this.landRipples.alpha = 0.55;
    this.haze = new Sprite(hazeTexture());
    this.haze.position.set(x, y);
    this.haze.width = w;
    this.haze.height = h;
    // The shower: its soft shadow on the land, and streaks of rain falling through it.
    const cloud = new Sprite(this.glow);
    cloud.anchor.set(0.5);
    cloud.tint = 0x3c5a6e;
    cloud.alpha = 0.3;
    cloud.width = 620;
    cloud.height = 360;
    this.rain.svg(
      `<svg><path d="${RAIN}" fill="none" stroke="#6ea0b9" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    );
    this.shower.addChild(cloud, this.rain);
    this.land.addChild(this.haze, this.shower);
    this.land.visible = false;
  }

  /** Shows the scene for `props`. Cheap when nothing visible changed. */
  update(props: MapProps): void {
    const previous = this.props;
    this.props = props;
    if (!this.ready) return;
    if (!previous || previous.width !== props.width || previous.height !== props.height) {
      this.app.renderer.resize(props.width, props.height);
      this.layoutScreen();
    }
    this.moveCamera(props.camera, props.reduced || !this.synced);
    const res = textureResolution(
      props.camera.scale,
      this.app.renderer.resolution,
      Math.max(WORLD.width, WORLD.height),
    );
    const signature = JSON.stringify([
      props.generators,
      props.upgrades,
      props.parcels,
      props.seconds,
      props.phase,
      props.season,
      props.greenness,
      props.reduced,
      props.sites,
      props.collectors,
      props.raining,
      props.bioregion,
      res,
    ]);
    if (signature !== this.signature) {
      this.signature = signature;
      this.res = res;
      this.palette = palette(props.phase, props.season);
      this.sync(props);
    }
    this.requestRender();
  }

  private context(): ArtContext {
    const sun = sunAt(this.props!.phase, 0, true);
    return { palette: this.palette, lit: sun.x >= 0 ? 1 : -1, greenness: this.props!.greenness };
  }

  /** Lists every element the map shows for `props`, with its drawing and its shadow. */
  private itemsFor(props: MapProps, ctx: ArtContext): Item[] {
    const { generators, upgrades } = props;
    const level = (id: GeneratorId) => upgradeLevel(upgrades, id);
    const gardens = visibleElements(generators.rooftopGarden, GARDEN_ROOFS.length);
    const greenhouses = visibleElements(generators.greenhouse, GREENHOUSE_SITES.length);
    const farms = visibleElements(generators.verticalFarm, FARM_SITES.length);
    const pots = visibleElements(generators.pot, POT_SPOTS.length);
    const panels = visibleElements(generators.balconyPanel, PANEL_SPOTS.length);
    const mirrors = visibleElements(generators.mirrorPlant, MIRRORS.length, 2);
    const trees = visibleElements(generators.urbanCanopy, TREES.length, 4);
    const rings = ARCOLOGY_RINGS.filter((owned) => generators.arcology >= owned).length;
    const sedum = drawsItself(props, 'livingRoofs');
    const kitchen = props.parcels.includes('livingRoofs') && !sedum;
    const items: Item[] = [];
    const gardenRoofs = GARDEN_ROOFS.slice(0, gardens);

    for (const { box, storeys } of [...BUILDINGS, ...FARM_SITES.slice(farms)]) {
      const bare = gardenRoofs.some((g) => inside(g, box));
      items.push({
        key: `b:${box.join()}`,
        group: 'buildings',
        art: () => buildingArt(ctx, box, storeys, { bare, sedum, kitchen }),
        shadow: { kind: 'box', box, height: storeys },
      });
    }
    for (const box of gardenRoofs) {
      items.push({
        key: `g:${box.join()}`,
        group: 'rooftopGarden',
        art: () => gardenArt(ctx, box, level('rooftopGarden')),
        ring: Math.max(box[2], box[3]) / 2,
      });
    }
    for (const [x, y] of PANEL_SPOTS.slice(0, panels)) {
      items.push({
        key: `p:${x},${y}`,
        group: 'balconyPanel',
        art: () => panelArt(ctx, 0, 0, level('balconyPanel')),
        at: [x, y],
        ring: 8,
      });
    }
    for (const [x, y] of POT_SPOTS.slice(0, pots)) {
      items.push({
        key: `pot:${x},${y}`,
        group: 'pot',
        art: () => potArt(ctx, 0, 0, level('pot')),
        at: [x, y],
        ring: 6,
      });
    }
    for (const box of GREENHOUSE_SITES.slice(0, greenhouses)) {
      const [x, y, w, h] = box;
      items.push({
        key: `gh:${box.join()}`,
        group: 'greenhouse',
        art: () => greenhouseArt(ctx, box, level('greenhouse')),
        shadow: { kind: 'box', box: [x + 4, y + 4, w - 8, h - 8], height: 1.4, radius: 7 },
        ring: Math.max(w, h) / 2,
      });
    }
    for (const site of FARM_SITES.slice(0, farms)) {
      items.push({
        key: `f:${site.box.join()}`,
        group: 'verticalFarm',
        art: () => farmArt(ctx, site.box, level('verticalFarm')),
        shadow: { kind: 'box', box: site.box, height: site.storeys * 1.6 },
        ring: Math.max(site.box[2], site.box[3]) / 2,
      });
    }
    if (mirrors > 0) {
      const gilded = level('mirrorPlant') >= 1;
      for (const { x, y, angle } of MIRRORS.slice(0, mirrors)) {
        items.push({
          key: `m:${x},${y}`,
          group: 'mirrorPlant',
          art: () => mirrorArt(ctx, gilded),
          at: [x, y],
          rotation: (angle * Math.PI) / 180,
          shadow: { kind: 'circle', x, y, r: 2.6, height: 0.8 },
          ring: 5,
        });
      }
      items.push({
        key: 'tower',
        group: 'mirrorPlant',
        art: towerArt,
        shadow: { kind: 'circle', x: MIRROR_TOWER.x, y: MIRROR_TOWER.y, r: 5, height: 6 },
        ring: 12,
      });
    }
    const [ax, ay] = centre(ARCOLOGY_SITE);
    for (let i = 0; i < rings; i++) {
      items.push({
        key: `a:${i}`,
        group: 'arcology',
        art: () => arcologyRingArt(ctx, i, level('arcology')),
        at: [ax, ay],
        scale: [1.25, 0.95],
        shadow:
          i === 0
            ? { kind: 'circle', x: ax, y: ay, r: 56, height: 2 + rings * 1.2, squash: 0.76 }
            : undefined,
        ring: 56 - i * 9,
      });
    }
    items.push({
      key: 'planter',
      group: 'planter',
      art: () => planterArt(Math.ceil(clickLevel(upgrades) / 2)),
    });
    for (const tree of TREES.slice(0, trees)) {
      const kind = hash(tree.x, tree.y) % 3;
      items.push({
        key: `t:${tree.x},${tree.y}`,
        group: 'urbanCanopy',
        art: () => treeArt(ctx, kind, tree.r, level('urbanCanopy')),
        at: [tree.x, tree.y],
        shadow: { kind: 'circle', x: tree.x, y: tree.y, r: tree.r * 0.9, height: 2.6 },
        ring: tree.r + 3,
      });
    }
    if (drawsItself(props, 'river')) {
      items.push({ key: 'river', group: 'river', art: () => riverBanksArt(ctx) });
      for (const sy of STREETS.horizontal) {
        items.push({
          key: `bridge:${sy}`,
          group: 'bridges',
          art: () => footbridgeArt(sy),
        });
      }
    }
    // Parcels, the Bioregion and the collectors: drawings taken from the SVG scene.
    const snapshots = this.snapshots;
    if (snapshots) {
      for (const source of mapSources(props)) {
        const { entrance } = source;
        items.push({
          key: `s:${source.key}`,
          group: source.group,
          art: () => snapshots.art(source.key),
          maxRes: source.maxRes,
          still: !entrance,
          ring:
            entrance && (entrance.unveil ? Math.min(entrance.unveil, 120) / 1.4 : entrance.size),
          ringAt: entrance?.at,
          unveil: entrance?.unveil
            ? { x: entrance.at[0], y: entrance.at[1], reach: entrance.unveil }
            : undefined,
        });
      }
    }
    return items;
  }

  private sync(props: MapProps): void {
    const ctx = this.context();
    const live = this.synced && !props.reduced;
    const now = this.time;

    // The ground: one world-sized drawing, redrawn only when the land itself changes.
    const greenhouses = visibleElements(props.generators.greenhouse, GREENHOUSE_SITES.length);
    const mirrors = visibleElements(props.generators.mirrorPlant, MIRRORS.length, 2);
    const pots = visibleElements(props.generators.pot, POT_SPOTS.length);
    const ground = groundArt(ctx, {
      courtyardGreen: Math.min(1, pots / POT_SPOTS.length),
      wastelands: [
        ...(props.generators.arcology === 0 ? [ARCOLOGY_SITE] : []),
        ...GREENHOUSE_SITES.slice(greenhouses),
      ],
      carParks: CAR_PARKS.filter((_, i) => !(i === 1 && mirrors > 0)),
      mirrorField: mirrors > 0 ? CAR_PARKS[1]! : null,
    });
    const groundKey = `${this.res}|${ground.svg}`;
    if (groundKey !== this.groundKey) {
      const previous = this.groundKey;
      this.groundKey = groundKey;
      this.acquire(groundKey, ground, this.res).then((texture) => {
        if (this.destroyed || this.groundKey !== groundKey) return;
        this.ground.texture = texture;
        this.ground.position.set(0, 0);
        this.ground.width = WORLD.width;
        this.ground.height = WORLD.height;
        if (previous) this.release(previous);
        this.requestRender();
      });
    }
    this.syncOutskirts();

    // Elements: added with an entrance, redrawn in place, or removed.
    const items = this.itemsFor(props, ctx);
    const keep = new Set<string>();
    for (const item of items) {
      keep.add(item.key);
      let placed = this.placed.get(item.key);
      if (!placed) {
        const sprite = new Sprite();
        sprite.anchor.set(0.5);
        sprite.visible = false;
        if (item.rotation) sprite.rotation = item.rotation;
        this.groups.get(item.group)!.addChild(sprite);
        const born = live && !item.still ? -1 : null;
        placed = { item, sprite, textureKey: null, base: { x: 1, y: 1 }, born };
        this.placed.set(item.key, placed);
      }
      placed.item = item;
      const art = item.art();
      if (!art) continue;
      const res = Math.min(this.res, item.maxRes ?? Infinity);
      const textureKey = `${res}|${art.svg}`;
      if (textureKey === placed.textureKey) continue;
      const old = placed.textureKey;
      placed.textureKey = textureKey;
      const target = placed;
      this.acquire(textureKey, art, res).then((texture) => {
        if (this.destroyed || target.textureKey !== textureKey) return;
        const [bx, by, bw, bh] = art.box;
        const [ox, oy] = item.at ?? [0, 0];
        const [sx, sy] = item.scale ?? [1, 1];
        target.sprite.texture = texture;
        // The drawing is centred on its box; placed drawings are moved and scaled around their origin.
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        const rot = item.rotation ?? 0;
        target.sprite.position.set(
          ox + (cx * Math.cos(rot) - cy * Math.sin(rot)) * sx,
          oy + (cx * Math.sin(rot) + cy * Math.cos(rot)) * sy,
        );
        target.base = { x: (bw / texture.width) * sx, y: (bh / texture.height) * sy };
        target.sprite.scale.set(target.base.x, target.base.y);
        target.sprite.visible = true;
        if (target.born === -1) {
          target.born = this.time;
          const [rx, ry] = item.ringAt ?? [target.sprite.x, target.sprite.y];
          if (item.ring) this.addRing(rx, ry, item.ring);
          if (item.unveil) {
            target.mask = new Graphics();
            target.sprite.parent?.addChild(target.mask);
            target.sprite.mask = target.mask;
          }
        }
        if (old) this.release(old);
        this.shadowsDirty = true;
        this.requestRender();
      });
    }
    for (const [key, placed] of this.placed) {
      if (keep.has(key)) continue;
      placed.mask?.destroy();
      placed.sprite.destroy();
      if (placed.textureKey) this.release(placed.textureKey);
      this.placed.delete(key);
    }

    // ×2 upgrades make a generator's elements shine once.
    for (const id of GENERATORS_DRAWN) {
      const level = upgradeLevel(props.upgrades, id);
      const was = this.levels.get(id);
      if (live && was !== undefined && level > was) this.flashes.set(id, now);
      this.levels.set(id, level);
    }

    this.snapshots?.keep(new Set(mapSources(props).map((source) => source.key)));
    this.syncGlints();
    this.syncWater(props);
    this.syncLand(props);
    this.syncFlows(props);
    this.syncMirrors(props);
    this.syncPollen(props);
    this.daylight.tint = this.palette.light;
    this.bloom.tint = this.palette.sun;
    this.shadowsDirty = true;
    this.synced = true;
    this.requestRender();
  }

  private syncOutskirts(): void {
    const key = `outskirts|${this.res}`;
    if ((this.outskirts as unknown as { key?: string }).key === key) return;
    (this.outskirts as unknown as { key?: string }).key = key;
    const res = Math.min(this.res, 3);
    rasterize(outskirtsTileArt(OUTSKIRTS_TILE), res).then((texture) => {
      if (this.destroyed) return;
      texture.source.addressMode = 'repeat';
      const old = this.outskirts.texture;
      this.outskirts.texture = texture;
      if (old !== Texture.WHITE) setTimeout(() => old.destroy(true), 500);
      const reach = OUTSKIRTS_REACH;
      this.outskirts.position.set(-reach, -reach);
      this.outskirts.width = WORLD.width + reach * 2;
      this.outskirts.height = WORLD.height + reach * 2;
      this.outskirts.tileScale.set(1 / res);
      // Align the tiles on the city's street grid.
      this.outskirts.tilePosition.set(
        (reach + STREETS.vertical[0]) * res,
        (reach + STREETS.horizontal[0]) * res,
      );
      this.requestRender();
    });
  }

  /** Glass of greenhouses and vertical farms catches a glint that sweeps across it now and then. */
  private syncGlints(): void {
    const boxes = [...this.placed.values()]
      .filter(({ item }) => item.group === 'greenhouse' || item.group === 'verticalFarm')
      .map(({ item }) => item.shadow)
      .filter((s): s is Extract<Shadow, { kind: 'box' }> => s?.kind === 'box')
      .map((s) => s.box);
    for (const glint of this.glints) {
      glint.sprite.mask = null;
      glint.sprite.destroy();
    }
    this.effects.children.filter((c) => c.label === 'glint-mask').forEach((c) => c.destroy());
    this.glints = boxes.map((box, i) => {
      const [x, y, w, h] = box;
      const mask = new Graphics().roundRect(x, y, w, h, 6).fill(0xffffff);
      mask.label = 'glint-mask';
      const sprite = new Sprite(this.band);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.alpha = 0.55;
      sprite.width = Math.max(w, h) * 0.5;
      sprite.height = Math.hypot(w, h) * 1.2;
      sprite.rotation = 0.5;
      sprite.mask = mask;
      this.effects.addChild(mask, sprite);
      return { sprite, box, offset: i * 2.3 };
    });
  }

  private syncWater(props: MapProps): void {
    this.ripples.mask = null;
    this.water.removeChildren().forEach((child) => {
      if (child !== this.ripples && child !== this.displacement) child.destroy();
    });
    this.sparkles = [];
    // Each pool is drawn at a width: its muddy bed, then its water a little narrower.
    const pools: { draw: (g: Graphics, grow: number) => void; points: [number, number][] }[] = [];
    if (drawsItself(props, 'river')) {
      pools.push({
        draw: (g, grow) => {
          g.svg(
            `<svg><path d="${riverPath()}" fill="none" stroke="#ffffff" stroke-width="${11 + grow}" stroke-linecap="round"/></svg>`,
          );
        },
        points: riverPoints(),
      });
    }
    if (props.generators.arcology > 0) {
      const [ax, ay] = centre(ARCOLOGY_SITE);
      pools.push({
        draw: (g, grow) => g.ellipse(ax, ay, 11 + grow / 2, 8.5 + grow / 2).fill(0xffffff),
        points: [
          [ax - 3, ay - 2],
          [ax + 4, ay + 1],
          [ax, ay + 4],
        ],
      });
    }
    if (pools.length === 0) {
      this.water.filters = [];
      return;
    }
    // The bed, deep water, the sky it reflects, ripples drifting with the current.
    const bed = new Graphics();
    // No filter of its own: the water's ripple filter already softens it (filters must not nest).
    for (const pool of pools) pool.draw(bed, 3);
    bed.tint = 0x6d7a55;
    bed.alpha = 0.7;
    const shape = new Graphics();
    for (const pool of pools) pool.draw(shape, 0);
    shape.tint = Number.parseInt(this.palette.water.slice(1), 16);
    const sky = new Graphics();
    for (const pool of pools) pool.draw(sky, -4);
    sky.tint = Number.parseInt(this.palette.sky.slice(1), 16);
    sky.alpha = 0.3;
    const mask = new Graphics();
    for (const pool of pools) pool.draw(mask, 0);
    const [rx, ry, rw] = PARCEL_PLACES.river;
    this.ripples.position.set(rx - 4, ry);
    this.ripples.width = rw + 8;
    this.ripples.height = WORLD.height;
    this.ripples.mask = mask;
    this.water.addChild(bed, shape, sky, this.ripples, mask, this.displacement);
    for (const pool of pools) {
      pool.points.forEach(([x, y], i) => {
        const sprite = new Sprite(this.glow);
        sprite.anchor.set(0.5);
        sprite.blendMode = 'add';
        sprite.position.set(x, y);
        sprite.width = sprite.height = 4;
        this.water.addChild(sprite);
        this.sparkles.push({ sprite, offset: (i * 1.7) % 6 });
      });
    }
    this.water.filters = [this.waterFilter(this.displacement)];
  }

  /** The Bioregion's river, canals and streams: the same living water as in the city. */
  private syncLand(props: MapProps): void {
    this.land.visible = props.bioregion;
    this.landRipples.mask = null;
    this.landWater.removeChildren().forEach((child) => {
      if (child !== this.landRipples && child !== this.landDisplacement) child.destroy();
    });
    for (const { sprite } of this.landSparkles) sprite.destroy();
    this.landSparkles = [];
    if (!props.bioregion) {
      this.landWater.filters = [];
      return;
    }
    const { streams } = landShown(props.sites, props.collectors);
    const canals = CANALS.map(([[x0, y0], [, y1]]) => `M${x0} ${y0}V${y1}`);
    const shapes = (grow: number) =>
      `<svg>${[
        ...streams.map((d) => stroke(d, 7 + grow, '#ffffff')),
        ...RIVER.map((d) => stroke(d, 28 + grow, '#ffffff')),
        ...canals.map((d) => stroke(d, 18 + grow, '#ffffff', 'butt')),
      ].join('')}</svg>`;
    // Grassy banks of the streams and the sandy bed of the river, then the water over them.
    const banks = new Graphics().svg(
      `<svg>${streams.map((d) => stroke(d, 14, '#b9cf9f')).join('')}${RIVER.map((d) => stroke(d, 40, '#d9cdb0')).join('')}</svg>`,
    );
    const water = new Graphics().svg(shapes(0));
    water.tint = Number.parseInt(this.palette.water.slice(1), 16);
    const sky = new Graphics().svg(shapes(-10));
    sky.tint = Number.parseInt(this.palette.sky.slice(1), 16);
    sky.alpha = 0.3;
    const mask = new Graphics().svg(shapes(0));
    this.landRipples.mask = mask;
    this.landWater.addChild(banks, water, sky, this.landRipples, mask, this.landDisplacement);
    [...RIVER_NORTH, ...RIVER_SOUTH].forEach(([x, y], i) => {
      const sprite = new Sprite(this.glow);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.position.set(x, y);
      this.landWater.addChild(sprite);
      this.landSparkles.push({ sprite, offset: (i * 1.3) % 6 });
    });
    this.landWater.filters = [this.waterFilter(this.landDisplacement)];
  }

  /** The ripple filter of a water layer, as sharp and smooth-edged as the rest of the map. */
  private waterFilter(sprite: Sprite): DisplacementFilter {
    return new DisplacementFilter({
      sprite,
      scale: 5,
      resolution: this.app.renderer.resolution,
      antialias: 'inherit',
    });
  }

  private syncFlows(props: MapProps): void {
    for (const mote of this.flowMotes) mote.sprite.destroy();
    this.flowMotes = [];
    if (props.reduced) return;
    for (const [id, curve] of Object.entries(FLOWS)) {
      if (!props.upgrades.includes(id as UpgradeId)) continue;
      for (let i = 0; i < 5; i++) {
        const sprite = new Sprite(this.glow);
        sprite.anchor.set(0.5);
        sprite.blendMode = 'add';
        sprite.tint = 0xf4c063;
        sprite.width = sprite.height = 5;
        this.effects.addChild(sprite);
        this.flowMotes.push({ sprite, curve, offset: i / 5 });
      }
    }
  }

  /** Mirrors flash now and then as they track the sun; the tower's receiver glows. */
  private syncMirrors(props: MapProps): void {
    for (const glint of this.mirrorGlints) glint.sprite.destroy();
    this.mirrorGlints = [];
    const mirrors = visibleElements(props.generators.mirrorPlant, MIRRORS.length, 2);
    this.towerGlow.visible = mirrors > 0;
    if (props.reduced) return;
    MIRRORS.slice(0, mirrors).forEach(({ x, y }, i) => {
      if (i % 2) return;
      const sprite = new Sprite(this.glow);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.tint = 0xfff6dc;
      sprite.position.set(x, y);
      this.effects.addChild(sprite);
      this.mirrorGlints.push({ sprite, offset: (i * 2.7) % 9 });
    });
  }

  private syncPollen(props: MapProps): void {
    const wanted = props.phase >= 2 && !props.reduced ? 42 : 0;
    while (this.motes.length > wanted) this.motes.pop()!.sprite.destroy();
    while (this.motes.length < wanted) {
      const i = this.motes.length;
      const sprite = new Sprite(this.glow);
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      const size = 3 + ((i * 7) % 5);
      sprite.width = sprite.height = size;
      this.pollen.addChild(sprite);
      this.motes.push({
        sprite,
        x: ((i * 137.5) % 100) / 100,
        y: ((i * 61.8) % 100) / 100,
        vx: 0.004 + ((i * 13) % 7) / 900,
        vy: -0.002 - ((i * 11) % 5) / 1600,
        phase: i * 0.7,
      });
    }
    for (const mote of this.motes) mote.sprite.tint = this.palette.sun;
  }

  private addRing(x: number, y: number, size: number): void {
    const g = new Graphics();
    g.position.set(x, y);
    this.effects.addChild(g);
    this.rings.push({ g, x, y, size, born: this.time });
  }

  private moveCamera(target: Camera, instant: boolean): void {
    const current = this.camera;
    if (
      current &&
      this.glide?.to.x === target.x &&
      this.glide.to.y === target.y &&
      this.glide.to.scale === target.scale
    )
      return;
    if (!current || instant) {
      this.camera = target;
      this.glide = null;
    } else if (current.x !== target.x || current.y !== target.y || current.scale !== target.scale) {
      this.glide = { from: current, to: target, start: this.time };
    }
    this.placeCamera();
  }

  private placeCamera(): void {
    const camera = this.camera;
    const props = this.props;
    if (!camera || !props) return;
    this.world.scale.set(camera.scale);
    this.world.position.set(
      props.width / 2 - camera.x * camera.scale,
      props.height / 2 - camera.y * camera.scale,
    );
  }

  private layoutScreen(): void {
    const { width, height } = this.props!;
    this.daylight.width = width;
    this.daylight.height = height;
    this.vignette.width = width;
    this.vignette.height = height;
    this.bloom.width = Math.max(width, height) * 1.1;
    this.bloom.height = Math.max(width, height) * 0.9;
  }

  /** One animation frame: `dt` seconds since the last one (0 for a still picture). */
  private frame(dt: number): void {
    const props = this.props;
    if (!props || !this.ready) return;
    const still = props.reduced;
    this.time += still ? 0 : Math.min(dt, 0.1);
    const t = this.time;

    if (this.glide && this.camera) {
      const p = (t - this.glide.start) / CAMERA_GLIDE;
      this.camera = blendCamera(this.glide.from, this.glide.to, easeInOut(p));
      if (p >= 1) {
        this.camera = this.glide.to;
        this.glide = null;
      }
      this.placeCamera();
    }

    // The sun swings slowly; shadows follow it and are redrawn when they visibly moved.
    const target = sunAt(props.phase, t, still);
    this.sun = still || Number.isNaN(this.drawnSun.x) ? target : approachSun(this.sun, target, dt);
    if (this.shadowsDirty) this.drawnSun = { x: NaN, y: NaN };
    if (
      Math.hypot(this.sun.x - this.drawnSun.x, this.sun.y - this.drawnSun.y) > 0.01 ||
      Number.isNaN(this.drawnSun.x)
    ) {
      this.drawShadows();
    }

    // Entrances of newly built elements: restored parcels are unveiled, the others grow.
    for (const placed of this.placed.values()) {
      if (placed.born === null || placed.born < 0) continue;
      const unveil = placed.item.unveil;
      if (unveil && placed.mask) {
        const p = Math.min(1, (t - placed.born) / UNVEIL);
        const r = Math.max(0.1, unveil.reach * (1 - (1 - p) ** 4));
        placed.mask.clear().circle(unveil.x, unveil.y, r).fill(0xffffff);
        if (p >= 1) {
          placed.sprite.mask = null;
          placed.mask.destroy();
          placed.mask = undefined;
          placed.born = null;
        }
        continue;
      }
      const s = appearScale(t - placed.born);
      placed.sprite.scale.set(placed.base.x * s, placed.base.y * s);
      placed.sprite.alpha = Math.min(1, (t - placed.born) * 4);
      if (s === 1) {
        placed.born = null;
        placed.sprite.alpha = 1;
      }
    }
    this.rings = this.rings.filter((ring) => {
      const p = (t - ring.born) / 1.3;
      if (p >= 1) {
        ring.g.destroy();
        return false;
      }
      ring.g
        .clear()
        .circle(0, 0, ring.size * (0.5 + p * 0.9))
        .stroke({ width: 0.9 * (1 - p) + 0.2, color: 0xf4c063 });
      ring.g.alpha = (1 - p) * 0.9;
      return true;
    });

    // Upgrades: the generator's layer brightens once.
    for (const [id, start] of this.flashes) {
      const group = this.groups.get(id)!;
      const p = (t - start) / 1.8;
      if (p >= 1) {
        group.filters = [];
        this.flashes.delete(id);
        continue;
      }
      const filter =
        (group.filters?.[0] as ColorMatrixFilter | undefined) ?? new ColorMatrixFilter();
      filter.brightness(1 + Math.sin(Math.min(1, p) * Math.PI) * 0.35, false);
      group.filters = [filter];
    }

    // Light: the bloom breathes on the sun's side, the hearth glows under the flower.
    const { width, height } = props;
    const fromLeft = this.sun.x >= 0;
    this.bloom.position.set(
      fromLeft ? width * 0.05 : width * 0.95,
      height * (0.05 - this.sun.y * 0.02),
    );
    this.bloom.alpha = 0.16 + Math.sin(t * 0.4) * 0.04;
    this.daylight.scale.x = Math.abs(this.daylight.scale.x) * (fromLeft ? 1 : -1);
    this.daylight.x = fromLeft ? 0 : width;
    this.daylight.alpha = this.palette.lightAlpha * 0.62;
    this.hearth.alpha = 0.6 + Math.sin(t * 1.3) * 0.12;

    // Clouds drift across the world and come back round.
    this.clouds.children.forEach((cloud, i) => {
      const span = WORLD.width + 700;
      cloud.x = ((t * (4 + i * 1.5) + i * 330) % span) - 350;
      cloud.y = 90 + i * 140 + Math.sin(t * 0.05 + i) * 20;
    });

    // Water: the current carries the ripples, the surface wobbles, the sun sparkles on it. The
    // wobble is measured in screen pixels: smaller from afar, so thin streams keep their shape.
    const wobble = Math.min(5, Math.max(1, (this.camera?.scale ?? 1) * 3));
    for (const filter of [...(this.water.filters ?? []), ...(this.landWater.filters ?? [])]) {
      (filter as DisplacementFilter).scale.set(wobble);
    }
    this.ripples.tilePosition.y = t * 6;
    this.displacement.x = t * 8;
    this.displacement.y = t * 5;
    for (const { sprite, offset } of this.sparkles) {
      const p = ((t + offset) % 3.2) / 3.2;
      sprite.alpha = Math.max(0, Math.sin(p * Math.PI)) ** 6;
      sprite.width = sprite.height = 3 + sprite.alpha * 4;
    }
    if (props.bioregion) {
      this.landRipples.tilePosition.set(t * 3, t * 6);
      this.landDisplacement.x = t * 8;
      this.landDisplacement.y = t * 5;
      for (const { sprite, offset } of this.landSparkles) {
        const p = ((t + offset) % 3.6) / 3.6;
        sprite.alpha = Math.max(0, Math.sin(p * Math.PI)) ** 6;
        sprite.width = sprite.height = 6 + sprite.alpha * 8;
      }
    }
    // A shower crosses the land while water is gathered.
    this.shower.visible = props.bioregion && props.raining && !still;
    if (this.shower.visible) {
      const p = (t % SHOWER_PERIOD) / SHOWER_PERIOD;
      this.shower.position.set(-1500 + 3600 * p, -500 + 1400 * p);
      const q = (t % 0.9) / 0.9;
      this.rain.position.set(3 - 6 * q, -8 + 16 * q);
      this.rain.alpha = 0.4 + 0.6 * q;
    }

    // Glints sweep across the glass now and then.
    for (const glint of this.glints) {
      const [x, y, w, h] = glint.box;
      const p = ((t + glint.offset) % 7) / 2.2;
      glint.sprite.visible = p < 1 && !still;
      glint.sprite.position.set(x - w * 0.3 + p * w * 1.6, y + h / 2);
    }

    // Synergy motes travel between the generators they link.
    for (const mote of this.flowMotes) {
      const p = (t * 0.12 + mote.offset) % 1;
      const [x, y] = bezier(mote.curve, p);
      mote.sprite.position.set(x, y);
      mote.sprite.alpha = Math.sin(p * Math.PI) * 0.9;
    }

    // Beams of the mirror field shimmer towards the tower; mirrors flash as they turn.
    this.drawBeams(t);
    for (const { sprite, offset } of this.mirrorGlints) {
      const p = ((t + offset) % 9) / 1.1;
      sprite.alpha = p < 1 ? Math.sin(p * Math.PI) ** 3 : 0;
      sprite.width = sprite.height = 4 + sprite.alpha * 9;
    }
    this.towerGlow.alpha = 0.55 + Math.sin(t * 1.1) * 0.15;
    this.towerGlow.width = this.towerGlow.height = 26 + Math.sin(t * 1.1) * 3;

    // A breeze moves through the street trees, in waves crossing the city.
    for (const placed of this.placed.values()) {
      if (placed.item.group !== 'urbanCanopy' || !placed.item.at) continue;
      const [x, y] = placed.item.at;
      const gust = Math.sin(t * 0.5 - x * 0.012) * 0.5 + 0.5;
      const sway = still ? 0 : Math.sin(t * 1.6 + x * 0.21 + y * 0.13) * (0.012 + gust * 0.022);
      placed.sprite.skew.set(sway, sway * 0.4);
    }

    // Pollen drifts on the warm air.
    for (const mote of this.motes) {
      mote.x = (mote.x + mote.vx * dt + 1) % 1;
      mote.y = (mote.y + mote.vy * dt + 1) % 1;
      const wobble = Math.sin(t * 0.8 + mote.phase) * 0.012;
      mote.sprite.position.set((mote.x + wobble) * width, (mote.y + wobble * 0.6) * height);
      mote.sprite.alpha = 0.35 + Math.sin(t * 1.4 + mote.phase) * 0.3;
    }
  }

  private drawShadows(): void {
    const sun = this.sun;
    this.drawnSun = sun;
    this.shadowsDirty = false;
    const ground = this.shadows.clear();
    const trees = this.treeShadows.clear();
    for (const { item, sprite } of this.placed.values()) {
      const shadow = item.shadow;
      if (!shadow || !sprite.visible) continue;
      const g = item.group === 'urbanCanopy' ? trees : ground;
      if (shadow.kind === 'box') {
        g.poly(shadowPolygon(shadow.box, shadow.height * SHADOW_LENGTH, sun)).fill(0x46372a);
      } else {
        const squash = shadow.squash ?? 1;
        g.ellipse(
          shadow.x + sun.x * shadow.height * SHADOW_LENGTH,
          shadow.y + sun.y * shadow.height * SHADOW_LENGTH,
          shadow.r * (squash === 1 ? 1 : 1.25),
          shadow.r * squash,
        ).fill(0x46372a);
      }
    }
    this.shadowLayer.alpha = this.palette.shadowAlpha;
    this.treeShadowLayer.alpha = this.palette.shadowAlpha * 1.1;
    // Blurred once into a texture of a few pixels per world unit: soft edges of about two
    // world units, and no blur to redo at every frame.
    const res = Math.min(this.res, 3);
    if (res !== this.shadowRes) {
      this.shadowRes = res;
      (this.shadowLayer.filters?.[0] as BlurFilter).strength = res * 2;
      (this.treeShadowLayer.filters?.[0] as BlurFilter).strength = res * 1.2;
      for (const cache of this.shadowCaches) {
        cache.cacheAsTexture(false);
        cache.cacheAsTexture({ resolution: res, antialias: false });
      }
    } else {
      for (const cache of this.shadowCaches) cache.updateCacheTexture();
    }
  }

  private drawBeams(t: number): void {
    const level = this.levels.get('mirrorPlant') ?? 0;
    const mirrors = [...this.placed.values()].filter(
      (p) => p.item.group === 'mirrorPlant' && p.item.key !== 'tower',
    );
    if (level < 2 || mirrors.length === 0) {
      this.beams.clear();
      return;
    }
    const g = this.beams.clear();
    mirrors.forEach((p, i) => {
      if (i % 3) return;
      const alpha = 0.18 + Math.sin(t * 1.7 + i) * 0.1;
      g.moveTo(p.sprite.x, p.sprite.y)
        .lineTo(MIRROR_TOWER.x, MIRROR_TOWER.y)
        .stroke({ width: 0.7, color: 0xf6d58f, alpha });
    });
  }

  /**
   * With reduced motion the picture is still: no ticker, one frame drawn when something changed,
   * at most once per display frame however many textures arrive.
   */
  private requestRender(): void {
    if (!this.ready || this.destroyed) return;
    if (!this.props?.reduced) {
      if (!this.app.ticker.started) this.app.ticker.start();
      return;
    }
    if (this.app.ticker.started) this.app.ticker.stop();
    if (this.pending) return;
    this.pending = requestAnimationFrame(() => {
      this.pending = 0;
      if (!this.ready || this.destroyed) return;
      this.frame(0);
      this.app.render();
    });
  }

  private acquire(key: string, art: Art, res: number): Promise<Texture> {
    let entry = this.textures.get(key);
    if (!entry) {
      const promise = rasterize(art, res);
      const created = { promise, refs: 0 } as {
        promise: Promise<Texture>;
        texture?: Texture;
        refs: number;
      };
      promise.then((texture) => (created.texture = texture)).catch(() => undefined);
      entry = created;
      this.textures.set(key, entry);
    }
    entry.refs++;
    return entry.promise;
  }

  private release(key: string): void {
    const entry = this.textures.get(key);
    if (!entry) return;
    entry.refs--;
    if (entry.refs > 0) return;
    this.textures.delete(key);
    // Destroyed a moment later, once no frame in flight still draws with it.
    entry.promise
      .then((texture) => setTimeout(() => texture.destroy(true), 500))
      .catch(() => undefined);
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.pending);
    if (!this.ready) return;
    this.ready = false;
    mapPicture.renderNow = null;
    this.app.destroy(true, { children: true, texture: true, textureSource: true });
    for (const entry of this.textures.values()) {
      entry.promise.then((texture) => texture.destroy(true)).catch(() => undefined);
    }
    this.textures.clear();
  }
}

/** Whether `inner` lies within `outer`. */
function inside([x, y, w, h]: Box, [ox, oy, ow, oh]: Box): boolean {
  return x >= ox && y >= oy && x + w <= ox + ow && y + h <= oy + oh;
}
