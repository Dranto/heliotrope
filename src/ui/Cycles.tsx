import { useState } from 'react';
import { offeredCycleChallenges, type CycleChallengeId } from '../game/cycleChallenges';
import {
  ADVISED_FIRST_CYCLE_SOURCES,
  canStartNewCycle,
  isCyclePremature,
  sourceBonus,
  sourcesToGain,
  startNewCycle,
  waterToNextSource,
} from '../game/cycles';
import {
  availableSources,
  canOpenArm,
  canWidenArm,
  DELTA,
  DELTA_IDS,
  isArmOpen,
  isDeltaOpen,
  keptByMemory,
  LOCK_FACTORS,
  memoryShare,
  nextArmCost,
  nextWidenCost,
  openArm,
  ripeningFor,
  setLockFactor,
  WIDE_ARM_IDS,
  widenArm,
  widenFactor,
  WIDEN_MAX,
  type DeltaId,
  type WideArmId,
} from '../game/delta';
import { formatCost, formatDecimal, formatNumber, formatPercent } from '../game/format';
import type { GameState } from '../game/state';
import { t } from '../i18n';
import {
  cycleChallengeGoalText,
  cycleChallengeRewardText,
  cycleChallengeRulesText,
  cycleChallengeTitle,
} from '../i18n/herbier';
import { Dialog } from './Dialog';
import { SpeciesArt } from './SpeciesArt';
import { useGameState, useGameStore } from './useGame';
import './delta.css';

/** A spring rising under the arch, its rings spreading on the water (§10.4). */
function CycleOrnament() {
  return (
    <svg viewBox="0 0 240 92" className="seasons-ornament cycle-ornament" aria-hidden="true">
      <defs>
        <linearGradient id="cycle-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFE3E6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FBF6EC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="seasons-arch-fill" d="M50 92V58a70 52 0 0 1 140 0v34Z" />
      <path className="seasons-arch" d="M50 92V58a70 52 0 0 1 140 0v34" />
      <path className="seasons-arch thin" d="M62 92V60a58 42 0 0 1 116 0v32" />
      <path className="cycle-drop" d="M120 30c-5 7-9 12-9 17a9 9 0 0 0 18 0c0-5-4-10-9-17Z" />
      <ellipse className="cycle-ring" cx="120" cy="80" rx="16" ry="4" />
      <ellipse className="cycle-ring outer" cx="120" cy="80" rx="34" ry="8" />
      <path className="cycle-wave" d="M66 86q9-4 18 0t18 0 18 0 18 0 18 0 18 0" />
      <path className="seasons-sprig" d="M20 86c14-4 22-14 24-28M220 86c-14-4-22-14-24-28" />
      <circle className="seasons-bud" cx="44" cy="56" r="3" />
      <circle className="seasons-bud" cx="196" cy="56" r="3" />
    </svg>
  );
}

/** Where each arm of the delta ends in its drawing, from west to east. */
const ARM_ENDS: Record<DeltaId, number> = {
  hillsArm: 28,
  floodArm: 74,
  seedArm: 120,
  memoryArm: 166,
  lockKeeper: 212,
};

/**
 * The delta (§7.5): the river comes down under the arch and fans out into five arms; an open
 * arm runs with water and ends in a pool, a closed one is a dry dotted bed.
 */
