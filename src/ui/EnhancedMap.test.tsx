import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

function renderApp() {
  render(
    <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
      <App />
    </GameStoreContext.Provider>,
  );
}

const sceneLabel = 'Le quartier, qui reverdit à mesure que vous construisez';

describe('Enhanced map (§10.4)', () => {
  beforeEach(() => localStorage.clear());

  it('stays off where the device cannot draw it, and is chosen from the options per browser', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    // jsdom has no WebGL: the automatic choice is the SVG map.
    const toggle = screen.getByRole('checkbox', { name: 'Rendu enrichi' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(localStorage.getItem('heliotrope.layout.renderer')).toBe('"pixi"');
    expect(localStorage.getItem('heliotrope.save') ?? '').not.toContain('pixi');
    fireEvent.click(toggle);
    expect(localStorage.getItem('heliotrope.layout.renderer')).toBe('"svg"');
  });

  it('keeps the SVG map when the device has no WebGL', async () => {
    localStorage.setItem('heliotrope.layout.renderer', '"pixi"');
    renderApp();
    // The WebGL map loads, then gives up: jsdom has no WebGL. The SVG scene comes back.
    await waitFor(() => expect(document.querySelector('.pixi-map')).toBeInTheDocument(), {
      timeout: 4000,
    });
    await waitFor(() => expect(document.querySelector('.pixi-map')).not.toBeInTheDocument(), {
      timeout: 4000,
    });
    expect(screen.getByRole('group', { name: sceneLabel }).tagName.toLowerCase()).toBe('svg');
  });
});
