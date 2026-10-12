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
import { canRestoreParcel, futureOf, offeredParcels, restoreParcel } from '../game/restoration';
import { BUTTERFLY_VISIBLE_SECONDS, catchButterfly, type CatchResult } from '../game/butterfly';
import { isBioregionOpen, waterPerSecond } from '../game/bioregion';
import { phaseOf, visualSeason } from '../game/phases';
import { lightPerSecond } from '../game/production';
import { t } from '../i18n';
import {
  isCooperativeActive,
  unlockedCooperatives,
  type CooperativeId,
} from '../game/cooperatives';
import { BioregionLand, CityWater } from './BioregionArt';
import { CooperativeBikes } from './CooperativeArt';
import { Neighbourhood } from './Neighbourhood';
import { Flower } from './Flower';
import { useLayoutPref } from './layoutPrefs';
import {
  PLANTER,
  WORLD,
  cameraTransform,
  fitCamera,
  flowerFrame,
  furthestView,
  VIEWS,
  type View,
} from './neighbourhood';
import { useMapRenderer } from './rendererPref';
import { SpeciesLife } from './SpeciesLife';
import { NightLights, VisitLayer } from './VisitArt';
import { GardenBeds } from './GardenArt';
import { cropStage, encodeBeds } from './gardenMap';
import { isGardenOpen, openPlots, plotGrowth } from '../game/garden';
import { DistrictGround, DistrictOffer } from './DistrictArt';
import { cityFrame } from './districtMap';
import {
  canRestoreDistrict,
  offeredDistrict,
  restoreDistrict,
  type DistrictId,
} from '../game/districts';
import { daylightOf, type Daylight } from './daylight';
import { welcomeVisit, type WelcomeResult } from '../game/visits';
import { ParcelGround, ParcelOffers, ProjectMarks } from './RestorationArt';
import { isDecorOpen, nextDecor, placeDecor } from '../game/decor';
import { DecorLayer } from './DecorArt';
import { GreatWorksLayer } from './GreatWorksArt';
import { GrowthLayer } from './GrowthArt';
import { PollenWave } from './PollenWave';
import { WeatherForecast, WeatherLayer } from './WeatherArt';
import { RequestBubbles } from './RequestArt';
import { isRequestMet } from '../game/requests';
import { isFlying } from '../game/pollen';
import { isWeatherOpen, type WeatherId } from '../game/weather';
import { encodeGrowth } from './growthMap';
import { reachedTiers } from '../game/growth';
import { GENERATOR_IDS, type GeneratorId } from '../game/generators';
import { CorridorLayer } from './CorridorArt';
import { AllianceThreads, BloomLayer } from './AllianceArt';
import { workingAlliances } from '../game/alliances';
import { OrchardLayer } from './OrchardArt';
import { encodeOrchard } from './orchardMap';
import { isOrchardOpen, pickFruit, type FruitId } from '../game/orchard';
import { encodeCorridors } from './corridorMap';
import { corridors as corridorsOf } from '../game/corridors';
import { encodeStages } from './greatWorksMap';
import { areGreatWorksOpen } from '../game/greatWorks';
import { ReturnReplay } from './ReturnReplay';
import { replaySeconds, returnMarks, returnSweeps } from './returnMap';
import { encodeDecor } from './decorMap';
import { DecorToolbar, PhotoToolbar, type PhotoLook } from './MapTools';
import { useGameState, useGameStore } from './useGame';

/** The enriched WebGL map (§10.4), downloaded only where it is drawn. */
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
 * the city, then the Bioregion around it (§7.4); each one keeps its part of the city whole and as large as the screen allows. The
 * light and the shadows follow the phase (dawn, noon, late afternoon) and, after the first
 * Season, the season's tint; a challenge Season (§7.3) changes it again. The species of the
 * Herbier (§9.5) live on it and the Golden Butterfly flies across it.
 */
