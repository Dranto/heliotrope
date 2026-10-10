import { formatNumber } from '../game/format';
import { RESOURCE_IDS, RESOURCES } from '../game/resources';
import { gather, productionRates } from '../game/tick';
import { useGameState, useGameStore } from './useGame';

export function App() {
  const store = useGameStore();
  const state = useGameState();
  const rates = productionRates(state);

  return (
    <main className="app">
      <header>
        <h1>Heliotrope</h1>
        <p className="tagline">A solarpunk idle game</p>
      </header>

      {store.offlineSeconds >= 60 && (
        <p className="notice" role="status">
          Welcome back! {formatNumber(Math.floor(store.offlineSeconds / 60))} minutes of growth
          while you were away.
        </p>
      )}

      <section className="resources" aria-label="Resources">
        {RESOURCE_IDS.map((id) => (
          <div key={id} className="resource">
            <span className="resource-name">{RESOURCES[id].name}</span>
            <span className="resource-amount" data-testid={`amount-${id}`}>
              {formatNumber(Math.floor(state.resources[id]))}
            </span>
            <span className="resource-rate">+{formatNumber(rates[id])}/s</span>
          </div>
        ))}
      </section>

      <button type="button" onClick={() => store.dispatch((s) => gather(s, 'sunlight'))}>
        Gather sunlight
      </button>
    </main>
  );
}
