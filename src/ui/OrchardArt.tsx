// The orchard and its hives on the map (docs/game-design.md §9.8, M22): four fruit trees that
// grow from a staked sapling to a crown in bloom, then heavy with fruit; a ripe tree breathes in
// a golden ring and is picked with a click (or Enter). Hives stand below the trees, bees around
// them. Drawn in SVG over both maps.
import { memo, type KeyboardEvent } from 'react';
import type { FruitId, TreeStage } from '../game/orchard';
import { t } from '../i18n';
import { HIVE_SPOTS, ORCHARD_PLACE, parseOrchard, TREE_SPOTS } from './orchardMap';
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

function Tree({ id, stage }: { id: FruitId; stage: TreeStage }) {
  if (stage === 'none') {
    return (
      <g className="orchard-pit">
        <ellipse rx="7" ry="4" cy="4" />
        <path className="orchard-stake" d="M0 4V-6" />
      </g>
    );
  }
  if (stage === 'sapling') {
    return (
      <g className="orchard-sapling">
        <ellipse className="orchard-shadow" rx="7" ry="3" cy="5" />
        <path className="orchard-stake" d="M2 5V-9" />
        <path className="orchard-trunk" d="M0 5V-4" />
        <circle className="orchard-crown" r="5" cy="-6" />
      </g>
    );
  }
  const fruit = stage === 'fruiting' || stage === 'ripe';
  const spots = stage === 'fruiting' ? CROWN_SPOTS.slice(0, 4) : CROWN_SPOTS;
  return (
    <g className="orchard-tree">
      <ellipse className="orchard-shadow" rx="15" ry="5" cy="13" />
      <path className="orchard-trunk" d="M0 13V2" strokeWidth={3} />
      <circle className="orchard-crown" r="14" />
      <circle className="orchard-crown-light" r="9" cx="-3" cy="-4" />
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
      <path
        className="orchard-mow"
        d={`M${x + 8} ${y + 82}H${x + w - 8}M${x + 8} ${y + 20}H${x + w - 8}`}
      />
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
