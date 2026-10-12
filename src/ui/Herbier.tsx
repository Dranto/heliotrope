import { biodiversityBonus } from '../game/production';
import { formatNumber, formatPercent } from '../game/format';
import { SPECIES_LIST } from '../game/species';
import {
  FAMILIES,
  FAMILY_BONUSES,
  FAMILY_IDS,
  familyOf,
  familyProgress,
  isFamilyComplete,
} from '../game/families';
import { bonusesText } from '../i18n/restoration';
import { t } from '../i18n';
import { speciesConditionText, speciesName } from '../i18n/herbier';
import { Dialog } from './Dialog';
import { SpeciesArt } from './SpeciesArt';
import { useGameState } from './useGame';

/**
 * The Herbier (docs/game-design.md §9.5, §10.2): a plate per species, drawn in colour once it
 * is back, a silhouette until then, each with what brings it back.
 */
export function Herbier({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const found = new Set(state.species);

  return (
    <Dialog
      title={t.herbier.title}
      closeLabel={t.herbier.close}
      onClose={onClose}
      className="herbier"
    >
      <p className="achievements-summary" data-testid="herbier-summary">
        {t.herbier.summary(formatNumber(found.size), formatNumber(SPECIES_LIST.length))} ·{' '}
        {t.biodiversity(formatPercent(biodiversityBonus(state)))}
      </p>
      <p className="hint">{t.herbier.hint}</p>
      <ul className="herbier-families" aria-label={t.herbier.families}>
        {FAMILY_IDS.map((family) => {
          const complete = isFamilyComplete(state.species, family);
          const bonuses = FAMILY_BONUSES[family];
          return (
            <li key={family} className="herbier-family" data-complete={complete}>
              <strong>{t.herbier.familyNames[family]}</strong>{' '}
              <span>
                {formatNumber(familyProgress(state.species, family))}/
                {formatNumber(FAMILIES[family].length)}
              </span>
              <small>{bonuses.length > 0 ? bonusesText(bonuses) : t.herbier.weatherFamily}</small>
            </li>
          );
        })}
      </ul>
      <ul className="plates">
        {SPECIES_LIST.map((species) => {
          const back = found.has(species.id);
          const family = familyOf(species.id);
          return (
            <li
              key={species.id}
              className="plate"
              data-found={back}
              data-species={species.id}
              data-golden={
                (family !== null && isFamilyComplete(state.species, family)) || undefined
              }
            >
              <span className="plate-frame">
                <SpeciesArt id={species.id} />
              </span>
              <h3>{speciesName(species.id)}</h3>
              <p>{speciesConditionText(species)}</p>
              <span className="visually-hidden">
                {back ? ` (${t.herbier.found})` : ` (${t.herbier.unknown})`}
              </span>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
