// The Cooperatives on the top-down map (docs/game-design.md §7.2, §10.4): each one is a cargo
// bike doing its rounds along the streets while it works. When it buys something, a golden ring
// spreads from the bike, and the building it bought appears on the map as usual.
import { memo } from 'react';
import type { CooperativeId } from '../game/cooperatives';
import { t } from '../i18n';
import { COOPERATIVE_ROUTES } from './cooperativeMap';

interface BikeProps {
  id: CooperativeId;
  working: boolean;
  purchases: number;
  reduced: boolean;
}

/** A cargo bike seen from above, heading right: the crate in the cooperative's colour, the rider. */
function Bike({ id, working, purchases, reduced }: BikeProps) {
  const { path, seconds, delay, park } = COOPERATIVE_ROUTES[id];
  // SMIL motion is not stopped by the reduced-motion CSS, so a still bike is simply parked.
  const moving = working && !reduced;
  const [x, y, angle] = park;
  return (
    <g
      className="coop-bike"
      data-cooperative={id}
      data-working={working}
      transform={moving ? undefined : `translate(${x} ${y}) rotate(${angle})`}
    >
      <title>{t.cooperatives.names[id]}</title>
      {moving && (
        <animateMotion
          dur={`${seconds}s`}
          begin={`-${delay}s`}
          repeatCount="indefinite"
          rotate="auto"
          path={path}
        />
      )}
      <ellipse className="bike-shadow" cx="1" cy="1.2" rx="9.5" ry="5" />
      <path className="wheel" d="M-9 -5.2h4.5M-9 5.2h4.5M5 0h4.5" />
      <rect className="crate" x="-10.5" y="-4.6" width="10.5" height="9.2" rx="2" />
      <path className="crate-lid" d="M-9 -1.6h7.5M-9 1.6h7.5" />
      {/* The load: a sack of compost, greens and a bunch of flowers peeking out of the crate. */}
      <circle className="load-leaf" cx="-7.6" cy="-2.2" r="1.7" />
      <circle className="load-leaf" cx="-3.4" cy="2.3" r="1.5" />
      <circle className="load-bloom" cx="-6.8" cy="2.4" r="0.9" />
      <circle className="load-bloom gold" cx="-2.6" cy="-2.4" r="0.8" />
      <path className="handlebar" d="M6.2 -3.6v7.2" />
      <ellipse className="rider" cx="3.8" cy="0" rx="2.6" ry="3.8" />
      <path className="rider-arm" d="M4.2 -2.8l2 -0.8M4.2 2.8l2 0.8" />
      <circle className="rider-head" cx="4.9" cy="0" r="1.9" />
      <path className="rider-hair" d="M3.6 -1.2a1.9 1.9 0 0 1 2.6 -0.2" />
      {purchases > 0 && !reduced && (
        <circle key={purchases} className="appear-ring coop-ring" cx="-2" cy="0" r="10" />
      )}
    </g>
  );
}

export interface CooperativeBikesProps {
  /** Cooperatives brought in by the Tree of Seasons, and whether each is working. */
  cooperatives: readonly { id: CooperativeId; working: boolean; purchases: number }[];
  reduced: boolean;
}

export const CooperativeBikes = memo(function CooperativeBikes({
  cooperatives,
  reduced,
}: CooperativeBikesProps) {
  if (cooperatives.length === 0) return null;
  return (
    <g className="coop-bikes">
      {cooperatives.map((coop) => (
        <Bike key={coop.id} {...coop} reduced={reduced} />
      ))}
    </g>
  );
});
