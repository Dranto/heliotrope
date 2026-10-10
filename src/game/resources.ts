// Resource catalogue (docs/game-design.md §3). The MVP has a single in-game currency.
// Display names live in src/i18n so the game can be translated.
export const RESOURCE_IDS = ['light'] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];
