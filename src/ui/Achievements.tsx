import { ACHIEVEMENT_LIST, achievementBonus } from '../game/achievements';
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

/**
 * Milestones screen (docs/game-design.md §9.3, §10.2): unlocked ones in colour, the others
 * greyed with their goal, hidden ones as "?".
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
      <ul className="achievement-grid">
        {ACHIEVEMENT_LIST.map((achievement) => {
          const done = unlocked.has(achievement.id);
          const secret = achievement.hidden && !done;
          return (
            <li
              key={achievement.id}
              className="achievement"
              data-unlocked={done}
              data-hidden={secret || undefined}
            >
              {secret ? <span className="badge secret">?</span> : <Badge />}
              <div>
                <h3>{secret ? t.achievements.hiddenName : achievementName(achievement)}</h3>
                <p>{secret ? '?' : achievementDescription(achievement)}</p>
              </div>
              <span className="visually-hidden">{done ? '' : ` (${t.achievements.locked})`}</span>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
