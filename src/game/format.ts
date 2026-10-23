// Number display rules from docs/game-design.md §8. In French notation: full digits with a
// no-break space separator up to 999 999, then short long-scale suffixes with 3 significant digits
// ("1,23 M", "45,6 Md"), then scientific notation. The English version (§14 Q1) follows the
// same rules with a decimal point, comma separators and short-scale suffixes ("1.23 M", "45.6 B").

/**
 * No-break space: the space before a suffix, and the French thousands separator. Not the narrow
 * one (U+202F): Manrope draws it a tenth of an em wide, so "479 339" and "12,0 M" read as one
 * block in the bold counter and buy buttons.
 */
const SPACE = '\u00a0';

/** Languages of the interface (§14 Q1): French first, English second. */
export type Language = 'fr' | 'en';

export const LANGUAGES: readonly Language[] = ['fr', 'en'];

interface NumberStyle {
  decimal: string;
  thousands: string;
  /** One suffix per power of 1000, starting at 1e6. */
  suffixes: readonly string[];
}

const STYLES: Record<Language, NumberStyle> = {
  // Long scale: million, milliard, billion, billiard…
  fr: { decimal: ',', thousands: SPACE, suffixes: ['M', 'Md', 'Bn', 'Bd', 'Tn', 'Td', 'Qn', 'Qd'] },
  // Short scale: million, billion, trillion, quadrillion…
  en: { decimal: '.', thousands: ',', suffixes: ['M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'] },
};

const FIRST_SUFFIX_EXPONENT = 6;

/** Language of the numbers on screen; the UI sets it from the saved settings, like the notation. */
let style: NumberStyle = STYLES.fr;

export function setNumberLanguage(language: Language): void {
  style = STYLES[language];
}

function groupThousands(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, style.thousands);
}

/** A plain decimal number with the separator of the language: 1.5 -> "1,5" in French. */
export function formatDecimal(value: number): string {
  return String(value).replace('.', style.decimal);
}

/** 3 significant digits for a value in [1, 1000). */
function threeDigits(value: number): string {
  return value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0).replace('.', style.decimal);
}

export type Notation = 'short' | 'scientific';

/**
 * Display notation chosen in the Options (§8). Kept here so every number on screen follows it;
 * the UI sets it from the saved settings before rendering.
 */
let currentNotation: Notation = 'short';

export function setNotation(notation: Notation): void {
  currentNotation = notation;
}

function formatAbs(abs: number, notation: Notation): string {
  if (abs < 1e6) {
    // Small fractional values (rates such as 0,1/s) keep one decimal; the rest is whole.
    const text = abs < 100 && !Number.isInteger(abs) ? abs.toFixed(1) : Math.round(abs).toFixed(0);
    if (text === '1000000') return formatAbs(1e6, notation);
    const [integer = '', decimals] = text.split('.');
    const grouped = groupThousands(integer);
    return decimals === undefined || decimals === '0'
      ? grouped
      : `${grouped}${style.decimal}${decimals}`;
  }
  let exponent = Math.floor(Math.log10(abs));
  let mantissa = abs / 10 ** exponent;
  // Rounding to 3 significant digits can carry over, e.g. 9,996 -> 10,0.
  if (Number(mantissa.toFixed(2)) >= 10) {
    exponent += 1;
    mantissa /= 10;
  }
  const tier = Math.floor((exponent - FIRST_SUFFIX_EXPONENT) / 3);
  const suffix = notation === 'short' ? style.suffixes[tier] : undefined;
  if (suffix === undefined) return `${threeDigits(mantissa)}e${exponent}`;
  const scaled = mantissa * 10 ** ((exponent - FIRST_SUFFIX_EXPONENT) % 3);
  return `${threeDigits(scaled)}${SPACE}${suffix}`;
}

/**
 * Human-readable number for display: 12345 -> "12 345", 1.234e6 -> "1,23 M", or "1,23e6" in
 * scientific notation.
 */
export function formatNumber(value: number, notation: Notation = currentNotation): string {
  if (!Number.isFinite(value)) return String(value);
  const sign = value < 0 ? '-' : '';
  return sign + formatAbs(Math.abs(value), notation);
}

/** A ratio as a percentage number, without the sign: 0.05 -> "5", 0.025 -> "2,5". */
export function formatPercent(ratio: number): string {
  return formatNumber(Math.round(ratio * 1000) / 10);
}

/** Prices are shown rounded up so the displayed price is always enough to buy. */
export function formatCost(cost: number): string {
  return formatNumber(Math.ceil(cost));
}
