import { create } from 'zustand';
import { initialCircuit, initialHistory } from '../circuit/initial';
import type { Circuit, HistoryEntry } from '../circuit/types';

export type ViewCommand = 'zoomIn' | 'zoomOut' | 'fit' | 'iso' | 'top' | 'reset';
export type PanelTab = 'history' | 'circuit';

interface ForgeState {
  circuit: Circuit;
  history: HistoryEntry[];
  tab: PanelTab;
  view: { cmd: ViewCommand; nonce: number } | null;
  toast: { text: string; nonce: number } | null;
  setTab: (t: PanelTab) => void;
  sendView: (cmd: ViewCommand) => void;
  showToast: (text: string) => void;
}

export const useForge = create<ForgeState>((set) => ({
  circuit: initialCircuit,
  history: initialHistory(),
  tab: 'history',
  view: null,
  toast: null,
  setTab: (tab) => set({ tab }),
  sendView: (cmd) => set({ view: { cmd, nonce: Date.now() + Math.random() } }),
  showToast: (text) => set({ toast: { text, nonce: Date.now() } }),
}));
