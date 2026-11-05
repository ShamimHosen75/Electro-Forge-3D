import { netKey } from './board';
import type { Circuit } from './types';

const PIN_555 = ['GND', 'TRIG', 'OUT', 'RESET', 'CV', 'THR', 'DIS', 'VCC'];

export interface Net {
  name: string;
  members: string[];
}

/** Groups every leg into electrical nets, joining strips through jumpers. */
export function buildNetlist(c: Circuit): Net[] {
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    if (!parent.has(k)) parent.set(k, k);
    const p = parent.get(k)!;
    if (p === k) return k;
    const r = find(p);
    parent.set(k, r);
    return r;
  };
  const join = (a: string, b: string) => parent.set(find(a), find(b));
  for (const w of c.wires) join(netKey(w.from), netKey(w.to));

  const groups = new Map<string, string[]>();
  for (const p of c.parts) {
    p.pins.forEach((hole, i) => {
      const root = find(netKey(hole));
      const label = p.kind === 'ic555' ? `U1·${PIN_555[i]}` : `${p.id}·${p.pins.length === 2 ? (i === 0 ? '1' : '2') : i + 1}`;
      groups.set(root, [...(groups.get(root) ?? []), label]);
    });
  }

  const nets: Net[] = [];
  let n = 1;
  for (const [root, members] of groups) {
    if (members.length < 2) continue;
    const named = members.find((m) => m.startsWith('U1·'))?.slice(3);
    const rail = root === find('FP') || root === find('BP') ? 'VCC' : root === find('FN') || root === find('BN') ? 'GND' : null;
    nets.push({ name: rail ?? named ?? `N${n++}`, members });
  }
  const rank = (n: Net) => (n.name === 'VCC' ? 0 : n.name === 'GND' ? 1 : n.name.startsWith('N') ? 3 : 2);
  return nets.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
