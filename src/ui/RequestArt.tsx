// The neighbours' requests (docs/game-design.md §9.11, M29): the icons of what they ask for and
// of the hands they offer, and their bubbles on the map, drawn in SVG over both renderers (§10.4).
import { memo } from 'react';
import './requests.css';
import type { HandId, Need } from '../game/requests';

type NeedKind = Need['kind'];

/** A small icon in a 20 × 20 box. */
export function RequestIcon({ kind }: { kind: NeedKind | HandId }) {
  return (
    <svg viewBox="0 0 20 20" className="request-icon" data-icon={kind} aria-hidden="true">
      {kind === 'harvests' && (
        <>
          <path d="M3.4 9h13.2l-1.6 7.2H5Z" className="ri-basket" />
          <path d="M6.4 9c0-3 1.6-5 3.6-5s3.6 2 3.6 5" />
          <circle cx="8" cy="7.6" r="1.6" className="ri-radish" />
          <circle cx="12" cy="7.6" r="1.6" className="ri-radish" />
        </>
      )}
      {kind === 'fruit' && (
        <>
          <path d="M10 6c3 0 4.4 3 4.4 6s-2 5-4.4 5-4.4-2-4.4-5S7 6 10 6Z" className="ri-pear" />
          <path d="M10 6V3.4M10 4.4c1.4-1.4 3-1.4 4-.8" />
        </>
      )}
      {(kind === 'flights' || kind === 'flight') && (
        <>
          <circle cx="10" cy="10" r="2.4" className="ri-pollen" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <circle
              key={angle}
              cx="10"
              cy="4.2"
              r="1.1"
              className="ri-pollen"
              transform={`rotate(${angle} 10 10)`}
            />
          ))}
        </>
      )}
      {kind === 'butterflies' && (
        <>
          <path
            d="M10 10C7 4 2.6 5 3.4 9s4.6 2 6.6 1Zm0 0c3-6 7.4-5 6.6-1s-4.6 2-6.6 1Z"
            className="ri-wing"
          />
          <path
            d="M10 10c-2 2-4.4 5-2.4 6s2.4-3 2.4-6Zm0 0c2 2 4.4 5 2.4 6S10 13 10 10Z"
            className="ri-wing"
          />
        </>
      )}
      {kind === 'owned' && <path d="M4 17V8l6-4 6 4v9Zm4 0v-5h4v5" className="ri-house" />}
      {kind === 'quarter' && (
        <>
          <circle cx="10" cy="10" r="6.4" />
          <path d="M10 10V5.4M10 10h4" />
        </>
      )}
      {kind === 'bloom' && (
        <>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="10"
              cy="6"
              rx="2.2"
              ry="3.4"
              className="ri-petal"
              transform={`rotate(${angle} 10 10)`}
            />
          ))}
          <circle cx="10" cy="10" r="1.8" className="ri-pollen" />
        </>
      )}
      {kind === 'ripen' && (
        <>
          <path
            d="M10 17c-3.4 0-5-2.4-5-5.4S7 6 10 6s5 2.6 5 5.6-1.6 5.4-5 5.4Z"
            className="ri-squash"
          />
          <path d="M10 6V3.4" />
        </>
      )}
    </svg>
  );
}

/** Where the bubbles of the requests waiting stand, by the streets around the courtyard. */
const SPOTS: [number, number][] = [
  [228, 160],
  [400, 200],
  [262, 318],
];

/** Each waiting request as a bubble over the city: its icon, and a gold rim once it is met. */
export const RequestBubbles = memo(function RequestBubbles({ bubbles }: { bubbles: string }) {
  if (!bubbles) return null;
  return (
    <g className="request-bubbles" aria-hidden="true">
      {bubbles.split(',').map((bubble, i) => {
        const [kind, met] = bubble.split(':') as [NeedKind, string];
        const [x, y] = SPOTS[i]!;
        return (
          <g
            key={i}
            className="request-bubble"
            data-met={met === '1' || undefined}
            transform={`translate(${x} ${y})`}
          >
            <path d="M-11 -24h22a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-8l-3 5-3-5h-8a5 5 0 0 1-5-5v-10a5 5 0 0 1 5-5Z" />
            <g transform="translate(-7 -21) scale(0.7)">
              <RequestIcon kind={kind} />
            </g>
          </g>
        );
      })}
    </g>
  );
});
