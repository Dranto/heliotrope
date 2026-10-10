// Resource catalogue (docs/game-design.md §3): Light, and Water from the Bioregion (§7.4).
// Display names live in src/i18n so the game can be translated.
export const RESOURCE_IDS = ['light', 'water'] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];
