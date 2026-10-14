// Imported first by main.tsx: with `?perf` in the address, React renders are counted from the
// very first one (docs/performance-plan.md, lot 0), and `npm run perf` reads them through
// `window.__perfStats`. Nothing happens otherwise.
import { installRenderCounter, perfRequested, renderStats } from './ui/renderCounter';

if (perfRequested()) {
  installRenderCounter();
  (window as unknown as { __perfStats: typeof renderStats }).__perfStats = renderStats;
}
