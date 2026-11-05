import { holeLabel, holePos, isValidHole } from './board';
import type { Chip, Circuit, HistoryEntry, HoleId, LedColor, Part, PartKind } from './types';
import { LED_COLORS, blinkStats, capitalize, formatFarads, formatHz, formatOhms, formatValue } from './values';

/** How a part should animate after a change. */
export type AnimKind = 'move' | 'flip' | 'swap' | 'pulse' | 'add' | 'remove';

export interface AnimSpec {
  partId: string;
  kind: AnimKind;
  /** move: where the part started, relative to where it ends up. */
  from?: [number, number, number];
  /** swap / remove: how the part looked before. */
  ghost?: Part;
}

export type CommandResult =
  | { ok: true; circuit: Circuit; entry: Omit<HistoryEntry, 'id' | 'at'>; anims: AnimSpec[] }
  | { ok: false; message: string };

const fail = (message: string): CommandResult => ({ ok: false, message });

/* ---------- small parsers ---------- */

const HOLE_RE = /\b([a-j])\s*-?\s*(\d{1,2})\b|\b(fp|fn|bp|bn)\s*-?\s*(\d{1,2})\b/gi;

function findHoles(text: string): HoleId[] {
  const out: HoleId[] = [];
  for (const m of text.matchAll(HOLE_RE)) {
    out.push(m[1] ? `${m[1].toLowerCase()}${Number(m[2])}` : `${m[3].toUpperCase()}${Number(m[4])}`);
  }
  return out;
}

const UNIT: Record<string, number> = { p: 1e-12, n: 1e-9, u: 1e-6, µ: 1e-6, m: 1e-3, k: 1e3, meg: 1e6, M: 1e6 };

/** "100k", "4.7 kΩ", "220 ohm", "10uF", "100nF" -> number (ohms or farads). */
export function parseValue(text: string, want: 'ohm' | 'farad'): number | null {
  const re = want === 'ohm'
    ? /(\d+(?:\.\d+)?)\s*(meg|[kK]|M)?\s*(?:ohms?|Ω)?/g
    : /(\d+(?:\.\d+)?)\s*(p|n|u|µ|m)\s*f?\b/gi;
  for (const m of text.matchAll(re)) {
    // skip hole coordinates like "g18"
    const before = text.slice(Math.max(0, (m.index ?? 0) - 1), m.index);
    if (/[a-j]/i.test(before)) continue;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) continue;
    const unit = m[2] ? (m[2] === 'M' ? 'M' : m[2].toLowerCase()) : '';
    if (want === 'farad' && !unit) continue;
    return n * (unit ? UNIT[unit] : 1);
  }
  return null;
}

const KIND_WORDS: [RegExp, PartKind | 'capacitor'][] = [
  [/\bresistors?\b|\bres\b/, 'resistor'],
  [/\bleds?\b|\blight\b|\bdiode\b/, 'led'],
  [/\belectrolytic\b|\btiming cap/, 'electrolytic'],
  [/\bceramic\b|\bdecoupling\b|\bdisc\b/, 'ceramic'],
  [/\bcap(?:acitor)?s?\b/, 'capacitor'],
  [/\b555\b|\bchip\b|\btimer\b|\bic\b/, 'ic555'],
  [/\bbutton\b|\bswitch\b/, 'button'],
];

