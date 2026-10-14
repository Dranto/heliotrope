import { useEffect, useMemo, useRef, type ReactNode, type Ref } from 'react';
import { t } from '../../i18n';
import { LandPatterns } from '../BioregionArt';
import { cameraTransform } from '../neighbourhood';
import { MapRenderer, type MapProps } from './renderer';
import { ParcelPatterns } from '../RestorationArt';
import { mapSources, type Source } from './sources';

/**
 * The enriched map (docs/game-design.md §10.4): the city and the Bioregion drawn with WebGL
 * under an SVG layer that keeps what the player touches or what moves on its own (parcels on
 * offer, projects, species, cargo bikes) exactly as in the SVG scene. Calls `onFail` when the
 * device cannot draw it, so the SVG map comes back.
 */
/**
 * The drawings, out of sight but styled by the scene's CSS. Animations are off there (see
 * App.css), so each one is taken at rest.
 */
function Sources({ sources, ref }: { sources: Source[]; ref?: Ref<SVGSVGElement> }) {
  return (
    <svg ref={ref} className="pixi-sources" aria-hidden="true">
      <defs>
        <g className="parcels">
          <ParcelPatterns />
        </g>
        <g className="bioregion-land">
          <LandPatterns />
        </g>
      </defs>
      {sources.map((source) => (
        <g key={source.key} className={source.scope}>
          <g data-source={source.key}>{source.node}</g>
        </g>
      ))}
    </svg>
  );
}

export default function PixiMap({
  overlay,
  onFail,
  ...props
}: MapProps & { overlay?: ReactNode; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const sourcesRoot = useRef<SVGSVGElement>(null);
  const renderer = useRef<MapRenderer | null>(null);
  // Whether to give up on slow devices is settled when the map starts.
  const strictStart = useRef(props.strict ?? false);
  const fail = useRef(onFail);
  useEffect(() => {
    fail.current = onFail;
  }, [onFail]);

  // Started once; the effect below hands it the props, before WebGL is even ready.
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const map = new MapRenderer(sourcesRoot.current);
    renderer.current = map;
    map.init(element, strictStart.current).then((ok) => {
      if (!ok && renderer.current === map) fail.current();
    });
    return () => {
      renderer.current = null;
      map.destroy();
    };
  }, []);

  const { generators, upgrades, parcels, seconds, phase, season, greenness, reduced, camera } =
    props;
  const { width, height, sites, collectors, raining, bioregion, landscape, strict, paused } = props;
  const sources = useMemo(
    () => mapSources({ parcels, seconds, sites, collectors, bioregion, landscape }),
    [parcels, seconds, sites, collectors, bioregion, landscape],
  );
  useEffect(() => {
    renderer.current?.update({
      generators,
      upgrades,
      parcels,
      seconds,
      phase,
      season,
      greenness,
      reduced,
      camera,
      width,
      height,
      sites,
      collectors,
      raining,
      bioregion,
      landscape,
      strict,
      paused,
    });
  }, [
    generators,
    upgrades,
    parcels,
    seconds,
    phase,
    season,
    greenness,
    reduced,
    camera,
    width,
    height,
    sites,
    collectors,
    raining,
    bioregion,
    landscape,
    strict,
    paused,
  ]);

  return (
    <div className="pixi-map">
      <div ref={host} className="pixi-canvas" role="img" aria-label={t.sceneLabel} />
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
        <g className="camera" style={{ transform: cameraTransform(camera, width, height) }}>
          {overlay}
        </g>
      </svg>
      <Sources ref={sourcesRoot} sources={sources} />
    </div>
  );
}