function DeltaArt({ state }: { state: GameState }) {
  return (
    <svg viewBox="0 0 240 104" className="delta-art" aria-hidden="true">
      <path className="delta-bank" d="M120 0V30" />
      <path className="delta-water open" d="M120 0V30" />
      {DELTA_IDS.map((id) => {
        const x = ARM_ENDS[id];
        const d = `M120 30C120 58 ${x} 56 ${x} 92`;
        const level = state.delta.levels[id];
        const open = level > 0;
        const full = level >= DELTA[id].costs.length;
        // A widened arm (M19) runs broader and its pool grows.
        const width = isWideArm(id) ? state.delta.widths[id] : 0;
        return (
          <g key={id} data-arm={id} data-open={open} data-width={width}>
            <path className="delta-bank" d={d} style={{ strokeWidth: 9 + width * 0.6 }} />
            <path
              className={`delta-water${open ? ' open' : ''}`}
              d={d}
              style={open ? { strokeWidth: 4.5 + width * 0.45 } : undefined}
            />
            <ellipse
              className={`delta-pool${open ? ' open' : ''}${full ? ' full' : ''}`}
              cx={x}
              cy="95"
              rx={9 + width * 0.5}
              ry={5 + width * 0.25}
            />
          </g>
        );
      })}
    </svg>
  );
}

function isWideArm(id: DeltaId): id is WideArmId {
  return (WIDE_ARM_IDS as readonly DeltaId[]).includes(id);
}

function armEffect(id: DeltaId, level: number): string {
  const effects = t.cycles.delta.effects;
  if (id === 'seedArm') return effects.seedArm(t.duration(ripeningFor(level, 0)));
  return effects[id];
}

/** What a widened arm does at `width` (M19). */
function widthEffect(state: GameState, id: WideArmId, width: number): string {
  const effects = t.cycles.delta.widen.effects;
  switch (id) {
    case 'seedArm':
      return effects.seedArm(t.duration(ripeningFor(state.delta.levels.seedArm, width)));
    case 'memoryArm':
      return effects.memoryArm(formatPercent(memoryShare(width)));
    case 'hillsArm':
      return effects.hillsArm(formatPercent(widenFactor(width) - 1));
    case 'floodArm':
      return effects.floodArm(formatPercent(widenFactor(width) - 1));
  }
}

/** Once the whole delta is open, an arm widens level by level (M19). */
function Widening({
  state,
  id,
  onWiden,
}: {
  state: GameState;
  id: WideArmId;
  onWiden: (id: WideArmId) => void;
}) {
  const width = state.delta.widths[id];
  const cost = nextWidenCost(state, id);
  const name = t.cycles.delta.names[id];
  if (cost === null && width === 0) return null;
  return (
    <div className="delta-widen" data-width={width}>
      <div>
        <span className="delta-level">
          {t.cycles.delta.widen.level(formatNumber(width), formatNumber(WIDEN_MAX))}
        </span>
        <p className="delta-effect">{widthEffect(state, id, cost === null ? width : width + 1)}</p>
      </div>
      {cost === null ? (
        <span className="delta-opened">{t.cycles.delta.widen.full}</span>
      ) : (
        <button
          type="button"
          className="buy delta-open"
          disabled={!canWidenArm(state, id)}
          aria-label={t.cycles.delta.widen.label(name, formatNumber(cost))}
          onClick={() => onWiden(id)}
        >
          <span className="buy-verb">{t.cycles.delta.widen.verb}</span>
          <span className="buy-cost">{t.cycles.delta.cost(formatNumber(cost))}</span>
        </button>
      )}
    </div>
  );
}

