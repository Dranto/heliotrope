import { achievementBonus } from '../game/achievements';
import { formatNumber, formatPercent } from '../game/format';
import { biodiversityBonus, clickValue, lightPerSecond } from '../game/production';
import { seedBonus } from '../game/seasons';
import { TALENT_LIST } from '../game/talents';
import { t } from '../i18n';
import { Dialog } from './Dialog';
import { useGameState } from './useGame';

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="stat-row">
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}

/** Statistics screen (docs/game-design.md §10.2): the current Season and all-time totals. */
export function Stats({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const season = t.seeds.seasonName(state.seasons + 1);

  return (
    <Dialog title={t.stats.title} closeLabel={t.stats.close} onClose={onClose} className="stats">
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
            value={t.stats.percent(formatPercent(seedBonus(state.seeds)))}
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
