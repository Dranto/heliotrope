// Display texts of the Herbier, resolved from its data.
import type { SpeciesDef, SpeciesId } from '../game/species';
import { TALENTS } from '../game/talents';
import { t } from './index';
import { talentName } from './talents';

export function speciesName(id: SpeciesId): string {
  return t.herbier.names[id];
}

/** What brings a species back: "Restaurer Rivière retrouvée", "Posséder 25 × Serre…". */
export function speciesConditionText({ condition }: SpeciesDef): string {
  const describe = t.herbier.describe;
  switch (condition.kind) {
    case 'parcel':
      return describe.parcel(t.restoration.parcelNames[condition.parcel]);
    case 'owned':
      return describe.owned(t.generators[condition.generator].name, condition.count);
    case 'butterflies':
      return describe.butterflies(condition.count);
    case 'project':
      return describe.project(t.restoration.projectNames[condition.project]);
    case 'talent':
      return describe.talent(talentName(TALENTS[condition.talent]));
    case 'fullTree':
      return describe.fullTree;
    case 'seasons':
      return describe.seasons(condition.count);
    case 'cycles':
      return describe.cycles(condition.count);
    case 'collector':
      return describe.collector(t.bioregion.collectors[condition.collector].name, condition.count);
    case 'site':
      return describe.site(t.bioregion.sites[condition.site].name, condition.level);
    case 'visit':
      return describe.visit(t.visits.welcome[condition.visit], condition.count);
    case 'corridor':
      return describe.corridor(t.corridors.family[condition.family], condition.length);
    case 'weather':
      return describe.weather(t.weather.day[condition.weather]);
  }
}
