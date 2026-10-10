import { useState } from 'react';
import {
  ADVISED_FIRST_CYCLE_SOURCES,
  canStartNewCycle,
  isCyclePremature,
  sourceBonus,
  sourcesToGain,
  startNewCycle,
  waterToNextSource,
} from '../game/cycles';
import { formatCost, formatNumber, formatPercent } from '../game/format';
import { t } from '../i18n';
import { Dialog } from './Dialog';
import { useGameState, useGameStore } from './useGame';

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

/**
 * The Water Cycle screen (docs/game-design.md §7.4): the second prestige. Sources owned and to
 * gain, the bonus before and after, what is reset and what stays.
 */
export function Cycles({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const state = useGameState();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const gain = sourcesToGain(state);
  const available = canStartNewCycle(state);
  const premature = isCyclePremature(state);

  function start() {
    store.dispatch((s) => startNewCycle(s));
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
            <strong>
              {t.stats.percent(formatPercent(sourceBonus(state.sources)))} →{' '}
              {t.stats.percent(formatPercent(sourceBonus(state.sources + gain)))}
            </strong>
            <span>{t.cycles.bonusAfter}</span>
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

      <p className="options-message" role="status">
        {message}
      </p>

      {!available && <p className="hint">{t.cycles.noSourceYet}</p>}
      {confirming && available ? (
        <div className="confirm-row">
          <span>{t.cycles.confirm(formatNumber(gain))}</span>
          <button type="button" className="season-button cycle-button" onClick={start}>
            {t.cycles.confirmYes}
          </button>
          <button type="button" className="ghost" onClick={() => setConfirming(false)}>
            {t.cycles.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="season-button cycle-button"
          disabled={!available}
          onClick={() => {
            setMessage('');
            setConfirming(true);
          }}
        >
          {t.cycles.start}
        </button>
      )}
    </Dialog>
  );
}
