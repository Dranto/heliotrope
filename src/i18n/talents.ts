// Display texts of the Tree of Seasons, its Canopy and the Cooperatives, resolved from their data.
import { COOPERATIVE_GENERATORS, type CooperativeId } from '../game/cooperatives';
import { CANOPY, type CanopyId, type TalentDef } from '../game/talents';
import { t } from './index';
import { bonusesText } from './restoration';

/** What a cooperative buys: "Héliotrope en pot et Panneau de balcon", or the upgrades. */
export function cooperativeBuysText(id: CooperativeId): string {
  if (id === 'fountaineers') return t.cooperatives.collectors;
  if (id === 'growers') return t.cooperatives.resows;
  if (id === 'beekeepers') return t.cooperatives.carriesHoney;
  const generators = COOPERATIVE_GENERATORS[id].map((g) => t.generators[g].name);
  const [first, second] = generators;
  if (first === undefined) return t.cooperatives.upgrades;
  return second === undefined ? first : t.cooperatives.and(first, second);
}

/** What a cooperative does, as the panel shows it (M36: the growers and beekeepers do not buy). */
export function cooperativeDoesText(id: CooperativeId, leadsProjects: boolean): string {
  if (id === 'growers' || id === 'beekeepers') return cooperativeBuysText(id);
  if (id === 'council' && leadsProjects) {
    return t.cooperatives.buys(t.cooperatives.upgradesAndProjects.toLowerCase());
  }
  return t.cooperatives.buys(cooperativeBuysText(id).toLowerCase());
}

/** The count under a cooperative: purchases, sowings or jars carried. */
export function cooperativeCountText(id: CooperativeId, count: string): string {
  if (id === 'growers') return t.cooperatives.sowings(count);
  if (id === 'beekeepers') return t.cooperatives.jars(count);
  return t.cooperatives.purchases(count);
}

export function talentName(talent: TalentDef): string {
  return t.tree.names[talent.id];
}

/** The effect of a talent: its bonuses, or the cooperative it brings in. */
export function talentEffectText(talent: TalentDef): string {
  const parts = [];
  if (talent.bonuses.length > 0) parts.push(bonusesText(talent.bonuses));
  if (talent.cooperative) parts.push(t.tree.cooperative(cooperativeBuysText(talent.cooperative)));
  return parts.join(' · ');
}

export function canopyName(id: CanopyId): string {
  return t.tree.canopy.names[id];
}

/** What a canopy talent does at `level` (1 or more). */
export function canopyEffectText(id: CanopyId, level: number): string {
  const def = CANOPY[id];
  if (id === 'sower') return t.tree.canopy.sowerEffect;
  if (id === 'assembly') return t.tree.canopy.assemblyEffect;
  if (id === 'growers') return t.cooperatives.resows;
  if (def.cooperative) return t.tree.cooperative(cooperativeBuysText(def.cooperative));
  return bonusesText(def.bonuses(level));
}
