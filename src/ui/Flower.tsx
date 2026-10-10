import { useState, type MouseEvent, type PointerEvent } from 'react';
import { formatNumber } from '../game/format';
import { clickValue } from '../game/production';
import { clickHeliotrope } from '../game/tick';
import { t } from '../i18n/fr';
import { useGameState, useGameStore } from './useGame';

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
}

let nextFloaterId = 0;

/** The clickable heliotrope, framed by an Art nouveau arch (docs/game-design.md §10.1, §10.4). */
export function Flower() {
  const store = useGameStore();
  const state = useGameState();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [tilt, setTilt] = useState(0);
  const [bloom, setBloom] = useState(0);
  const value = clickValue(state);

  function harvest(event: MouseEvent<HTMLButtonElement>) {
    store.dispatch(clickHeliotrope);
    setBloom((b) => b + 1);
    const rect = event.currentTarget.getBoundingClientRect();
    // Keyboard activation (detail 0) has no pointer position: float from the blossoms.
    const fromPointer = event.detail > 0;
    const x = fromPointer ? event.clientX - rect.left : rect.width / 2;
    const y = fromPointer ? event.clientY - rect.top : rect.height / 3;
    const floater = { id: nextFloaterId++, x, y, text: `+${formatNumber(value)}` };
    setFloaters((list) => [...list.slice(-12), floater]);
  }

  function follow(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientX - rect.left) / rect.width - 0.5;
    setTilt(Math.max(-1, Math.min(1, offset * 2)) * 8);
  }

  return (
    <section className="panel flower-panel" aria-label={t.light}>
      <button
        type="button"
        className="flower-button"
        aria-label={t.clickFlower}
        onPointerMove={follow}
        onPointerLeave={() => setTilt(0)}
        onClick={harvest}
      >
        <svg viewBox="0 0 200 260" className="flower-art" aria-hidden="true">
          <defs>
            <radialGradient id="flower-halo" cx="50%" cy="38%" r="55%">
              <stop offset="0%" stopColor="#FFE7A8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFE7A8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="petal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CDB6EA" />
              <stop offset="100%" stopColor="#9C7CC4" />
            </linearGradient>
          </defs>
          <path
            className="arch"
            d="M20 256 V100 C20 40 60 8 100 8 C140 8 180 40 180 100 V256"
            fill="none"
          />
          <circle cx="100" cy="96" r="92" fill="url(#flower-halo)" />
          <g className="flower-sway" style={{ transform: `rotate(${tilt}deg)` }}>
            <path className="stem" d="M100 250 C98 210 104 170 100 120" fill="none" />
            <path className="leaf" d="M100 200 C80 186 62 190 52 204 C70 210 86 208 100 200 Z" />
            <path
              className="leaf"
              d="M101 172 C120 156 140 158 150 170 C132 180 116 180 101 172 Z"
            />
            <g className="blossoms" key={bloom}>
              {CLUSTER.map(([cx, cy, r], i) => (
                <g key={i} transform={`translate(${cx} ${cy})`}>
                  {[0, 72, 144, 216, 288].map((angle) => (
                    <ellipse
                      key={angle}
                      className="petal"
                      rx={r * 0.55}
                      ry={r}
                      cy={-r * 0.7}
                      transform={`rotate(${angle})`}
                      fill="url(#petal)"
                    />
                  ))}
                  <circle r={r * 0.32} className="pistil" />
                </g>
              ))}
            </g>
          </g>
        </svg>
        {floaters.map((f) => (
          <span
            key={f.id}
            className="floater"
            style={{ left: f.x, top: f.y }}
            onAnimationEnd={() => setFloaters((list) => list.filter((x) => x.id !== f.id))}
          >
            {f.text}
          </span>
        ))}
      </button>
      <p className="click-value">
        <strong>+{formatNumber(value)}</strong> {t.perClick}
      </p>
      <p className="hint">{t.clickHint}</p>
    </section>
  );
}

/** Heliotrope flowers grow in a dome-shaped cluster: [x, y, radius]. */
const CLUSTER: [number, number, number][] = [
  [100, 84, 13],
  [76, 96, 11],
  [124, 96, 11],
  [88, 70, 10],
  [112, 70, 10],
  [64, 116, 9],
  [136, 116, 9],
  [100, 108, 11],
  [82, 118, 9],
  [118, 118, 9],
  [100, 56, 9],
];
