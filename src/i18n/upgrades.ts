// Display texts of an upgrade, resolved from its id and effect.
import { formatPercent } from '../game/format';
import type { GeneratorUpgradeTier, UpgradeDef } from '../game/upgrades';
import { t, type UpgradeText } from './fr';

export function upgradeText(upgrade: UpgradeDef): UpgradeText {
  const { id, effect } = upgrade;
  if (effect.kind === 'generatorMultiplier') {
    const tier = Number(id.split('.')[1]) as GeneratorUpgradeTier;
    return t.generatorUpgrades[effect.generator][tier - 1]!;
  }
  if (effect.kind === 'synergy') return t.synergies[id as keyof typeof t.synergies];
  if (effect.kind === 'upgradeSynergy') {
    return t.upgradeSynergies[id as keyof typeof t.upgradeSynergies];
  }
  return t.clickUpgrades[id as keyof typeof t.clickUpgrades];
}

export function upgradeEffectText(upgrade: UpgradeDef): string {
  const { effect } = upgrade;
  switch (effect.kind) {
    case 'generatorMultiplier':
      return t.upgradeEffect.generatorMultiplier(t.generators[effect.generator].name);
    case 'clickMultiplier':
      return t.upgradeEffect.clickMultiplier;
    case 'clickFromProduction':
      return t.upgradeEffect.clickFromProduction(formatPercent(effect.fraction));
    case 'synergy':
      return t.upgradeEffect.synergy(
        t.generators[effect.generator].name,
        formatPercent(effect.bonusPerUnit),
        t.generators[effect.source].name,
      );
    case 'upgradeSynergy':
      return t.upgradeEffect.upgradeSynergy(formatPercent(effect.bonusPerUpgrade), effect.counts);
  }
}
