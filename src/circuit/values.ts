import type { Circuit, LedColor, Part } from './types';

export const BAND_COLORS = [
  '#1b1b1b', // black
  '#7a4a24', // brown
  '#c62f26', // red
  '#e5761c', // orange
  '#e8c21e', // yellow
  '#2e8b47', // green
  '#2f55c4', // blue
  '#7a3fb2', // violet
  '#8d8d8d', // grey
  '#f2f2f2', // white
];
export const GOLD = '#c9a03d';

/** 4-band colour code: [digit, digit, multiplier, tolerance]. */
export function resistorBands(ohms: number): string[] {
  let exp = Math.floor(Math.log10(ohms)) - 1;
  let digits = Math.round(ohms / 10 ** exp);
  if (digits >= 100) {
    digits = Math.round(digits / 10);
    exp += 1;
  }
  const d1 = Math.floor(digits / 10);
  const d2 = digits % 10;
  const mult = exp < 0 ? GOLD : BAND_COLORS[Math.min(exp, 9)];
  return [BAND_COLORS[d1], BAND_COLORS[d2], mult, GOLD];
}

const trim = (n: number) => Number(n.toPrecision(3)).toString();

export function formatOhms(v: number) {
  if (v >= 1e6) return `${trim(v / 1e6)} MΩ`;
  if (v >= 1e3) return `${trim(v / 1e3)} kΩ`;
  return `${trim(v)} Ω`;
}

export function formatFarads(v: number) {
  if (v >= 1e-6) return `${trim(v * 1e6)} µF`;
  if (v >= 1e-9) return `${trim(v * 1e9)} nF`;
  return `${trim(v * 1e12)} pF`;
}

export const formatHz = (f: number) => `${f.toFixed(2)} Hz`;

export function formatValue(p: Part) {
  if (p.kind === 'resistor' && p.value) return formatOhms(p.value);
  if ((p.kind === 'electrolytic' || p.kind === 'ceramic') && p.value) return formatFarads(p.value);
  if (p.kind === 'led') return `${capitalize(p.color ?? 'red')} LED`;
  if (p.kind === 'ic555') return 'NE555 timer';
  if (p.kind === 'button') return 'Push button';
  return '';
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const LED_COLORS: Record<LedColor, { body: string; glow: string }> = {
  red: { body: '#d8261f', glow: '#ff6a4d' },
  green: { body: '#39b54a', glow: '#8dff7a' },
  blue: { body: '#2a63e0', glow: '#7fb0ff' },
  yellow: { body: '#f2c418', glow: '#fff07a' },
  white: { body: '#e9eef2', glow: '#ffffff' },
  orange: { body: '#f07a1a', glow: '#ffb070' },
};

/** 555 astable: f = 1.44 / ((R1 + 2·R2) · C). */
export function blinkStats(c: Circuit) {
  const r1 = c.parts.find((p) => p.id === 'R1')?.value ?? 10e3;
  const r2 = c.parts.find((p) => p.id === 'R2')?.value ?? 91e3;
  const cap = c.parts.find((p) => p.id === 'C1')?.value ?? 10e-6;
  const freq = 1.44 / ((r1 + 2 * r2) * cap);
  const duty = (r1 + r2) / (r1 + 2 * r2);
  return { freq, duty, r1, r2, cap };
}
