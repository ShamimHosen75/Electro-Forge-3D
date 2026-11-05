export type PartKind = 'ic555' | 'resistor' | 'led' | 'electrolytic' | 'ceramic' | 'button';
export type LedColor = 'red' | 'green' | 'blue' | 'yellow' | 'white' | 'orange';

/** A hole id: "a1".."j30" for the main area, "FP3"/"FN3"/"BP3"/"BN3" for the rails. */
export type HoleId = string;

export interface Part {
  id: string;
  kind: PartKind;
  /** Value in base units: ohms, farads. */
  value?: number;
  color?: LedColor;
  /** Holes the legs sit in. For two-legged parts: [first, second] (anode/+ first). */
  pins: HoleId[];
  /** Polarised parts turned the wrong way round. */
  reversed?: boolean;
  /** What a push button is wired to do. */
  role?: 'reset' | 'trigger';
}

export interface Wire {
  id: string;
  from: HoleId;
  to: HoleId;
  color: string;
}

export interface Circuit {
  name: string;
  version: string;
  mode: 'astable' | 'monostable';
  parts: Part[];
  wires: Wire[];
}

export type ChangeType = 'generated' | 'added' | 'modified' | 'rewired' | 'swapped' | 'removed';

export interface Chip {
  icon: PartKind | 'wire' | 'flip' | 'move';
  text: string;
}

export interface HistoryEntry {
  id: string;
  type: ChangeType;
  title: string;
  /** Old value -> new value. */
  diff?: { from: string; to: string };
  chips?: Chip[];
  description: string;
  at: number;
}
