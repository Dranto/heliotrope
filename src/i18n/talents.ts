// Display texts of the Tree of Seasons, its Canopy and the Cooperatives, resolved from their data.
import { COOPERATIVE_GENERATORS, type CooperativeId } from '../game/cooperatives';
import { CANOPY, type CanopyId, type TalentDef } from '../game/talents';
import { t } from './index';
import { bonusesText } from './restoration';

/** What a cooperative buys: "Héliotrope en pot et Panneau de balcon", or the upgrades. */
export function cooperativeBuysText(id: CooperativeId): string {
  if (id === 'fountaineers') return t.cooperatives.collectors;
  const generators = COOPERATIVE_GENERATORS[id].map((g) => t.generators[g].name);
  const [first, second] = generators;
  if (first === undefined) return t.cooperatives.upgrades;
  return second === undefined ? first : t.cooperatives.and(first, second);
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
  if (def.cooperative) return t.tree.cooperative(cooperativeBuysText(def.cooperative));
  return bonusesText(def.bonuses(level));
}
