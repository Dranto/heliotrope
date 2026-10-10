import { formatNumber } from './format';

// Expected strings use "_" for the narrow no-break space to keep them readable.
const s = (text: string) => text.replaceAll('_', ' ');

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [12, '12'],
    [0.1, '0,1'],
    [12.34, '12,3'],
    [12.04, '12'],
    [999, '999'],
    [123.6, '124'],
    [12_345, '12_345'],
    [999_999, '999_999'],
    [999_999.7, '1,00_M'],
    [1_234_567, '1,23_M'],
    [45_600_000_000, '45,6_Md'],
    [789_000_000, '789_M'],
    [999_999_999, '1,00_Md'],
    [7.89e12, '7,89_Bn'],
    [1.5e15, '1,50_Bd'],
    [2e27, '2,00_Qd'],
    [1.23e30, '1,23e30'],
    [1e40, '1,00e40'],
    [-2500, '-2_500'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatNumber(value)).toBe(s(expected));
  });

  it('passes non-finite values through', () => {
    expect(formatNumber(Infinity)).toBe('Infinity');
  });
});
