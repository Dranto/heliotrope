import { formatNumber } from './format';

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [12, '12'],
    [12.34, '12.3'],
    [999, '999'],
    [1234, '1.23K'],
    [45_600, '45.6K'],
    [789_000_000, '789M'],
    [-2500, '-2.50K'],
    [1e40, '1.00e40'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });
});