/** Picks the part a sentence talks about: an id ("R3"), a kind plus a hole ("resistor at d24"), or a unique kind. */
function resolvePart(text: string, c: Circuit, opts: { hole?: HoleId; prefer?: PartKind } = {}): Part | string {
  // "R3", "c1"... but not "at c12", which is a hole.
  const idMatch = /(?<!\b(?:at|from|in|on|to)\s)\b([rcdu]|sw)(\d{1,2})\b/i.exec(text);
  if (idMatch) {
    const id = `${idMatch[1].toUpperCase()}${idMatch[2]}`;
    const p = c.parts.find((x) => x.id === id);
    if (p) return p;
    if (!opts.hole) return `There's no ${id} on the board.`;
  }

  const lower = text.toLowerCase();
  let kind: PartKind | 'capacitor' | undefined;
  for (const [re, k] of KIND_WORDS) if (re.test(lower)) { kind = k; break; }
  kind ??= opts.prefer;

  let pool = c.parts.filter((p) =>
    !kind ? true : kind === 'capacitor' ? p.kind === 'electrolytic' || p.kind === 'ceramic' : p.kind === kind,
  );
  if (!pool.length) return `I couldn't find a ${kind ?? 'part'} on the board.`;

  if (opts.hole) {
    const exact = pool.find((p) => p.pins.includes(opts.hole!));
    if (exact) return exact;
    // Nothing exactly there: take the closest leg within a couple of holes.
    const [hx, , hz] = holePos(opts.hole);
    let best: { p: Part; d: number } | null = null;
    for (const p of pool) {
      for (const pin of p.pins) {
        const [x, , z] = holePos(pin);
        const d = Math.hypot(x - hx, z - hz);
        if (!best || d < best.d) best = { p, d };
      }
    }
    if (best && best.d <= 0.65) return best.p;
    return `I couldn't find a ${kind ?? 'part'} at ${holeLabel(opts.hole)}.`;
  }

  // "the capacitor" on its own means the polarised timing cap.
  if (kind === 'capacitor') pool = pool.filter((p) => p.kind === 'electrolytic').length ? pool.filter((p) => p.kind === 'electrolytic') : pool;
  // "the led" on its own means the blinking one.
  if (kind === 'led' && pool.some((p) => p.id === 'D1')) return pool.find((p) => p.id === 'D1')!;
  if (pool.length === 1) return pool[0];
  return `Which ${kind ?? 'part'}? ${pool.map((p) => p.id).join(', ')}, or give its hole, e.g. "${kind ?? 'part'} at ${pool[0].pins[0]}".`;
}

function usedHoles(c: Circuit, except?: string): Set<HoleId> {
  const s = new Set<HoleId>();
  for (const p of c.parts) if (p.id !== except) p.pins.forEach((h) => s.add(h));
  for (const w of c.wires) { s.add(w.from); s.add(w.to); }
  return s;
}

const center = (pins: HoleId[]) => {
  const pts = pins.map(holePos);
  return [0, 1, 2].map((i) => pts.reduce((s, p) => s + p[i], 0) / pts.length) as [number, number, number];
};

const KIND_NAME: Record<PartKind, string> = {
  resistor: 'resistor',
  led: 'LED',
  electrolytic: 'capacitor',
  ceramic: 'capacitor',
  ic555: 'timer chip',
  button: 'button',
};

const chipFor = (p: Part, text: string): Chip => ({ icon: p.kind, text });

const ROLE: Record<string, string> = {
  R1: 'the charge path',
  R2: 'the timing node',
  R3: 'the LED feed',
  C1: 'the timing node',
  D1: 'the output',
};

function replacePart(c: Circuit, p: Part): Circuit {
  return { ...c, parts: c.parts.map((x) => (x.id === p.id ? p : x)) };
}

/* ---------- commands ---------- */

function cmdFlip(text: string, c: Circuit): CommandResult {
  const target = resolvePart(text, c, { prefer: 'electrolytic' });
  if (typeof target === 'string') return fail(target);
  if (target.kind !== 'electrolytic' && target.kind !== 'led') {
    return fail(`${target.id} isn't polarised, so flipping it changes nothing.`);
  }
  const reversed = !target.reversed;
  const next = { ...target, reversed };
  const isCap = target.kind === 'electrolytic';
  return {
    ok: true,
    circuit: replacePart(c, next),
    entry: {
      type: 'modified',
      title: isCap ? 'Flipped capacitor polarity' : 'Flipped LED polarity',
      chips: [chipFor(target, `${target.id} · ${reversed ? 'reversed' : 'restored'}`)],
      description: isCap
        ? reversed
          ? `Turned ${target.id} around so the + terminal faces the rail.`
          : `Turned ${target.id} back so + faces the timing node again.`
        : reversed
          ? `Turned ${target.id} around. It's reverse-biased now and stays dark.`
          : `Turned ${target.id} back the right way. It lights again.`,
    },
    anims: [{ partId: target.id, kind: 'flip' }],
  };
}

