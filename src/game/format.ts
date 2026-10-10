// Number display rules from docs/game-design.md §8, in French notation:
// full digits with a thin-space separator up to 999 999, then short long-scale suffixes
// with 3 significant digits ("1,23 M", "45,6 Md"), then scientific notation.

/** Narrow no-break space: the French thousands separator, and the space before a suffix. */
const SPACE = ' ';

/** Long-scale French suffixes, one per power of 1000 starting at 1e6. */
const SUFFIXES = ['M', 'Md', 'Bn', 'Bd', 'Tn', 'Td', 'Qn', 'Qd'];

const FIRST_SUFFIX_EXPONENT = 6;

function groupThousands(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, SPACE);
}

/** 3 significant digits for a value in [1, 1000), French decimal comma. */
function threeDigits(value: number): string {
  return value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0).replace('.', ',');
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
    return decimals === undefined || decimals === '0' ? grouped : `${grouped},${decimals}`;
  }
  let exponent = Math.floor(Math.log10(abs));
  let mantissa = abs / 10 ** exponent;
  // Rounding to 3 significant digits can carry over, e.g. 9,996 -> 10,0.
  if (Number(mantissa.toFixed(2)) >= 10) {
    exponent += 1;
    mantissa /= 10;
  }
  const tier = Math.floor((exponent - FIRST_SUFFIX_EXPONENT) / 3);
  const suffix = notation === 'short' ? SUFFIXES[tier] : undefined;
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

/** A ratio as a French percentage number, without the sign: 0.05 -> "5", 0.025 -> "2,5". */
export function formatPercent(ratio: number): string {
  return formatNumber(Math.round(ratio * 1000) / 10);
}

/** Prices are shown rounded up so the displayed price is always enough to buy. */
export function formatCost(cost: number): string {
  return formatNumber(Math.ceil(cost));
}
