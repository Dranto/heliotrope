import {
  ALLIANCE_IDS,
  ALLIANCES,
  allianceSlots,
  areAlliancesOpen,
  canChoose,
  canTakeOut,
  chooseAlliance,
  isAwake,
  takeOutAlliance,
  type AllianceId,
} from '../game/alliances';
import { formatNumber } from '../game/format';
import { t } from '../i18n';
import { bonusesText } from '../i18n/restoration';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';
import './alliances.css';

/**
 * The alliances (docs/game-design.md §9.9): the slots used, and each alliance with the two
 * things it links and how far they have grown, its effect, and the button to choose it or take
 * it out.
 */
export function Alliances() {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('alliances');
  if (!areAlliancesOpen(state)) return null;
  const { chosen } = state.alliances;
  const slots = allianceSlots(state);
  // Twelve alliances (M34): the chosen ones first, then those awake, then those still asleep.
  const rank = (id: AllianceId) => (chosen.includes(id) ? 0 : isAwake(state, id) ? 1 : 2);
  const order = [...ALLIANCE_IDS].sort((a, b) => rank(a) - rank(b));

  return (
    <section className="panel alliances-panel" aria-labelledby="alliances-title" data-open={open}>
      <header className="alliances-head">
        <PanelTitle id="alliances-title" open={open} onToggle={toggle}>
          {t.alliances.title}
        </PanelTitle>
        <span className="alliances-slots" title={t.alliances.slotsHint}>
          {t.alliances.slots(formatNumber(chosen.length), formatNumber(slots))}
        </span>
      </header>
      <p className="hint">{t.alliances.hint}</p>
      <ul className="alliances-list">
        {order.map((id) => {
          const def = ALLIANCES[id];
          const name = t.alliances.names[id];
          const awake = isAwake(state, id);
          const isChosen = chosen.includes(id);
          const sides = def.sides
            .map((side) =>
              t.alliances.side(
                t.alliances.sides[side.key] ?? side.key,
                formatNumber(Math.min(side.have(state), side.need)),
                formatNumber(side.need),
              ),
            )
            .join(' · ');
          return (
            <li key={id} className="alliance-card" data-chosen={isChosen} data-alliance={id}>
              <strong>
                {name}{' '}
                <span className="alliance-state" data-awake={awake}>
                  · {awake ? t.alliances.awake : t.alliances.asleep}
                </span>
              </strong>
              <p className="alliance-sides">{sides}</p>
              <p className="alliance-effect">
                {def.bonuses.length > 0 ? bonusesText(def.bonuses) : t.alliances.effects[id]}
              </p>
              {isChosen ? (
                <button
                  type="button"
                  className="buy"
                  disabled={!canTakeOut(state, id)}
                  title={canTakeOut(state, id) ? undefined : t.alliances.takenOut}
                  aria-label={t.alliances.takeOutLabel(name)}
                  onClick={() => store.dispatch((s) => takeOutAlliance(s, id))}
                >
                  <span className="buy-verb">{t.alliances.takeOut}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="buy"
                  disabled={!canChoose(state, id)}
                  title={canChoose(state, id) ? undefined : t.alliances.full}
                  aria-label={t.alliances.chooseLabel(name)}
                  onClick={() => store.dispatch((s) => chooseAlliance(s, id))}
                >
                  <span className="buy-verb">{t.alliances.choose}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