function cmdMove(text: string, c: Circuit): CommandResult {
  const holes = findHoles(text);
  if (!holes.length) return fail('Tell me where to put it, e.g. "move R3 to a3".');
  const dest = holes[holes.length - 1];
  const fromHole = holes.length > 1 ? holes[0] : undefined;
  if (!isValidHole(dest)) return fail(`${holeLabel(dest)} isn't a hole on this board.`);

  const target = resolvePart(text.replace(/\bto\b.*$/i, ''), c, { hole: fromHole });
  if (typeof target === 'string') return fail(target);
  if (target.kind === 'ic555') return fail('The 555 straddles the channel. Move the parts around it instead.');

  // The named leg (or the first one) lands on dest; the rest keep their spacing.
  const anchorIdx = fromHole ? Math.max(0, target.pins.indexOf(fromHole)) : 0;
  const [ax, , az] = holePos(target.pins[anchorIdx]);
  const [dx, , dz] = holePos(dest);
  const shift = (h: HoleId) => {
    const [x, , z] = holePos(h);
    return nearestHole(x + dx - ax, z + dz - az);
  };
  let pins = target.pins.map(shift);
  // If the far leg runs off the board, mirror the part around the destination.
  if (pins.some((p) => !p)) {
    pins = target.pins.map((h) => {
      const [x, , z] = holePos(h);
      return nearestHole(dx - (x - ax), dz - (z - az));
    });
  }
  if (pins.some((p) => !p)) return fail(`${target.id} doesn't fit at ${holeLabel(dest)}.`);
  const used = usedHoles(c, target.id);
  const clash = (pins as HoleId[]).find((h) => used.has(h));
  if (clash) return fail(`${holeLabel(clash)} is already taken. Pick a free hole.`);

  const before = center(target.pins);
  const after = center(pins as HoleId[]);
  const next = { ...target, pins: pins as HoleId[] };
  return {
    ok: true,
    circuit: replacePart(c, next),
    entry: {
      type: 'rewired',
      title: `Repositioned ${KIND_NAME[target.kind]} ${target.id}`,
      chips: [chipFor(target, `${target.id} · col ${holeLabel(target.pins[anchorIdx])} → ${holeLabel(dest)}`)],
      description: ROLE[target.id] ? `Moved ${target.id} to free up ${ROLE[target.id]}.` : `Moved ${target.id} to ${holeLabel(dest)}.`,
    },
    anims: [{ partId: target.id, kind: 'move', from: [before[0] - after[0], 0, before[2] - after[2]] }],
  };
}

function nearestHole(x: number, z: number): HoleId | null {
  // Snap back to a hole id by searching the board; it's small enough to brute force.
  let best: { id: HoleId; d: number } | null = null;
  const consider = (id: HoleId) => {
    if (!isValidHole(id)) return;
    const [hx, , hz] = holePos(id);
    const d = Math.hypot(hx - x, hz - z);
    if (!best || d < best.d) best = { id, d };
  };
  for (let col = 1; col <= 30; col++) {
    for (const r of 'abcdefghij') consider(`${r}${col}`);
    for (const r of ['FP', 'FN', 'BP', 'BN']) consider(`${r}${col}`);
  }
  const b = best as { id: HoleId; d: number } | null;
  return b && b.d < 0.05 ? b.id : null;
}

function cmdSwapValue(text: string, c: Circuit): CommandResult {
  const holes = findHoles(text.replace(/\bwith\b.*$/i, ''));
  const subject = text.replace(/\b(with|to|for)\b.*$/i, '');
  const target = resolvePart(subject, c, { hole: holes[0], prefer: 'resistor' });
  if (typeof target === 'string') return fail(target);

  const tail = text.replace(/^.*?\b(with|to|for)\b/i, '');
  if (target.kind === 'resistor') {
    const v = parseValue(tail, 'ohm');
    if (!v) return fail('What value should it be? e.g. "swap R3 with a 1k".');
    if (v === target.value) return fail(`${target.id} is already ${formatOhms(v)}.`);
    return swapResult(c, target, { ...target, value: v }, formatOhms(target.value ?? 0), formatOhms(v));
  }
  if (target.kind === 'electrolytic' || target.kind === 'ceramic') {
    const v = parseValue(tail, 'farad');
    if (!v) return fail('What value should it be? e.g. "swap C1 with 22uF".');
    return swapResult(c, target, { ...target, value: v }, formatFarads(target.value ?? 0), formatFarads(v));
  }
  if (target.kind === 'led') {
    const color = findColor(tail);
    if (color) return cmdRecolor(`led ${color}`, c, target);
  }
  return fail(`I can't change the value of ${target.id}.`);
}

