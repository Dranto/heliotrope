import { cityBonuses, LANDSCAPES, networkBonuses, savoirBonus } from '../game/cityData';
import {
  buyWorkshop,
  canBuyWorkshop,
  canSwarm,
  citySources,
  LANDSCAPE_IDS,
  savoirsToGain,
  swarm,
  SWARM_SOURCES,
  nextWorkshopCost,
  WORKSHOP_COSTS,
  WORKSHOP_IDS,
  workshopLevel,
  type CityKind,
  type LandscapeId,
} from '../game/cities';
import { formatNumber, formatPercent } from '../game/format';
import { foldBonuses } from '../game/greatWorks';
import { t } from '../i18n';
import { bonusesText } from '../i18n/restoration';
import { Dialog } from './Dialog';
import { CityGlyph, RegionMap } from './RegionMap';
import { useGameState, useGameStore } from './useGame';
import './cities.css';

function cityName(kind: CityKind | null): string {
  return kind === null || kind === 'home' ? t.cities.home : t.cities.landscapes[kind];
}

/**
 * The sister cities (docs/game-design.md §7.6): the region with the cities founded, the five
 * landscapes to swarm to, and the Savoirs' workshop.
 */
export function Cities({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const state = useGameState();
  const { city } = state;
  const gain = savoirsToGain(state);
  const ready = canSwarm(state);
  const go = (landscape: LandscapeId) => {
    store.dispatch((s) => swarm(s, landscape));
    onClose();
  };

  return (
    <Dialog title={t.cities.title} closeLabel={t.cities.close} onClose={onClose} className="cities">
      <p className="cities-summary">
        <strong>{t.cities.savoirs(formatNumber(city.savoirs))}</strong>
        {city.earned > 0 &&
          ` · ${t.cities.earned(formatNumber(city.earned), formatPercent(savoirBonus(city)))}`}
      </p>
      <p className="hint">{t.cities.hint}</p>
      <RegionMap founded={city.founded} landscape={city.landscape} />
      <p className="cities-living">
        {t.cities.living(cityName(city.landscape))}
        {city.landscape && ` · ${bonusesText(LANDSCAPES[city.landscape].rule)}`}
      </p>
      <h3>{t.cities.networkTitle}</h3>
      {city.founded.length === 0 ? (
        <p className="hint">{t.cities.networkNone}</p>
      ) : (
        <p className="cities-network">
          {bonusesText(foldBonuses(cityBonuses({ ...city, landscape: null, earned: 0 })))}
        </p>
      )}
      <h3>{t.cities.choose}</h3>
      <p className="cities-gain">
        {ready
          ? t.cities.gain(formatNumber(gain))
          : t.cities.needSources(formatNumber(citySources(state)), formatNumber(SWARM_SOURCES))}
      </p>
      <p className="hint">
        {t.cities.gainHint} {t.cities.lost}
      </p>
      <ul className="cities-landscapes">
        {LANDSCAPE_IDS.map((id) => {
          const name = t.cities.landscapes[id];
          return (
            <li key={id} className="cities-landscape" data-landscape={id}>
              <svg viewBox="-20 -14 40 28" className="cities-landscape-art" aria-hidden="true">
                <CityGlyph kind={id} />
              </svg>
              <strong>{name}</strong>
              <p>
                <span className="cities-label">{t.cities.rule}</span>{' '}
                {bonusesText(LANDSCAPES[id].rule)}
              </p>
              <p>
                <span className="cities-label">{t.cities.network}</span>{' '}
                {bonusesText(networkBonuses(id))}
              </p>
              <button
                type="button"
                className="buy"
                disabled={!ready}
                aria-label={t.cities.swarmLabel(name, formatNumber(gain))}
                onClick={() => go(id)}
              >
                <span className="buy-verb">{t.cities.swarm}</span>
                <span className="buy-cost">+{t.cities.savoirs(formatNumber(gain))}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <h3>{t.cities.workshop}</h3>
      <p className="hint">{t.cities.workshopHint}</p>
      <ul className="cities-workshop">
        {WORKSHOP_IDS.map((id) => {
          const level = workshopLevel(city.workshop, id);
          const max = WORKSHOP_COSTS[id].length;
          const cost = nextWorkshopCost(city.workshop, id);
          return (
            <li key={id} className="cities-rule" data-learnt={cost === null} data-level={level}>
              <span>
                <strong>{t.cities.workshopNames[id]}</strong>
                {max > 1 && level > 0 && (
                  <span className="cities-level"> · {t.cities.level(level, max)}</span>
                )}
                <br />
                <span className="hint">{t.cities.workshopEffects[id]}</span>
              </span>
              {cost === null ? (
                <span className="cities-learnt">{t.cities.learnt}</span>
              ) : (
                <button
                  type="button"
                  className="buy"
                  disabled={!canBuyWorkshop(state, id)}
                  onClick={() => store.dispatch((s) => buyWorkshop(s, id))}
                >
                  <span className="buy-verb">{level > 0 ? t.cities.deepen : t.cities.learn}</span>
                  <span className="buy-cost">{t.cities.savoirs(formatNumber(cost))}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
