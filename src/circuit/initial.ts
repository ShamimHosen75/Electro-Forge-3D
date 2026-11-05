import type { Circuit, HistoryEntry } from './types';

/** NE555 astable LED blinker, about 0.75 Hz. */
export const initialCircuit: Circuit = {
  name: 'LED Blinker',
  version: 'v2.3',
  mode: 'astable',
  parts: [
    // Pins 1-4 along row e, pins 8-5 along row f (DIP numbering).
    { id: 'U1', kind: 'ic555', pins: ['e10', 'e11', 'e12', 'e13', 'f13', 'f12', 'f11', 'f10'] },
    { id: 'R1', kind: 'resistor', value: 10e3, pins: ['g7', 'g11'] },
    { id: 'R2', kind: 'resistor', value: 91e3, pins: ['h11', 'h16'] },
    { id: 'R3', kind: 'resistor', value: 220, pins: ['c12', 'c17'] },
    { id: 'D1', kind: 'led', color: 'red', pins: ['b17', 'b18'] },
    { id: 'C1', kind: 'electrolytic', value: 10e-6, pins: ['i3', 'i2'] },
    { id: 'C2', kind: 'ceramic', value: 100e-9, pins: ['BP14', 'BN14'] },
  ],
  wires: [
    { id: 'W1', from: 'FP1', to: 'BP1', color: '#d63a2f' },
    { id: 'W2', from: 'FN2', to: 'BN2', color: '#2a2a2e' },
    { id: 'W3', from: 'j10', to: 'BP10', color: '#d63a2f' },
    { id: 'W4', from: 'a10', to: 'FN10', color: '#2a2a2e' },
    { id: 'W5', from: 'a13', to: 'FP13', color: '#d63a2f' },
    { id: 'W6', from: 'j7', to: 'BP7', color: '#d63a2f' },
    { id: 'W7', from: 'g12', to: 'd11', color: '#2f62c8' },
    { id: 'W8', from: 'i16', to: 'i12', color: '#2f62c8' },
    { id: 'W9', from: 'j3', to: 'j12', color: '#e07a22' },
    { id: 'W10', from: 'j2', to: 'BN3', color: '#2a2a2e' },
    { id: 'W11', from: 'c18', to: 'FN19', color: '#2a2a2e' },
  ],
};

const min = 60_000;

export function initialHistory(now = Date.now()): HistoryEntry[] {
  return [
    {
      id: 'h5',
      type: 'added',
      title: 'Added a decoupling cap',
      chips: [{ icon: 'ceramic', text: 'C2 · 100 nF' }],
      description: 'Steadies the supply rail near pin 8.',
      at: now - 2 * min,
    },
    {
      id: 'h4',
      type: 'modified',
      title: 'Recolored the blink LED',
      diff: { from: 'Green', to: 'Red' },
      description: 'Swapped the indicator LED to red.',
      at: now - 3 * min,
    },
    {
      id: 'h3',
      type: 'modified',
      title: 'Recolored the blink LED',
      diff: { from: 'Red', to: 'Green' },
      description: 'Swapped the indicator LED to green.',
      at: now - 3.2 * min,
    },
    {
      id: 'h2',
      type: 'modified',
      title: 'Tuned the blink rate',
      diff: { from: '1.01 Hz', to: '0.75 Hz' },
      description: 'Raised R2 to slow the oscillation down.',
      at: now - 5 * min,
    },
    {
      id: 'h1',
      type: 'generated',
      title: 'Generated the base circuit',
      chips: [
        { icon: 'ic555', text: 'NE555' },
        { icon: 'resistor', text: 'R1 · R2' },
        { icon: 'electrolytic', text: 'C1' },
        { icon: 'led', text: 'LED' },
      ],
      description: 'Astable 555 driving a single indicator LED.',
      at: now - 5.4 * min,
    },
  ];
}
