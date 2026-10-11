// Drawings the enriched map (docs/game-design.md §10.4) takes from the SVG scene itself: restored
// parcels, the Bioregion's land and the water collectors. PixiMap renders them, out of sight,
// with the scene's own components and CSS; the renderer turns each one into a texture. So both
// maps always show the same art.
import type { ReactNode } from 'react';
import type { CollectorId, SiteId } from '../../game/bioregion';
import type { ParcelId } from '../../game/parcels';
import {
  FoodForest,
  LandGround,
  MarshArt,
  Meadow,
  OldCrown,
  Pond,
  Swale,
  Tank,
  TerraceArt,
} from '../BioregionArt';
import { landShown } from '../bioregionMap';
import { centre } from '../neighbourhood';
import { ParcelArt } from '../RestorationArt';
import { GROUND_ORDER, PARCEL_PINS, PARCEL_PLACES } from '../restorationMap';
import { PIXI_PARCELS } from './model';

/** Layers of the WebGL map these drawings go to, from the ground up. */
export type SourceGroup = 'landGround' | 'landSites' | 'landTop' | 'parcels' | 'cityWater';

export interface Source {
  key: string;
  group: SourceGroup;
  /** Class of the drawing's layer in the SVG scene, which its CSS rules expect. */
  scope: 'parcels' | 'bioregion-land' | 'city-water';
  node: ReactNode;
  /**
   * How it enters once the game runs: grows with a golden ring of `size` around `at`, or, for a
   * parcel, is unveiled by a circle widening from its pin up to `unveil`. None for the land.
   */
  entrance?: { at: [number, number]; size: number; unveil?: number };
  /** Most pixels per world unit of its texture: the countryside is seen from afar. */
  maxRes?: number;
}

export interface SourceProps {
  parcels: readonly ParcelId[];
  sites: Record<SiteId, number>;
  collectors: Record<CollectorId, number>;
  bioregion: boolean;
}

/** The plain is one large texture, kept light; its sites are small ones, a little sharper. */
export const LAND_GROUND_RES = 0.75;
export const LAND_RES = 2;

/** Every drawing taken from the SVG scene for this state, in drawing order within each layer. */
export function mapSources({ parcels, sites, collectors, bioregion }: SourceProps): Source[] {
  const sources: Source[] = [];
  for (const id of GROUND_ORDER) {
    if (!parcels.includes(id) || PIXI_PARCELS.includes(id)) continue;
    sources.push({
      key: `parcel:${id}`,
      group: 'parcels',
      scope: 'parcels',
      node: <ParcelArt id={id} />,
      entrance: { at: PARCEL_PINS[id], size: 40, unveil: reach(id) },
    });
  }
  if (!bioregion) return sources;
  const shown = landShown(sites, collectors);
  const land = { scope: 'bioregion-land', maxRes: LAND_RES } as const;
  sources.push({
    key: 'land',
    group: 'landGround',
    scope: 'bioregion-land',
    node: <LandGround sites={sites} fields={shown.fields} />,
    maxRes: LAND_GROUND_RES,
  });
  for (const { box } of shown.meadows) {
    sources.push({
      ...land,
      key: `meadow:${box.join()}`,
      group: 'landSites',
      node: <Meadow box={box} />,
      entrance: { at: centre(box), size: box[2] / 2 },
    });
  }
  for (const { box } of shown.gardens) {
    sources.push({
      ...land,
      key: `garden:${box.join()}`,
      group: 'landSites',
      node: <FoodForest box={box} />,
      entrance: { at: centre(box), size: box[2] / 2 },
    });
  }
  for (const marsh of shown.marshes) {
    sources.push({
      ...land,
      key: `marsh:${marsh.x},${marsh.y}`,
      group: 'landTop',
      node: <MarshArt {...marsh} />,
      entrance: { at: [marsh.x, marsh.y], size: marsh.rx },
    });
  }
  for (const pond of shown.ponds) {
    sources.push({
      ...land,
      key: `pond:${pond.x},${pond.y}`,
      group: 'landTop',
      node: <Pond {...pond} />,
      entrance: { at: [pond.x, pond.y], size: pond.r + 6 },
    });
  }
  for (const crown of shown.crowns) {
    sources.push({
      ...land,
      key: `crown:${crown.x},${crown.y}`,
      group: 'landTop',
      node: <OldCrown {...crown} />,
      entrance: { at: [crown.x, crown.y], size: crown.r + 2 },
    });
  }
  for (const terrace of shown.terraces) {
    sources.push({
      ...land,
      key: `terrace:${terrace.at.join()}`,
      group: 'landTop',
      node: <TerraceArt {...terrace} />,
      entrance: { at: [terrace.at[0], terrace.at[1]], size: terrace.size },
    });
  }
  for (const box of shown.swales) {
    sources.push({
      key: `swale:${box.join()}`,
      group: 'cityWater',
      scope: 'city-water',
      node: <Swale box={box} />,
      entrance: { at: centre(box), size: box[2] / 3 },
    });
  }
  for (const at of shown.tanks) {
    sources.push({
      key: `tank:${at.join()}`,
      group: 'cityWater',
      scope: 'city-water',
      node: <Tank at={at} />,
      entrance: { at: [at[0], at[1]], size: 5 },
    });
  }
  return sources;
}

/** How far a parcel's unveiling circle goes: to the farthest corner of its place. */
function reach(id: ParcelId): number {
  const [x, y] = PARCEL_PINS[id];
  const [bx, by, bw, bh] = PARCEL_PLACES[id];
  return Math.max(
    Math.hypot(bx - x, by - y),
    Math.hypot(bx + bw - x, by - y),
    Math.hypot(bx - x, by + bh - y),
    Math.hypot(bx + bw - x, by + bh - y),
  );
}
