// The courtyard garden on the map and in its panel (docs/game-design.md §9.7): small beds on each
// side of the heliotrope, between the rows of pots, where every crop grows through four stages
// and a ripe one breathes a golden ring until a click harvests it.
import { memo, type KeyboardEvent } from 'react';
import { MAX_PLOTS, type CropId } from '../game/garden';
import { t } from '../i18n';
import { BED_PLACES, BED_SIZE, decodeBeds, type CropStage } from './gardenMap';
import './garden.css';

/** One plant of a crop at a stage, drawn around (0, 0), about 6 units across when ripe. */
export function Plant({ crop, stage }: { crop: CropId; stage: CropStage }) {
  if (stage === 0) return <ellipse className="plant-seed" rx="0.9" ry="0.6" />;
  if (stage === 1) {
    return (
      <g className="plant-sprout">
        <path d="M0 0.6V-0.8" />
        <path
          className="leaf"
          d="M0 -0.6c-1.4 0-2-0.8-2-1.6 1.2 0 2 .6 2 1.6zm0 0c1.4 0 2-.8 2-1.6-1.2 0-2 .6-2 1.6z"
        />
      </g>
    );
  }
  const ripe = stage === 3;
  switch (crop) {
    case 'radish':
      return (
        <g className="plant-radish">
          {ripe && <ellipse className="fruit" cx="0" cy="0.8" rx="1.6" ry="1.4" />}
          <path
            className="leaf"
            d="M0 0c-2-.4-2.8-2-2.4-3.2 1.4.2 2.4 1.4 2.4 3.2zm0 0c2-.4 2.8-2 2.4-3.2-1.4.2-2.4 1.4-2.4 3.2z"
          />
          <path className="leaf" d="M0 0c-.6-1.6 0-3.2 0-3.6.6.6.8 2.2 0 3.6z" />
        </g>
      );
    case 'sunflower':
      return (
        <g className="plant-sunflower">
          <path
            className="leaf"
            d="M0 1c-2 0-3-1-3-2 1.6 0 3 .6 3 2zm0 0c2 0 3-1 3-2-1.6 0-3 .6-3 2z"
          />
          {ripe ? (
            <g className="flower-head">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <ellipse
                  key={a}
                  className="petal"
                  cx="0"
                  cy="-1.9"
                  rx="0.7"
                  ry="1.3"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle className="heart" r="1.3" />
            </g>
          ) : (
            <circle className="bud" r="1.2" />
          )}
        </g>
      );
    case 'beans':
      return (
        <g className="plant-beans">
          <path className="pole" d="M0 2V-3.2" />
          <path className="vine" d="M0 1.6c-1.4-.6-1.4-1.6 0-2.2s1.4-1.6 0-2.2" />
          <path
            className="leaf"
            d="M-.2 .4c-1.6 0-2.2-.8-2.2-1.6 1.4 0 2.2.6 2.2 1.6zm.4-2.2c1.6 0 2.2-.8 2.2-1.6-1.4 0-2.2.6-2.2 1.6z"
          />
          {ripe && (
            <path className="pod" d="M1 0.2c.8.6.9 1.8.3 2.4M-1.2 -1.6c-.8.6-.9 1.8-.3 2.4" />
          )}
        </g>
      );
    case 'squash':
      return (
        <g className="plant-squash">
          <path
            className="leaf"
            d="M0 0c-2.6-.2-3.2-2.2-2.4-3.2 1.6.4 2.4 1.6 2.4 3.2zm0 0c2.6-.2 3.2-2.2 2.4-3.2-1.6.4-2.4 1.6-2.4 3.2z"
          />
          {ripe ? (
            <g className="fruit">
              <ellipse cx="0" cy="0.9" rx="2.4" ry="1.9" />
              <path
                className="rib"
                d="M0 -.9V2.7M-1.2 -.6c-.6 1-.6 2.4 0 3.2M1.2 -.6c.6 1 .6 2.4 0 3.2"
              />
            </g>
          ) : (
            <circle className="bud" cy="0.6" r="0.9" />
          )}
        </g>
      );
    case 'strawberry':
      // M32: a low rosette of toothed leaves, white flowers, then red berries.
      return (
        <g className="plant-strawberry">
          {[0, 120, 240].map((a) => (
            <path
              key={a}
              className="leaf"
              d="M0 0c-1-.4-1.6-1.4-1.2-2.4.4.4 1 .2 1.2.6.2-.4.8-.2 1.2-.6.4 1-.2 2-1.2 2.4z"
              transform={`rotate(${a})`}
            />
          ))}
          {ripe ? (
            <g className="berries">
              {[
                [-1.3, 0.9],
                [1.2, 1.1],
                [0.1, -1.6],
              ].map(([x, y]) => (
                <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
                  <path
                    className="berry"
                    d="M0 1.1c-.8-.3-1-1-.8-1.5.4-.4 1.2-.4 1.6 0 .2.5 0 1.2-.8 1.5z"
                  />
                  <path className="calyx" d="M-.5 -.5l.5.2.5-.2" />
                </g>
              ))}
            </g>
          ) : (
            <g className="blossom">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-.6" rx=".35" ry=".5" transform={`rotate(${a})`} />
              ))}
              <circle className="heart" r=".3" />
            </g>
          )}
        </g>
      );
  }
}

