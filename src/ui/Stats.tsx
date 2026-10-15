import { achievementBonus } from '../game/achievements';
import { formatNumber, formatPercent } from '../game/format';
import { biodiversityBonus, clickValue, lightPerSecond } from '../game/production';
import { seedBonus } from '../game/seasons';
import { TALENT_LIST } from '../game/talents';
import { t } from '../i18n';
import { Dialog } from './Dialog';
import { ProductionCurve } from './ProductionCurve';
import { useGameState } from './useGame';

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="stat-row">
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}

/** Three stems of rising height under a sun, a garden read as a growth chart (§10.4). */
function StatsOrnament() {
  return (
    <svg viewBox="0 0 240 92" className="stats-ornament" aria-hidden="true">
      <circle className="stats-sun" cx="178" cy="22" r="13" />
      <path className="stats-trend" d="M58 80C102 76 140 58 186 24" />
      <path className="stats-soil" d="M62 86q58-9 116 0" />
      <g className="stats-stem">
        <path d="M92 86V62" />
        <path className="stats-leaf" d="M92 72c-8-1-13-5-14-11 8 0 13 4 14 11Z" />
        <circle className="stats-bud lilac" cx="92" cy="59" r="4" />
      </g>
      <g className="stats-stem" style={{ animationDelay: '0.15s' }}>
        <path d="M120 86V46" />
        <path className="stats-leaf" d="M120 70c-9-1-15-6-16-13 9 0 15 5 16 13Z" />
        <path className="stats-leaf" d="M120 60c8-1 13-5 14-11-8 0-13 4-14 11Z" />
        <circle className="stats-bud" cx="120" cy="42" r="4.8" />
      </g>
      <g className="stats-stem" style={{ animationDelay: '0.3s' }}>
        <path d="M148 86V30" />
        <path className="stats-leaf" d="M148 68c-10-1-16-6-17-14 10 0 16 6 17 14Z" />
        <path className="stats-leaf" d="M148 54c9-1 15-6 16-13-9 0-15 5-16 13Z" />
        <circle className="stats-bud heliotrope" cx="148" cy="25" r="5.6" />
      </g>
      <path className="stats-grass" d="M66 86l-3-7M70 86l1-8M174 86l3-7M170 86l-1-8" />
    </svg>
  );
}

/** Statistics screen (docs/game-design.md §10.2): the current Season and all-time totals. */
export function Stats({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const season = t.seeds.seasonName(state.seasons + 1);

  return (
    <Dialog
      title={t.stats.title}
      closeLabel={t.stats.close}
      onClose={onClose}
      className="stats"
      header={<StatsOrnament />}
    >
      <section>
        <h3>{t.stats.seasonTitle(season)}</h3>
        <dl>
          <Row
            label={t.stats.seasonLight}
            value={formatNumber(Math.floor(state.totalLight))}
            testId="stat-season-light"
          />
          <Row label={t.stats.seasonTime} value={t.duration(state.seasonSeconds)} />
          <Row
            label={t.stats.production}
            value={t.stats.perSecond(formatNumber(lightPerSecond(state)))}
          />
          <Row label={t.stats.clickValue} value={formatNumber(clickValue(state))} />
          <Row
            label={t.stats.biodiversity}
            value={t.stats.percent(formatPercent(biodiversityBonus(state)))}
          />
        </dl>
      </section>
      <section>
        <h3>{t.stats.curveTitle}</h3>
        <ProductionCurve curves={state.history} />
      </section>
      <section>
        <h3>{t.stats.allTitle}</h3>
        <dl>
          <Row
            label={t.stats.allLight}
            value={formatNumber(Math.floor(state.allTimeLight))}
            testId="stat-all-light"
          />
          <Row label={t.stats.playTime} value={t.duration(state.playSeconds)} />
          <Row label={t.stats.clicks} value={formatNumber(Math.floor(state.clicks))} />
          <Row label={t.stats.seasons} value={formatNumber(state.seasons)} testId="stat-seasons" />
          <Row label={t.stats.seeds} value={formatNumber(state.seeds)} />
          <Row
            label={t.stats.seedBonus}
            value={t.stats.percent(formatPercent(seedBonus(state.seeds, state.sources)))}
          />
          <Row
            label={t.stats.butterflies}
            value={formatNumber(state.butterflies)}
            testId="stat-butterflies"
          />
          <Row label={t.stats.achievements} value={formatNumber(state.achievements.length)} />
          <Row
            label={t.stats.achievementBonus}
            value={t.stats.percent(formatPercent(achievementBonus(state)))}
          />
          {state.seeds > 0 && (
            <Row
              label={t.stats.talents}
              value={`${state.talents.length} / ${TALENT_LIST.length}`}
            />
          )}
          {state.allTimeWater > 0 && (
            <Row
              label={t.stats.water}
              value={formatNumber(Math.floor(state.allTimeWater))}
              testId="stat-water"
            />
          )}
          {(state.sources > 0 || state.cycles > 0) && (
            <>
              <Row label={t.stats.sources} value={formatNumber(state.sources)} />
              <Row label={t.stats.cycles} value={formatNumber(state.cycles)} />
            </>
          )}
          {state.talents.length > 0 && (
            <Row
              label={t.stats.cooperativePurchases}
              value={formatNumber(
                Object.values(state.cooperatives.purchases).reduce((sum, n) => sum + n, 0),
              )}
            />
          )}
        </dl>
      </section>
    </Dialog>
  );
}
