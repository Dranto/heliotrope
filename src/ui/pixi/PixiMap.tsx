import { useEffect, useRef, type ReactNode } from 'react';
import { t } from '../../i18n';
import { cameraTransform } from '../neighbourhood';
import { MapRenderer, type MapProps } from './renderer';

/**
 * The enriched map (docs/game-design.md §10.4), loaded only when chosen in the Options: the
 * city drawn with WebGL under an SVG layer that keeps what the player touches (parcels on
 * offer, projects, species, cargo bikes) exactly as in the SVG scene. Calls `onFail` when the
 * device has no WebGL, so the SVG map comes back.
 */
export default function PixiMap({
  ground,
  overlay,
  onFail,
  ...props
}: MapProps & { ground?: ReactNode; overlay?: ReactNode; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<MapRenderer | null>(null);
  const fail = useRef(onFail);
  useEffect(() => {
    fail.current = onFail;
  }, [onFail]);

  // Started once; the effect below hands it the props, before WebGL is even ready.
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const map = new MapRenderer();
    renderer.current = map;
    map.init(element).then((ok) => {
      if (!ok && renderer.current === map) fail.current();
    });
    return () => {
      renderer.current = null;
      map.destroy();
    };
  }, []);

  const { generators, upgrades, parcels, phase, season, greenness, reduced, camera } = props;
  const { width, height } = props;
  useEffect(() => {
    renderer.current?.update({
      generators,
      upgrades,
      parcels,
      phase,
      season,
      greenness,
      reduced,
      camera,
      width,
      height,
    });
  }, [generators, upgrades, parcels, phase, season, greenness, reduced, camera, width, height]);

  return (
    <div className="pixi-map">
      <div ref={host} className="pixi-canvas" role="img" aria-label={t.sceneLabel} />
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
        <g className="camera" style={{ transform: cameraTransform(camera, width, height) }}>
          {ground}
          {overlay}
        </g>
      </svg>
    </div>
  );
}
