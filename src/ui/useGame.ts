import { createContext, useContext, useSyncExternalStore } from 'react';
import type { GameStore } from '../game/store';

export const GameStoreContext = createContext<GameStore | null>(null);

export function useGameStore(): GameStore {
  const store = useContext(GameStoreContext);
  if (!store) throw new Error('useGameStore must be used inside <GameStoreContext.Provider>');
  return store;
}

/** Subscribe to the live game state. */
export function useGameState() {
  const store = useGameStore();
  return useSyncExternalStore(store.subscribe, store.getState);
}
