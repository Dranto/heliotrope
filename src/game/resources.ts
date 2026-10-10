// Placeholder resource list. The real catalogue comes from docs/game-design.md.
export const RESOURCE_IDS = ['sunlight'] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];

export interface ResourceDef {
  id: ResourceId;
  name: string;
  /** Passive production per second before any upgrades. */
  baseRate: number;
}

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  sunlight: { id: 'sunlight', name: 'Sunlight', baseRate: 1 },
};