export function Scene({
  onCatch,
  onVisit,
  onHarvest,
  highlight,
}: {
  onCatch: (result: CatchResult) => void;
  onVisit: (result: WelcomeResult) => void;
  onHarvest: (index: number) => void;
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
  const { parcels, projects, species, districts } = state;
  const districtOffer = offeredDistrict(state)?.id ?? null;
  const districtReady = districtOffer !== null && canRestoreDistrict(state, districtOffer);
  const restoreNeighbour = useCallback(
    (id: DistrictId) => store.dispatch((s) => restoreDistrict(s, id)),
    [store],
  );
  const visitor = state.visit.kind;
  const clock = useDaylight();
  // Decorating and the photo mode (§6.5) take over the map for a while.
  const [mode, setMode] = useState<'play' | 'decor' | 'photo'>('play');
  const [look, setLook] = useState<PhotoLook>({ daylight: 'day', season: 'summer' });
  const photo = mode === 'photo';
  const editing = mode === 'decor';
  const daylight = photo ? look.daylight : clock;
  const decor = encodeDecor(state.decor.slots);
  const setDecor = useCallback(
    (slot: number) =>
      store.dispatch((s) => placeDecor(s, slot, nextDecor(s, s.decor.slots[slot] ?? null))),
    [store],
  );
  // The return in images (§9.1): what grew while away, replayed once after loading.
  const [replay] = useState(() =>
    store.offlineSeconds >= 60
      ? { marks: returnMarks(store.offlineReport), sweeps: returnSweeps(store.offlineSeconds) }
      : null,
  );
  const [replaying, setReplaying] = useState(replay !== null && replay.marks.length > 0);
  useEffect(() => {
    if (!replaying || !replay) return;
    const timer = setTimeout(
      () => setReplaying(false),
      replaySeconds(replay.marks.length, replay.sweeps) * 1000,
    );
    return () => clearTimeout(timer);
  }, [replaying, replay]);
  const welcome = useCallback(() => {
    const result = welcomeVisit(store.getState());
    if (!result) return;
    store.dispatch(() => result.state);
    onVisit(result);
  }, [store, onVisit]);
  // The open beds of the courtyard garden (§9.7), redrawn only when a stage changes.
  const beds = isGardenOpen(state)
    ? encodeBeds(
        state.garden.plots
          .slice(0, openPlots(state))
          .map((plot) => ({ crop: plot.crop, stage: cropStage(plotGrowth(plot)) })),
      )
    : '';
  // Encoded as one string so the bikes only redraw when a cooperative starts, stops or buys.
  const bikes = unlockedCooperatives(state)
    .map(
      (id) => `${id}:${isCooperativeActive(state, id) ? 1 : 0}:${state.cooperatives.purchases[id]}`,
    )
    .join();
  const reduced = state.settings.reducedMotion || prefersReducedMotion();
  // The great works (§6.6), encoded so the layer only redraws when a stage is built.
  const worksOpen = areGreatWorksOpen(state);
  const works = encodeStages(
    Object.fromEntries(
      Object.entries(state.greatWorks.works).map(([id, w]) => [id, w.stage]),
    ) as Parameters<typeof encodeStages>[0],
  );
  // The buildings that grow (§5.5), encoded so the layer only redraws when a form or path changes.
  const flights = state.pollen.flights;
  const weather = isWeatherOpen(state) ? state.weather.current : null;
  const forecast = state.weather.forecast.join(',');
  // The neighbours' requests waiting (§9.11), encoded so the bubbles only redraw when one changes.
  const requests = state.requests.open
    .map((r) => `${r.need.kind}:${isRequestMet(state, r) ? 1 : 0}`)
    .join(',');
  const flying = isFlying(state);
  const growth = encodeGrowth(
    Object.fromEntries(GENERATOR_IDS.map((id) => [id, reachedTiers(state, id)])) as Record<
      GeneratorId,
      number
    >,
    state.growth.paths,
  );
  // The alliances at work and the grand bloom (§9.9), joined so the map redraws only on a change.
  const working = workingAlliances(state).join();
  const bloomed = state.alliances.bloomed;
  // The orchard (§9.8), encoded so the layer only redraws when a tree or a hive changes.
  const orchardOpen = isOrchardOpen(state);
  // The landscape of the sister city lived in (§7.6).
  const landscape = state.city.landscape;
  const orchard = encodeOrchard(state.orchard);
  const onPick = useCallback(
    (id: FruitId) => store.dispatch((s) => pickFruit(s, id)?.state ?? s),
    [store],
  );
  // The green and blue corridors (§6.7), encoded so the layer only redraws when one changes.
  const corridors = encodeCorridors(corridorsOf(state));
  // The parcels in their second future (§6.5), joined so the ground only redraws on a change.
  const seconds = parcels.filter((id) => futureOf(state, id) === 1).join();
  const secondList = useMemo(() => split(seconds), [seconds]);
  const ground = useMemo(
    () => <ParcelGround parcels={parcels} seconds={seconds} />,
    [parcels, seconds],
  );
  const bioregion = isBioregionOpen(state);
  const { sites, collectors } = state;
  const raining = waterPerSecond(state) > 0;
  const land = useMemo(
    () =>
      bioregion ? (
        <BioregionLand
          sites={sites}
          collectors={collectors}
          raining={raining}
          reduced={reduced}
          landscape={landscape}
        />
      ) : null,
    [bioregion, sites, collectors, raining, reduced, landscape],
  );
  const { roofTanks, swales } = collectors;
  // What moves on its own or answers the pointer: over both maps, drawn in SVG.
  const marks = useMemo(
    () => (
      <>
        {weather && <WeatherLayer weather={weather} reduced={reduced} />}
        <DistrictGround districts={districts} />
        <DistrictOffer id={districtOffer} ready={districtReady} onRestore={restoreNeighbour} />
        <CorridorLayer corridors={corridors} />
        <BloomLayer bloomed={bloomed} />
        <AllianceThreads working={working} />
        <OrchardLayer orchard={orchard} open={orchardOpen} onPick={onPick} />
        <GreatWorksLayer stages={works} open={worksOpen} reduced={reduced} />
        <GrowthLayer growth={growth} flying={flying} reduced={reduced} />
        <PollenWave flights={flights} flying={flying} reduced={reduced} />
        <RequestBubbles bubbles={requests} />
        <ProjectMarks projects={projects} />
        <SpeciesLife species={species} />
        <CooperativeBikes cooperatives={parseBikes(bikes)} reduced={reduced} />
        <GardenBeds beds={beds} onHarvest={onHarvest} />
        <DecorLayer slots={decor} editing={editing} onSlot={setDecor} />
        {replaying && replay && !reduced && (
          <ReturnReplay marks={replay.marks} sweeps={replay.sweeps} />
        )}
        <VisitLayer kind={visitor} onWelcome={welcome} />
        <ParcelOffers
          offered={split(offered)}
          affordable={split(affordable)}
          highlight={highlight}
          onRestore={restore}
        />
      </>
    ),
    [
      districts,
      districtOffer,
      works,
      worksOpen,
      growth,
      flights,
      flying,
      weather,
      requests,
      corridors,
      working,
      bloomed,
      orchard,
      orchardOpen,
      onPick,
      districtReady,
      restoreNeighbour,
      projects,
      species,
      bikes,
      reduced,
      visitor,
      welcome,
      beds,
      onHarvest,
      decor,
      editing,
      setDecor,
      replaying,
      replay,
      offered,
      affordable,
      highlight,
      restore,
    ],
  );
  const overlay = useMemo(
    () => (
      <>
        <CityWater roofTanks={roofTanks} swales={swales} />
        {marks}
      </>
    ),
    [roofTanks, swales, marks],
  );
  const phase = phaseOf(state);
  const furthest = furthestView(phase, state.generators, bioregion);
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
    // The City view grows with the neighbouring districts restored (§6.4).
    const frame = view === 3 ? cityFrame(districts) : undefined;
    return fitCamera(view, width, height, { top, left: 0, bottom: 0 }, frame);
  }, [view, width, height, districts]);
  // The heliotrope stands in the home courtyard, at the heart of the city, and follows the camera.
  const flower = flowerFrame(camera, width, height, PLANTER);
  const season = photo ? look.season : visualSeason(state);
  // 0 with nothing built, 1 around 100 000 Light/s, well into the city phase. Rounded so the
  // map only redraws when the colour visibly changes.
  const greenness = Math.round(Math.min(1, Math.log10(1 + lightPerSecond(state)) / 5) * 20) / 20;
  const { renderer, chosen: rendererChosen } = useMapRenderer();
  const [webglFailed, setWebglFailed] = useState(false);
  const enhanced = renderer === 'pixi' && !webglFailed;
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
      land={land}
      overlay={overlay}
    />
  );

  return (
    <figure
      className="panel scene"
      data-photo={photo || undefined}
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
              seconds={secondList}
              phase={phase}
              season={season}
              greenness={greenness}
              reduced={reduced}
              camera={camera}
              width={width}
              height={height}
              sites={sites}
              collectors={collectors}
              raining={raining}
              bioregion={bioregion}
              landscape={landscape}
              strict={!rendererChosen}
              overlay={marks}
              onFail={() => setWebglFailed(true)}
            />
          </Suspense>
        ) : (
          svgMap
        )}
        <NightLights
          daylight={daylight}
          camera={cameraTransform(camera, width, height)}
          width={width}
          height={height}
        />
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
                aria-label={t.phases[v]}
                onClick={() => choose(v)}
              >
                {/* Narrow screens drop the article so the four views fit on one line. */}
                <span className="view-long">{t.phases[v]}</span>
                <span className="view-short">{t.layout.viewNames[v]}</span>
              </button>
            ))}
          </div>
        )}
        {furthest === 1 && <span className="scene-phase">{t.phases[1]}</span>}
        {season && <span className="scene-season">{t.visualSeasons[season]}</span>}
        {weather && <WeatherForecast now={weather} next={forecast.split(',') as WeatherId[]} />}
        {mode === 'play' && isDecorOpen(state) && (
          <button type="button" className="scene-tool decor-tool" onClick={() => setMode('decor')}>
            {t.decor.open}
          </button>
        )}
        {mode === 'play' && (
          <button
            type="button"
            className="scene-tool"
            onClick={() => {
              setLook({ daylight: clock, season: visualSeason(state) ?? 'summer' });
              setMode('photo');
            }}
          >
            {t.photo.open}
          </button>
        )}
      </figcaption>
      {editing && <DecorToolbar onDone={() => setMode('play')} />}
      {photo && (
        <PhotoToolbar
          look={look}
          onLook={setLook}
          map={() => mapRef.current}
          onClose={() => setMode('play')}
        />
      )}
    </figure>
  );
}

/** Evening and night from the player's clock (§9.6), checked every minute. */
function useDaylight(): Daylight {
  const [daylight, setDaylight] = useState(() => daylightOf(new Date().getHours()));
  useEffect(() => {
    const timer = setInterval(() => setDaylight(daylightOf(new Date().getHours())), 60_000);
    return () => clearInterval(timer);
  }, []);
  return daylight;
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
