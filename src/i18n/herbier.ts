// Display texts of the Herbier and the challenge Seasons, resolved from their data.
import { CHALLENGES, type ChallengeDef, type ChallengeId } from '../game/challenges';
import {
  CYCLE_CHALLENGES,
  type CycleChallengeDef,
  type CycleChallengeId,
} from '../game/cycleChallenges';
import { formatNumber } from '../game/format';
import type { SpeciesDef, SpeciesId } from '../game/species';
import { TALENTS } from '../game/talents';
import { t } from './index';
import { bonusesText } from './restoration';
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
    case 'challenge':
      return describe.challenge(t.challenges.names[condition.challenge]);
    case 'cycleChallenge':
      return describe.challenge(t.cycleChallenges.names[condition.challenge]);
    case 'visit':
      return describe.visit(t.visits.welcome[condition.visit], condition.count);
    case 'corridor':
      return describe.corridor(t.corridors.family[condition.family], condition.length);
  }
}

/** Round goals read better without decimals: "2 Md" rather than "2,00 Md". */
export function challengeGoalText(challenge: ChallengeDef): string {
  return t.challenges.goal(formatNumber(challenge.goal).replace(/[.,]0+(?=\s)/, ''));
}

/** The challenge's name as a title: "La Saison des nuages". */
export function challengeTitle(id: ChallengeId): string {
  const name = t.challenges.names[id];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The constraint of a challenge, e.g. "Impossible de bâtir : Panneau de balcon, Centrale…". */
export function challengeRulesText(challenge: ChallengeDef): string {
  const rules = t.challenges.rules;
  const parts: string[] = [];
  if (challenge.blocked) {
    parts.push(rules.blocked(challenge.blocked.map((id) => t.generators[id].name).join(', ')));
  }
  if (challenge.noUpgrades) parts.push(rules.noUpgrades);
  if (challenge.maxPerGenerator !== undefined) {
    parts.push(rules.maxPerGenerator(formatNumber(challenge.maxPerGenerator)));
  }
  if (challenge.productionFactor !== undefined) {
    parts.push(rules.productionFactor(formatNumber(1 / challenge.productionFactor)));
  }
  return parts.join(' · ');
}

export function challengeRewardText(id: ChallengeId): string {
  const challenge = CHALLENGES[id];
  return t.challenges.reward(speciesName(challenge.species), bonusesText(challenge.bonuses));
}

/** The challenge Cycle's name as a title: "L'année sèche". */
export function cycleChallengeTitle(id: CycleChallengeId): string {
  const name = t.cycleChallenges.names[id];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The constraint of a challenge Cycle, e.g. "Eau recueillie divisée par 4". */
export function cycleChallengeRulesText(challenge: CycleChallengeDef): string {
  const rules = t.cycleChallenges.rules;
  const parts: string[] = [];
  if (challenge.waterFactor !== undefined) {
    parts.push(rules.water(formatNumber(1 / challenge.waterFactor)));
  }
  if (challenge.collectorCostFactor !== undefined) {
    parts.push(rules.collectorCost(formatNumber(challenge.collectorCostFactor)));
  }
  if (challenge.siteCostFactor !== undefined) {
    parts.push(rules.siteCost(formatNumber(challenge.siteCostFactor)));
  }
  return parts.join(' · ');
}

export function cycleChallengeGoalText(challenge: CycleChallengeDef): string {
  return t.cycleChallenges.goal(formatNumber(challenge.goal).replace(/[.,]0+(?=\s)/, ''));
}

export function cycleChallengeRewardText(id: CycleChallengeId): string {
  const challenge = CYCLE_CHALLENGES[id];
  return t.challenges.reward(speciesName(challenge.species), bonusesText(challenge.bonuses));
}
