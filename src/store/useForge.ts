import { create } from 'zustand';
import { initialCircuit, initialHistory } from '../circuit/initial';
import { runCommand, type AnimSpec } from '../circuit/commands';
import type { Circuit, HistoryEntry } from '../circuit/types';
import { DEFAULT_OLLAMA, translate, type OllamaSettings } from '../ai/ollama';

export type Engine = 'builtin' | 'ollama';

const SETTINGS_KEY = 'ef.ai';
function loadAi(): { engine: Engine; ollama: OllamaSettings } {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (raw?.engine && raw?.ollama?.url) return raw;
  } catch {
    /* storage blocked or empty */
  }
  return { engine: 'builtin', ollama: DEFAULT_OLLAMA };
}
function saveAi(v: { engine: Engine; ollama: OllamaSettings }) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export type ViewCommand = 'zoomIn' | 'zoomOut' | 'fit' | 'iso' | 'top' | 'reset';
export type PanelTab = 'history' | 'circuit';
export type Page = 'dashboard' | 'lessons' | 'lab' | 'components';
export const PAGES: Page[] = ['dashboard', 'lessons', 'lab', 'components'];

const pageFromHash = (): Page => {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#\/?/, '') as Page;
  return PAGES.includes(h) ? h : 'dashboard';
};

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
  page: Page;
  goto: (p: Page) => void;
  /** Go to the dashboard and run prompts one after another. */
  runOnBoard: (prompts: string[]) => Promise<void>;
  engine: Engine;
  ollama: OllamaSettings;
  setAi: (engine: Engine, ollama?: OllamaSettings) => void;
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

export const useForge = create<ForgeState>((set, get) => {
  /** Runs one parser command against the board. Returns false (with a toast) if it didn't apply. */
  const apply = (text: string): boolean => {
    const result = runCommand(text, get().circuit);
    if (!result.ok) {
      get().showToast(result.message, 'error');
      return false;
    }
    const now = performance.now() / 1000;
    const entry: HistoryEntry = { ...result.entry, id: `h${++seq}`, at: Date.now() };
    set((s) => ({
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
  };

  return {
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
  page: pageFromHash(),
  goto: (page) => {
    if (location.hash !== `#/${page}`) location.hash = `/${page}`;
    set({ page });
  },
  runOnBoard: async (prompts) => {
    get().goto('dashboard');
    await wait(500); // let the 3D view mount first
    for (const p of prompts) {
      await get().submit(p);
      await wait(900);
    }
  },
  ...loadAi(),
  setAi: (engine, ollama) => {
    const next = { engine, ollama: ollama ?? get().ollama };
    saveAi(next);
    set(next);
  },
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
    try {
      if (get().engine === 'ollama') {
        let commands: string[] | null = null;
        let reply = '';
        try {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), 45_000);
          const t = await translate(text, get().circuit, get().ollama, ctl.signal);
          clearTimeout(timer);
          commands = t.commands;
          reply = t.reply;
        } catch (e) {
          get().showToast(`Couldn't reach the local model (${(e as Error).message}). Used the built-in parser instead.`, 'error');
        }
        if (commands) {
          if (!commands.length) {
            get().showToast(reply || 'The model had no change to make for that.', 'error');
            return false;
          }
          let any = false;
          for (let i = 0; i < commands.length; i++) {
            if (i > 0) await wait(1300); // let the previous animation play
            const c = commands[i];
            if (/^\s*undo\b/i.test(c)) {
              get().undo();
              any = true;
            } else any = apply(c) || any;
          }
          if (any && reply) get().showToast(reply);
          return any;
        }
      } else {
        // A short beat so the change reads as "the AI worked on it" rather than a snap.
        await wait(650);
      }
      return apply(text);
    } finally {
      set({ thinking: false });
    }
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
};
});
