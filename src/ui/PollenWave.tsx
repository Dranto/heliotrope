// The pollen's flight on the map (docs/game-design.md §5.6, M27): a wave of golden pollen leaves
// the courtyard flower and crosses the city, a soft ring followed by drifting grains. Drawn in SVG
// over both renderers, like the other marks (§10.4). Each flight remounts it, so it replays.
import { memo, type CSSProperties } from 'react';
import './pollen.css';
import { PLANTER } from './neighbourhood';

const GRAINS = Array.from({ length: 28 }, (_, i) => ({
  angle: (i * 360) / 28 + (i % 3) * 4,
  reach: 240 + ((i * 37) % 5) * 40,
  delay: (i % 4) * 0.12,
  size: 1.6 + (i % 3) * 0.7,
}));

export const PollenWave = memo(function PollenWave({
  flights,
  flying,
  reduced,
}: {
  flights: number;
  flying: boolean;
  reduced: boolean;
}) {
  if (!flying) return null;
  return (
    <g
      key={flights}
      className="pollen-wave"
      data-reduced={reduced || undefined}
      transform={`translate(${PLANTER.x} ${PLANTER.y})`}
      aria-hidden="true"
    >
      <circle className="pollen-glow" r="60" />
      {!reduced && (
        <>
          <circle className="pollen-ring" r="40" />
          <circle className="pollen-ring pollen-ring-late" r="40" />
          {GRAINS.map(({ angle, reach, delay, size }) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <circle
                className="pollen-grain"
                r={size}
                style={{ '--reach': `${reach}px`, animationDelay: `${delay}s` } as CSSProperties}
              />
            </g>
          ))}
        </>
      )}
    </g>
  );
});
