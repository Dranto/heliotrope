import { useState } from 'react';
import { formatCost, formatNumber, formatPercent } from '../game/format';
import {
  ADVISED_FIRST_SEASON_SEEDS,
  areSeedsRipe,
  canStartNewSeason,
  DEEP_SOIL_SEEDS,
  isSeasonPremature,
  lightToNextSeed,
  SEED_RIPENING_SECONDS,
  seasonRipeness,
  secondsToRipeness,
  seedBonus,
  seedsGrowing,
  seedsToGain,
  startNewSeason,
} from '../game/seasons';
import { offeredChallenges, type ChallengeId } from '../game/challenges';
import { canLearnTalent, TALENT_LIST } from '../game/talents';
import { t } from '../i18n';
import {
  challengeGoalText,
  challengeRewardText,
  challengeRulesText,
  challengeTitle,
} from '../i18n/herbier';
import { Dialog } from './Dialog';
import { SpeciesArt } from './SpeciesArt';
import { useGameState, useGameStore } from './useGame';

/** A sprouting seed under an Art nouveau arch (§10.4: arches frame the Seasons screen). */
function SeasonsOrnament() {
  return (
    <svg viewBox="0 0 240 92" className="seasons-ornament" aria-hidden="true">
      <defs>
        <linearGradient id="seasons-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6D58F" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FBF6EC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="seasons-arch-fill" d="M50 92V58a70 52 0 0 1 140 0v34Z" />
      <path className="seasons-arch" d="M50 92V58a70 52 0 0 1 140 0v34" />
      <path className="seasons-arch thin" d="M62 92V60a58 42 0 0 1 116 0v32" />
      <circle className="seasons-sun" cx="120" cy="44" r="11" />
      <path className="seasons-soil" d="M74 86q46-10 92 0" />
      <path className="seasons-stem" d="M120 84V60" />
      <path className="seasons-leaf" d="M120 70c-10-1-17-7-19-15 9 0 16 5 19 15Z" />
      <path className="seasons-leaf" d="M120 64c8-1 14-6 16-13-8 0-14 5-16 13Z" />
      <ellipse className="seasons-seed" cx="120" cy="86" rx="5" ry="3.2" />
      <path className="seasons-sprig" d="M20 86c14-4 22-14 24-28M220 86c-14-4-22-14-24-28" />
      <circle className="seasons-bud" cx="44" cy="56" r="3" />
      <circle className="seasons-bud" cx="196" cy="56" r="3" />
    </svg>
  );
}

