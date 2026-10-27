import { memo } from 'react';
import type { SpeciesId } from '../game/species';
import { t } from '../i18n';
import { Appear } from './Neighbourhood';
import { SPECIES_ART } from './speciesDrawings';
import { SPECIES_PLACES } from './speciesMap';
import './species.css';

/** Species are drawn a little larger than life so they read at the scale of the map. */
const MAP_SCALE = 1.25;

/**
 * The species of the Herbier back in the neighbourhood (docs/game-design.md §9.5): each one
 * lives near what brought it back, with a soft entrance when it returns while playing.
 */
export const SpeciesLife = memo(function SpeciesLife({
  species,
}: {
  species: readonly SpeciesId[];
}) {
  return (
    <g className="species">
      {species.map((id) => {
        const { spots, motion } = SPECIES_PLACES[id];
        const size = SPECIES_PLACES[id].size * MAP_SCALE;
        const Art = SPECIES_ART[id];
        return (
          <g key={id} data-species={id} data-motion={motion}>
            <title>{t.herbier.names[id]}</title>
            {spots.map(([x, y], i) => (
              <Appear key={`${x},${y}`} at={[x, y]} size={size}>
                <g transform={`translate(${x} ${y})`}>
                  <g className="species-individual" style={{ animationDelay: `${-i * 1.7}s` }}>
                    {motion !== 'fly' && <circle r={size * 0.55} className="species-halo" />}
                    <g transform={`scale(${size / 32}) translate(-16 -16)`}>
                      <Art />
                    </g>
                  </g>
                </g>
              </Appear>
            ))}
          </g>
        );
      })}
    </g>
  );
});
