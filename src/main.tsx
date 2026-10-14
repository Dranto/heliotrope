import './perfHook';
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/manrope';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameStore } from './game/store';
import { loadLanguage } from './i18n';
import { App } from './ui/App';
import { GameStoreContext } from './ui/useGame';
import { PerfMeter } from './ui/PerfMeter';
import { perfRequested } from './ui/renderCounter';
import './ui/App.css';

const store = new GameStore();
store.start();
// A player who chose English gets its texts before the first picture (lot 4 of the plan).
await loadLanguage(store.getState().settings.language).catch(() => {});

// Save when the tab is hidden or closed so offline progress starts from the right moment.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.save();
});
window.addEventListener('pagehide', store.save);

// §10.5: installable and playable without a connection once loaded (public/sw.js).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameStoreContext.Provider value={store}>
      <App />
    </GameStoreContext.Provider>
  </StrictMode>,
);

// `?perf`: the performance meter, in a root of its own (docs/performance-plan.md, lot 0).
if (perfRequested()) {
  const host = document.createElement('div');
  document.body.append(host);
  createRoot(host).render(<PerfMeter />);
}
