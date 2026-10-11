import { daylightOf } from './daylight';

describe('day and night on the map (§9.6)', () => {
  it('follows the local hour', () => {
    expect(daylightOf(12)).toBe('day');
    expect(daylightOf(6)).toBe('day');
    expect(daylightOf(18)).toBe('evening');
    expect(daylightOf(20)).toBe('evening');
    expect(daylightOf(21)).toBe('night');
    expect(daylightOf(2)).toBe('night');
  });
});
