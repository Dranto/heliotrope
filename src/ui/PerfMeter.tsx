// The performance meter shown with `?perf` in the address (docs/performance-plan.md, lot 0), so
// the game can be measured on a real device: frames per second, the slowest frame, React work per
// second and the map renderer. A measuring tool, in technical shorthand, not part of the game.
import { useEffect, useState } from 'react';
import { mapRenderer } from './rendererPref';
import { renderStats } from './renderCounter';

export interface PerfSample {
  fps: number;
  /** Longest gap between two frames over the last second, in ms. */
  worstFrame: number;
  commits: number;
  /** Components rendered per commit, on average over the last second. */
  perCommit: number;
  nodes: number;
}

/** Turns one second of frame times and render totals into what the meter shows. */
function sample(
  frames: readonly number[],
  commits: number,
  rendered: number,
  nodes: number,
): PerfSample {
  let worst = 0;
  for (let i = 1; i < frames.length; i++) worst = Math.max(worst, frames[i]! - frames[i - 1]!);
  return {
    fps: Math.max(0, frames.length - 1),
    worstFrame: Math.round(worst),
    commits,
    perCommit: commits > 0 ? Math.round(rendered / commits) : 0,
    nodes,
  };
}

export function PerfMeter() {
  const [shown, setShown] = useState<PerfSample | null>(null);
  useEffect(() => {
    let frames: number[] = [];
    let raf = requestAnimationFrame(function frame(now) {
      frames.push(now);
      raf = requestAnimationFrame(frame);
    });
    let last = { commits: 0, rendered: 0 };
    const timer = setInterval(() => {
      const stats = renderStats();
      const commits = (stats?.commits ?? 0) - last.commits;
      const rendered = (stats?.rendered ?? 0) - last.rendered;
      last = { commits: stats?.commits ?? 0, rendered: stats?.rendered ?? 0 };
      setShown(sample(frames, commits, rendered, document.getElementsByTagName('*').length));
      frames = frames.slice(-1);
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, []);
  if (!shown) return null;
  const { renderer } = mapRenderer();
  // The quality tier the WebGL map settled on (0 = full), see pixi/model.ts.
  const quality = document.querySelector<HTMLElement>('.pixi-canvas')?.dataset.quality;
  const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
  return (
    <output className="perf-meter" aria-hidden="true" data-testid="perf-meter">
      {shown.fps} fps · max {shown.worstFrame} ms
      <br />
      React {shown.commits}/s × {shown.perCommit}
      <br />
      {renderer}
      {quality !== undefined && ` q${quality}`} · dpr {dpr} · {shown.nodes} nodes
    </output>
  );
}
