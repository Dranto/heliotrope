// The gifts of the Milestones (docs/game-design.md §9.16, M37): each Milestone reached leaves a
// small laurel parcel at the foot of the heliotrope, gathered with a click for its family's gift.
import { gatherMilestoneGifts } from '../game/milestoneFamilies';
import { formatNumber } from '../game/format';
import { t } from '../i18n';
import { useGameState, useGameStore } from './useGame';

export function MilestoneGifts({ left, top }: { left: number; top: number }) {
  const store = useGameStore();
  const gifts = useGameState().milestoneGifts;
  if (gifts.length === 0) return null;
  return (
    <button
      type="button"
      className="milestone-gift"
      style={{ left, top }}
      data-gift={gifts[0]}
      aria-label={t.achievements.gather(formatNumber(gifts.length))}
      title={t.achievements.gather(formatNumber(gifts.length))}
      onClick={() => store.dispatch(gatherMilestoneGifts)}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle className="gift-halo" cx="16" cy="16" r="15" />
        <circle className="gift-disc" cx="16" cy="16" r="9" />
        <path
          className="gift-laurel"
          d="M16 25V11M16 17c-3.4 0-5.8-2-6.2-5.2 3.4 0 5.8 2 6.2 5.2ZM16 14.6c2.6 0 4.6-1.6 5-4.2-2.6 0-4.6 1.6-5 4.2ZM16 21c2.8 0 4.8-1.6 5.2-4.2-2.8 0-4.8 1.6-5.2 4.2Z"
        />
      </svg>
      {gifts.length > 1 && <span className="gift-count">{formatNumber(gifts.length)}</span>}
    </button>
  );
}
