// The tools over the map (docs/game-design.md §6.5): decorating the neighbourhood, and the photo
// mode that hides the game around the map to save a picture of it.
import { useState } from 'react';
import {
  DECOR_CONDITIONS,
  DECOR_IDS,
  FLOWER_COLOURS,
  FLOWER_CONDITIONS,
  isDecorUnlocked,
  isFlowerColourUnlocked,
  setFlowerColour,
  type DecorCondition,
  type FlowerColour,
} from '../game/decor';
import { VISUAL_SEASONS, type VisualSeason } from '../game/phases';
import { t } from '../i18n';
import type { Daylight } from './daylight';
import { DecorIcon } from './DecorArt';
import { COROLLAS } from './decorMap';
import { downloadPhoto, takePhoto } from './photo';
import { useGameState, useGameStore } from './useGame';

function conditionText(condition: DecorCondition): string {
  switch (condition.kind) {
    case 'achievements':
      return t.decor.achievements(condition.count);
    case 'species':
      return t.decor.species(condition.count);
    case 'milestoneFamily':
      return t.decor.milestoneFamily(t.achievements.families[condition.family]);
  }
}

/** While decorating: the pieces won and to win, and the colour of the heliotrope. */
export function DecorToolbar({ onDone }: { onDone: () => void }) {
  const store = useGameStore();
  const state = useGameState();
  // A colour still to win is told on a tap, since a title never shows on a phone.
  const [toWin, setToWin] = useState<FlowerColour | null>(null);
  const toWinCondition = toWin && FLOWER_CONDITIONS[toWin];
  return (
    <section className="map-toolbar decor-toolbar" aria-labelledby="decor-title">
      <h3 id="decor-title">{t.decor.title}</h3>
      <p className="hint">{t.decor.hint}</p>
      <ul className="decor-pieces">
        {DECOR_IDS.map((id) => {
          const won = isDecorUnlocked(state, id);
          return (
            <li
              key={id}
              data-won={won}
              title={won ? undefined : conditionText(DECOR_CONDITIONS[id])}
            >
              <DecorIcon id={id} />
              {t.decor.names[id]}
              {!won && ` · ${conditionText(DECOR_CONDITIONS[id])}`}
            </li>
          );
        })}
      </ul>
      <div className="toolbar-row" role="radiogroup" aria-label={t.decor.flowerTitle}>
        <span>{t.decor.flowerTitle}</span>
        {FLOWER_COLOURS.map((colour) => {
          const won = isFlowerColourUnlocked(state, colour);
          const condition = FLOWER_CONDITIONS[colour];
          return (
            <button
              key={colour}
              type="button"
              role="radio"
              className="toolbar-pill"
              aria-checked={state.decor.flower === colour}
              aria-disabled={!won}
              title={!won && condition ? conditionText(condition) : undefined}
              onClick={() => {
                if (won) {
                  setToWin(null);
                  store.dispatch((s) => setFlowerColour(s, colour));
                } else setToWin(colour);
              }}
            >
              <span className="colour-dot" style={{ background: COROLLAS[colour][0]![1] }} />
              {t.decor.colours[colour]}
            </button>
          );
        })}
      </div>
      <p className="hint colour-to-win" aria-live="polite">
        {toWin &&
          toWinCondition &&
          t.decor.colourToWin(t.decor.colours[toWin], conditionText(toWinCondition))}
      </p>
      <div className="toolbar-actions">
        <button type="button" className="season-button" onClick={onDone}>
          {t.decor.done}
        </button>
      </div>
    </section>
  );
}

export interface PhotoLook {
  daylight: Daylight;
  season: VisualSeason;
}

/** In the photo mode: the time of day and the season of the scene, then the picture itself. */
export function PhotoToolbar({
  look,
  onLook,
  map,
  onClose,
}: {
  look: PhotoLook;
  onLook: (look: PhotoLook) => void;
  /** The map element the picture is taken from. */
  map: () => HTMLElement | null;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    const element = map();
    setBusy(true);
    setMessage('');
    const blob = element ? await takePhoto(element).catch(() => null) : null;
    setBusy(false);
    if (!blob) {
      setMessage(t.photo.failed);
      return;
    }
    downloadPhoto(blob, t.photo.fileName);
    setMessage(t.photo.saved);
  }
  return (
    <section className="map-toolbar photo-toolbar" aria-label={t.photo.title}>
      <div className="toolbar-row" role="radiogroup" aria-label={t.photo.daylight}>
        <span>{t.photo.daylight}</span>
        {(['day', 'evening', 'night'] as const).map((daylight) => (
          <button
            key={daylight}
            type="button"
            role="radio"
            className="toolbar-pill"
            aria-checked={look.daylight === daylight}
            onClick={() => onLook({ ...look, daylight })}
          >
            {t.photo.daylights[daylight]}
          </button>
        ))}
      </div>
      <div className="toolbar-row" role="radiogroup" aria-label={t.photo.season}>
        <span>{t.photo.season}</span>
        {VISUAL_SEASONS.map((season) => (
          <button
            key={season}
            type="button"
            role="radio"
            className="toolbar-pill"
            aria-checked={look.season === season}
            onClick={() => onLook({ ...look, season })}
          >
            {t.visualSeasons[season]}
          </button>
        ))}
      </div>
      <div className="toolbar-actions">
        <span className="options-message" role="status">
          {message}
        </span>
        <button type="button" className="ghost" onClick={onClose}>
          {t.photo.close}
        </button>
        <button
          type="button"
          className="season-button"
          onClick={save}
          disabled={busy}
          aria-busy={busy}
        >
          {t.photo.save}
        </button>
      </div>
    </section>
  );
}
