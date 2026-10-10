import { useEffect, useRef, useState } from 'react';
import { ACHIEVEMENTS, bonusPerAchievement, type AchievementId } from '../game/achievements';
import { formatNumber, formatPercent } from '../game/format';
import { achievementDescription, achievementName } from '../i18n/achievements';
import { t } from '../i18n/fr';
import { useGameState } from './useGame';

/** How long one medallion stays on screen, its bloom and fade included. */
export const BLOOM_MS = 4200;
/** More Milestones than this at once share a single medallion. */
const GROUP_OVER = 3;
/** Medallions waiting their turn; beyond this the waiting ones merge into one. */
const MAX_QUEUE = 4;

interface Bloom {
  key: number;
  ids: AchievementId[];
}

let nextKey = 0;

function enqueue(queue: Bloom[], fresh: AchievementId[]): Bloom[] {
  const blooms =
    fresh.length > GROUP_OVER
      ? [{ key: nextKey++, ids: fresh }]
      : fresh.map((id) => ({ key: nextKey++, ids: [id] }));
  const next = [...queue, ...blooms];
  if (next.length <= MAX_QUEUE) return next;
  // Keep the medallion on screen and merge everything still waiting.
  const [current, ...waiting] = next;
  return [current!, { key: nextKey++, ids: waiting.flatMap((b) => b.ids) }];
}

/** Angles (degrees, clockwise from east) of the laurel leaves along the left branch. */
const LEAF_ANGLES = [112, 136, 160, 184, 208];
const WREATH_RADIUS = 18;

function polar(angle: number, radius = WREATH_RADIUS): [number, number] {
  const rad = (angle * Math.PI) / 180;
  return [40 + radius * Math.cos(rad), 40 + radius * Math.sin(rad)];
}

/** The laurel medallion: a golden ring that draws itself, a wreath leafing out, petals. */
function Medallion() {
  const [startX, startY] = polar(96);
  const [endX, endY] = polar(220);
  const branch = `M${startX} ${startY}A${WREATH_RADIUS} ${WREATH_RADIUS} 0 0 1 ${endX} ${endY}`;
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="bloom-medallion">
      <circle className="bloom-halo" cx="40" cy="40" r="30" />
      <circle className="bloom-disc" cx="40" cy="40" r="25" />
      <circle className="bloom-ring" cx="40" cy="40" r="27" pathLength="1" />
      <g className="bloom-petals">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <ellipse
            key={angle}
            cx="40"
            cy="7"
            rx="2.4"
            ry="4.6"
            style={{ transform: `rotate(${angle + 30}deg)` }}
          />
        ))}
      </g>
      {[1, -1].map((side) => (
        // The right branch mirrors the left one.
        <g key={side} transform={side === -1 ? 'matrix(-1 0 0 1 80 0)' : undefined}>
          <path className="bloom-stem" d={branch} pathLength="1" />
          {LEAF_ANGLES.map((angle, i) => {
            const [x, y] = polar(angle);
            return (
              <g key={angle} transform={`rotate(${angle + 90 - 28} ${x} ${y})`}>
                <ellipse
                  className="bloom-leaf"
                  cx={x}
                  cy={y}
                  rx="5.2"
                  ry="2.2"
                  style={{ animationDelay: `${0.5 + i * 0.11}s` }}
                />
              </g>
            );
          })}
        </g>
      ))}
      <circle className="bloom-bud" cx="40" cy="40" r="5" />
    </svg>
  );
}

/**
 * §9.3: each Milestone reached blooms as a laurel medallion at the top of the screen, with its
 * name, its condition and the production it adds, then fades. Nothing blooms for the Milestones
 * already reached when the game loads. With reduced motion the medallion simply appears.
 */
export function MilestoneBloom() {
  const state = useGameState();
  const seen = useRef(state.achievements.length);
  const [queue, setQueue] = useState<Bloom[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    // An imported save can hold fewer Milestones: start counting again from there.
    const fresh = state.achievements.slice(Math.min(seen.current, state.achievements.length));
    seen.current = state.achievements.length;
    if (fresh.length === 0) return;
    setQueue((queue) => enqueue(queue, fresh));
    setAnnouncements(
      fresh.length > GROUP_OVER
        ? [t.achievements.unlockedMany(formatNumber(fresh.length))]
        : fresh.map((id) => t.achievements.unlocked(achievementName(ACHIEVEMENTS[id]))),
    );
  }, [state.achievements]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setQueue((queue) => queue.slice(1)), BLOOM_MS);
    return () => clearTimeout(timer);
  }, [current]);

  const single = current?.ids.length === 1 ? ACHIEVEMENTS[current.ids[0]!] : undefined;
  return (
    <div className="milestone-bloom-area">
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcements.map((text) => (
          <span key={text}>{text} </span>
        ))}
      </p>
      {current && (
        <div key={current.key} className="milestone-bloom" aria-hidden="true">
          <Medallion />
          <div className="bloom-text">
            <span className="bloom-kicker">
              {single ? t.achievements.bloomKicker : t.achievements.bloomKickerMany}
            </span>
            <strong className="bloom-name">
              {single ? achievementName(single) : formatNumber(current.ids.length)}
            </strong>
            {single && <span className="bloom-condition">{achievementDescription(single)}</span>}
            <span className="bloom-bonus">
              {t.achievements.bloomBonus(
                formatPercent(bonusPerAchievement(state) * current.ids.length),
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
