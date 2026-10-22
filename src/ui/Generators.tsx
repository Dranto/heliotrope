import { useEffect, useState } from 'react';
import {
  canChoosePath,
  choosePath,
  GROWTH,
  GROWTH_TIERS,
  pendingTier,
  reachedTiers,
  strengthen,
} from '../game/growth';
import {
  buildingWeather,
  favouredBuildings,
  isWeatherOpen,
  WEATHER_PATH_FACTOR,
} from '../game/weather';
import { WeatherIcon } from './WeatherArt';
import { GeneratorIcon } from './UpgradeIcon';
import { bonusText } from '../i18n/restoration';
import { guideStep } from '../game/guide';
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
import { Eta } from './Goals';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { isElsewhere } from './shortcuts';
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
  const guide = guideStep(state);

  // §10.5: keys 1 to 8 buy the generator of that rank with the chosen amount; M toggles Max.
  // No key clicks the heliotrope, so the keyboard never stands in for an autoclicker.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isElsewhere(event)) return;
      if (event.key === 'm' || event.key === 'M') {
        setAmount((current) => (current === 'max' ? 1 : 'max'));
        return;
      }
      const rank = Number(event.key);
      const id = Number.isInteger(rank) && rank >= 1 ? GENERATOR_IDS[rank - 1] : undefined;
      if (!id) return;
      store.dispatch((s) =>
        isGeneratorRevealed(s, id) ? buyGenerator(s, id, unitsFor(s, id, amount)) : s,
      );
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [store, amount]);

  return (
    <section className="panel generators" aria-labelledby="generators-title" data-open={open}>
      <div className="panel-head">
        <PanelTitle id="generators-title" open={open} onToggle={toggle}>
          {t.generatorsTitle}
        </PanelTitle>
        <div
          className="segmented"
          role="radiogroup"
          aria-label={t.buyAmount}
          aria-keyshortcuts="M"
          title={t.shortcutsHint}
        >
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
          const rank = GENERATOR_IDS.indexOf(id) + 1;
          return (
            <li key={id} className="generator">
              <div className="generator-text">
                <h3>
                  <GeneratorIcon id={id} />
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
                data-guide={(guide?.kind === 'building' && guide.generator === id) || undefined}
                disabled={!affordable}
                aria-label={t.buyLabel(text.name, cost, units)}
                aria-describedby={`buy-eta-${id}`}
                aria-keyshortcuts={String(rank)}
                title={t.shortcutsHint}
                onClick={() => store.dispatch((s) => buyGenerator(s, id, unitsFor(s, id, amount)))}
              >
                <span className="buy-verb">
                  {t.buy}
                  {units > 1 && ` ×${units}`}
                </span>
                <span className="buy-cost">☀ {cost}</span>
                {owned < limit && (
                  <Eta cost={generatorCost(state, id, units)} id={`buy-eta-${id}`} />
                )}
              </button>
              <GrowthPaths id={id} state={state} />
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

/**
 * §5.5 (M26): the three forms of a building, as pips, and the fork of two paths at a tier: shown
 * on its own when a tier is reached without a path, or when the player picks a pip.
 */
function GrowthPaths({ id, state }: { id: GeneratorId; state: GameState }) {
  const store = useGameStore();
  const [picked, setPicked] = useState<number | null>(null);
  const reached = reachedTiers(state, id);
  const pending = pendingTier(state, id);
  const shown = picked ?? pending;
  const forms = t.growth.forms[id];
  if (reached === 0 && picked === null && state.generators[id] < GROWTH_TIERS[0] / 2) return null;
  // Under its weather, a building's paths play stronger (M33).
  const sky = isWeatherOpen(state) ? buildingWeather(id) : null;
  const favoured = favouredBuildings(state).includes(id);
  return (
    <div className="growth" role="group" aria-label={t.growth.label(t.generators[id].name)}>
      <span className="growth-pips">
        {GROWTH_TIERS.map((count, tier) => {
          const path = state.growth.paths[id][tier];
          return (
            <button
              key={count}
              type="button"
              className="growth-pip"
              data-reached={tier < reached}
              data-path={path ?? undefined}
              data-pending={pending === tier || undefined}
              aria-expanded={shown === tier}
              title={t.growth.tier(forms[tier]!, formatNumber(count))}
              aria-label={t.growth.tier(forms[tier]!, formatNumber(count))}
              onClick={() => setPicked(shown === tier ? null : tier)}
            />
          );
        })}
        {sky && (
          <span
            className="growth-sky"
            data-active={favoured}
            role="img"
            aria-label={t.weather.paths(t.weather.day[sky])}
            title={t.weather.paths(t.weather.day[sky])}
          >
            <WeatherIcon id={sky} />
          </span>
        )}
      </span>
      {shown !== null && (
        <div className="growth-fork" role="group" aria-label={t.growth.choose(forms[shown]!)}>
          {([0, 1] as const).map((path) => {
            const current = state.growth.paths[id][shown] === path;
            const allowed = current || canChoosePath(state, id, shown, path);
            return (
              <button
                key={path}
                type="button"
                className="growth-path"
                data-path={path}
                aria-pressed={current}
                disabled={!allowed}
                title={allowed ? undefined : t.growth.locked}
                onClick={() => {
                  store.dispatch((s) => choosePath(s, id, shown, path));
                  setPicked(null);
                }}
              >
                {bonusText(
                  strengthen(GROWTH[id][shown]![path], favoured ? WEATHER_PATH_FACTOR : 1),
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