/** Seasons screen (docs/game-design.md §7, §10.2): Seeds, bonus before/after, new Season. */
export function Seasons({ onClose, onOpenTree }: { onClose: () => void; onOpenTree: () => void }) {
  const store = useGameStore();
  const state = useGameState();
  const [confirming, setConfirming] = useState(false);
  const challenges = offeredChallenges(state);
  const [challenge, setChallenge] = useState<ChallengeId | null>(null);
  const [message, setMessage] = useState('');
  const gain = seedsToGain(state);
  const growing = seedsGrowing(state);
  const ripe = areSeedsRipe(state);
  const ripening = t.duration(Math.ceil(secondsToRipeness(state)));
  const available = canStartNewSeason(state);
  const premature = isSeasonPremature(state);

  function start() {
    store.dispatch((s) => startNewSeason(s, challenge));
    setChallenge(null);
    store.save();
    setConfirming(false);
    setMessage(t.seeds.started(t.seeds.seasonName(store.getState().seasons + 1)));
  }

  return (
    <Dialog
      title={t.seeds.title}
      closeLabel={t.seeds.close}
      onClose={onClose}
      className="seasons"
      header={<SeasonsOrnament />}
    >
      <p className="seasons-intro">{t.seeds.intro}</p>

      <dl className="seed-tiles">
        <div className="seed-tile">
          <dt>{t.seeds.owned}</dt>
          <dd>
            <strong data-testid="seeds-owned">{formatNumber(state.seeds)}</strong>
            <span>{t.seeds.ownedHint(formatPercent(seedBonus(state.seeds, state.sources)))}</span>
          </dd>
        </div>
        <div className="seed-tile gain">
          <dt>{t.seeds.toGain}</dt>
          <dd>
            <strong data-testid="seeds-gain">+{formatNumber(growing)}</strong>
            <span>{ripe ? t.seeds.toGainHint : t.seeds.toGainRipening(ripening)}</span>
          </dd>
        </div>
        <div className="seed-tile">
          <dt>{t.seeds.bonus}</dt>
          <dd>
            <strong data-testid="seeds-bonus">
              {t.stats.percent(formatPercent(seedBonus(state.seeds, state.sources)))} →{' '}
              {t.stats.percent(formatPercent(seedBonus(state.seeds + gain, state.sources)))}
            </strong>
            <span>{t.seeds.bonusAfter}</span>
          </dd>
        </div>
      </dl>

      <p className="seeds-ripening" data-ripe={ripe}>
        <span
          className="challenge-meter"
          role="progressbar"
          aria-label={t.seeds.ripeness(formatPercent(seasonRipeness(state)))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(seasonRipeness(state) * 100)}
        >
          <span style={{ width: `${seasonRipeness(state) * 100}%` }} />
        </span>
        {ripe ? t.seeds.ripe : t.seeds.ripening(ripening)}
      </p>

      <p className="hint">
        {t.seeds.nextSeed(formatCost(lightToNextSeed(state)))}{' '}
        {t.seeds.formula(t.duration(SEED_RIPENING_SECONDS), formatNumber(DEEP_SOIL_SEEDS))}
      </p>

      {premature && available && (
        <div className="advice" role="note">
          <h3>{t.seeds.notReadyTitle}</h3>
          <p>{t.seeds.notReady(formatNumber(ADVISED_FIRST_SEASON_SEEDS))}</p>
        </div>
      )}

      <div className="season-ledger">
        <section>
          <h3>{t.seeds.lostTitle}</h3>
          <ul>
            {t.seeds.lost.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>{t.seeds.keptTitle}</h3>
          <ul className="kept">
            {t.seeds.kept.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <p className="options-message" role="status">
        {message}
      </p>

      {TALENT_LIST.some((talent) => canLearnTalent(state, talent.id)) && (
        <button type="button" className="tree-link" onClick={onOpenTree}>
          {t.tree.fromSeasons}
        </button>
      )}

      {challenges.length > 0 && available && (
        <fieldset className="challenge-choice">
          <legend>{t.challenges.title}</legend>
          <p className="hint">{t.challenges.hint}</p>
          <label className="challenge-option">
            <input
              type="radio"
              name="challenge"
              checked={challenge === null}
              onChange={() => setChallenge(null)}
            />
            <span aria-hidden="true" />
            <span>
              <strong>{t.challenges.free}</strong>
              <span>{t.challenges.freeHint}</span>
            </span>
          </label>
          {challenges.map((c) => (
            <label key={c.id} className="challenge-option" data-challenge={c.id}>
              <input
                type="radio"
                name="challenge"
                checked={challenge === c.id}
                onChange={() => setChallenge(c.id)}
              />
              <SpeciesArt id={c.species} />
              <span>
                <strong>{challengeTitle(c.id)}</strong>
                <span>{challengeRulesText(c)}</span>
                <span>{challengeGoalText(c)}</span>
                <span className="challenge-reward">{challengeRewardText(c.id)}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {!available && growing === 0 && <p className="hint">{t.seeds.noSeedYet}</p>}
      {confirming && available ? (
        <div className="confirm-row">
          <span>{t.seeds.confirm(formatNumber(gain))}</span>
          <button type="button" className="season-button" onClick={start}>
            {challenge ? t.challenges.startWith(t.challenges.names[challenge]) : t.seeds.confirmYes}
          </button>
          <button type="button" className="ghost" onClick={() => setConfirming(false)}>
            {t.seeds.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="season-button"
          disabled={!available}
          onClick={() => {
            setMessage('');
            setConfirming(true);
          }}
        >
          {t.seeds.start}
        </button>
      )}
    </Dialog>
  );
}
