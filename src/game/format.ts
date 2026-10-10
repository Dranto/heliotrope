const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** Short human-readable number: 1234 -> "1.23K". Falls back to exponent past the suffix list. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) return sign + (Number.isInteger(abs) ? String(abs) : abs.toFixed(1));
  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier >= SUFFIXES.length) return sign + abs.toExponential(2).replace('+', '');
  const scaled = abs / 1000 ** tier;
  return sign + scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + SUFFIXES[tier];
}
