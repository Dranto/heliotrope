import { useEffect, useState } from 'react';
import { guideStep } from '../game/guide';
import { upgradesAllowed } from '../game/challenges';
import { formatCost, formatNumber } from '../game/format';
import { availableUpgrades, upgradeInSight } from '../game/production';
import { affordableUpgrades, buyAffordableUpgrades, buyUpgrade, canBuyUpgrade } from '../game/tick';
import type { UpgradeId } from '../game/upgrades';
import { t } from '../i18n';
import { Eta } from './Goals';
import { isElsewhere } from './shortcuts';
import { upgradeEffectText, upgradeText } from '../i18n/upgrades';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { UpgradeIcon, upgradeFamily } from './UpgradeIcon';
import { useGameState, useGameStore } from './useGame';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * Available upgrades (docs/game-design.md §5, §10.1), cheapest first, as icon tiles. Selecting a
 * tile shows its details and buy button, so touch players can read before they buy.
 */
export function Upgrades() {
  const store = useGameStore();
  const state = useGameState();
  const available = availableUpgrades(state);
  const [selectedId, setSelectedId] = useState<UpgradeId | null>(null);
  const [open, toggle] = usePanelOpen('upgrades');
  const selected = available.find((u) => u.id === selectedId) ?? available[0];
  const wild = !upgradesAllowed(state);
  const guide = guideStep(state);
  const affordable = affordableUpgrades(state).length;

  // §10.5: U buys every upgrade the reserve covers, like the button.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isElsewhere(event) || (event.key !== 'u' && event.key !== 'U')) return;
      store.dispatch(buyAffordableUpgrades);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [store]);

  // Nothing to show before the first upgrade unlocks.
  if (selected === undefined && state.upgrades.length === 0 && !wild) return null;

  return (
    <section className="panel upgrades" aria-labelledby="upgrades-title" data-open={open}>
      <div className="panel-head">
        <PanelTitle id="upgrades-title" open={open} onToggle={toggle}>
          {t.upgradesTitle}
        </PanelTitle>
        {affordable > 1 && (
          <button
            type="button"
            className="buy-all"
            aria-keyshortcuts="U"
            aria-label={t.buyAllUpgradesLabel(affordable)}
            title={t.buyAllUpgradesLabel(affordable)}
            onClick={() => store.dispatch(buyAffordableUpgrades)}
          >
            {t.buyAllUpgrades}
            <span className="buy-all-count">{affordable}</span>
          </button>
        )}
      </div>
      {selected === undefined ? (
        <>
          <p className="empty">{wild ? t.challenges.noUpgrades : t.noUpgrades}</p>
          {!wild && <UpgradeInSightLine />}
        </>
      ) : (
        <>
          <ul className="upgrade-grid">
            {available.map((upgrade) => {
              const tier = upgrade.id.split('.')[1];
              const affordable = canBuyUpgrade(state, upgrade.id);
              const label = t.upgradeTile(
                upgradeText(upgrade).name,
                formatCost(upgrade.cost),
                affordable,
              );
              return (
                <li key={upgrade.id}>
                  <button
                    type="button"
                    className="upgrade-tile"
                    aria-label={label}
                    title={label}
                    aria-pressed={upgrade.id === selected.id}
                    data-affordable={affordable}
                    data-family={upgradeFamily(upgrade)}
                    data-guide={
                      (guide?.kind === 'upgrade' && guide.upgrade === upgrade.id) || undefined
                    }
                    onClick={() => setSelectedId(upgrade.id)}
                  >
                    <UpgradeIcon upgrade={upgrade} />
                    {tier && <span className="tier">{ROMAN[Number(tier) - 1]}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <UpgradeDetail
            key={selected.id}
            name={upgradeText(selected).name}
            flavour={upgradeText(selected).flavour}
            effect={upgradeEffectText(selected)}
            cost={formatCost(selected.cost)}
            price={selected.cost}
            affordable={canBuyUpgrade(state, selected.id)}
            onBuy={() => store.dispatch((s) => buyUpgrade(s, selected.id))}
          />
        </>
      )}
    </section>
  );
}

/** The nearest upgrade still locked, with the building count it waits for. */
function UpgradeInSightLine() {
  const state = useGameState();
  const sight = upgradeInSight(state);
  if (!sight) return null;
  const progress = Math.min(1, sight.owned / sight.required);
  return (
    <div className="upgrade-sight" data-testid="upgrade-in-sight">
      <span>
        {t.upgradeInSight(
          upgradeText(sight.upgrade).name,
          t.generators[sight.generator].name,
          formatNumber(sight.owned),
          formatNumber(sight.required),
        )}
      </span>
      <span className="achievement-next-bar" aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </span>
    </div>
  );
}

interface DetailProps {
  name: string;
  flavour: string;
  effect: string;
  cost: string;
  price: number;
  affordable: boolean;
  onBuy: () => void;
}

function UpgradeDetail({ name, flavour, effect, cost, price, affordable, onBuy }: DetailProps) {
  return (
    <div className="upgrade-detail" aria-live="polite">
      <div>
        <h3>{name}</h3>
        <p className="upgrade-effect">{effect}</p>
        <p className="flavour">{flavour}</p>
      </div>
      <button
        type="button"
        className="buy"
        disabled={!affordable}
        aria-label={t.buyUpgradeLabel(name, cost)}
        onClick={onBuy}
      >
        <span className="buy-verb">{t.buy}</span>
        <span className="buy-cost">☀ {cost}</span>
        <Eta cost={price} />
      </button>
    </div>
  );
}
