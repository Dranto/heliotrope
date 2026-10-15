import {
  ACHIEVEMENT_FAMILIES,
  ACHIEVEMENT_LIST,
  achievementBonus,
  type AchievementDef,
  type AchievementFamily,
} from '../game/achievements';
import { familyColour } from '../game/decor';
import { formatNumber, formatPercent } from '../game/format';
import {
  familyMilestones,
  isMilestoneFamilyComplete,
  MILESTONE_FAMILY_BONUSES,
  nextMilestone,
} from '../game/milestoneFamilies';
import { t } from '../i18n';
import { achievementDescription, achievementName } from '../i18n/achievements';
import { bonusesText } from '../i18n/restoration';
import { COROLLAS } from './decorMap';
import { Dialog } from './Dialog';
import { useGameState } from './useGame';

/** The glyph inside each Milestone badge, by family, so the families read apart at a glance. */
const GLYPHS: Record<AchievementFamily, string> = {
  light:
    'M16 12.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 1 0 0-6.4ZM16 9.5v1.6M16 20.9v1.6M9.5 16h1.6M20.9 16h1.6M11.4 11.4l1.1 1.1M19.5 19.5l1.1 1.1M11.4 20.6l1.1-1.1M19.5 12.5l1.1-1.1',
  buildings: 'M11 22v-6.2l5-4.3 5 4.3V22ZM14.6 22v-3.4h2.8V22',
  upgrades: 'M16 22V11M12 15l4-4 4 4M12.5 21.5h7',
  clicks:
    'M16 14a2 2 0 1 0 0 4 2 2 0 1 0 0-4ZM16 10.5a5.5 5.5 0 0 1 5.5 5.5M10.5 16a5.5 5.5 0 0 1 5.5-5.5',
  butterflies:
    'M16 12.5v8.5M16 15.5c-1.5-3.3-5.5-4-5.5-1.2s3 3.4 5.5 2.4M16 15.5c1.5-3.3 5.5-4 5.5-1.2s-3 3.4-5.5 2.4M16 17.6c-1.2 1.8-4 3.2-4 1.3s2.5-2 4-1.3M16 17.6c1.2 1.8 4 3.2 4 1.3s-2.5-2-4-1.3',
  neighbourhood:
    'M16 26V12M16 18c-3.5 0-6-2.2-6.5-5.5 3.5 0 6 2.2 6.5 5.5ZM16 15.5c2.8 0 4.8-1.8 5.2-4.5-2.8 0-4.8 1.8-5.2 4.5Z',
  seasons: 'M16 10.5c3 2.5 4 5.5 2.6 8.3a2.9 2.9 0 0 1-5.2 0c-1.4-2.8-.4-5.8 2.6-8.3ZM16 13.5v7',
  bioregion: 'M16 10c2.8 3.6 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.7-4.4 4.5-8Z',
};

/** The Milestone badge: a gilded disc with its family's glyph. */
function Badge({ family }: { family: AchievementFamily }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="badge">
      <circle cx="16" cy="16" r="9.5" />
      <path d={GLYPHS[family]} />
    </svg>
  );
}

function Milestone({ achievement, done }: { achievement: AchievementDef; done: boolean }) {
  const secret = achievement.hidden && !done;
  return (
    <li className="achievement" data-unlocked={done} data-hidden={secret || undefined}>
      {secret ? <span className="badge secret">?</span> : <Badge family={achievement.family} />}
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
        // Hidden Milestones are a bonus: the family is complete without them (M37).
        const counted = familyMilestones(family);
        const reached = counted.filter((a) => unlocked.has(a.id)).length;
        const complete = isMilestoneFamilyComplete(state.achievements, family);
        const colour = familyColour(family);
        const reward = bonusesText(MILESTONE_FAMILY_BONUSES[family]);
        const colourName = t.decor.colours[colour].toLowerCase();
        const next = complete ? null : nextMilestone(state, family);
        return (
          // A plain section, found by its heading: named, it would be a landmark sharing the
          // main panels' names ("Lumière", "Le quartier") in the screen reader's landmark list.
          <section key={family} className="achievement-family" data-complete={complete}>
            <h3 className="achievement-family-title">
              {t.achievements.families[family]}
              <span className="achievement-family-count">
                {complete
                  ? t.achievements.complete
                  : t.achievements.familyCount(formatNumber(reached), formatNumber(counted.length))}
              </span>
            </h3>
            <p className="achievement-family-reward">
              <span
                className="colour-dot"
                style={{ background: COROLLAS[colour][0]![1] }}
                aria-hidden="true"
              />
              {complete
                ? t.achievements.reward(reward, colourName)
                : t.achievements.toComplete(reward, colourName)}
            </p>
            {next && (
              <div className="achievement-next" data-testid={`next-${family}`}>
                <span>{t.achievements.next(achievementName(next.achievement))}</span>
                {next.progress !== null && (
                  <>
                    <span className="achievement-next-bar" aria-hidden="true">
                      <span style={{ width: `${Math.round(next.progress * 100)}%` }} />
                    </span>
                    <span className="achievement-next-percent">
                      {t.achievements.progress(formatNumber(Math.floor(next.progress * 100)))}
                    </span>
                  </>
                )}
              </div>
            )}
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
