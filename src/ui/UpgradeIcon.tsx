import type { GeneratorId } from '../game/generators';
import type { UpgradeDef } from '../game/upgrades';

/** Fine-line botanical icons, one per generator plus click and synergy (§10.4). */
const GENERATOR_PATHS: Record<GeneratorId, string> = {
  pot: 'M8 14h8l-1.2 6H9.2zM12 14V9.5M14.5 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  balconyPanel: 'M6 5h13l-2 9H4zM5 9.5h13M12.5 5l-2 9M8 20h6M11 14v6',
  rooftopGarden:
    'M3 20h18M5 20v-5h14v5M12 15V9M12 11c-3 0-4-2-4-4 3 0 4 2 4 4zm0-1c0-2 1-4 4-4 0 2-1 4-4 4z',
  greenhouse: 'M4 20v-8a8 8 0 0 1 16 0v8zM12 4v16M4 14h16',
  verticalFarm: 'M7 21V3h10v18M7 8h10M7 13h10M7 18h10M10 10.5c1-1 3-1 4 0M10 15.5c1-1 3-1 4 0',
  mirrorPlant:
    'M3 13l8-4 1.5 2.5-8 4zM7.5 14.5V21M4.5 21h6M20 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM17.5 2v1M21.5 7h1',
  urbanCanopy:
    'M12 21v-7M12 14c-5 0-7-3-6-6 1-3 4-4 6-4s5 1 6 4-1 6-6 6zM9 21h6M12 10l-2-2M12 11l2.5-2.5',
  arcology: 'M8 21c0-6-2-9 0-15 1-2.5 7-2.5 8 0 2 6 0 9 0 15zM6 21h12M10 9h4M9.5 13h5M9 17h6',
};

const CLICK_PATH =
  'M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 10V5a1.5 1.5 0 0 1 3 0v5M14 10V7a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7-3 0-4-2-6-5l-1.4-2.4a1.4 1.4 0 0 1 2.4-1.5L8 13';

const SYNERGY_PATH =
  'M12 20v-9M12 11C12 7 9 4 4 4c0 5 3 7 8 7zM12 14.5c0-4 3-6.5 8-6.5 0 5-3 6.5-8 6.5z';

function pathFor({ effect }: UpgradeDef): string {
  switch (effect.kind) {
    case 'generatorMultiplier':
      return GENERATOR_PATHS[effect.generator];
    case 'synergy':
    case 'upgradeSynergy':
      return SYNERGY_PATH;
    default:
      return CLICK_PATH;
  }
}

export function UpgradeIcon({ upgrade }: { upgrade: UpgradeDef }) {
  return (
    <svg viewBox="0 0 24 24" className="upgrade-icon" aria-hidden="true">
      <path d={pathFor(upgrade)} />
    </svg>
  );
}
