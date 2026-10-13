// The roots of the heliotrope tree on the map (docs/game-design.md §10.4, "L'arbre héliotrope"):
// fine veins of wood and light running out from the courtyard under the neighbourhood, the city,
// the neighbouring districts and the Bioregion, with a shoot where they reach a place restored.
// Drawn in SVG over both maps, under every other mark.
import { memo, useMemo } from 'react';
import type { SiteId } from '../game/bioregion';
import type { DistrictId } from '../game/districts';
import type { ParcelId } from '../game/parcels';
import type { View } from './neighbourhood';
import { rootNetwork } from './treeRoots';
import './roots.css';

interface Props {
  seed: number;
  view: View;
  /** Ids joined with commas, so the layer only redraws when one is added. */
  parcels: string;
  districts: string;
  sites: string;
  /** Age of the tree in whole half Seasons: the courtyard rootlets follow it. */
  age: number;
  reduced: boolean;
}

function list<T extends string>(joined: string): T[] {
  return joined === '' ? [] : (joined.split(',') as T[]);
}

function RootPaths({ seed, view, parcels, districts, sites, age, reduced }: Props) {
  const network = useMemo(
    () =>
      rootNetwork(seed, {
        view,
        parcels: list<ParcelId>(parcels),
        districts: list<DistrictId>(districts),
        sites: list<SiteId>(sites),
        age,
      }),
    [seed, view, parcels, districts, sites, age],
  );
  return (
    <g className="tree-roots" aria-hidden="true" data-reduced={reduced || undefined}>
      {network.roots.map((root) => (
        <path
          key={`${root.id}-wood`}
          d={root.d}
          className="root"
          pathLength={1}
          strokeWidth={root.width}
        />
      ))}
      {/* The sap: light running out along the larger roots, from the tree to the places. */}
      {network.roots
        .filter((root) => root.width >= 1.3)
        .map((root) => (
          <path
            key={`${root.id}-sap`}
            d={root.d}
            className="root-sap"
            pathLength={1}
            strokeWidth={Math.max(0.7, root.width * 0.38)}
            style={{ animationDelay: `${-((root.depth * 1.7) % 9)}s` }}
          />
        ))}
      {network.shoots.map((shoot) => (
        <g
          key={shoot.id}
          className="root-shoot"
          transform={`translate(${shoot.x} ${shoot.y}) rotate(${shoot.angle + 90})`}
        >
          <path d="M0 0 C-3 -1 -6 -4 -5.5 -8 C-2.5 -6.5 -0.8 -3.5 0 0Z" />
          <path d="M0 0 C3 -1 6 -4 5.5 -8 C2.5 -6.5 0.8 -3.5 0 0Z" />
          <circle cy="-5" r="1.7" className="shoot-bud" />
        </g>
      ))}
    </g>
  );
}

export const RootsLayer = memo(RootPaths);
