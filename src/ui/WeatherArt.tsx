// The weather (docs/game-design.md §9.10, M28) on the map and in its caption: a veil over the
// whole city for the sky of the moment, drawn in SVG over both renderers like the other marks
// (§10.4), and the forecast as icons, without text, next to the view switch.
import { memo } from 'react';
import './weather.css';
import type { WeatherId } from '../game/weather';
import { t } from '../i18n';

/** Far enough around the city to cover every view, the Bioregion included. */
const SKY = { x: -900, y: -700, width: 2400, height: 1850 };

const DROPS = Array.from({ length: 160 }, (_, i) => ({
  // Over the neighbourhood and around it, where the map is looked at most.
  x: -150 + ((i * 397) % 900),
  y: -150 + ((i * 211) % 750),
  delay: (i % 7) * 0.13,
}));

const LEAVES = Array.from({ length: 14 }, (_, i) => ({
  y: -60 + ((i * 131) % 560),
  delay: i * 0.55,
  tilt: (i * 47) % 360,
}));

const GLINTS: [number, number][] = [
  [90, 120],
  [210, 60],
  [420, 140],
  [520, 300],
  [160, 360],
  [330, 410],
  [470, 70],
];

function Sky({ id }: { id: WeatherId }) {
  return <rect className="weather-veil" data-weather={id} {...SKY} />;
}

export const WeatherLayer = memo(function WeatherLayer({
  weather,
  reduced,
}: {
  weather: WeatherId;
  reduced: boolean;
}) {
  return (
    <g className="weather" data-weather={weather} aria-hidden="true">
      <Sky id={weather} />
      {weather === 'shower' && !reduced && (
        <g className="weather-rain">
          {DROPS.map(({ x, y, delay }) => (
            <path
              key={`${x},${y}`}
              d={`M${x} ${y}l-6 22`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </g>
      )}
      {weather === 'wind' && !reduced && (
        <g className="weather-wind">
          {LEAVES.map(({ y, delay, tilt }) => (
            <ellipse
              key={y}
              cx={-40}
              cy={y}
              rx="4"
              ry="1.8"
              transform={`rotate(${tilt} -40 ${y})`}
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </g>
      )}
      {weather === 'sun' && (
        <g className="weather-glints">
          {GLINTS.map(([x, y], i) => (
            <path
              key={`${x},${y}`}
              d={`M${x} ${y - 5}v10M${x - 5} ${y}h10`}
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>
      )}
      {weather === 'mist' && (
        <g className="weather-mist">
          {[80, 220, 360].map((y) => (
            <ellipse key={y} cx="300" cy={y} rx="420" ry="34" />
          ))}
        </g>
      )}
    </g>
  );
});

/** A small icon for each weather, in a 20 × 20 box. */
export function WeatherIcon({ id }: { id: WeatherId }) {
  return (
    <svg viewBox="0 0 20 20" className="weather-icon" data-weather={id} aria-hidden="true">
      {(id === 'sun' || id === 'heat') && (
        <>
          <circle cx="10" cy="10" r="4" className="weather-sun" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path key={angle} d="M10 2.4v2" transform={`rotate(${angle} 10 10)`} />
          ))}
        </>
      )}
      {id === 'heat' && (
        <path d="M4 17c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 3 0" className="weather-wave" />
      )}
      {id === 'shower' && (
        <>
          <path
            d="M5.4 11.6a3 3 0 0 1 .4-6 4 4 0 0 1 7.6 1 2.6 2.6 0 0 1 .8 5Z"
            className="weather-cloud"
          />
          <path d="M7 14l-1 3M10.4 14l-1 3M13.8 14l-1 3" className="weather-drop" />
        </>
      )}
      {id === 'wind' && <path d="M3 8h9.4a2.2 2.2 0 1 0-2.2-2.2M3 12h12a2.4 2.4 0 1 1-2.4 2.4" />}
      {id === 'mist' && <path d="M3 7h14M5 10.4h12M3 13.8h12M6 17.2h8" />}
    </svg>
  );
}

/** The weather of the moment and the three forecast ones, in the map's caption. */
export function WeatherForecast({ now, next }: { now: WeatherId; next: readonly WeatherId[] }) {
  const names = t.weather.names;
  return (
    <span
      className="scene-weather"
      role="img"
      aria-label={t.weather.forecast(names[now], next.map((id) => names[id]).join(', '))}
      title={t.weather.forecast(names[now], next.map((id) => names[id]).join(', '))}
    >
      <WeatherIcon id={now} />
      <span className="weather-next">
        {next.map((id, i) => (
          <WeatherIcon key={i} id={id} />
        ))}
      </span>
    </span>
  );
}
