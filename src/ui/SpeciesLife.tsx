import { memo, type KeyboardEvent } from 'react';
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
 * lives near what brought it back, with a soft entrance when it returns while playing. Those
 * that can be greeted (M35, §9.15) answer a click or Enter, once per passage.
 */
export const SpeciesLife = memo(function SpeciesLife({
  species,
  greetable = '',
  onGreet,
}: {
  species: readonly SpeciesId[];
  /** The species that can be greeted now, joined by commas. */
  greetable?: string;
  onGreet?: (id: SpeciesId) => void;
}) {
  const open = new Set(greetable.split(','));
  return (
    <g className="species">
      {species.map((id) => {
        const { spots, motion } = SPECIES_PLACES[id];
        const size = SPECIES_PLACES[id].size * MAP_SCALE;
        const Art = SPECIES_ART[id];
        const name = t.herbier.names[id];
        const greet = onGreet && open.has(id) ? () => onGreet(id) : undefined;
        const onKey = (event: KeyboardEvent<SVGGElement>) => {
          if (!greet || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          greet();
        };
        return (
          <g
            key={id}
            data-species={id}
            data-motion={motion}
            data-greet={greet ? true : undefined}
            role={greet ? 'button' : undefined}
            tabIndex={greet ? 0 : undefined}
            aria-label={greet ? t.herbier.greet(name) : undefined}
            onClick={greet}
            onKeyDown={greet ? onKey : undefined}
          >
            <title>{greet ? t.herbier.greet(name) : name}</title>
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
