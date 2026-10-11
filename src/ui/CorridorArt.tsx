// The green and blue corridors on the map (docs/game-design.md §6.7, M21): a continuous hedge
// along the parcels of a green corridor, a running brook along those of a blue one, with a link
// where two of its parcels do not touch. Drawn in SVG over both maps.
import { memo } from 'react';
import { BRIDGES, parseCorridors, SPINES } from './corridorMap';

function CorridorPaths({ corridors }: { corridors: string }) {
  return (
    <g className="corridors-layer" aria-hidden="true">
      {parseCorridors(corridors).map((c) => {
        const d = [
          ...c.parcels.map((id) => SPINES[id]),
          ...c.links.map((link) => BRIDGES[link] ?? ''),
        ].join('');
        return (
          <g key={`${c.family}-${c.parcels.join()}`} className="corridor" data-family={c.family}>
            <path className="corridor-base" d={d} />
            <path className="corridor-top" d={d} />
          </g>
        );
      })}
    </g>
  );
}

export const CorridorLayer = memo(CorridorPaths);
