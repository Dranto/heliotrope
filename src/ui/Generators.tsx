import { useState } from 'react';
import { generatorLimit } from '../game/challenges';
import { formatCost, formatNumber, formatPercent } from '../game/format';
import { GENERATOR_IDS, GENERATORS, type GeneratorId } from '../game/generators';
import {
  biodiversityBonus,
  generatorCost,
  generatorMultiplier,
  generatorProduction,
  globalMultiplier,
  isGeneratorRevealed,
  maxAffordable,
} from '../game/production';
import type { GameState } from '../game/state';
import { buyGenerator, canBuyGenerator } from '../game/tick';
import { t } from '../i18n';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';

type BuyAmount = 1 | 10 | 100 | 'max';
const BUY_AMOUNTS: BuyAmount[] = [1, 10, 100, 'max'];

/** Units a bulk button buys: the chosen amount, or as many as affordable (at least 1 shown). */
function unitsFor(state: GameState, id: GeneratorId, amount: BuyAmount): number {
  return amount === 'max' ? Math.max(1, maxAffordable(state, id)) : amount;
}

/** Light per second one more unit would add, with current multipliers. */
function unitProduction(state: GameState, id: GeneratorId): number {
  return GENERATORS[id].baseProduction * generatorMultiplier(state, id) * globalMultiplier(state);
}

/**
 * Generator list (docs/game-design.md §4, §10.1): revealed generators, then the next one as a
 * silhouette with its price so the player always has a visible goal. Bulk buy ×1/×10/×100/Max.
 */
export function Generators() {
  const store = useGameStore();
  const state = useGameState();
  const [amount, setAmount] = useState<BuyAmount>(1);
  const [open, toggle] = usePanelOpen('generators');
  const revealed = GENERATOR_IDS.filter((id) => isGeneratorRevealed(state, id));
  const next = GENERATOR_IDS.find((id) => !isGeneratorRevealed(state, id));
  const biodiversity = biodiversityBonus(state);

  return (
    <section className="panel generators" aria-labelledby="generators-title" data-open={open}>
      <div className="panel-head">
        <PanelTitle id="generators-title" open={open} onToggle={toggle}>
          {t.generatorsTitle}
        </PanelTitle>
        <div className="segmented" role="radiogroup" aria-label={t.buyAmount}>
          {BUY_AMOUNTS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={amount === option}
              onClick={() => setAmount(option)}
            >
              {option === 'max' ? t.buyMax : `×${option}`}
            </button>
          ))}
        </div>
      </div>
      {biodiversity > 0 && (
        <p className="biodiversity" title={t.biodiversityHint}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 14V7M8 9C5 9 3 7 3 4c3 0 5 2 5 5zm0-1c0-3 2-5 5-5 0 3-2 5-5 5z" />
          </svg>
          {t.biodiversity(formatPercent(biodiversity))}
        </p>
      )}
      <ul>
        {revealed.map((id) => {
          const text = t.generators[id];
          const owned = state.generators[id];
          const units = unitsFor(state, id, amount);
          const cost = formatCost(generatorCost(state, id, units));
          const affordable = canBuyGenerator(state, id, units);
          const limit = generatorLimit(state, id);
          return (
            <li key={id} className="generator">
              <div className="generator-text">
                <h3>
                  {text.name}
                  {limit !== Infinity && (
                    <span className="generator-limit">
                      {limit === 0
                        ? t.challenges.blockedTag
                        : t.challenges.limitTag(formatNumber(limit))}
                    </span>
                  )}
                </h3>
                <p className="flavour">{text.flavour}</p>
                <p className="generator-stats">
                  {owned > 0
                    ? `${t.produces} ${formatNumber(generatorProduction(state, id))} ${t.perSecond}`
                    : `+${formatNumber(unitProduction(state, id))} ${t.perSecond}`}
                </p>
              </div>
              <span className="owned" data-testid={`owned-${id}`} title={t.owned}>
                {owned}
              </span>
              <button
                type="button"
                className="buy"
                disabled={!affordable}
                aria-label={t.buyLabel(text.name, cost, units)}
                onClick={() => store.dispatch((s) => buyGenerator(s, id, unitsFor(s, id, amount)))}
              >
                <span className="buy-verb">
                  {t.buy}
                  {units > 1 && ` ×${units}`}
                </span>
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
