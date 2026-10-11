// The alliances and the grand bloom on the map (docs/game-design.md §9.9, M24): each alliance at
// work stretches a thread of golden light between the two places it links, a pulse running along
// it; once the whole region is restored, flowers open everywhere, from the city to the hills,
// without a word. Drawn in SVG over both maps.
import { memo, useEffect, useRef, useState } from 'react';
import type { AllianceId } from '../game/alliances';
import { BLOOM_FLOWERS, THREADS, threadPath } from './allianceMap';
import './alliances.css';

function Threads({ working }: { working: string }) {
  const ids = working ? (working.split(',') as AllianceId[]) : [];
  return (
    <g className="alliance-threads" aria-hidden="true">
      {ids.map((id) => {
        const d = threadPath(THREADS[id]);
        const [[x1, y1], [x2, y2]] = THREADS[id];
        return (
          <g key={id} className="alliance-thread" data-alliance={id}>
            <path className="alliance-glow" d={d} />
            <path className="alliance-line" d={d} />
            <path className="alliance-pulse" d={d} />
            <circle className="alliance-knot" cx={x1} cy={y1} r="3.5" />
            <circle className="alliance-knot" cx={x2} cy={y2} r="3.5" />
          </g>
        );
      })}
    </g>
  );
}

export const AllianceThreads = memo(Threads);

const PETALS = [0, 72, 144, 216, 288];

function Bloom({ bloomed }: { bloomed: boolean }) {
  // The opening is played only when the bloom comes during play; a later visit finds it open.
  const was = useRef(bloomed);
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    if (bloomed && !was.current) setOpening(true);
    was.current = bloomed;
  }, [bloomed]);
  if (!bloomed) return null;
  return (
    <g className="bloom" data-opening={opening} aria-hidden="true">
      {BLOOM_FLOWERS.map((f) => (
        <g key={`${f.x},${f.y}`} transform={`translate(${f.x} ${f.y})`}>
          <g
            className="bloom-flower"
            data-colour={f.colour}
            style={{ animationDelay: `${(f.delay * 4).toFixed(2)}s` }}
          >
            <g transform={`scale(${f.r / 10})`}>
              {PETALS.map((a) => (
                <ellipse
                  key={a}
                  className="bloom-petal"
                  cy="-5"
                  rx="3.4"
                  ry="5"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle className="bloom-heart" r="2.6" />
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}

export const BloomLayer = memo(Bloom);
