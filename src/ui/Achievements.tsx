import {
  ACHIEVEMENT_FAMILIES,
  ACHIEVEMENT_LIST,
  achievementBonus,
  type AchievementDef,
} from '../game/achievements';
import { formatNumber, formatPercent } from '../game/format';
import { t } from '../i18n/fr';
import { achievementDescription, achievementName } from '../i18n/achievements';
import { Dialog } from './Dialog';
import { useGameState } from './useGame';

/** A small laurel sprig: the Milestone badge. */
function Badge() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="badge">
      <circle cx="16" cy="16" r="9.5" />
      <path d="M16 26V12M16 18c-3.5 0-6-2.2-6.5-5.5 3.5 0 6 2.2 6.5 5.5ZM16 15.5c2.8 0 4.8-1.8 5.2-4.5-2.8 0-4.8 1.8-5.2 4.5Z" />
    </svg>
  );
}

function Milestone({ achievement, done }: { achievement: AchievementDef; done: boolean }) {
  const secret = achievement.hidden && !done;
  return (
    <li className="achievement" data-unlocked={done} data-hidden={secret || undefined}>
      {secret ? <span className="badge secret">?</span> : <Badge />}
      <div>
        <h4>{secret ? t.achievements.hiddenName : achievementName(achievement)}</h4>
        <p>{secret ? '?' : achievementDescription(achievement)}</p>
      </div>
      <span className="visually-hidden">{done ? '' : ` (${t.achievements.locked})`}</span>
    </li>
  );
}

/**
 * Milestones screen (docs/game-design.md §9.3, §10.2): unlocked ones in colour, the others
 * greyed with their goal, hidden ones as "?", grouped by family.
 */
export function Achievements({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const unlocked = new Set(state.achievements);

  return (
    <Dialog
      title={t.achievements.title}
      closeLabel={t.achievements.close}
      onClose={onClose}
      className="achievements"
    >
      <p className="achievements-summary" data-testid="achievements-summary">
        {t.achievements.summary(
          formatNumber(unlocked.size),
          formatNumber(ACHIEVEMENT_LIST.length),
          formatPercent(achievementBonus(state)),
        )}
      </p>
      <p className="hint">{t.achievements.hint}</p>
      {ACHIEVEMENT_FAMILIES.map((family) => {
        const members = ACHIEVEMENT_LIST.filter((a) => a.family === family);
        const reached = members.filter((a) => unlocked.has(a.id)).length;
        return (
          <section
            key={family}
            className="achievement-family"
            aria-label={t.achievements.families[family]}
          >
            <h3 className="achievement-family-title">
              {t.achievements.families[family]}
              <span className="achievement-family-count">
                {t.achievements.familyCount(formatNumber(reached), formatNumber(members.length))}
              </span>
            </h3>
            <ul className="achievement-grid">
              {members.map((achievement) => (
                <Milestone
                  key={achievement.id}
                  achievement={achievement}
                  done={unlocked.has(achievement.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </Dialog>
  );
}
