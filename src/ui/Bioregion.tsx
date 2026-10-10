import {
  buyCollector,
  canBuyCollector,
  canRaiseSite,
  COLLECTOR_IDS,
  COLLECTOR_LINK_BONUS,
  COLLECTORS,
  collectorCost,
  collectorUnitWater,
  collectorWater,
  isBioregionOpen,
  isCollectorRevealed,
  isSiteRevealed,
  raiseSite,
  SITE_BONUS,
  SITE_IDS,
  SITES,
  siteCost,
  waterPerSecond,
} from '../game/bioregion';
import { formatCost, formatDecimal, formatNumber, formatPercent } from '../game/format';
import { t } from '../i18n';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { useGameState, useGameStore } from './useGame';

/** A drop of water, the mark of the Bioregion's resource (§7.4). */
export function WaterIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="water-icon">
      <path d="M8 1.8C6 4.6 3.6 7.4 3.6 10a4.4 4.4 0 0 0 8.8 0C12.4 7.4 10 4.6 8 1.8Z" />
    </svg>
  );
}

/**
 * The Bioregion panel (docs/game-design.md §7.4): the water collectors, built with Light, then
 * the regional sites, extended with the Water they gather. Shown from the third Season.
 */
export function Bioregion() {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('bioregion');
  if (!isBioregionOpen(state)) return null;
  const collectors = COLLECTOR_IDS.filter((id) => isCollectorRevealed(state, id));
  const nextCollector = COLLECTOR_IDS.find((id) => !isCollectorRevealed(state, id));
  const sites = SITE_IDS.filter((id) => isSiteRevealed(state, id));
  const nextSite = SITE_IDS.find((id) => !isSiteRevealed(state, id));

  return (
    <section className="panel bioregion" aria-labelledby="bioregion-title" data-open={open}>
      <div className="panel-head">
        <PanelTitle id="bioregion-title" open={open} onToggle={toggle}>
          {t.bioregion.title}
        </PanelTitle>
        <span className="bioregion-rate">
          <WaterIcon />
          {formatNumber(Math.floor(state.resources.water))}
          <span className="counter-rate">
            +{formatNumber(waterPerSecond(state))} {t.perSecond}
          </span>
        </span>
      </div>

      <h3 className="bioregion-subtitle">{t.bioregion.collectorsTitle}</h3>
      <ul>
        {collectors.map((id) => {
          const text = t.bioregion.collectors[id];
          const owned = state.collectors[id];
          const cost = formatCost(collectorCost(state, id));
          const linked = t.generators[COLLECTORS[id].linked].name;
          return (
            <li key={id} className="generator collector" data-collector={id}>
              <div className="generator-text">
                <h3>{text.name}</h3>
                <p className="flavour">{text.flavour}</p>
                <p className="generator-stats">
                  {owned > 0
                    ? t.bioregion.gathers(formatNumber(collectorWater(state, id)))
                    : t.bioregion.unitWater(formatNumber(collectorUnitWater(state, id)))}
                  {' · '}
                  {t.bioregion.linked(formatPercent(COLLECTOR_LINK_BONUS), linked)}
                </p>
              </div>
              <span className="owned" data-testid={`collector-${id}`} title={t.owned}>
                {owned}
              </span>
              <button
                type="button"
                className="buy"
                disabled={!canBuyCollector(state, id)}
                aria-label={t.bioregion.buildLabel(text.name, cost)}
                onClick={() => store.dispatch((s) => buyCollector(s, id))}
              >
                <span className="buy-verb">{t.bioregion.build}</span>
                <span className="buy-cost">☀ {cost}</span>
              </button>
            </li>
          );
        })}
        {nextCollector && (
          <li className="generator silhouette" aria-label={t.bioregion.unknown}>
            <div className="generator-text">
              <h3>{t.bioregion.unknown}</h3>
              <p className="flavour">· · ·</p>
            </div>
            <span className="buy-cost">☀ {formatCost(COLLECTORS[nextCollector].baseCost)}</span>
          </li>
        )}
      </ul>

      {(sites.length > 0 || nextSite) && (
        <>
          <h3 className="bioregion-subtitle">{t.bioregion.sitesTitle}</h3>
          <ul>
            {sites.map((id) => {
              const text = t.bioregion.sites[id];
              const level = state.sites[id];
              const cost = formatCost(siteCost(state, id));
              const [first, second] = SITES[id].buildings.map((g) => t.generators[g].name);
              return (
                <li key={id} className="generator site" data-site={id}>
                  <div className="generator-text">
                    <h3>{text.name}</h3>
                    <p className="flavour">{text.flavour}</p>
                    <p className="generator-stats">
                      {t.bioregion.siteEffect(first!, second!, formatPercent(SITE_BONUS))}
                      {level > 0 &&
                        ` · ${t.bioregion.siteNow(formatDecimal(1 + SITE_BONUS * level))}`}
                    </p>
                  </div>
                  <span
                    className="owned"
                    data-testid={`site-${id}`}
                    title={t.bioregion.level}
                    // Re-keyed so the level pops when it grows.
                    key={level}
                  >
                    {level}
                  </span>
                  <button
                    type="button"
                    className="buy water-buy"
                    disabled={!canRaiseSite(state, id)}
                    aria-label={t.bioregion.raiseLabel(text.name, cost)}
                    onClick={() => store.dispatch((s) => raiseSite(s, id))}
                  >
                    <span className="buy-verb">{t.bioregion.raise}</span>
                    <span className="buy-cost">
                      <WaterIcon /> {cost}
                    </span>
                  </button>
                </li>
              );
            })}
            {nextSite && (
              <li className="generator silhouette" aria-label={t.bioregion.unknown}>
                <div className="generator-text">
                  <h3>{t.bioregion.unknown}</h3>
                  <p className="flavour">· · ·</p>
                </div>
                <span className="buy-cost">
                  <WaterIcon /> {formatCost(SITES[nextSite].baseCost)}
                </span>
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
