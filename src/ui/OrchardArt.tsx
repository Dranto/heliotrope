// The orchard and its hives on the map (docs/game-design.md §9.8, M22): four fruit trees that
// grow from a staked sapling to a crown in bloom, then heavy with fruit; a ripe tree breathes in
// a golden ring and is picked with a click (or Enter). Hives stand below the trees, bees around
// them. Drawn in SVG over both maps.
import { memo, type KeyboardEvent } from 'react';
import type { FruitId, TreeStage } from '../game/orchard';
import { t } from '../i18n';
import {
  HIVE_SPOTS,
  MEADOW,
  MOWN_PATHS,
  ORCHARD_PLACE,
  parseOrchard,
  TREE_SPOTS,
} from './orchardMap';
import './orchard.css';

const FRUIT_COLOURS: Record<FruitId, string> = {
  apple: '#d9483b',
  pear: '#c9bf45',
  cherry: '#a3122a',
  plum: '#6b3f8f',
};

/** Fruit and blossom spots on a crown of radius 14, around its centre. */
const CROWN_SPOTS: [number, number][] = [
  [-8, -3],
  [-3, -9],
  [5, -7],
  [9, 1],
  [3, 6],
  [-5, 6],
  [-1, -1],
  [6, -1],
  [-9, 3],
];

/** Leaf clusters of a grown crown, [x, y, radius]: a lobed outline about 14 across. */
const TREE_LOBES: [number, number, number][] = [
  [0, -6, 8],
  [-7, -3, 7],
  [7, -3, 7],
  [-6, 4, 7],
  [6, 4, 7],
  [0, 3, 8],
];

/** The few leaf clusters of a young tree, on top of its trunk. */
const SAPLING_LOBES: [number, number, number][] = [
  [-2.2, -6.5, 3],
  [2.2, -7, 3],
  [0, -10, 2.8],
];

/**
 * A crown lit from the upper left like the rest of the map: the clusters in shade, offset down
 * and right, then in leaf, then a smaller sunlit cap on each.
 */
function Crown({ lobes }: { lobes: [number, number, number][] }) {
  return (
    <g className="orchard-crown">
      {lobes.map(([x, y, r]) => (
        <circle key={`s${x},${y}`} className="shade" cx={x + r * 0.12} cy={y + r * 0.16} r={r} />
      ))}
      {lobes.map(([x, y, r]) => (
        <circle
          key={`l${x},${y}`}
          className="leaf"
          cx={x - r * 0.06}
          cy={y - r * 0.08}
          r={r * 0.9}
        />
      ))}
      {lobes.map(([x, y, r]) => (
        <circle
          key={`h${x},${y}`}
          className="lit"
          cx={x - r * 0.3}
          cy={y - r * 0.35}
          r={r * 0.45}
        />
      ))}
    </g>
  );
}

function Tree({ id, stage }: { id: FruitId; stage: TreeStage }) {
  if (stage === 'none') {
    return (
      // A planting hole waiting for its tree: a straw mulch ring around dug soil, a stake tied
      // with twine.
      <g className="orchard-pit">
        <ellipse className="orchard-mulch" rx="8.5" ry="4.6" cy="4" />
        <path
          className="orchard-straw"
          d="M-7 3.2l2 .5M-4.5 6.6l2 -.3M3 7.1l2.2 -.6M5.6 1.6l1.8 .9M-1 0.2l2 .2"
        />
        <ellipse className="orchard-soil" rx="4.6" ry="2.4" cy="4" />
        <ellipse className="orchard-soil-light" rx="2.4" ry="1" cx="-1" cy="3.2" />
        <path className="orchard-stake" d="M0 4V-6" />
        <path className="orchard-tie" d="M-1.1 -3.4h2.2" />
      </g>
    );
  }
  if (stage === 'sapling') {
    return (
      <g className="orchard-sapling">
        <ellipse className="orchard-mulch" rx="6.5" ry="2.8" cy="5" />
        <ellipse className="orchard-shadow" rx="5" ry="2" cx="2" cy="5.4" />
        <path className="orchard-stake" d="M3 5V-9" />
        <path className="orchard-tie" d="M1.9 -4.4h2.2" />
        <path className="orchard-trunk" d="M0 5V-6" />
        <Crown lobes={SAPLING_LOBES} />
      </g>
    );
  }
  const fruit = stage === 'fruiting' || stage === 'ripe';
  const spots = stage === 'fruiting' ? CROWN_SPOTS.slice(0, 4) : CROWN_SPOTS;
  return (
    <g className="orchard-tree">
      <ellipse className="orchard-shadow" rx="15" ry="5" cx="3" cy="13" />
      <path className="orchard-trunk-flare" d="M-3.2 13.5q2.2 -1 2 -5h2.4q-.2 4 2 5z" />
      <path className="orchard-trunk" d="M0 13V4" strokeWidth={3} />
      <g transform="translate(0 -3)">
        <Crown lobes={TREE_LOBES} />
        {spots.map(([x, y]) =>
          fruit ? (
            <circle
              key={`${x},${y}`}
              cx={x}
              cy={y}
              r={id === 'cherry' ? 1.6 : 2.2}
              fill={FRUIT_COLOURS[id]}
              className="orchard-fruit"
            />
          ) : (
            <g key={`${x},${y}`} transform={`translate(${x} ${y})`} className="orchard-blossom">
              <circle r="2" />
              <circle r="0.7" className="orchard-blossom-heart" />
            </g>
          ),
        )}
      </g>
    </g>
  );
}

