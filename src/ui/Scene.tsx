import { useCallback, useMemo, useState } from 'react';
import type { ParcelId } from '../game/parcels';
import { canRestoreParcel, offeredParcels, restoreParcel } from '../game/restoration';
import { BUTTERFLY_VISIBLE_SECONDS, catchButterfly, type CatchResult } from '../game/butterfly';
import { phaseOf, visualSeason } from '../game/phases';
import { lightPerSecond } from '../game/production';
import { t } from '../i18n/fr';
import {
  isCooperativeActive,
  unlockedCooperatives,
  type CooperativeId,
} from '../game/cooperatives';
import { CooperativeBikes } from './CooperativeArt';
import { Neighbourhood } from './Neighbourhood';
import { Restoration } from './Restoration';
import { ParcelGround, ParcelOffers, ProjectMarks } from './RestorationArt';
import { useGameState, useGameStore } from './useGame';

/** The Golden Butterfly (§9.2), drawn with fine lines like the rest of the botanical motifs. */
function ButterflyArt() {
  return (
    <svg viewBox="0 0 48 40" aria-hidden="true">
      <g className="wings">
        <path d="M24 20C18 6 6 2 4 9c-2 7 8 12 20 11Z" />
        <path d="M24 20C30 6 42 2 44 9c2 7-8 12-20 11Z" />
        <path d="M24 21c-8 1-15 6-12 11 3 4 9 0 12-11Z" />
        <path d="M24 21c8 1 15 6 12 11-3 4-9 0-12-11Z" />
      </g>
      <path className="body" d="M24 12v20M24 12c-1-4-4-6-6-7M24 12c1-4 4-6 6-7" />
    </svg>
  );
}

function Butterfly({ onCatch }: { onCatch: (result: CatchResult) => void }) {
  const store = useGameStore();
  const state = useGameState();
  const { visible } = state.butterfly;
  if (visible <= 0) return null;
  // Resume the flight where it is, e.g. after a reload.
  const delay = -(BUTTERFLY_VISIBLE_SECONDS - visible);

  function capture() {
    const result = catchButterfly(store.getState());
    if (!result) return;
    store.dispatch(() => result.state);
    onCatch(result);
  }

  return (
    <button
      // A new flight for each visit.
      key={state.rngSeed}
      type="button"
      className="butterfly"
      aria-label={t.butterfly.catch}
      style={{ animationDelay: `${delay}s` }}
      onClick={capture}
    >
      <ButterflyArt />
    </button>
  );
}

/**
 * The neighbourhood scene (docs/game-design.md §6, §10.4): the city seen from above, where each
 * purchase builds something with a soft entrance. The light and the shadows follow the phase
 * (dawn, noon, late afternoon) and, after the first Season, the season's tint. The Golden
 * Butterfly flies across it.
 */
export function Scene({ onCatch }: { onCatch: (result: CatchResult) => void }) {
  const store = useGameStore();
  const state = useGameState();
  const [highlight, setHighlight] = useState<ParcelId | null>(null);
  const restore = useCallback(
    (id: ParcelId) => store.dispatch((s) => restoreParcel(s, id)),
    [store],
  );
  // Joined into strings so the map layers only redraw when an offer actually changes.
  const offered = offeredParcels(state)
    .map((p) => p.id)
    .join();
  const affordable = offeredParcels(state)
    .filter((p) => canRestoreParcel(state, p.id))
    .map((p) => p.id)
    .join();
  const { parcels, projects } = state;
  // Encoded as one string so the bikes only redraw when a cooperative starts, stops or buys.
  const bikes = unlockedCooperatives(state)
    .map(
      (id) => `${id}:${isCooperativeActive(state, id) ? 1 : 0}:${state.cooperatives.purchases[id]}`,
    )
    .join();
  const reduced = state.settings.reducedMotion || prefersReducedMotion();
  const ground = useMemo(() => <ParcelGround parcels={parcels} />, [parcels]);
  const overlay = useMemo(
    () => (
      <>
        <ProjectMarks projects={projects} />
        <CooperativeBikes cooperatives={parseBikes(bikes)} reduced={reduced} />
        <ParcelOffers
          offered={split(offered)}
          affordable={split(affordable)}
          highlight={highlight}
          onRestore={restore}
        />
      </>
    ),
    [projects, bikes, reduced, offered, affordable, highlight, restore],
  );
  const phase = phaseOf(state);
  const season = visualSeason(state);
  // 0 with nothing built, 1 around 100 000 Light/s, well into the city phase. Rounded so the
  // map only redraws when the colour visibly changes.
  const greenness = Math.round(Math.min(1, Math.log10(1 + lightPerSecond(state)) / 5) * 20) / 20;

  return (
    <figure className="panel scene" data-phase={phase} data-season={season ?? 'none'}>
      <figcaption className="scene-caption">
        <span key={phase} className="scene-phase">
          {t.phases[phase]}
        </span>
        {season && <span className="scene-season">{t.visualSeasons[season]}</span>}
      </figcaption>
      <div className="scene-map">
        <Neighbourhood
          generators={state.generators}
          upgrades={state.upgrades}
          phase={phase}
          greenness={greenness}
          reduced={state.settings.reducedMotion}
          ground={ground}
          overlay={overlay}
        />
        <Butterfly onCatch={onCatch} />
      </div>
      <Restoration onHighlight={setHighlight} />
    </figure>
  );
}

/** The device asks for less motion; SMIL animations do not follow the CSS rule by themselves. */
function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function parseBikes(encoded: string) {
  if (encoded === '') return [];
  return encoded.split(',').map((entry) => {
    const [id, working, purchases] = entry.split(':');
    return {
      id: id as CooperativeId,
      working: working === '1',
      purchases: Number(purchases),
    };
  });
}

function split(ids: string): ParcelId[] {
  return ids === '' ? [] : (ids.split(',') as ParcelId[]);
}
