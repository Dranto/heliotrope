// The side menu's panels, sorted by layer (docs/game-design.md §10.1, M25): when each one opens,
// which ones the player has not seen yet, and whether a folded one hides something to do.
import { allianceSlots, ALLIANCE_IDS, areAlliancesOpen, canChoose } from './alliances';
import {
  canBuyCollector,
  canRaiseSite,
  COLLECTOR_IDS,
  isBioregionOpen,
  SITE_IDS,
} from './bioregion';
import { unlockedCooperatives } from './cooperatives';
import { canRestoreDistrict, offeredDistrict } from './districts';
import { FRUIT_IDS } from './fruits';
import { isGardenOpen, isRipe } from './garden';
import { GENERATOR_IDS } from './generators';
import { pendingTier } from './growth';
import { areGreatWorksOpen, isStageReady, WORK_IDS } from './greatWorks';
import { canPlant, isOrchardOpen, treeStage } from './orchard';
import { availableUpgrades, isGeneratorRevealed } from './production';
import {
  canCarryOutProject,
  canRestoreParcel,
  offeredParcels,
  offeredProjects,
} from './restoration';
import { areRequestsOpen, canPlayHand, canServe } from './requests';
import type { GameState } from './state';
import { canBuyGenerator, canBuyUpgrade } from './tick';
import { upgradesAllowed } from './challenges';

export const PANEL_IDS = [
  'upgrades',
  'generators',
  'restoration',
  'cooperatives',
  'garden',
  'orchard',
  'requests',
  'alliances',
  'bioregion',
  'greatWorks',
] as const;
export type PanelId = (typeof PANEL_IDS)[number];

export const LAYER_IDS = ['city', 'living', 'region'] as const;
/** The three tabs of the side menu: the city, the living world, the region. */
export type LayerId = (typeof LAYER_IDS)[number];

export const PANEL_LAYER: Record<PanelId, LayerId> = {
  upgrades: 'city',
  generators: 'city',
  restoration: 'city',
  cooperatives: 'city',
  garden: 'living',
  orchard: 'living',
  requests: 'living',
  alliances: 'living',
  bioregion: 'region',
  greatWorks: 'region',
};

export function isPanelId(value: unknown): value is PanelId {
  return typeof value === 'string' && (PANEL_IDS as readonly string[]).includes(value);
}

/** Whether a panel shows in the side menu: the same conditions as each panel's component. */
export function isPanelShown(state: GameState, id: PanelId): boolean {
  switch (id) {
    case 'upgrades':
      return (
        availableUpgrades(state).length > 0 || state.upgrades.length > 0 || !upgradesAllowed(state)
      );
    case 'generators':
      return true;
    case 'restoration':
      return (
        state.parcels.length > 0 ||
        offeredParcels(state).length > 0 ||
        offeredProjects(state).length > 0 ||
        offeredDistrict(state) !== null
      );
    case 'cooperatives':
      return unlockedCooperatives(state).length > 0;
    case 'garden':
      return isGardenOpen(state);
    case 'orchard':
      return isOrchardOpen(state);
    case 'requests':
      return areRequestsOpen(state);
    case 'alliances':
      return areAlliancesOpen(state);
    case 'bioregion':
      return isBioregionOpen(state);
    case 'greatWorks':
      return areGreatWorksOpen(state);
  }
}

export function shownPanels(state: GameState): PanelId[] {
  return PANEL_IDS.filter((id) => isPanelShown(state, id));
}

/** The layers with at least one panel shown, in menu order. */
export function shownLayers(state: GameState): LayerId[] {
  const panels = shownPanels(state);
  return LAYER_IDS.filter((layer) => panels.some((id) => PANEL_LAYER[id] === layer));
}

/** Panels shown that the player has not touched yet: they glow until then. */
export function unseenPanels(state: GameState): PanelId[] {
  return shownPanels(state).filter((id) => !state.seenPanels.includes(id));
}

/** Player action: a panel was touched, so it stops glowing. */
export function markPanelSeen(state: GameState, id: PanelId): GameState {
  if (state.seenPanels.includes(id)) return state;
  return { ...state, seenPanels: [...state.seenPanels, id] };
}

/** Whether a panel offers something to do right now: shown as a dot on its folded title. */
export function panelHasAction(state: GameState, id: PanelId): boolean {
  switch (id) {
    case 'upgrades':
      return availableUpgrades(state).some((upgrade) => canBuyUpgrade(state, upgrade.id));
    case 'generators':
      return GENERATOR_IDS.some(
        (generator) =>
          (isGeneratorRevealed(state, generator) && canBuyGenerator(state, generator)) ||
          pendingTier(state, generator) !== null,
      );
    case 'restoration': {
      const district = offeredDistrict(state);
      return (
        offeredParcels(state).some((parcel) => canRestoreParcel(state, parcel.id)) ||
        offeredProjects(state).some((project) => canCarryOutProject(state, project.id)) ||
        (district !== null && canRestoreDistrict(state, district.id))
      );
    }
    case 'cooperatives':
      return false;
    case 'garden':
      return state.garden.plots.some((plot) => plot.crop !== null && isRipe(plot));
    case 'orchard':
      return FRUIT_IDS.some(
        (fruit) => treeStage(state.orchard.trees[fruit]) === 'ripe' || canPlant(state, fruit),
      );
    case 'requests':
      return (
        state.requests.open.some((_, i) => canServe(state, i)) ||
        state.requests.hands.some((_, i) => canPlayHand(state, i))
      );
    case 'alliances':
      return (
        state.alliances.chosen.length < allianceSlots(state) &&
        ALLIANCE_IDS.some((alliance) => canChoose(state, alliance))
      );
    case 'bioregion':
      return (
        COLLECTOR_IDS.some((collector) => canBuyCollector(state, collector)) ||
        SITE_IDS.some((site) => canRaiseSite(state, site))
      );
    case 'greatWorks':
      return WORK_IDS.some((work) => isStageReady(state, work));
  }
}
