// The decor of the neighbourhood on the map (docs/game-design.md §6.5): small pieces seen from
// above, set by the player on a few spots. While decorating, every spot is a button that sets the
// next piece won there.
import { memo, type KeyboardEvent, type ReactNode } from 'react';
import type { DecorId } from '../game/decor';
import { t } from '../i18n';
import { DECOR_PLACES, decodeDecor } from './decorMap';
import './decor.css';

const PIECES: Record<DecorId, () => ReactNode> = {
  bench: () => (
    <g className="decor-bench">
      <rect x="-5" y="-1.9" width="10" height="1.6" rx="0.4" className="wood" />
      <rect x="-5" y="0.3" width="10" height="1.6" rx="0.4" className="wood" />
      <path d="M-4 -2.4v4.8M4 -2.4v4.8" className="iron" />
    </g>
  ),
  planter: () => (
    <g className="decor-planter">
      <rect x="-4.6" y="-2" width="9.2" height="4" rx="1.2" className="terracotta" />
      {[-3, -1, 1, 3].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 ? 0.4 : -0.5} r="1.2" className={`bloom bloom-${i % 3}`} />
      ))}
    </g>
  ),
  lanterns: () => (
    <g className="decor-lanterns">
      <path d="M-7 -1.6Q0 3 7 -1.6" className="string" />
      <circle cx="-7" cy="-1.6" r="0.7" className="post" />
      <circle cx="7" cy="-1.6" r="0.7" className="post" />
      {[-4.2, -1.4, 1.4, 4.2].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={0.5 + (i === 1 || i === 2 ? 0.6 : 0)}
          r="1.1"
          className={`lantern lantern-${i % 3}`}
        />
      ))}
    </g>
  ),
  birdhouse: () => (
    <g className="decor-birdhouse">
      <circle cx="1.4" cy="1.6" r="3" className="shadow" />
      <path d="M-3 -3H3V3H-3Z" className="wood" />
      <path d="M-3 -3L3 3M3 -3L-3 3" className="roof-line" />
      <circle cx="0" cy="0" r="0.8" className="hole" />
      <path d="M3.6 -3.6c1 -.8 2.2 -.6 2.6 .2-.8 0-1.6.4-2 1Z" className="bird" />
    </g>
  ),
  fresco: () => (
    <g className="decor-fresco">
      <circle r="6.2" className="ground" />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <ellipse
          key={a}
          cx="0"
          cy="-3.4"
          rx="1.6"
          ry="2.6"
          transform={`rotate(${a})`}
          className={`petal-paint paint-${i % 3}`}
        />
      ))}
      <circle r="1.6" className="heart-paint" />
    </g>
  ),
  fountain: () => (
    <g className="decor-fountain">
      <circle r="5.4" className="stone" />
      <circle r="4.2" className="water" />
      <circle r="2.4" className="ripple" />
      <circle r="0.9" className="jet" />
    </g>
  ),
  insectHotel: () => (
    <g className="decor-insect-hotel">
      <circle cx="1.2" cy="1.4" r="3.6" className="shadow" />
      <rect x="-3" y="-3.6" width="6" height="7.2" rx="0.6" className="wood" />
      {[-2.2, -0.4, 1.4].map((y) =>
        [-1.6, 0, 1.6].map((x) => (
          <circle key={`${x},${y}`} cx={x} cy={y + 0.4} r="0.6" className="cell" />
        )),
      )}
    </g>
  ),
};

/** One piece of decor, drawn around (0, 0), about 10 units across. */
export function DecorPiece({ id }: { id: DecorId }) {
  const Piece = PIECES[id];
  return <Piece />;
}

/**
 * The decor set on the map. While `editing`, every spot is a button: a click (or Enter) sets the
 * next piece won there, the last one clearing the spot again.
 */
export const DecorLayer = memo(function DecorLayer({
  slots,
  editing,
  onSlot,
}: {
  /** encodeDecor of the spots. */
  slots: string;
  editing: boolean;
  onSlot: (index: number) => void;
}) {
  const pieces = decodeDecor(slots);
  if (!editing && pieces.every((piece) => piece === null)) return null;
  return (
    <g className="decor" data-editing={editing}>
      {DECOR_PLACES.map(([x, y], i) => {
        const piece = pieces[i] ?? null;
        if (!editing) {
          return piece ? (
            <g key={i} transform={`translate(${x} ${y})`} aria-hidden="true">
              <DecorPiece id={piece} />
            </g>
          ) : null;
        }
        const label = t.decor.slot(i + 1, piece ? t.decor.names[piece] : t.decor.empty);
        const onKey = (event: KeyboardEvent<SVGGElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onSlot(i);
        };
        return (
          <g
            key={i}
            className="decor-slot"
            transform={`translate(${x} ${y})`}
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={() => onSlot(i)}
            onKeyDown={onKey}
          >
            <title>{label}</title>
            <circle r="7.5" className="slot-ring" />
            {piece && <DecorPiece id={piece} />}
          </g>
        );
      })}
    </g>
  );
});

/** A piece on its own, for the decor toolbar. */
export function DecorIcon({ id }: { id: DecorId }) {
  return (
    <svg viewBox="-8 -8 16 16" className="decor-icon" aria-hidden="true">
      <DecorPiece id={id} />
    </svg>
  );
}