function swapResult(c: Circuit, old: Part, next: Part, from: string, to: string): CommandResult {
  const circuit = replacePart(c, next);
  const timing = ['R1', 'R2', 'C1'].includes(old.id);
  let description = `Replaced ${old.id} with a ${to} part.`;
  if (timing) {
    const f = blinkStats(circuit).freq;
    const slower = f < blinkStats(c).freq;
    description = `${slower ? 'Raised' : 'Dropped'} the timing ${old.kind === 'resistor' ? 'resistor' : 'capacitor'}. The LED now blinks at ${formatHz(f)}.`;
  } else if (old.id === 'R3') {
    description = (next.value ?? 0) > (old.value ?? 0)
      ? 'Raised the LED resistor, so the LED draws less current and glows dimmer.'
      : 'Dropped the LED resistor to a lower value, so the LED glows brighter.';
  }
  return {
    ok: true,
    circuit,
    entry: {
      type: 'swapped',
      title: `Swapped a ${KIND_NAME[old.kind]}`,
      diff: { from, to },
      chips: [chipFor(old, `${old.id} · ${holeLabel(old.pins[0])}`)],
      description,
    },
    anims: [{ partId: old.id, kind: 'swap', ghost: old }],
  };
}

const COLOR_WORDS = Object.keys(LED_COLORS) as LedColor[];
const findColor = (t: string) => COLOR_WORDS.find((w) => new RegExp(`\\b${w}\\b`, 'i').test(t));

function cmdRecolor(text: string, c: Circuit, known?: Part): CommandResult {
  const color = findColor(text);
  if (!color) return fail(`Which colour? I have ${COLOR_WORDS.join(', ')}.`);
  const target = known ?? resolvePart(text.replace(new RegExp(`\\b${color}\\b`, 'i'), ''), c, { prefer: 'led' });
  if (typeof target === 'string') return fail(target);
  if (target.kind !== 'led') return fail(`${target.id} isn't an LED.`);
  if (target.color === color) return fail(`${target.id} is already ${color}.`);
  const from = capitalize(target.color ?? 'red');
  return {
    ok: true,
    circuit: replacePart(c, { ...target, color }),
    entry: {
      type: 'modified',
      title: target.id === 'D1' ? 'Recolored the blink LED' : `Recolored ${target.id}`,
      diff: { from, to: capitalize(color) },
      description: `Swapped the ${target.id === 'D1' ? 'indicator' : ''} LED to ${color}.`.replace('  ', ' '),
    },
    anims: [{ partId: target.id, kind: 'swap', ghost: target }],
  };
}

/** Change blink frequency by retuning R2 (or C1 when R2 can't go low enough). */
function cmdRate(text: string, c: Circuit): CommandResult {
  if (c.mode !== 'astable') return fail("It's a one-shot timer right now, so it doesn't blink on its own.");
  const t = text.toLowerCase();
  const stats = blinkStats(c);
  let factor: number | null = null;
  let title = 'Tuned the blink rate';
  const hz = /(\d+(?:\.\d+)?)\s*hz/.exec(t);
  if (hz) factor = Number(hz[1]) / stats.freq;
  else if (/\b(double|twice|2x|two times)\b/.test(t)) { factor = 2; title = 'Doubled the blink rate'; }
  else if (/\b(triple|three times|3x)\b/.test(t)) { factor = 3; title = 'Tripled the blink rate'; }
  else if (/\b(half|halve)\b/.test(t)) { factor = 0.5; title = 'Halved the blink rate'; }
  else if (/\b(faster|quicker|speed up)\b/.test(t)) factor = 1.5;
  else if (/\b(slower|slow down)\b/.test(t)) factor = 1 / 1.5;
  if (!factor || factor <= 0) return fail('How fast? Try "blink twice as fast" or "blink at 2 Hz".');

  const target = stats.freq * factor;
  const r2 = (1.44 / (target * stats.cap) - stats.r1) / 2;
  const r2Part = c.parts.find((p) => p.id === 'R2');
  const c1Part = c.parts.find((p) => p.id === 'C1');
  if (!r2Part || !c1Part) return fail('This circuit has no R2 or C1 to retune.');

  let next: Circuit;
  let description: string;
  let changed: Part;
  if (r2 >= 1e3) {
    const v = Math.round(r2 / 100) * 100;
    changed = { ...r2Part, value: v };
    next = replacePart(c, changed);
    description = `${v < (r2Part.value ?? 0) ? 'Lowered' : 'Raised'} R2 to ${formatOhms(v)} to ${factor > 1 ? 'speed up' : 'slow down'} the oscillation.`;
  } else {
    const cap = c1Part.value! / factor;
    changed = { ...c1Part, value: cap };
    next = replacePart(c, changed);
    description = `R2 can't go any lower, so I ${factor > 1 ? 'shrank' : 'grew'} C1 to ${formatFarads(cap)} instead.`;
  }
  return {
    ok: true,
    circuit: next,
    entry: { type: 'modified', title, diff: { from: formatHz(stats.freq), to: formatHz(blinkStats(next).freq) }, description },
    anims: [{ partId: changed.id, kind: 'swap', ghost: changed.id === 'R2' ? r2Part : c1Part }],
  };
}

