import { render, screen } from '@testing-library/react';
import { GameStore } from '../game/store';
import { App } from './App';
import { GameStoreContext } from './useGame';

// The SVG map holds species to greet, garden beds and visits that answer a click or a
// key: an image role would make them presentational and hide them from screen readers.
describe('the SVG map', () => {
  beforeEach(() => localStorage.clear());

  it('is a labelled group, and no image role wraps a control', () => {
    render(
      <GameStoreContext.Provider value={new GameStore(localStorage, () => 0)}>
        <App />
      </GameStoreContext.Provider>,
    );
    const scene = screen.getByRole('group', {
      name: 'Le quartier, qui reverdit à mesure que vous construisez',
    });
    expect(scene.tagName.toLowerCase()).toBe('svg');
    for (const image of document.querySelectorAll('[role="img"]')) {
      expect(image.querySelector('button, a[href], [role="button"], [tabindex]')).toBeNull();
    }
  });
});
