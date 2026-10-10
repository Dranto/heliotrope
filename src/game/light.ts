import type { GameState } from './state';

/** Add Light to the reserve, to the Season total and to the all-time total. */
export function earnLight(state: GameState, amount: number): GameState {
  return {
    ...state,
    resources: { ...state.resources, light: state.resources.light + amount },
    totalLight: state.totalLight + amount,
    allTimeLight: state.allTimeLight + amount,
  };
}