/** The arms of the delta (§7.5), opened with the Sources not yet spent. */
function Delta({
  state,
  onOpen,
  onWiden,
}: {
  state: GameState;
  onOpen: (id: DeltaId) => void;
  onWiden: (id: WideArmId) => void;
}) {
  return (
    <section className="delta" aria-labelledby="delta-title">
      <h3 id="delta-title">{t.cycles.delta.title}</h3>
      <p className="hint">
        {t.cycles.delta.hint}{' '}
        <strong data-testid="sources-available">
          {t.cycles.delta.available(formatNumber(availableSources(state)))}
        </strong>
      </p>
      <DeltaArt state={state} />
      <ul className="delta-list">
        {DELTA_IDS.map((id) => {
          const level = state.delta.levels[id];
          const max = DELTA[id].costs.length;
          const cost = nextArmCost(state, id);
          const name = t.cycles.delta.names[id];
          return (
            <li key={id} className="delta-item" data-arm={id} data-level={level}>
              <div>
                <h4>{name}</h4>
                {max > 1 && (
                  <span className="delta-level">
                    {t.cycles.delta.level(formatNumber(level), formatNumber(max))}
                  </span>
                )}
                <p className="delta-effect">{armEffect(id, cost === null ? level : level + 1)}</p>
              </div>
              {cost === null ? (
                <span className="delta-opened">{t.cycles.delta.opened}</span>
              ) : (
                <button
                  type="button"
                  className="buy delta-open"
                  disabled={!canOpenArm(state, id)}
                  aria-label={t.cycles.delta.openLabel(name, formatNumber(cost))}
                  onClick={() => onOpen(id)}
                >
                  <span className="buy-verb">{t.cycles.delta.open}</span>
                  <span className="buy-cost">{t.cycles.delta.cost(formatNumber(cost))}</span>
                </button>
              )}
              {isWideArm(id) && <Widening state={state} id={id} onWiden={onWiden} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The Water Cycle screen (docs/game-design.md §7.4): the second prestige. Sources owned and to
 * gain, the bonus before and after, what is reset and what stays; then the delta (§7.5), the lock
 * keeper's setting and the choice of a challenge Cycle.
 */
export function Cycles({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const state = useGameState();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  // A tap on the blocked start button stresses the line that says why, rather than repeat it.
  const [stressed, setStressed] = useState(false);
  const challenges = offeredCycleChallenges(state);
  const [challenge, setChallenge] = useState<CycleChallengeId | null>(null);
  const gain = sourcesToGain(state);
  const available = canStartNewCycle(state);
  const premature = isCyclePremature(state);

  function start() {
    store.dispatch((s) => startNewCycle(s, challenge));
    setChallenge(null);
    store.save();
    setConfirming(false);
    setMessage(t.cycles.started);
  }

  return (
    <Dialog
      title={t.cycles.title}
      closeLabel={t.cycles.close}
      onClose={onClose}
      className="seasons cycles"
      header={<CycleOrnament />}
    >
      <p className="seasons-intro">{t.cycles.intro}</p>

      <dl className="seed-tiles">
        <div className="seed-tile">
          <dt>{t.cycles.owned}</dt>
          <dd>
            <strong data-testid="sources-owned">{formatNumber(state.sources)}</strong>
            <span>{t.cycles.ownedHint(formatPercent(sourceBonus(state.sources)))}</span>
          </dd>
        </div>
        <div className="seed-tile gain">
          <dt>{t.cycles.toGain}</dt>
          <dd>
            <strong data-testid="sources-gain">+{formatNumber(gain)}</strong>
            <span>{t.cycles.toGainHint}</span>
          </dd>
        </div>
        <div className="seed-tile">
          <dt>{t.cycles.bonus}</dt>
          <dd>
            {/* No arrow to the same number while no Source is in reach (as in the Seasons). */}
            <strong data-testid="sources-bonus">
              {t.stats.percent(formatPercent(sourceBonus(state.sources)))}
              {gain > 0 &&
                ` → ${t.stats.percent(formatPercent(sourceBonus(state.sources + gain)))}`}
            </strong>
            <span>{gain > 0 ? t.cycles.bonusAfter : t.cycles.bonusSame}</span>
          </dd>
        </div>
      </dl>

      <p className="hint">
        {t.cycles.nextSource(formatCost(waterToNextSource(state)))} {t.cycles.formula}
      </p>

      {premature && available && (
        <div className="advice" role="note">
          <h3>{t.cycles.notReadyTitle}</h3>
          <p>{t.cycles.notReady(formatNumber(ADVISED_FIRST_CYCLE_SOURCES))}</p>
        </div>
      )}

      <div className="season-ledger">
        <section>
          <h3>{t.seeds.lostTitle}</h3>
          <ul>
            {t.cycles.lost.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>{t.seeds.keptTitle}</h3>
          <ul className="kept">
            {t.cycles.kept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {isArmOpen(state, 'memoryArm') && (
        <p className="hint">{t.cycles.memoryKept(formatPercent(keptByMemory(state)))}</p>
      )}

      <p className="options-message" role="status">
        {message}
      </p>

      {isDeltaOpen(state) && (
        <Delta
          state={state}
          onOpen={(id) => store.dispatch((s) => openArm(s, id))}
          onWiden={(id) => store.dispatch((s) => widenArm(s, id))}
        />
      )}

      {isArmOpen(state, 'lockKeeper') && (
        <fieldset className="sower-choice lock-choice">
          <legend>{t.cycles.lockKeeper.title}</legend>
          <p className="hint">{t.cycles.lockKeeper.hint}</p>
          <div className="sower-options">
            {[0, ...LOCK_FACTORS].map((factor) => (
              <label key={factor} className="sower-option">
                <input
                  type="radio"
                  name="lock-keeper"
                  checked={state.delta.lockFactor === factor}
                  onChange={() => store.dispatch((s) => setLockFactor(s, factor))}
                />
                <span>
                  {factor === 0
                    ? t.cycles.lockKeeper.off
                    : t.cycles.lockKeeper.factor(formatDecimal(factor))}
                </span>
              </label>
            ))}
          </div>
          {state.delta.lockCycles > 0 && (
            <p className="hint">
              {t.cycles.lockKeeper.started(formatNumber(state.delta.lockCycles))}
            </p>
          )}
        </fieldset>
      )}

      {challenges.length > 0 && available && (
        <fieldset className="challenge-choice">
          <legend>{t.cycleChallenges.title}</legend>
          <p className="hint">{t.cycleChallenges.hint}</p>
          <label className="challenge-option">
            <input
              type="radio"
              name="cycle-challenge"
              checked={challenge === null}
              onChange={() => setChallenge(null)}
            />
            <span aria-hidden="true" />
            <span>
              <strong>{t.cycleChallenges.free}</strong>
              <span>{t.cycleChallenges.freeHint}</span>
            </span>
          </label>
          {challenges.map((c) => (
            <label key={c.id} className="challenge-option" data-challenge={c.id}>
              <input
                type="radio"
                name="cycle-challenge"
                checked={challenge === c.id}
                onChange={() => setChallenge(c.id)}
              />
              <SpeciesArt id={c.species} />
              <span>
                <strong>{cycleChallengeTitle(c.id)}</strong>
                <span>{cycleChallengeRulesText(c)}</span>
                <span>{cycleChallengeGoalText(c)}</span>
                <span className="challenge-reward">{cycleChallengeRewardText(c.id)}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {!available && (
        <p className="hint start-blocked" id="cycle-blocked" data-stressed={stressed || undefined}>
          {t.cycles.noSourceYet}
        </p>
      )}
      {/* The start button stays in view at the foot of the dialog while the player reads. */}
      <div className="prestige-actions">
        {confirming && available ? (
          <div className="confirm-row">
            <span>{t.cycles.confirm(formatNumber(gain))}</span>
            <button type="button" className="season-button cycle-button" onClick={start}>
              {challenge
                ? t.cycleChallenges.startWith(t.cycleChallenges.names[challenge])
                : t.cycles.confirmYes}
            </button>
            <button type="button" className="ghost" onClick={() => setConfirming(false)}>
              {t.cycles.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="season-button cycle-button"
            // Still focusable and tappable while blocked, so a tap points to why (as in the Seasons).
            aria-disabled={!available}
            aria-describedby={available ? undefined : 'cycle-blocked'}
            onClick={() => {
              if (!available) {
                setStressed(true);
                return;
              }
              setMessage('');
              setConfirming(true);
            }}
          >
            {t.cycles.start}
          </button>
        )}
      </div>
    </Dialog>
  );
}
