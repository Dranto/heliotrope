import { ACHIEVEMENTS } from '../game/achievements';
import { achievementName } from '../i18n/achievements';
import { BOND_BONUS, BOND_MAX } from '../game/bonds';
import { DISTRICT_IDS } from '../game/districts';
import { formatPercent } from '../game/format';
import {
  areRequestsOpen,
  canPlayHand,
  canServe,
  declineRequest,
  isRequestMet,
  handLimit,
  playHand,
  requestProgress,
  serveRequest,
  type Need,
} from '../game/requests';
import { t } from '../i18n';
import { usePanelOpen } from './layoutPrefs';
import { PanelTitle } from './PanelTitle';
import { RequestIcon } from './RequestArt';
import { useGameState, useGameStore } from './useGame';

function needText(need: Need): string {
  switch (need.kind) {
    case 'owned':
      return t.requests.needs.owned(need.count, t.generators[need.generator].name);
    case 'greet':
      return t.requests.needs.greet(t.herbier.names[need.species]);
    case 'milestone':
      return t.requests.needs.milestone(achievementName(ACHIEVEMENTS[need.id]));
    default:
      return t.requests.needs[need.kind](need.count);
  }
}

/**
 * The neighbours' requests (docs/game-design.md §9.11): what each one asks for and how far it
 * is, the hand it offers, the buttons to serve or decline it, the hands in reserve and the bonds.
 */
export function Requests() {
  const store = useGameStore();
  const state = useGameState();
  const [open, toggle] = usePanelOpen('requests');
  if (!areRequestsOpen(state)) return null;
  const { requests } = state;
  const full = requests.hands.length >= handLimit(state);
  const bonds = DISTRICT_IDS.filter((id) => (requests.bonds[id] ?? 0) > 0);

  return (
    <section className="panel requests-panel" aria-labelledby="requests-title" data-open={open}>
      <PanelTitle id="requests-title" open={open} onToggle={toggle}>
        {t.requests.title}
      </PanelTitle>
      <p className="hint">{t.requests.hint}</p>
      {requests.open.length === 0 ? (
        <p className="hint">{t.requests.waiting}</p>
      ) : (
        <ul className="request-list">
          {requests.open.map((request, i) => {
            const need = needText(request.need);
            const met = isRequestMet(state, request);
            const blocked = met && full;
            return (
              <li key={i} className="request-card" data-met={met || undefined}>
                <RequestIcon kind={request.need.kind} />
                <span className="request-need">{need}</span>
                <span className="request-meta">
                  <span className="request-progress">
                    {requestProgress(state, request)}/{request.need.count}
                  </span>
                  <span>{t.requests.offers(t.requests.hands[request.hand])}</span>
                  {request.from && (
                    <span>{t.requests.from(t.restoration.districtNames[request.from])}</span>
                  )}
                </span>
                {blocked && (
                  <p className="request-blocked" id={`request-blocked-${i}`}>
                    {t.requests.reserveFull}
                  </p>
                )}
                <span className="request-actions">
                  <button
                    type="button"
                    className="ghost"
                    aria-label={t.requests.declineLabel(need)}
                    onClick={() => store.dispatch((s) => declineRequest(s, i))}
                  >
                    {t.requests.decline}
                  </button>
                  <button
                    type="button"
                    className="buy"
                    disabled={!canServe(state, i)}
                    aria-describedby={blocked ? `request-blocked-${i}` : undefined}
                    aria-label={t.requests.serveLabel(need)}
                    onClick={() => store.dispatch((s) => serveRequest(s, i))}
                  >
                    {t.requests.serve}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <h3 className="requests-sub">
        {t.requests.reserve} · {requests.hands.length}/{handLimit(state)}
      </h3>
      {requests.hands.length === 0 ? (
        <p className="hint">{t.requests.reserveEmpty}</p>
      ) : (
        <ul className="hand-list">
          {requests.hands.map((hand, i) => {
            // A hand that cannot be played yet says what it waits for, on phones too.
            const wait = canPlayHand(state, i) ? undefined : t.requests.handWaits[hand];
            return (
              <li key={i} className="hand-card" data-hand={hand}>
                <RequestIcon kind={hand} />
                <span className="hand-text">
                  {t.requests.hands[hand]}
                  {wait && (
                    <span className="hand-wait" id={`hand-wait-${i}`}>
                      {wait}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="buy"
                  disabled={!canPlayHand(state, i)}
                  aria-label={t.requests.playLabel(t.requests.hands[hand])}
                  aria-describedby={wait ? `hand-wait-${i}` : undefined}
                  onClick={() => store.dispatch((s) => playHand(s, i))}
                >
                  {t.requests.play}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {bonds.length > 0 && (
        <ul className="request-bonds">
          {bonds.map((id) => (
            <li key={id}>
              {t.requests.bond(
                t.restoration.districtNames[id],
                formatPercent(BOND_BONUS * Math.min(BOND_MAX, requests.bonds[id]!)),
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
