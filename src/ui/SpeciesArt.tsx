import type { SpeciesId } from '../game/species';
import { SPECIES_ART } from './speciesDrawings';

/** A species drawn on its own, e.g. on a plate of the Herbier. */
export function SpeciesArt({ id }: { id: SpeciesId }) {
  const Art = SPECIES_ART[id];
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="species-art">
      <Art />
    </svg>
  );
}
