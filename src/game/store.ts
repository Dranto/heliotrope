import { applyOfflineProgress } from './offline';
import { clearSave, importSave, loadGame, saveGame } from './save';
import { createInitialState, type GameState } from './state';
import { tick } from './tick';

export const TICK_MS = 100;
/** §9.4: autosave every 30 s (and when the tab is hidden or closed, see main.tsx). */
export const AUTOSAVE_MS = 30_000;

type Listener = () => void;

/**
 * Holds the live game state, drives the tick loop and autosave.
 * UI reads it through useSyncExternalStore (see ui/useGame.ts).
 */
export class GameStore {
  private state: GameState;
  private listeners = new Set<Listener>();
  private tickTimer: ReturnType<typeof setInterval> | undefined;
  private saveTimer: ReturnType<typeof setInterval> | undefined;
  /** Seconds of offline progress applied when the store was created. */
  readonly offlineSeconds: number;
  /** Light produced during those offline seconds. */
  readonly offlineLight: number;

  constructor(
    private readonly storage: Storage = localStorage,
    private readonly now: () => number = Date.now,
  ) {
    const loaded = loadGame(this.now(), storage);
    if (loaded) {
      const result = applyOfflineProgress(loaded, this.now());
      this.state = result.state;
      this.offlineSeconds = result.elapsedSeconds;
      this.offlineLight = result.state.totalLight - loaded.totalLight;
    } else {
      this.state = createInitialState(this.now());
      this.offlineSeconds = 0;
      this.offlineLight = 0;
    }
  }

  getState = (): GameState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Apply a pure state transition, e.g. store.dispatch(clickHeliotrope). */
  dispatch = (update: (state: GameState) => GameState): void => {
    this.setState(update(this.state));
  };

  /** Advance to the current wall-clock time. Uses real elapsed time, so throttled tabs catch up. */
  step = (): void => {
    const dt = (this.now() - this.state.lastUpdate) / 1000;
    if (dt > 0) this.setState(tick(this.state, dt));
  };

  save = (): void => saveGame(this.state, this.storage);

  /** Replace the game with an imported one and save it right away. */
  load = (state: GameState): void => {
    this.setState(state);
    this.save();
  };

  /** Import an exported save (§9.4). Returns false, leaving the game untouched, when invalid. */
  importText = (text: string): boolean => {
    const imported = importSave(text, this.now());
    if (!imported) return false;
    this.load(imported);
    return true;
  };

  /** Full reset (§9.4): erase the save and start a fresh game. */
  reset = (): void => {
    clearSave(this.storage);
    this.setState(createInitialState(this.now()));
    this.save();
  };

  start(): void {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(this.step, TICK_MS);
    this.saveTimer = setInterval(this.save, AUTOSAVE_MS);
  }

  stop(): void {
    clearInterval(this.tickTimer);
    clearInterval(this.saveTimer);
    this.tickTimer = undefined;
    this.saveTimer = undefined;
  }

  private setState(next: GameState): void {
    if (next === this.state) return;
    this.state = next;
    for (const listener of this.listeners) listener();
  }
}
