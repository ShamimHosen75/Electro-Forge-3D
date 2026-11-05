import type { HoleId } from './types';

/** Distance between neighbouring holes, in scene units. */
export const PITCH = 0.3;
export const COLS = 30;
export const ROWS = 'abcdefghij';

export const BOARD_W = 10.2;
export const BOARD_D = 6.6;
export const BOARD_H = 0.55;

export const RAILS = {
  FN: 2.25, // front, negative
  FP: 2.55, // front, positive
  BN: -2.25, // back, negative
  BP: -2.55, // back, positive
} as const;
export type RailId = keyof typeof RAILS;

export const colX = (c: number) => (c - 15.5) * PITCH;

export function rowZ(r: string) {
  const i = ROWS.indexOf(r);
  // a..e sit at the front (towards the viewer), f..j behind the centre channel.
  return i < 5 ? 0.45 + (4 - i) * PITCH : -0.45 - (i - 5) * PITCH;
}

/** Rails have holes in groups of five, with a gap every sixth column. */
export const railHasCol = (c: number) => c >= 1 && c <= 29 && c % 6 !== 0;

const MAIN = /^([a-j])(\d{1,2})$/;
const RAIL = /^(FP|FN|BP|BN)(\d{1,2})$/;

export function isValidHole(id: string): boolean {
  const m = MAIN.exec(id);
  if (m) {
    const c = Number(m[2]);
    return c >= 1 && c <= COLS;
  }
  const r = RAIL.exec(id);
  if (r) return railHasCol(Number(r[2]));
  return false;
}

export function holePos(id: HoleId): [number, number, number] {
  const m = MAIN.exec(id);
  if (m) return [colX(Number(m[2])), 0, rowZ(m[1])];
  const r = RAIL.exec(id);
  if (r) return [colX(Number(r[2])), 0, RAILS[r[1] as RailId]];
  throw new Error(`Unknown hole ${id}`);
}

/** Human label, e.g. "d24" -> "D-24", "BP7" -> "+rail 7". */
export function holeLabel(id: HoleId): string {
  const m = MAIN.exec(id);
  if (m) return `${m[1].toUpperCase()}-${m[2]}`;
  const r = RAIL.exec(id);
  if (r) return `${r[1].endsWith('P') ? '+' : '−'}rail ${r[2]}`;
  return id;
}

/** Holes that are electrically joined to this one (its strip or rail). */
export function netKey(id: HoleId): string {
  const m = MAIN.exec(id);
  if (m) return `${ROWS.indexOf(m[1]) < 5 ? 'L' : 'U'}${m[2]}`;
  const r = RAIL.exec(id);
  if (r) return r[1];
  return id;
}