function Hive() {
  return (
    <g className="orchard-hive">
      <ellipse className="orchard-shadow" rx="8" ry="2.4" cy="6" />
      <rect x="-6" y="-4" width="12" height="10" rx="1" className="orchard-hive-box" />
      <path d="M-6 0h12M-6 3h12" className="orchard-hive-line" />
      <path d="M-7.5 -4 0 -9 7.5 -4Z" className="orchard-hive-roof" />
      <circle className="orchard-bee" cx="9" cy="-6" r="1" />
      <circle className="orchard-bee" cx="-10" cy="-2" r="1" />
    </g>
  );
}

function OrchardPaths({
  orchard,
  open,
  onPick,
}: {
  orchard: string;
  open: boolean;
  onPick: (id: FruitId) => void;
}) {
  if (!open) return null;
  const { trees, hives } = parseOrchard(orchard);
  const [x, y, w, h] = ORCHARD_PLACE;
  return (
    <g className="orchard-layer">
      <rect className="orchard-ground" x={x} y={y} width={w} height={h} rx="6" />
      {['orchard-hedge', 'orchard-hedge lit'].map((name) => (
        <rect
          key={name}
          className={name}
          x={x + 2.5}
          y={y + 2.5}
          width={w - 5}
          height={h - 5}
          rx="5"
        />
      ))}
      <path className="orchard-mow" d={MOWN_PATHS} />
      <path className="orchard-tufts" d={MEADOW.tufts} />
      {MEADOW.flowers.map(([fx, fy, tint]) => (
        <circle key={`${fx},${fy}`} className={`orchard-flower f${tint}`} cx={fx} cy={fy} r="0.9" />
      ))}
      {(Object.keys(TREE_SPOTS) as FruitId[]).map((id) => {
        const [tx, ty] = TREE_SPOTS[id];
        const stage = trees[id];
        if (stage !== 'ripe') {
          return (
            <g key={id} transform={`translate(${tx} ${ty})`} data-tree={id} data-stage={stage}>
              <Tree id={id} stage={stage} />
            </g>
          );
        }
        const label = t.orchard.pickLabel(t.orchard.names[id]);
        const onKey = (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPick(id);
          }
        };
        return (
          <g
            key={id}
            className="orchard-ripe"
            transform={`translate(${tx} ${ty})`}
            data-tree={id}
            data-stage={stage}
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={() => onPick(id)}
            onKeyDown={onKey}
          >
            <title>{label}</title>
            <circle className="orchard-ring" r="19" />
            <circle className="tap-hit" r="28" />
            <Tree id={id} stage={stage} />
          </g>
        );
      })}
      {HIVE_SPOTS.slice(0, hives).map(([hx, hy]) => (
        <g key={`${hx},${hy}`} transform={`translate(${hx} ${hy})`}>
          <Hive />
        </g>
      ))}
    </g>
  );
}

export const OrchardLayer = memo(OrchardPaths);

/** A tree on its own, for the orchard panel. */
export function TreeArt({ id, stage }: { id: FruitId; stage: TreeStage }) {
  return (
    <svg
      viewBox="-18 -18 36 36"
      className="fruit-tree-art"
      width="42"
      height="42"
      aria-hidden="true"
    >
      <Tree id={id} stage={stage === 'none' ? 'sapling' : stage} />
    </svg>
  );
}
