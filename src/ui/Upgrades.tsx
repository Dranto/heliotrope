import { useState } from 'react';
import { upgradesAllowed } from '../game/challenges';
import { formatCost } from '../game/format';
import { availableUpgrades } from '../game/production';
import { buyUpgrade, canBuyUpgrade } from '../game/tick';
import type { UpgradeId } from '../game/upgrades';
import { t } from '../i18n';
import { upgradeEffectText, upgradeText } from '../i18n/upgrades';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { UpgradeIcon } from './UpgradeIcon';
import { useGameState, useGameStore } from './useGame';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

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
  // Nothing to show before the first upgrade unlocks.
  if (selected === undefined && state.upgrades.length === 0 && !wild) return null;

  return (
    <section className="panel upgrades" aria-labelledby="upgrades-title" data-open={open}>
      <PanelTitle id="upgrades-title" open={open} onToggle={toggle}>
        {t.upgradesTitle}
      </PanelTitle>
      {selected === undefined ? (
        <p className="empty">{wild ? t.challenges.noUpgrades : t.noUpgrades}</p>
      ) : (
        <>
          <ul className="upgrade-grid">
            {available.map((upgrade) => {
              const tier = upgrade.id.split('.')[1];
              return (
                <li key={upgrade.id}>
                  <button
                    type="button"
                    className="upgrade-tile"
                    aria-label={upgradeText(upgrade).name}
                    aria-pressed={upgrade.id === selected.id}
                    data-affordable={canBuyUpgrade(state, upgrade.id)}
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
            affordable={canBuyUpgrade(state, selected.id)}
            onBuy={() => store.dispatch((s) => buyUpgrade(s, selected.id))}
          />
        </>
      )}
    </section>
  );
}

interface DetailProps {
  name: string;
  flavour: string;
  effect: string;
  cost: string;
  affordable: boolean;
  onBuy: () => void;
}

function UpgradeDetail({ name, flavour, effect, cost, affordable, onBuy }: DetailProps) {
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
      </button>
    </div>
  );
}
