import { useState, type PointerEvent } from 'react';
import { formatNumber } from '../game/format';
import type { SeasonCurve } from '../game/history';
import { t } from '../i18n';

const WIDTH = 320;
const HEIGHT = 150;
const PAD = { left: 40, right: 8, top: 8, bottom: 20 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/** Duration of a curve: the time of its last point. */
function span(curve: SeasonCurve): number {
  return Math.max(0, curve.points.length - 1) * curve.step;
}

/** Value of a curve at `seconds`, the nearest point; undefined past its end. */
function valueAt(curve: SeasonCurve, seconds: number): number | undefined {
  if (curve.points.length === 0 || seconds > span(curve) + curve.step / 2) return undefined;
  return curve.points[Math.min(curve.points.length - 1, Math.round(seconds / curve.step))];
}

/**
 * Light per second through the last Seasons (design doc §10.5), on a log scale so a late Season
 * and the first one share the chart. The current Season is the darkest line, earlier ones fade
 * with age. Pointing at the chart reads each Season's production at that time.
 */
export function ProductionCurve({ curves }: { curves: SeasonCurve[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const drawn = curves.filter((c) => c.points.length > 1);
  if (drawn.length === 0) return <p className="curve-empty">{t.stats.curveEmpty}</p>;

  const duration = Math.max(...drawn.map(span));
  const positive = drawn.flatMap((c) => c.points).filter((p) => p > 0);
  const low = Math.floor(Math.log10(Math.min(...positive, 1)));
  const high = Math.max(low + 1, Math.ceil(Math.log10(Math.max(...positive, 1))));
  const x = (seconds: number) => PAD.left + (seconds / duration) * PLOT_W;
  const y = (value: number) => {
    const log = Math.log10(Math.max(value, 10 ** low));
    return PAD.top + PLOT_H - ((log - low) / (high - low)) * PLOT_H;
  };
  // At most five gridlines, on powers of ten.
  const every = Math.ceil((high - low) / 4);
  const ticks: number[] = [];
  for (let e = low; e <= high; e += every) ticks.push(e);
  const current = curves[curves.length - 1]!.season;

  function onPointer(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * WIDTH;
    const seconds = ((px - PAD.left) / PLOT_W) * duration;
    setHover(seconds >= 0 && seconds <= duration ? seconds : null);
  }

  return (
    <figure className="curve">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={t.stats.curveLabel}
        onPointerMove={onPointer}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((e) => (
          <g key={e} className="curve-grid">
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(10 ** e)} y2={y(10 ** e)} />
            <text x={PAD.left - 6} y={y(10 ** e)} dy="0.32em" textAnchor="end">
              {formatNumber(10 ** e)}
            </text>
          </g>
        ))}
        <g className="curve-axis">
          <text x={PAD.left} y={HEIGHT - 4}>
            0
          </text>
          <text x={WIDTH - PAD.right} y={HEIGHT - 4} textAnchor="end">
            {t.duration(duration)}
          </text>
        </g>
        {drawn.map((curve) => (
          <polyline
            key={curve.season}
            className="curve-line"
            data-current={curve.season === current}
            style={{
              opacity: curve.season === current ? 1 : 0.25 + 0.6 / (current - curve.season),
            }}
            points={curve.points.map((p, i) => `${x(i * curve.step)},${y(p)}`).join(' ')}
          />
        ))}
        {hover !== null && (
          <g className="curve-hover">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + PLOT_H} />
            {drawn.map((curve) => {
              const value = valueAt(curve, hover);
              return value === undefined ? null : (
                <circle
                  key={curve.season}
                  cx={x(hover)}
                  cy={y(value)}
                  r={4}
                  data-current={curve.season === current}
                />
              );
            })}
          </g>
        )}
      </svg>
      <figcaption className="curve-legend">
        {[...drawn].reverse().map((curve) => {
          const value = hover === null ? undefined : valueAt(curve, hover);
          const name = t.seeds.seasonName(curve.season);
          return (
            <span key={curve.season} data-current={curve.season === current}>
              <i
                style={{
                  opacity: curve.season === current ? 1 : 0.25 + 0.6 / (current - curve.season),
                }}
              />
              {value === undefined || hover === null
                ? name
                : t.stats.curveAt(name, t.duration(hover), formatNumber(value))}
            </span>
          );
        })}
      </figcaption>
    </figure>
  );
}
