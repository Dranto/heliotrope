import { corridorBonus, corridors, FAMILIES } from '../game/corridors';
import {
  areDistrictsOpen,
  canRestoreDistrict,
  DISTRICT_IDS,
  offeredDistrict,
  restoreDistrict,
  type DistrictDef,
} from '../game/districts';
import { formatCost } from '../game/format';
import { memo, useEffect, useId, useState } from 'react';
import {
  PARCEL_IDS,
  parcelBonuses,
  type Future,
  type ParcelDef,
  type ParcelId,
} from '../game/parcels';
import type { ProjectDef } from '../game/projects';
import {
  affordableProjects,
  canCarryOutProject,
  canChangeFuture,
  canRestoreParcel,
  carryOutAffordableProjects,
  carryOutProject,
  changeFuture,
  futureOf,
  offeredParcels,
  offeredProjects,
  restoreParcel,
} from '../game/restoration';
import { t } from '../i18n';
import { Eta } from './Goals';
import { bonusesText, parcelName } from '../i18n/restoration';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';

const ParcelIcon = memo(function ParcelIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18h16M7 18c0-3 2-5 5-5s5 2 5 5M12 13V8M12 10c-2 0-3.4-1.2-3.6-3 2 0 3.4 1.2 3.6 3ZM12 9c1.8 0 3-1 3.3-2.6-1.8 0-3 1-3.3 2.6Z" />
    </svg>
  );
});

const ProjectIcon = memo(function ProjectIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="4.5" r="1.6" />
      <circle cx="18.5" cy="16" r="1.6" />
      <circle cx="5.5" cy="16" r="1.6" />
      <path d="M12 6.5V9M17 15l-2.4-1.4M7 15l2.4-1.4" />
    </svg>
  );
});

/** A neighbouring district (§6.4): blocks around a small tree. */
function DistrictIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </svg>
  );
}

const ICONS = { parcel: ParcelIcon, project: ProjectIcon, district: DistrictIcon };

type Offer =
  | { kind: 'parcel'; def: ParcelDef }
  | { kind: 'project'; def: ProjectDef }
  | { kind: 'district'; def: DistrictDef };

/** Offers listed at once under the map. */
const MAX_OFFERS = 4;

/** The two futures of a parcel to choose from (§6.5): their names and effects. */
interface FutureChoice {
  id: ParcelId;
  chosen: Future;
  onChoose: (future: Future) => void;
}

function FuturePills({
  id,
  chosen,
  onChoose,
  disabled = false,
}: FutureChoice & { disabled?: boolean }) {
  return (
    <span
      className="future-pills"
      role="radiogroup"
      aria-label={t.restoration.futureLabel(parcelName(id, chosen))}
    >
      {([0, 1] as const).map((future) => (
        <button
          key={future}
          type="button"
          role="radio"
          aria-checked={chosen === future}
          disabled={disabled && chosen !== future}
          title={futureTitle(id, future)}
          onClick={() => onChoose(future)}
        >
          {FAMILIES[id][future] && (
            <i className="family-dot" data-family={FAMILIES[id][future]} aria-hidden="true" />
          )}
          {parcelName(id, future)}
        </button>
      ))}
    </span>
  );
}

/**
 * The future not chosen and what it would give, written out under the chosen one's effect: the
 * pills' titles only show on hover, and a parcel changes its future once per Cycle.
 */
function OtherFuture({ id, chosen }: { id: ParcelId; chosen: Future }) {
  const other: Future = chosen === 0 ? 1 : 0;
  return (
    <span className="future-other">
      {t.restoration.otherFuture(parcelName(id, other), futureTitle(id, other))}
    </span>
  );
}

/** The effect of a future, and the corridor family it joins (§6.7). */
function futureTitle(id: ParcelId, future: Future): string {
  const family = FAMILIES[id][future];
  const effect = bonusesText(parcelBonuses(id, future));
  return family ? `${effect} · ${t.corridors.joins(t.corridors.family[family])}` : effect;
}

