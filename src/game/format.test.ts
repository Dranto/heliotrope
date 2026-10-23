import {
  formatDecimal,
  formatNumber,
  formatPercent,
  setNotation,
  setNumberLanguage,
} from './format';

// Expected strings use "_" for the no-break space to keep them readable.
const s = (text: string) => text.replaceAll('_', '\u00a0');

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

  it('separates thousands and suffixes with a full no-break space, not the narrow one', () => {
    // Manrope's narrow no-break space is a tenth of an em: "479 339" read as "479339".
    for (const text of [formatNumber(479_339), formatNumber(12e6)]) {
      expect(text).toMatch(/\u00a0/);
      expect(text).not.toMatch(/[\u202f ]/);
    }
  });
});

describe('formatPercent', () => {
  it.each([
    [0.05, '5'],
    [0.01, '1'],
    [0.025, '2,5'],
    [0.48, '48'],
  ])('formats %d as %s', (ratio, expected) => {
    expect(formatPercent(ratio)).toBe(expected);
  });
});

describe('scientific notation option (§8)', () => {
  afterEach(() => setNotation('short'));

  it('replaces the suffixes with scientific notation from one million', () => {
    expect(formatNumber(1_234_567, 'scientific')).toBe('1,23e6');
    expect(formatNumber(45_600_000_000, 'scientific')).toBe('4,56e10');
    expect(formatNumber(12_345, 'scientific')).toBe(s('12_345'));
  });

  it('follows the notation set for the whole display', () => {
    setNotation('scientific');
    expect(formatNumber(2e9)).toBe('2,00e9');
    setNotation('short');
    expect(formatNumber(2e9)).toBe(s('2,00_Md'));
  });
});

describe('English numbers', () => {
  afterEach(() => setNumberLanguage('fr'));

  it.each([
    [0.1, '0.1'],
    [12_345, '12,345'],
    [1_234_567, '1.23_M'],
    [45_600_000_000, '45.6_B'],
    [7.89e12, '7.89_T'],
    [2e27, '2.00_Oc'],
    [1.23e30, '1.23e30'],
  ])('formats %d as %s', (value, expected) => {
    setNumberLanguage('en');
    expect(formatNumber(value)).toBe(s(expected));
  });

  it('writes percentages and factors with a decimal point', () => {
    setNumberLanguage('en');
    expect(formatPercent(0.025)).toBe('2.5');
    expect(formatDecimal(1.5)).toBe('1.5');
    setNumberLanguage('fr');
    expect(formatDecimal(1.5)).toBe('1,5');
  });
});
