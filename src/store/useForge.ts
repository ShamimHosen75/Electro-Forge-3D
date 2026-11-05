import { create } from 'zustand';
import { initialCircuit, initialHistory } from '../circuit/initial';
import { runCommand, type AnimSpec } from '../circuit/commands';
import type { Circuit, HistoryEntry } from '../circuit/types';

export type ViewCommand = 'zoomIn' | 'zoomOut' | 'fit' | 'iso' | 'top' | 'reset';
export type PanelTab = 'history' | 'circuit';

export interface ActiveAnim extends AnimSpec {
  start: number;
  duration: number;
}

const DURATION: Record<AnimSpec['kind'], number> = {
  move: 1.15,
  flip: 1.0,
  swap: 1.1,
  pulse: 0.7,
  add: 0.9,
  remove: 0.8,
};

interface ForgeState {
  circuit: Circuit;
  history: HistoryEntry[];
  tab: PanelTab;
  view: { cmd: ViewCommand; nonce: number } | null;
  toast: { text: string; tone: 'info' | 'error'; nonce: number } | null;
  thinking: boolean;
  anims: ActiveAnim[];
  /** Snapshots for undo, newest last. */
  past: { circuit: Circuit; history: HistoryEntry[] }[];
  /** Buttons currently held down in the 3D view. */
  pressed: Record<string, boolean>;
  /** Monostable output stays high until this time (performance.now seconds). */
  pulseUntil: number;
  highlight: (partId: string) => void;
  press: (partId: string, down: boolean) => void;
  undo: () => void;
  setTab: (t: PanelTab) => void;
  sendView: (cmd: ViewCommand) => void;
  showToast: (text: string, tone?: 'info' | 'error') => void;
  submit: (text: string) => Promise<boolean>;
  endAnim: (partId: string) => void;
}

let seq = 100;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useForge = create<ForgeState>((set, get) => ({
  circuit: initialCircuit,
  history: initialHistory(),
  tab: 'history',
  view: null,
  toast: null,
  thinking: false,
  anims: [],
  past: [],
  pressed: {},
  pulseUntil: 0,
  setTab: (tab) => set({ tab }),
  sendView: (cmd) => set({ view: { cmd, nonce: Date.now() + Math.random() } }),
  showToast: (text, tone = 'info') => set({ toast: { text, tone, nonce: Date.now() } }),

  submit: async (text) => {
    if (get().thinking) return false;
    if (/^\s*undo\b/i.test(text)) {
      get().undo();
      return true;
    }
    set({ thinking: true });
    // A short beat so the change reads as "the AI worked on it" rather than a snap.
    await wait(650);
    const result = runCommand(text, get().circuit);
    if (!result.ok) {
      set({ thinking: false });
      get().showToast(result.message, 'error');
      return false;
    }
    const now = performance.now() / 1000;
    const entry: HistoryEntry = { ...result.entry, id: `h${++seq}`, at: Date.now() };
    set((s) => ({
      thinking: false,
      past: [...s.past.slice(-30), { circuit: s.circuit, history: s.history }],
      circuit: result.circuit,
      history: [entry, ...s.history],
      tab: 'history',
      anims: [
        ...s.anims.filter((a) => !result.anims.some((n) => n.partId === a.partId)),
        ...result.anims.map((a) => ({ ...a, start: now, duration: DURATION[a.kind] })),
      ],
    }));
    return true;
  },

  highlight: (partId) => {
    const now = performance.now() / 1000;
    set((s) => ({
      anims: [...s.anims.filter((a) => a.partId !== partId), { partId, kind: 'pulse', start: now, duration: DURATION.pulse }],
    }));
  },

  press: (partId, down) => {
    set((s) => ({ pressed: { ...s.pressed, [partId]: down } }));
    const { circuit } = get();
    // The trigger button fires one monostable pulse: t = 1.1 · R · C.
    if (down && partId === 'SW2' && circuit.mode === 'monostable') {
      const r = (circuit.parts.find((p) => p.id === 'R1')?.value ?? 0) + (circuit.parts.find((p) => p.id === 'R2')?.value ?? 0);
      const cap = circuit.parts.find((p) => p.id === 'C1')?.value ?? 0;
      set({ pulseUntil: performance.now() / 1000 + 1.1 * r * cap });
    }
  },

  undo: () => {
    const last = get().past[get().past.length - 1];
    if (!last) {
      get().showToast('Nothing to undo yet.', 'error');
      return;
    }
    const undone = get().history[0];
    set((s) => ({ circuit: last.circuit, history: last.history, past: s.past.slice(0, -1), anims: [] }));
    get().showToast(`Undid “${undone?.title ?? 'last change'}”.`);
  },

  endAnim: (partId) => set((s) => ({ anims: s.anims.filter((a) => a.partId !== partId) })),
}));
