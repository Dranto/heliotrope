import { formatNumber } from '../game/format';
import {
  isCooperativeActive,
  setThrifty,
  toggleCooperative,
  unlockedCooperatives,
  type CooperativeId,
} from '../game/cooperatives';
import { t } from '../i18n';
import { cooperativeBuysText } from '../i18n/talents';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';
import './cooperatives.css';

/** A cargo bike, the mark of the cooperatives in the panel and on the map. */
export function CooperativeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="17" r="3" />
      <circle cx="18.5" cy="17" r="3" />
      <path d="M3 9h7v5H3zM10 14h4l3-6h2M14 14l-2-5h-2M18.5 17 16 10" />
    </svg>
  );
}

/**
 * The Cooperatives (docs/game-design.md §7.2): who buys for the player, how often, and the
 * switches to pause one or keep a reserve. Shown once the Tree of Seasons brought one in.
 */
export function Cooperatives() {
  const store = useGameStore();
  const state = useGameState();
  const unlocked = unlockedCooperatives(state);
  const [open, toggleOpen] = usePanelOpen('cooperatives');
  if (unlocked.length === 0) return null;
  const toggle = (id: CooperativeId) => store.dispatch((s) => toggleCooperative(s, id));

  return (
    <section className="panel cooperatives" aria-labelledby="cooperatives-title" data-open={open}>
      <PanelTitle id="cooperatives-title" open={open} onToggle={toggleOpen}>
        {t.cooperatives.title}
      </PanelTitle>
      <p className="hint">{t.cooperatives.hint}</p>
      <ul className="coop-list">
        {unlocked.map((id) => {
          const working = isCooperativeActive(state, id);
          const name = t.cooperatives.names[id];
          return (
            <li key={id} className="coop" data-cooperative={id} data-working={working}>
              <span className="coop-icon">
                <CooperativeIcon />
              </span>
              <span className="coop-text">
                <span className="coop-name">{name}</span>
                <span className="coop-buys">
                  {t.cooperatives.buys(cooperativeBuysText(id).toLowerCase())}
                </span>
                <span className="coop-count" data-testid={`coop-${id}`}>
                  {/* Re-keyed so the count pops at each purchase. */}
                  <span key={state.cooperatives.purchases[id]}>
                    {t.cooperatives.purchases(formatNumber(state.cooperatives.purchases[id]))}
                  </span>
                </span>
              </span>
              <button
                type="button"
                role="switch"
                className="coop-switch"
                aria-checked={working}
                aria-label={t.cooperatives.toggleLabel(name)}
                onClick={() => toggle(id)}
              >
                <span className="coop-switch-label">
                  {working ? t.cooperatives.working : t.cooperatives.paused}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <label className="coop-thrifty">
        <input
          type="checkbox"
          checked={state.cooperatives.thrifty}
          onChange={(event) => {
            const thrifty = event.currentTarget.checked;
            store.dispatch((s) => setThrifty(s, thrifty));
          }}
        />
        <span>
          <span className="coop-thrifty-label">{t.cooperatives.thrifty}</span>
          <span className="hint">{t.cooperatives.thriftyHint}</span>
        </span>
      </label>
    </section>
  );
}
