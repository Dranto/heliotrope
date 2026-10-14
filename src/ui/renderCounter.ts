// Counts React commits and the components each one rendered (docs/performance-plan.md, lot 0).
// It listens where the React DevTools listen, so it works in production builds too, and reads the
// "performed work" flag React sets on every component it rendered. That flag is a React internal:
// this is a measuring tool for `?perf` and the tests, never something the game depends on.

/** Totals since the counter was installed. */
export interface RenderStats {
  commits: number;
  /** Components rendered, summed over every commit. */
  rendered: number;
  /** Components rendered, by name, summed over every commit. */
  byName: Map<string, number>;
}

interface Fiber {
  tag: number;
  flags: number;
  type: unknown;
  child: Fiber | null;
  sibling: Fiber | null;
}

interface Hook {
  onCommitFiberRoot?: (id: number, root: { current: Fiber }, ...rest: unknown[]) => void;
  [key: string]: unknown;
}

/** Function, class, forwardRef and memo components (React's work tags). */
const COMPONENT_TAGS = new Set([0, 1, 11, 14, 15]);
const PERFORMED_WORK = 1;

function nameOf(type: unknown): string {
  if (typeof type === 'function') {
    const fn = type as { displayName?: string; name?: string };
    return fn.displayName || fn.name || '?';
  }
  if (type && typeof type === 'object') {
    const wrapper = type as { displayName?: string; render?: unknown; type?: unknown };
    return wrapper.displayName || nameOf(wrapper.render ?? wrapper.type);
  }
  return '?';
}

function count(stats: RenderStats, root: Fiber | null): void {
  const stack: Fiber[] = root ? [root] : [];
  while (stack.length > 0) {
    const fiber = stack.pop()!;
    if (COMPONENT_TAGS.has(fiber.tag) && (fiber.flags & PERFORMED_WORK) !== 0) {
      stats.rendered += 1;
      const name = nameOf(fiber.type);
      stats.byName.set(name, (stats.byName.get(name) ?? 0) + 1);
    }
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
}

let installed: RenderStats | null = null;

/**
 * Starts counting. Must run before react-dom is loaded; keeps working beside the React DevTools
 * when they are installed. Returns the live totals.
 */
export function installRenderCounter(scope: Record<string, unknown> = globalThis): RenderStats {
  if (installed) return installed;
  const stats: RenderStats = { commits: 0, rendered: 0, byName: new Map() };
  installed = stats;
  const key = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
  const existing = scope[key] as Hook | undefined;
  const hook: Hook = existing ?? {
    supportsFiber: true,
    renderers: new Map(),
    inject: () => 1,
    onScheduleFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
    onPostCommitFiberRoot: () => {},
    checkDCE: () => {},
  };
  const previous = hook.onCommitFiberRoot;
  hook.onCommitFiberRoot = (id, root, ...rest) => {
    stats.commits += 1;
    count(stats, root.current.child);
    previous?.call(hook, id, root, ...rest);
  };
  if (!existing) scope[key] = hook;
  return stats;
}

/** The totals, when the counter is installed. */
export function renderStats(): RenderStats | null {
  return installed;
}

/** Whether the page was opened with `?perf`, which shows the performance meter. */
export function perfRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('perf');
  } catch {
    return false;
  }
}
