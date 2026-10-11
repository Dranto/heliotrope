import { formatCost } from '../game/format';
import { PARCEL_IDS, type ParcelDef, type ParcelId } from '../game/parcels';
import type { ProjectDef } from '../game/projects';
import {
  canCarryOutProject,
  canRestoreParcel,
  carryOutProject,
  offeredParcels,
  offeredProjects,
  restoreParcel,
} from '../game/restoration';
import { t } from '../i18n';
import { Eta } from './Goals';
import { bonusesText } from '../i18n/restoration';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';

function ParcelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18h16M7 18c0-3 2-5 5-5s5 2 5 5M12 13V8M12 10c-2 0-3.4-1.2-3.6-3 2 0 3.4 1.2 3.6 3ZM12 9c1.8 0 3-1 3.3-2.6-1.8 0-3 1-3.3 2.6Z" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="4.5" r="1.6" />
      <circle cx="18.5" cy="16" r="1.6" />
      <circle cx="5.5" cy="16" r="1.6" />
      <path d="M12 6.5V9M17 15l-2.4-1.4M7 15l2.4-1.4" />
    </svg>
  );
}

type Offer = { kind: 'parcel'; def: ParcelDef } | { kind: 'project'; def: ProjectDef };

/** Offers listed at once under the map. */
const MAX_OFFERS = 4;

interface CardProps {
  kind: 'parcel' | 'project';
  name: string;
  effect: string;
  cost: number;
  affordable: boolean;
  onBuy: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function Card({ kind, name, effect, cost, affordable, onBuy, onFocus, onBlur }: CardProps) {
  const price = formatCost(cost);
  return (
    <li
      className="restoration-card"
      data-kind={kind}
      data-affordable={affordable}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
    >
      <span className="restoration-icon">
        {kind === 'parcel' ? <ParcelIcon /> : <ProjectIcon />}
      </span>
      <span className="restoration-text">
        <span className="restoration-name">{name}</span>
        <span className="restoration-effect">{effect}</span>
      </span>
      <button
        type="button"
        className="buy"
        disabled={!affordable}
        aria-label={
          kind === 'parcel'
            ? t.restoration.restoreLabel(name, price)
            : t.restoration.carryOutLabel(name, price)
        }
        onClick={onBuy}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <span className="buy-verb">
          {kind === 'parcel' ? t.restoration.restore : t.restoration.carryOut}
        </span>
        <span className="buy-cost">☀ {price}</span>
        <Eta cost={cost} />
      </button>
    </li>
  );
}

/**
 * Parcels to restore and neighbourhood projects on offer (docs/game-design.md §6.1, §6.2), under
 * the map, in the side menu. Pointing at a parcel highlights its place on the map. A row of dots shows how much of
 * the neighbourhood is restored for good.
 */
export function Restoration({ onHighlight }: { onHighlight: (id: ParcelId | null) => void }) {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('restoration');
  // The cheapest few, so the list stays short under the map; the next ones follow.
  const offers: Offer[] = [
    ...offeredParcels(state).map((def) => ({ kind: 'parcel', def }) as const),
    ...offeredProjects(state).map((def) => ({ kind: 'project', def }) as const),
  ]
    .sort((a, b) => a.def.cost - b.def.cost)
    .slice(0, MAX_OFFERS);
  if (offers.length === 0 && state.parcels.length === 0) return null;

  return (
    <section className="panel restoration" aria-labelledby="restoration-title" data-open={open}>
      <header className="restoration-head">
        <PanelTitle id="restoration-title" open={open} onToggle={toggle}>
          {t.restoration.title}
        </PanelTitle>
        <ol className="restored-dots" aria-label={t.restoration.parcels}>
          {PARCEL_IDS.map((id) => {
            const done = state.parcels.includes(id);
            return (
              <li
                key={id}
                data-done={done}
                title={done ? t.restoration.parcelNames[id] : undefined}
              >
                <span className="visually-hidden">
                  {done ? t.restoration.restored(t.restoration.parcelNames[id]) : '…'}
                </span>
              </li>
            );
          })}
        </ol>
      </header>
      {offers.length > 0 && (
        <ul className="restoration-list">
          {offers.map((offer) =>
            offer.kind === 'parcel' ? (
              <Card
                key={offer.def.id}
                kind="parcel"
                name={t.restoration.parcelNames[offer.def.id]}
                effect={bonusesText(offer.def.bonuses)}
                cost={offer.def.cost}
                affordable={canRestoreParcel(state, offer.def.id)}
                onBuy={() => {
                  store.dispatch((s) => restoreParcel(s, offer.def.id));
                  onHighlight(null);
                }}
                onFocus={() => onHighlight(offer.def.id)}
                onBlur={() => onHighlight(null)}
              />
            ) : (
              <Card
                key={offer.def.id}
                kind="project"
                name={t.restoration.projectNames[offer.def.id]}
                effect={bonusesText(offer.def.bonuses)}
                cost={offer.def.cost}
                affordable={canCarryOutProject(state, offer.def.id)}
                onBuy={() => store.dispatch((s) => carryOutProject(s, offer.def.id))}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}
