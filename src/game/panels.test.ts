import { describe, expect, it } from 'vitest';
import {
  markPanelSeen,
  panelHasAction,
  PANEL_IDS,
  shownLayers,
  shownPanels,
  unseenPanels,
} from './panels';
import { deserialize, serialize } from './save';
import { createInitialState, type GameState } from './state';

function at(extra: Partial<GameState>): GameState {
  return { ...createInitialState(0), ...extra };
}

describe('side menu panels (§10.1, M25)', () => {
  it('opens with the city layer only, the generators already seen', () => {
    const fresh = createInitialState(0);
    expect(shownPanels(fresh)).toEqual(['generators']);
    expect(shownLayers(fresh)).toEqual(['city']);
    expect(unseenPanels(fresh)).toEqual([]);
  });

  it('opens the living world and the region with the Bioregion', () => {
    const state = at({ seasons: 2 });
    expect(shownLayers(state)).toEqual(['city', 'living', 'region']);
    expect(unseenPanels(state)).toEqual(expect.arrayContaining(['garden', 'bioregion']));
  });

  it('stops a panel glowing once touched, without copying the state twice', () => {
    const state = at({ seasons: 1 });
    expect(unseenPanels(state)).toContain('garden');
    const seen = markPanelSeen(state, 'garden');
    expect(unseenPanels(seen)).not.toContain('garden');
    expect(markPanelSeen(seen, 'garden')).toBe(seen);
    expect(state.seenPanels).not.toContain('garden');
  });

  it('marks a folded panel with something to buy', () => {
    const poor = createInitialState(0);
    expect(panelHasAction(poor, 'generators')).toBe(false);
    const rich = { ...poor, totalLight: 1e6, resources: { ...poor.resources, light: 1e6 } };
    expect(panelHasAction(rich, 'generators')).toBe(true);
    for (const id of PANEL_IDS) expect(typeof panelHasAction(rich, id)).toBe('boolean');
  });

  it('keeps the panels seen in the save, and an older save has seen what it shows', () => {
    const state = markPanelSeen(at({ seasons: 2 }), 'garden');
    const loaded = deserialize(serialize(state), 0)!;
    expect(loaded.seenPanels).toEqual(state.seenPanels);

    const { seenPanels: _seen, ...old } = JSON.parse(serialize(at({ seasons: 2 })));
    const migrated = deserialize(JSON.stringify({ ...old, version: 25 }), 0)!;
    expect(unseenPanels(migrated)).toEqual([]);
  });
});
