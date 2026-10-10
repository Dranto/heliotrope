import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type { ParcelId } from '../game/parcels';
import { canRestoreParcel, offeredParcels, restoreParcel } from '../game/restoration';
import { BUTTERFLY_VISIBLE_SECONDS, catchButterfly, type CatchResult } from '../game/butterfly';
import { phaseOf, visualSeason } from '../game/phases';
import { lightPerSecond } from '../game/production';
import { t } from '../i18n';
import {
  isCooperativeActive,
  unlockedCooperatives,
  type CooperativeId,
} from '../game/cooperatives';
import { CooperativeBikes } from './CooperativeArt';
import { Neighbourhood } from './Neighbourhood';
import { Flower } from './Flower';
import { useLayoutPref } from './layoutPrefs';
import {
  PLANTER,
  WORLD,
  fitCamera,
  flowerFrame,
  furthestView,
  VIEWS,
  type View,
} from './neighbourhood';
import { PIXI_PARCELS } from './pixi/model';
import { useMapRenderer } from './rendererPref';
import { SpeciesLife } from './SpeciesLife';
import { ParcelGround, ParcelOffers, ProjectMarks } from './RestorationArt';
import { useGameState, useGameStore } from './useGame';

/** The enriched WebGL map (§10.4), downloaded only when chosen in the Options. */
const PixiMap = lazy(() => import('./pixi/PixiMap'));

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

interface Size {
  width: number;
  height: number;
}

/** Size of an element in whole pixels, followed as the window or the layout changes. */
function useSize<T extends HTMLElement>(fallback: Size): [RefObject<T | null>, Size] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (!box || box.width < 1 || box.height < 1) return;
      const next = { width: Math.round(box.width), height: Math.round(box.height) };
      setSize((old) => (old.width === next.width && old.height === next.height ? old : next));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

/** Room kept free under the view switch at the top of the map. */
const CAPTION_ROOM = 52;

/**
 * The neighbourhood scene (docs/game-design.md §6, §10.4): the city seen from above, where each
 * purchase builds something with a soft entrance, with the clickable heliotrope rising from the
 * home courtyard at its heart. The player switches between the views opened so far: the courtyard, the neighbourhood,
 * the city; each one keeps its part of the city whole and as large as the screen allows. The
 * light and the shadows follow the phase (dawn, noon, late afternoon) and, after the first
 * Season, the season's tint; a challenge Season (§7.3) changes it again. The species of the
 * Herbier (§9.5) live on it and the Golden Butterfly flies across it.
 */
export function Scene({
  onCatch,
  highlight,
}: {
  onCatch: (result: CatchResult) => void;
  highlight: ParcelId | null;
}) {
  const store = useGameStore();
  const state = useGameState();
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
  const { parcels, projects, species } = state;
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
        <SpeciesLife species={species} />
        <CooperativeBikes cooperatives={parseBikes(bikes)} reduced={reduced} />
        <ParcelOffers
          offered={split(offered)}
          affordable={split(affordable)}
          highlight={highlight}
          onRestore={restore}
        />
      </>
    ),
    [projects, species, bikes, reduced, offered, affordable, highlight, restore],
  );
  const phase = phaseOf(state);
  const furthest = furthestView(phase, state.generators);
  const [chosen, choose] = useLayoutPref<View | null>('view', null);
  // When a further view opens during play, the map moves to it once, so the new places are seen
  // being built; the player can go back closer at any time.
  const opened = useRef(furthest);
  useEffect(() => {
    if (furthest > opened.current) choose(furthest);
    opened.current = furthest;
  }, [furthest, choose]);
  const view = Math.min(chosen ?? furthest, furthest) as View;
  const [mapRef, size] = useSize<HTMLDivElement>(WORLD);
  const { width, height } = size;
  // Kept as one object while nothing moves, so the map does not redraw at every tick.
  const camera = useMemo(() => {
    const top = width >= height ? 0 : CAPTION_ROOM;
    return fitCamera(view, width, height, { top, left: 0, bottom: 0 });
  }, [view, width, height]);
  // The heliotrope stands in the home courtyard, at the heart of the city, and follows the camera.
  const flower = flowerFrame(camera, width, height, PLANTER);
  const season = visualSeason(state);
  // 0 with nothing built, 1 around 100 000 Light/s, well into the city phase. Rounded so the
  // map only redraws when the colour visibly changes.
  const greenness = Math.round(Math.min(1, Math.log10(1 + lightPerSecond(state)) / 5) * 20) / 20;
  const renderer = useMapRenderer();
  const [webglFailed, setWebglFailed] = useState(false);
  const enhanced = renderer === 'pixi' && !webglFailed;
  // The WebGL map draws some parcels itself; the SVG layer over it keeps the others.
  const enhancedGround = useMemo(
    () => <ParcelGround parcels={parcels.filter((id) => !PIXI_PARCELS.includes(id))} />,
    [parcels],
  );
  const svgMap = (
    <Neighbourhood
      generators={state.generators}
      camera={camera}
      width={width}
      height={height}
      upgrades={state.upgrades}
      phase={phase}
      greenness={greenness}
      reduced={state.settings.reducedMotion}
      ground={ground}
      overlay={overlay}
    />
  );

  return (
    <figure
      className="panel scene"
      data-phase={phase}
      data-season={season ?? 'none'}
      data-challenge={state.challenge ?? undefined}
    >
      <div className="scene-map" ref={mapRef}>
        {enhanced ? (
          <Suspense fallback={svgMap}>
            <PixiMap
              generators={state.generators}
              upgrades={state.upgrades}
              parcels={parcels}
              phase={phase}
              season={season}
              greenness={greenness}
              reduced={reduced}
              camera={camera}
              width={width}
              height={height}
              ground={enhancedGround}
              overlay={overlay}
              onFail={() => setWebglFailed(true)}
            />
          </Suspense>
        ) : (
          svgMap
        )}
        <div className="map-flower" style={{ left: flower.x, top: flower.y, width: flower.width }}>
          <Flower />
        </div>
        <Butterfly onCatch={onCatch} />
      </div>
      <figcaption className="scene-caption">
        {furthest > 1 && (
          <div className="segmented views" role="radiogroup" aria-label={t.layout.views}>
            {VIEWS.filter((v) => v <= furthest).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => choose(v)}
              >
                {t.phases[v]}
              </button>
            ))}
          </div>
        )}
        {furthest === 1 && <span className="scene-phase">{t.phases[1]}</span>}
        {season && <span className="scene-season">{t.visualSeasons[season]}</span>}
      </figcaption>
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