/** A bed seen from above: its soil, its wooden edge, and three plants of its crop. */
function Bed({ crop, stage }: { crop: CropId | null; stage: CropStage }) {
  const { width, height } = BED_SIZE;
  return (
    <g className="bed">
      <rect
        className="bed-edge"
        x={-width / 2 - 0.8}
        y={-height / 2 - 0.8}
        width={width + 1.6}
        height={height + 1.6}
        rx="1.2"
      />
      <rect
        className="bed-soil"
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx="0.8"
      />
      <path className="bed-furrow" d={`M0 ${-height / 2 + 1.5}V${height / 2 - 1.5}`} />
      {crop !== null &&
        [-5, 0, 5].map((y) => (
          <g key={y} transform={`translate(0 ${y})`}>
            <Plant crop={crop} stage={stage} />
          </g>
        ))}
    </g>
  );
}

/**
 * The open beds of the courtyard on the map. A ripe bed breathes a golden ring and is a button:
 * a click (or Enter) harvests it.
 */
export const GardenBeds = memo(function GardenBeds({
  beds,
  onHarvest,
}: {
  /** encodeBeds of the open beds, in order. */
  beds: string;
  onHarvest: (index: number) => void;
}) {
  const marks = decodeBeds(beds).slice(0, MAX_PLOTS);
  if (marks.length === 0) return null;
  return (
    <g className="garden">
      {marks.map(({ crop, stage }, i) => {
        const [x, y] = BED_PLACES[i]!;
        const ripe = crop !== null && stage === 3;
        if (!ripe) {
          return (
            <g key={i} transform={`translate(${x} ${y})`} aria-hidden="true">
              <Bed crop={crop} stage={stage} />
            </g>
          );
        }
        const label = t.garden.harvestLabel(t.garden.crops[crop].name);
        const onKey = (event: KeyboardEvent<SVGGElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onHarvest(i);
        };
        return (
          <g
            key={i}
            className="bed-ripe"
            transform={`translate(${x} ${y})`}
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={() => onHarvest(i)}
            onKeyDown={onKey}
          >
            <title>{label}</title>
            <rect className="bed-ring" x="-6" y="-10" width="12" height="20" rx="3" />
            <circle className="tap-hit" r="16" />
            <Bed crop={crop} stage={stage} />
          </g>
        );
      })}
    </g>
  );
});

/** A crop on its own, for the garden panel: one plant at its ripe stage, or at `stage`. */
export function CropArt({ crop, stage = 3 }: { crop: CropId; stage?: CropStage }) {
  return (
    <svg viewBox="-4 -4.5 8 8" className="crop-art" data-crop={crop} aria-hidden="true">
      <Plant crop={crop} stage={stage} />
    </svg>
  );
}
