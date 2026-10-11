import { formatCost, formatNumber } from '../game/format';
import {
  areGreatWorksOpen,
  canContribute,
  contribute,
  foldBonuses,
  nextStageCost,
  PAYMENTS,
  speciesMissing,
  stageCount,
  WORK_IDS,
  WORKS,
  type Payment,
  type WorkId,
} from '../game/greatWorks';
import { t } from '../i18n';
import { bonusesText } from '../i18n/restoration';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';
import './greatWorks.css';

const PAYMENT_LABEL: Record<Payment, () => string> = {
  light: () => t.greatWorks.light,
  water: () => t.greatWorks.water,
  baskets: () => t.greatWorks.basketsLabel,
  honey: () => t.greatWorks.honeyLabel,
};

/**
 * The great works (docs/game-design.md §6.6): each work with its stages built, what the next one
 * still asks for and does, and the button that gives what the player owns towards it.
 */
export function GreatWorks() {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('greatWorks');
  if (!areGreatWorksOpen(state)) return null;

  return (
    <section className="panel works-panel" aria-labelledby="works-title" data-open={open}>
      <header className="works-head">
        <PanelTitle id="works-title" open={open} onToggle={toggle}>
          {t.greatWorks.title}
        </PanelTitle>
        <span className="works-baskets" title={t.greatWorks.basketsHint}>
          {t.greatWorks.baskets(formatNumber(state.garden.baskets))}
        </span>
      </header>
      <p className="hint">{t.greatWorks.hint}</p>
      <ul className="works-list">
        {WORK_IDS.map((id) => (
          <Work
            key={id}
            id={id}
            onGive={() => store.dispatch((s) => contribute(s, id))}
            state={state}
          />
        ))}
      </ul>
    </section>
  );
}

function Work({
  id,
  state,
  onGive,
}: {
  id: WorkId;
  state: ReturnType<typeof useGameState>;
  onGive: () => void;
}) {
  const { stage, paid } = state.greatWorks.works[id];
  const count = stageCount(id);
  const cost = nextStageCost(state, id);
  const name = t.greatWorks.names[id];
  const stageNames = t.greatWorks.stages[id];
  return (
    <li className="works-card" data-work={id} data-complete={cost === null}>
      <div className="works-card-head">
        <strong>{name}</strong>
        <ol className="works-stages" aria-label={t.greatWorks.stage(String(stage), String(count))}>
          {stageNames.map((stageName, i) => (
            <li key={stageName} data-built={i < stage} title={stageName} />
          ))}
        </ol>
      </div>
      {cost === null ? (
        <p className="works-effect">
          <span className="works-done">{t.greatWorks.complete}</span>{' '}
          {bonusesText(foldBonuses(WORKS[id].stages.flat()))}
        </p>
      ) : (
        <>
          <p className="works-next">{t.greatWorks.next(stageNames[stage] ?? '')}</p>
          <p className="works-effect">{bonusesText(WORKS[id].stages[stage] ?? [])}</p>
          <div className="works-meters">
            {PAYMENTS.filter((p) => cost[p] > 0).map((p) => (
              <div key={p} className="works-meter" data-payment={p}>
                <span className="works-meter-label">{PAYMENT_LABEL[p]()}</span>
                <meter min={0} max={cost[p]} value={paid[p]} />
                <span className="works-meter-value">
                  {formatCost(paid[p])} / {formatCost(cost[p])}
                </span>
              </div>
            ))}
            {cost.species > 0 && (
              <p
                className="works-species"
                data-missing={speciesMissing(state, id) > 0 || undefined}
              >
                {t.greatWorks.species(
                  formatNumber(Math.min(state.species.length, cost.species)),
                  formatNumber(cost.species),
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            className="buy works-give"
            disabled={!canContribute(state, id)}
            aria-label={t.greatWorks.contributeLabel(name)}
            onClick={onGive}
          >
            <span className="buy-verb">{t.greatWorks.contribute}</span>
          </button>
        </>
      )}
    </li>
  );
}
