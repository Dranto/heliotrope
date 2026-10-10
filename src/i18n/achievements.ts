// Display texts of a Milestone, resolved from its id and condition.
import type { AchievementDef } from '../game/achievements';
import { formatNumber } from '../game/format';
import { t } from './fr';

/** Round thresholds read better without decimals: "1 M" rather than "1,00 M". */
function round(value: number): string {
  return formatNumber(value).replace(/,00(?=\s)/, '');
}

export function achievementName(achievement: AchievementDef): string {
  return t.achievements.names[achievement.id];
}

export function achievementDescription({ id, condition }: AchievementDef): string {
  const describe = t.achievements.describe;
  switch (condition.kind) {
    case 'allTimeLight':
      return describe.allTimeLight(round(condition.amount));
    case 'owned':
      return describe.owned(t.generators[condition.generator].name, condition.count);
    case 'clicks':
      return describe.clicks(round(condition.count));
    case 'butterflies':
      return describe.butterflies(condition.count);
    case 'seasons':
      return describe.seasons(condition.count);
    case 'everyGenerator':
      return describe.everyGenerator(condition.count);
    case 'idle':
      return describe.idle;
    case 'action':
      return id === 'earlySowing' ? describe.earlySowing : '';
  }
}
