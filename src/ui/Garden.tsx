import { useState, type CSSProperties } from 'react';
import {
  canSow,
  CROP_IDS,
  hasRipe,
  weatherCrop,
  CROPS,
  isCropUnlocked,
  isGardenOpen,
  isRipe,
  MAX_PLOTS,
  openPlots,
  PLOT_PARCELS,
  plotsToCome,
  plotGrowth,
  secondsToRipe,
  sow,
  VARIETIES,
  VARIETY_IDS,
  type CropId,
} from '../game/garden';
import { t } from '../i18n';
import { CropArt } from './GardenArt';
import { cropStage } from './gardenMap';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';

/**
 * The courtyard garden (docs/game-design.md §9.7): each bed with what grows in it, the crops to
 * sow in a bare one, the harvest button of a ripe one, and the seed bank's varieties.
 */
export function Garden({
  onHarvest,
  onHarvestAll,
}: {
  onHarvest: (index: number) => void;
  onHarvestAll: () => void;
}) {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('garden');
  // The bare bed whose crops are listed; the first bare one by default.
  const [choosing, setChoosing] = useState<number | null>(null);
  if (!isGardenOpen(state)) return null;
  const plots = state.garden.plots;
  const opened = openPlots(state);
  const toCome = plotsToCome(state);
  const firstBare = plots.findIndex((p, i) => i < opened && p.crop === null);
  const picking = choosing !== null && plots[choosing]?.crop === null ? choosing : firstBare;
  const crops = CROP_IDS.filter((id) => isCropUnlocked(state, id));
  const favoured = weatherCrop(state);
  const plant = (index: number, crop: CropId) => {
    store.dispatch((s) => sow(s, index, crop));
    setChoosing(null);
  };

  return (
    <section className="panel garden-panel" aria-labelledby="garden-title" data-open={open}>
      <PanelTitle id="garden-title" open={open} onToggle={toggle}>
        {t.garden.title}
      </PanelTitle>
      <p className="hint">{t.garden.hint}</p>
      {favoured && (
        <p className="hint garden-weather">{t.garden.weatherCrop(t.garden.crops[favoured].name)}</p>
      )}
      {hasRipe(state) && (
        <button
          type="button"
          className="buy garden-all"
          title={t.garden.harvestAllHint}
          onClick={onHarvestAll}
        >
          <span className="buy-verb">{t.garden.harvestAll}</span>
        </button>
      )}
      <ul className="garden-beds">
        {plots.slice(0, MAX_PLOTS).map((plot, i) => {
          const name = t.garden.plot(i + 1);
          if (i >= opened) {
            const condition = toCome[i - opened];
            return (
              <li key={i} className="garden-bed" data-state="locked">
                <span className="garden-bed-head">
                  <strong>{name}</strong>
                </span>
                <span className="hint">
                  {condition === 'parcels'
                    ? t.garden.lockedBy.parcels(
                        Math.min(state.parcels.length, PLOT_PARCELS),
                        PLOT_PARCELS,
                      )
                    : condition
                      ? t.garden.lockedBy[condition]
                      : t.garden.locked}
                </span>
              </li>
            );
          }
          if (plot.crop === null) {
            return (
              <li key={i} className="garden-bed" data-state="bare">
                <span className="garden-bed-head">
                  <strong>{name}</strong>
                  <span className="hint">{t.garden.bare}</span>
                </span>
                {picking === i ? (
                  <div className="garden-crops" role="group" aria-label={t.garden.choose}>
                    {crops.map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        className="garden-crop"
                        disabled={!canSow(state, i, crop)}
                        aria-label={t.garden.sowLabel(t.garden.crops[crop].name, name)}
                        onClick={() => plant(i, crop)}
                      >
                        <CropArt crop={crop} />
                        <span>
                          {t.garden.crops[crop].name}
                          <small>
                            {t.garden.grows(t.duration(CROPS[crop].seconds))} ·{' '}
                            {t.garden.crops[crop].effect}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" className="ghost garden-sow" onClick={() => setChoosing(i)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={SOW_ICON} />
                    </svg>
                    {t.garden.sow}
                  </button>
                )}
              </li>
            );
          }
          const crop = t.garden.crops[plot.crop].name;
          const ripe = isRipe(plot);
          const growth = plotGrowth(plot);
          const status = ripe
            ? t.garden.ripe
            : t.garden.growing(t.duration(Math.ceil(secondsToRipe(state, plot))));
          return (
            <li
              key={i}
              className="garden-bed"
              data-state={ripe ? 'ripe' : 'growing'}
              // The shoots on the bed's strip of earth grow with the crop.
              style={{ '--grown': ripe ? 1 : growth } as CSSProperties}
            >
              <span className="garden-bed-head">
                <CropArt crop={plot.crop} stage={cropStage(growth)} />
                <span>
                  <strong>{crop}</strong>
                  <br />
                  <span className="hint">{status}</span>
                  {plot.rotated && !ripe && (
                    <>
                      <br />
                      <span className="hint garden-rotated">{t.garden.rotated}</span>
                    </>
                  )}
                </span>
              </span>
              {ripe ? (
                <button
                  type="button"
                  className="buy"
                  aria-label={t.garden.harvestLabel(crop)}
                  onClick={() => onHarvest(i)}
                >
                  <span className="buy-verb">{t.garden.harvest}</span>
                </button>
              ) : (
                <span
                  className="garden-meter"
                  role="progressbar"
                  aria-label={t.garden.plotLabel(name, crop, status)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.floor(growth * 100)}
                >
                  <span style={{ width: `${growth * 100}%` }} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="garden-bank">
        <h3>{t.garden.seedBank}</h3>
        <p className="hint">{t.garden.seedBankHint}</p>
        <ul className="garden-varieties">
          {VARIETY_IDS.map((id) => {
            const found = state.garden.varieties.includes(id);
            const [a, b] = VARIETIES[id].parents;
            return (
              <li key={id} className="garden-variety" data-found={found}>
                <span className="variety-pair" aria-hidden="true">
                  <CropArt crop={a} />
                  <CropArt crop={b} />
                </span>
                <span>
                  {found
                    ? t.garden.varieties[id]
                    : t.garden.unknownVariety(t.garden.crops[a].name, t.garden.crops[b].name)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** A shoot rising from a seed in the furrow, on the button that sows a bare square. */
const SOW_ICON =
  'M12 19v-7M12 12c0-3 1.8-5 5-5 0 3-1.8 5-5 5zM12 14c0-2.4-1.6-4-4.2-4 0 2.4 1.6 4 4.2 4zM5 19.5h14';
