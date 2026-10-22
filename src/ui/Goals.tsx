import { formatNumber } from '../game/format';
import { nextGoal, secondsToAfford, type Goal } from '../game/goals';
import { UPGRADES } from '../game/upgrades';
import { t } from '../i18n';
import { upgradeText } from '../i18n/upgrades';
import { useGameState } from './useGame';

/** Seconds shown rounded up, so "in 0 s" never appears before the button lights up. */
function etaText(seconds: number): string {
  return t.duration(Math.ceil(seconds));
}

/**
 * Time before a purchase, under its price (design doc §10.5). Nothing when it is affordable or
 * when nothing is produced yet. Its buy button points at it with `aria-describedby={id}`, since the
 * button's own label replaces the text inside it; hidden from the reading order, the ticking
 * count is not re-announced every second inside a live region.
 */
export function Eta({ cost, id }: { cost: number; id: string }) {
  const state = useGameState();
  const seconds = secondsToAfford(state, cost);
  if (seconds <= 0 || !Number.isFinite(seconds)) return null;
  return (
    <span className="buy-eta" id={id} aria-hidden="true">
      {t.eta(etaText(seconds))}
    </span>
  );
}

function goalName(goal: Goal): string {
  switch (goal.kind) {
    case 'generator':
      return goal.discovered ? t.generators[goal.id].name : t.unknownGenerator;
    case 'upgrade':
      return upgradeText(UPGRADES[goal.id]).name;
    case 'parcel':
      return t.restoration.parcelNames[goal.id];
    case 'project':
      return t.restoration.projectNames[goal.id];
    case 'district':
      return t.restoration.districtNames[goal.id];
  }
}

/** The next goal under the Light counter (§2 golden rule, §10.5), with its time to afford. */
export function NextGoal() {
  const state = useGameState();
  const goal = nextGoal(state);
  if (!goal) return null;
  const name = goalName(goal);
  const seconds = secondsToAfford(state, goal.cost);
  const finite = Number.isFinite(seconds);
  // With nothing produced yet there is no time to give: the Light still missing stands in for it.
  const missing = formatNumber(Math.ceil(goal.cost - state.resources.light));
  const detail = finite ? t.eta(etaText(seconds)) : t.goalMissing(missing);
  return (
    <span className="counter-goal" data-testid="next-goal" data-kind={goal.kind}>
      {/* A plain span has no role, so an aria-label on it is never read: the full sentence goes
          to screen readers as hidden text instead. */}
      <span className="visually-hidden">
        {finite ? t.nextGoalLabel(name, etaText(seconds)) : t.nextGoalMissingLabel(name, missing)}
      </span>
      <span aria-hidden="true">{t.nextGoal(name)}</span>
      <span className="counter-goal-eta" aria-hidden="true">
        {detail}
      </span>
    </span>
  );
}
