import { formatNumber } from '../game/format';
import { GENERATOR_IDS, GENERATORS } from '../game/generators';
import {
  buyGenerator,
  canBuyGenerator,
  generatorCost,
  generatorProduction,
  isGeneratorRevealed,
} from '../game/tick';
import { t } from '../i18n/fr';
import { useGameState, useGameStore } from './useGame';

/** Costs are shown rounded up so the displayed price is always enough to buy. */
const formatCost = (cost: number) => formatNumber(Math.ceil(cost));

/**
 * Generator list (docs/game-design.md §4, §10.1): revealed generators, then the next one as a
 * silhouette with its price so the player always has a visible goal.
 */
export function Generators() {
  const store = useGameStore();
  const state = useGameState();
  const revealed = GENERATOR_IDS.filter((id) => isGeneratorRevealed(state, id));
  const next = GENERATOR_IDS.find((id) => !isGeneratorRevealed(state, id));

  return (
    <section className="panel generators" aria-labelledby="generators-title">
      <h2 id="generators-title">{t.generatorsTitle}</h2>
      <ul>
        {revealed.map((id) => {
          const text = t.generators[id];
          const owned = state.generators[id];
          const cost = formatCost(generatorCost(state, id));
          const affordable = canBuyGenerator(state, id);
          return (
            <li key={id} className="generator">
              <div className="generator-text">
                <h3>{text.name}</h3>
                <p className="flavour">{text.flavour}</p>
                <p className="generator-stats">
                  {owned > 0
                    ? `${t.produces} ${formatNumber(generatorProduction(state, id))} ${t.perSecond}`
                    : `+${formatNumber(GENERATORS[id].baseProduction)} ${t.perSecond}`}
                </p>
              </div>
              <span className="owned" data-testid={`owned-${id}`} title={t.owned}>
                {owned}
              </span>
              <button
                type="button"
                className="buy"
                disabled={!affordable}
                aria-label={t.buyLabel(text.name, cost)}
                onClick={() => store.dispatch((s) => buyGenerator(s, id))}
              >
                <span className="buy-verb">{t.buy}</span>
                <span className="buy-cost">☀ {cost}</span>
              </button>
            </li>
          );
        })}
        {next && (
          <li className="generator silhouette" aria-label={t.unknownGenerator}>
            <div className="generator-text">
              <h3>{t.unknownGenerator}</h3>
              <p className="flavour">· · ·</p>
            </div>
            <span className="buy-cost">☀ {formatCost(GENERATORS[next].baseCost)}</span>
          </li>
        )}
      </ul>
    </section>
  );
}