function cmdRemove(text: string, c: Circuit): CommandResult {
  const holes = findHoles(text);
  const target = resolvePart(text, c, { hole: holes[0] });
  if (typeof target === 'string') return fail(target);
  if (target.kind === 'ic555') return fail("Without the 555 there's no blinker. I'll leave it in.");
  return {
    ok: true,
    circuit: { ...c, parts: c.parts.filter((p) => p.id !== target.id) },
    entry: {
      type: 'removed',
      title: `Removed ${target.id}`,
      chips: [chipFor(target, `${target.id} · ${formatValue(target)}`)],
      description: `Pulled ${target.id} off the board.`,
    },
    anims: [{ partId: target.id, kind: 'remove', ghost: target }],
  };
}

/* ---------- builders from the suggestion chips ---------- */

const BLACK = '#2a2a2e';
const YELLOW = '#e3b52a';

function nextId(c: Circuit, prefix: string) {
  let n = 1;
  const ids = new Set([...c.parts.map((p) => p.id), ...c.wires.map((w) => w.id)]);
  while (ids.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

function needFree(c: Circuit, holes: HoleId[], what: string): string | null {
  const used = usedHoles(c);
  const busy = holes.find((h) => used.has(h));
  return busy ? `I need ${holeLabel(busy)} free to add ${what}. Move whatever is there first.` : null;
}

function cmdAddPowerLed(c: Circuit): CommandResult {
  if (c.parts.some((p) => p.kind === 'led' && p.id !== 'D1')) return fail('There is already a power LED on the board.');
  const R = nextId(c, 'R');
  const D = nextId(c, 'D');
  const W = nextId(c, 'W');
  const holes = ['FP25', 'a25', 'c25', 'c26', 'a26', 'FN27'];
  const busy = needFree(c, holes, 'a power LED');
  if (busy) return fail(busy);
  const res: Part = { id: R, kind: 'resistor', value: 1e3, pins: ['FP25', 'a25'] };
  const led: Part = { id: D, kind: 'led', color: 'green', pins: ['c25', 'c26'] };
  return {
    ok: true,
    circuit: { ...c, parts: [...c.parts, res, led], wires: [...c.wires, { id: W, from: 'a26', to: 'FN27', color: BLACK }] },
    entry: {
      type: 'added',
      title: 'Added a power LED',
      chips: [chipFor(led, `${D} · green`), chipFor(res, `${R} · 1 kΩ`)],
      description: 'Lights steadily whenever the board has power.',
    },
    anims: [
      { partId: R, kind: 'add' },
      { partId: D, kind: 'add' },
    ],
  };
}

function cmdAddReset(c: Circuit): CommandResult {
  if (c.parts.some((p) => p.id === 'SW1')) return fail('The reset button is already on the board.');
  const tie = c.wires.find((w) => [w.from, w.to].includes('a13'));
  const holes = ['d13', 'd15', 'a15', 'FN15', ...(tie ? [] : ['a13', 'FP13'])];
  const busy = needFree({ ...c, wires: c.wires.filter((w) => w !== tie) }, holes, 'a reset button');
  if (busy) return fail(busy);
  const R = nextId(c, 'R');
  const sw: Part = { id: 'SW1', kind: 'button', pins: ['d13', 'd15'] };
  // The hard tie from RESET to + becomes a pull-up, so pressing the button can pull RESET low.
  const pullUp: Part = { id: R, kind: 'resistor', value: 10e3, pins: ['FP13', 'a13'] };
  return {
    ok: true,
    circuit: {
      ...c,
      parts: [...c.parts, sw, pullUp],
      wires: [...c.wires.filter((w) => w !== tie), { id: nextId(c, 'W'), from: 'a15', to: 'FN15', color: BLACK }],
    },
    entry: {
      type: 'added',
      title: 'Added a reset button',
      chips: [chipFor(sw, 'SW1 · reset'), chipFor(pullUp, `${R} · 10 kΩ pull-up`)],
      description: 'Hold the button on the board to stop the timer. Click it in 3D to try.',
    },
    anims: [
      { partId: 'SW1', kind: 'add' },
      { partId: R, kind: 'add' },
    ],
  };
}

function cmdMonostable(c: Circuit): CommandResult {
  if (c.mode === 'monostable') return fail("It's already a monostable.");
  const link = c.wires.find((w) => [w.from, w.to].includes('g12') && [w.from, w.to].includes('d11'));
  const holes = ['c11', 'c9', 'a9', 'FN9', 'FP11', 'a11'];
  const busy = needFree({ ...c, wires: c.wires.filter((w) => w !== link) }, holes, 'a trigger button');
  if (busy) return fail(busy);
  const R = nextId(c, 'R');
  const sw: Part = { id: 'SW2', kind: 'button', pins: ['c11', 'c9'] };
  const pullUp: Part = { id: R, kind: 'resistor', value: 10e3, pins: ['FP11', 'a11'] };
  const next: Circuit = {
    ...c,
    mode: 'monostable',
    parts: [...c.parts, sw, pullUp],
    wires: [...c.wires.filter((w) => w !== link), { id: nextId(c, 'W'), from: 'a9', to: 'FN9', color: YELLOW }],
  };
  const { r1, r2, cap } = blinkStats(next);
  return {
    ok: true,
    circuit: next,
    entry: {
      type: 'modified',
      title: 'Made it a monostable',
      diff: { from: 'Astable', to: 'Monostable' },
      chips: [chipFor(sw, 'SW2 · trigger'), chipFor(pullUp, `${R} · 10 kΩ pull-up`)],
      description: `Cut the THR–TRIG link and added a trigger button. One press lights the LED for ${(1.1 * (r1 + r2) * cap).toFixed(1)} s.`,
    },
    anims: [
      { partId: 'SW2', kind: 'add' },
      { partId: R, kind: 'add' },
    ],
  };
}

function cmdAstable(c: Circuit): CommandResult {
  if (c.mode === 'astable') return fail("It's already blinking on its own (astable).");
  const sw = c.parts.find((p) => p.id === 'SW2');
  const pull = c.parts.find((p) => p.kind === 'resistor' && p.pins.includes('FP11'));
  const busy = needFree({ ...c, parts: c.parts.filter((p) => p !== sw && p !== pull) }, ['g12', 'd11'], 'the THR–TRIG link');
  if (busy) return fail(busy);
  return {
    ok: true,
    circuit: {
      ...c,
      mode: 'astable',
      parts: c.parts.filter((p) => p !== sw && p !== pull),
      wires: [...c.wires.filter((w) => !(w.from === 'a9' && w.to === 'FN9')), { id: nextId(c, 'W'), from: 'g12', to: 'd11', color: '#2f62c8' }],
    },
    entry: {
      type: 'modified',
      title: 'Made it an astable again',
      diff: { from: 'Monostable', to: 'Astable' },
      description: 'Restored the THR–TRIG link so the 555 free-runs and blinks.',
    },
    anims: [sw, pull].filter(Boolean).map((p) => ({ partId: p!.id, kind: 'remove' as const, ghost: p! })),
  };
}

/* ---------- entry point ---------- */

export function runCommand(input: string, c: Circuit): CommandResult {
  const text = input.trim().replace(/\s+/g, ' ');
  const t = text.toLowerCase();
  if (!t) return fail('Type a change to make.');

  if (/\bpower (led|light|indicator)\b/.test(t)) return cmdAddPowerLed(c);
  if (/\breset\b/.test(t) && /\b(add|button|switch)\b/.test(t)) return cmdAddReset(c);
  if (/\bmono-?stable\b|\bone-?shot\b/.test(t)) return cmdMonostable(c);
  if (/\ba-?stable\b|\bfree-?run/.test(t)) return cmdAstable(c);
  if (/\b(flip|reverse|turn around|rotate)\b/.test(t)) return cmdFlip(text, c);
  if (/\b(blink|rate|frequency|hz|faster|slower|speed)\b/.test(t)) return cmdRate(text, c);
  if (/\b(move|reposition|shift|relocate|put)\b/.test(t)) return cmdMove(text, c);
  if (/\b(colou?r|recolou?r)\b/.test(t) || (findColor(t) && /\b(led|light|make|change|turn)\b/.test(t))) return cmdRecolor(text, c);
  if (/\b(swap|replace|change|set|use)\b/.test(t)) return cmdSwapValue(text, c);
  if (/\b(remove|delete|pull|take out)\b/.test(t)) return cmdRemove(text, c);

  return fail('I couldn\'t turn that into a change yet. Try "move R3 to a3", "flip the capacitor" or "make it blink twice as fast".');
}
