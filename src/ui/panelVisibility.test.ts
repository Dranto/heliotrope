import { isPanelHidden } from './panelVisibility';

describe('isPanelHidden', () => {
  it('shows every panel on wide screens', () => {
    expect(isPanelHidden('garden', 'wide', 'build')).toBe(false);
    expect(isPanelHidden('bioregion', 'wide', 'more')).toBe(false);
  });

  it('shows on phones only the panels of the open tab (§10.3)', () => {
    expect(isPanelHidden('cooperatives', 'phone', 'build')).toBe(false);
    expect(isPanelHidden('restoration', 'phone', 'build')).toBe(true);
    expect(isPanelHidden('restoration', 'phone', 'improve')).toBe(false);
    expect(isPanelHidden('garden', 'phone', 'living')).toBe(false);
    expect(isPanelHidden('greatWorks', 'phone', 'region')).toBe(false);
    expect(isPanelHidden('bioregion', 'phone', 'more')).toBe(true);
  });

  it('shows on medium screens the panels of the open layer (M25)', () => {
    expect(isPanelHidden('restoration', 'medium', 'build')).toBe(false);
    expect(isPanelHidden('cooperatives', 'medium', 'improve')).toBe(false);
    expect(isPanelHidden('garden', 'medium', 'build')).toBe(true);
    expect(isPanelHidden('garden', 'medium', 'living')).toBe(false);
    expect(isPanelHidden('bioregion', 'medium', 'living')).toBe(true);
    expect(isPanelHidden('bioregion', 'medium', 'region')).toBe(false);
  });
});
