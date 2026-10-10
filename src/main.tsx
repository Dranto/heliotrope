import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameStore } from './game/store';
import { App } from './ui/App';
import { GameStoreContext } from './ui/useGame';
import './ui/App.css';

const store = new GameStore();
store.start();

// Save when the tab is hidden or closed so offline progress starts from the right moment.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.save();
});
window.addEventListener('pagehide', store.save);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameStoreContext.Provider value={store}>
      <App />
    </GameStoreContext.Provider>
  </StrictMode>,
);
