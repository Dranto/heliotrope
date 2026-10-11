// The return in images (docs/game-design.md §9.1, M17): after an absence, the map replays what
// grew, sped up. The sun sweeps over the city once per hour away (at most four times), then a
// golden ring opens, one after the other, on each building that grew, each bed that ripened and
// on the heliotrope when its Seeds became ripe. No text: the numbers stay in the return notice.
import { memo } from 'react';
import { WORLD } from './neighbourhood';
import { MARK_STEP_SECONDS, SWEEP_SECONDS, type ReturnMark } from './returnMap';
import './return.css';

function MarkIcon({ kind }: { kind: ReturnMark['kind'] }) {
  if (kind === 'ripe')
    return <path d="M0 3 C-3 0 -2 -4 0 -5 C2 -4 3 0 0 3 Z" className="return-leaf" />;
  if (kind === 'seeds') return <ellipse rx={2.4} ry={3.6} className="return-seed" />;
  return <path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" className="return-spark" />;
}

export const ReturnReplay = memo(function ReturnReplay({
  marks,
  sweeps,
}: {
  marks: readonly ReturnMark[];
  sweeps: number;
}) {
  const start = sweeps * SWEEP_SECONDS;
  return (
    <g className="return-replay" aria-hidden="true">
      <defs>
        <linearGradient id="return-sun" x1="0" x2="1">
          <stop offset="0" stopColor="#ffe7a6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffe7a6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffe7a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        className="return-sweep"
        x={-WORLD.width / 2}
        y={0}
        width={WORLD.width / 2}
        height={WORLD.height}
        fill="url(#return-sun)"
        style={{ animationIterationCount: sweeps, animationDuration: `${SWEEP_SECONDS}s` }}
      />
      {marks.map((mark, i) => (
        <g
          key={`${mark.kind}:${mark.x}:${mark.y}`}
          className="return-mark"
          data-kind={mark.kind}
          transform={`translate(${mark.x} ${mark.y})`}
          style={{ animationDelay: `${start + i * MARK_STEP_SECONDS}s` }}
        >
          <circle r={14} className="return-ring" />
          <g transform="scale(1.8)">
            <MarkIcon kind={mark.kind} />
          </g>
        </g>
      ))}
    </g>
  );
});
