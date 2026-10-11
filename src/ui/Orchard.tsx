import { formatNumber } from '../game/format';
import {
  canPlant,
  canSetHive,
  FRUIT_IDS,
  FRUITS,
  HIVE_COSTS,
  isOrchardOpen,
  nextHiveCost,
  pickFruit,
  plant,
  secondsToNext,
  setHive,
  treeStage,
} from '../game/orchard';
import { fruitVarietyBonuses } from '../game/fruits';
import { t } from '../i18n';
import { bonusesText } from '../i18n/restoration';
import { usePanelOpen } from './layoutPrefs';
import { TreeArt } from './OrchardArt';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';
import './greatWorks.css';
import './orchard.css';

/**
 * The orchard and the hives (docs/game-design.md §9.8): each tree with its stage and the time to
 * its next one, the buttons to plant or pick it, the hives and their honey, and the old
 * varieties found.
 */
export function Orchard() {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('orchard');
  if (!isOrchardOpen(state)) return null;
  const { orchard } = state;
  const hiveCost = nextHiveCost(state);

  return (
    <section className="panel orchard-panel" aria-labelledby="orchard-title" data-open={open}>
      <header className="works-head">
        <PanelTitle id="orchard-title" open={open} onToggle={toggle}>
          {t.orchard.title}
        </PanelTitle>
        <span className="works-baskets" title={t.greatWorks.basketsHint}>
          {t.greatWorks.baskets(formatNumber(state.garden.baskets))}
        </span>
      </header>
      <p className="hint">{t.orchard.hint}</p>
      <ul className="orchard-trees">
        {FRUIT_IDS.map((id) => {
          const tree = orchard.trees[id];
          const stage = treeStage(tree);
          const name = t.orchard.names[id];
          const cost = FRUITS[id].baskets;
          return (
            <li key={id} className="orchard-card" data-tree={id} data-stage={stage}>
              <span className="orchard-card-head">
                <TreeArt id={id} stage={stage} />
                <span>
                  <strong>{name}</strong>
                  <br />
                  <span className="hint">
                    {t.orchard.stages[stage]}
                    {stage !== 'none' &&
                      stage !== 'ripe' &&
                      ` · ${t.orchard.next(t.duration(Math.ceil(secondsToNext(state, id))))}`}
                  </span>
                </span>
              </span>
              {stage === 'none' && (
                <button
                  type="button"
                  className="buy"
                  disabled={!canPlant(state, id)}
                  aria-label={t.orchard.plantLabel(name)}
                  onClick={() => store.dispatch((s) => plant(s, id))}
                >
                  <span className="buy-verb">{t.orchard.plant}</span>
                  <span className="buy-cost">
                    {cost === 0 ? t.orchard.free : t.orchard.cost(formatNumber(cost))}
                  </span>
                </button>
              )}
              {stage === 'ripe' && (
                <button
                  type="button"
                  className="buy"
                  aria-label={t.orchard.pickLabel(name)}
                  onClick={() => store.dispatch((s) => pickFruit(s, id)?.state ?? s)}
                >
                  <span className="buy-verb">{t.orchard.pick}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="orchard-hives">
        <span>
          <strong>
            {t.orchard.hives(formatNumber(orchard.hives), formatNumber(HIVE_COSTS.length))}
          </strong>{' '}
          · {t.orchard.honey(formatNumber(orchard.honey))}
          <br />
          <span className="hint">{t.orchard.hiveHint}</span>
        </span>
        {hiveCost !== null && (
          <button
            type="button"
            className="buy"
            disabled={!canSetHive(state)}
            onClick={() => store.dispatch((s) => setHive(s))}
          >
            <span className="buy-verb">{t.orchard.setHive}</span>
            <span className="buy-cost">{t.orchard.cost(formatNumber(hiveCost))}</span>
          </button>
        )}
      </div>
      <h3>{t.orchard.varietiesTitle}</h3>
      <ul className="orchard-varieties">
        {FRUIT_IDS.map((id) => {
          const found = orchard.varieties.includes(id);
          return (
            <li key={id} data-found={found} title={bonusesText(fruitVarietyBonuses([id]))}>
              {found
                ? `${t.orchard.varieties[id]} · ${bonusesText(fruitVarietyBonuses([id]))}`
                : t.orchard.unknownVariety(t.orchard.names[id])}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