/** The corridors on the map (§6.7, M21): their family, length and bonus. */
function Corridors({ state }: { state: ReturnType<typeof useGameState> }) {
  const found = corridors(state);
  return (
    <div className="corridors">
      <p className="hint">{t.corridors.hint}</p>
      {found.length > 0 && (
        <ul>
          {found.map((c) => (
            <li key={c.parcels.join()} data-family={c.family}>
              <i className="family-dot" data-family={c.family} aria-hidden="true" />
              {t.corridors.line(
                t.corridors.family[c.family],
                c.parcels.length,
                bonusesText([corridorBonus(c.family, c.parcels.length)]),
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CardProps {
  kind: Offer['kind'];
  name: string;
  effect: string;
  future?: FutureChoice;
  cost: number;
  affordable: boolean;
  onBuy: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function Card({ kind, name, effect, future, cost, affordable, onBuy, onFocus, onBlur }: CardProps) {
  const price = formatCost(cost);
  const Icon = ICONS[kind];
  const etaId = useId();
  return (
    <li
      className="restoration-card"
      data-kind={kind}
      data-futures={future ? true : undefined}
      data-affordable={affordable}
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
    >
      <span className="restoration-icon">
        <Icon />
      </span>
      <span className="restoration-text">
        <span className="restoration-name">{name}</span>
        {future && <FuturePills {...future} />}
        <span className="restoration-effect">{effect}</span>
        {future && <OtherFuture id={future.id} chosen={future.chosen} />}
      </span>
      <button
        type="button"
        className="buy"
        disabled={!affordable}
        aria-label={
          kind === 'project'
            ? t.restoration.carryOutLabel(name, price)
            : t.restoration.restoreLabel(name, price)
        }
        aria-describedby={etaId}
        onClick={onBuy}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <span className="buy-verb">
          {kind === 'project' ? t.restoration.carryOut : t.restoration.restore}
        </span>
        <span className="buy-cost">☀ {price}</span>
        <Eta cost={cost} id={etaId} />
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
  // A hidden panel sleeps (App): no parcel stays highlighted on the map from it.
  useEffect(() => () => onHighlight(null), [onHighlight]);
  // The future picked on each offered parcel's card before restoring it.
  const [picks, setPicks] = useState<Partial<Record<ParcelId, Future>>>({});
  // The cheapest few, so the list stays short under the map; the next ones follow.
  const offers: Offer[] = [
    ...offeredParcels(state).map((def) => ({ kind: 'parcel', def }) as const),
    ...offeredProjects(state).map((def) => ({ kind: 'project', def }) as const),
    ...[offeredDistrict(state)].flatMap((def) => (def ? [{ kind: 'district', def } as const] : [])),
  ]
    .sort((a, b) => a.def.cost - b.def.cost)
    .slice(0, MAX_OFFERS);
  if (offers.length === 0 && state.parcels.length === 0) return null;
  const affordable = affordableProjects(state).length;

  return (
    <section className="panel restoration" aria-labelledby="restoration-title" data-open={open}>
      <header className="restoration-head">
        <PanelTitle id="restoration-title" open={open} onToggle={toggle}>
          {t.restoration.title}
        </PanelTitle>
        <div className="restoration-tools">
          {affordable > 1 && (
            <button
              type="button"
              className="buy-all"
              aria-label={t.restoration.carryOutAllLabel(affordable)}
              title={t.restoration.carryOutAllLabel(affordable)}
              onClick={() => store.dispatch(carryOutAffordableProjects)}
            >
              {t.restoration.carryOutAll}
              <span className="buy-all-count">{affordable}</span>
            </button>
          )}
          {/* Once the neighbourhood is whole, the dots count the neighbouring districts (§6.4). */}
          {areDistrictsOpen(state) ? (
            <ol className="restored-dots" data-kind="district" aria-label={t.restoration.districts}>
              {DISTRICT_IDS.map((id) => {
                const done = state.districts.includes(id);
                const name = t.restoration.districtNames[id];
                return (
                  <li key={id} data-done={done} title={done ? name : undefined}>
                    <span className="visually-hidden">
                      {done
                        ? t.restoration.districtRestored(name)
                        : t.restoration.districtToRestore}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
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
                      {done
                        ? t.restoration.restored(t.restoration.parcelNames[id])
                        : t.restoration.parcelToRestore}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </header>
      {offers.length > 0 && (
        <ul className="restoration-list">
          {offers.map((offer) =>
            offer.kind === 'district' ? (
              <Card
                key={offer.def.id}
                kind="district"
                name={t.restoration.districtNames[offer.def.id]}
                effect={bonusesText(offer.def.bonuses)}
                cost={offer.def.cost}
                affordable={canRestoreDistrict(state, offer.def.id)}
                onBuy={() => store.dispatch((s) => restoreDistrict(s, offer.def.id))}
              />
            ) : offer.kind === 'parcel' ? (
              <Card
                key={offer.def.id}
                kind="parcel"
                name={parcelName(offer.def.id, picks[offer.def.id] ?? 0)}
                effect={bonusesText(parcelBonuses(offer.def.id, picks[offer.def.id] ?? 0))}
                future={{
                  id: offer.def.id,
                  chosen: picks[offer.def.id] ?? 0,
                  onChoose: (future) => setPicks((p) => ({ ...p, [offer.def.id]: future })),
                }}
                cost={offer.def.cost}
                affordable={canRestoreParcel(state, offer.def.id)}
                onBuy={() => {
                  store.dispatch((s) => restoreParcel(s, offer.def.id, picks[offer.def.id] ?? 0));
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
      {state.parcels.length > 0 && (
        <details className="futures">
          <summary>{t.restoration.futuresTitle}</summary>
          <p className="hint">{t.restoration.futuresHint}</p>
          <Corridors state={state} />
          <ul>
            {PARCEL_IDS.filter((id) => state.parcels.includes(id)).map((id) => {
              const locked = !canChangeFuture(state, id);
              return (
                <li key={id} data-parcel={id}>
                  <FuturePills
                    id={id}
                    chosen={futureOf(state, id)}
                    disabled={locked}
                    onChoose={(future) => store.dispatch((s) => changeFuture(s, id, future))}
                  />
                  <span className="restoration-effect">
                    {bonusesText(parcelBonuses(id, futureOf(state, id)))}
                    {locked && ` · ${t.restoration.futureLocked}`}
                  </span>
                  {!locked && <OtherFuture id={id} chosen={futureOf(state, id)} />}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
