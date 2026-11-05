import type { PartKind } from '../circuit/types';

export interface CatalogItem {
  name: string;
  kind: PartKind;
  category: 'Passive' | 'Active' | 'Optoelectronics' | 'Electromechanical';
  blurb: string;
  specs: [string, string][];
  pins: string;
  prompt: string;
}

export const CATALOG: CatalogItem[] = [
  {
    name: 'NE555 timer',
    kind: 'ic555',
    category: 'Active',
    blurb: 'Classic timer IC for blinkers, one-shots, tone generators and PWM.',
    specs: [['Supply', '4.5–16 V'], ['Output', '200 mA'], ['Package', 'DIP-8']],
    pins: '1 GND · 2 TRIG · 3 OUT · 4 RESET · 5 CV · 6 THR · 7 DIS · 8 VCC',
    prompt: 'make it blink twice as fast',
  },
  {
    name: 'Carbon film resistor',
    kind: 'resistor',
    category: 'Passive',
    blurb: 'Limits current and sets timing. The colour bands give its value.',
    specs: [['Range', '1 Ω – 10 MΩ'], ['Power', '¼ W'], ['Tolerance', '±5 % (gold)']],
    pins: 'Non-polarised: either way round',
    prompt: 'swap R3 with 470',
  },
  {
    name: '5 mm LED',
    kind: 'led',
    category: 'Optoelectronics',
    blurb: 'Lights when current flows from the long leg (anode) to the short leg (cathode).',
    specs: [['Forward V', '1.8–3.3 V'], ['Current', '20 mA'], ['Colours', '6']],
    pins: 'Anode (+) long leg · Cathode (−) flat side',
    prompt: 'change led color to blue',
  },
  {
    name: 'Electrolytic capacitor',
    kind: 'electrolytic',
    category: 'Passive',
    blurb: 'Large capacitance in a small can, used here as the timing cap.',
    specs: [['Range', '1 µF – 4700 µF'], ['Voltage', '25 V'], ['Polarised', 'Yes']],
    pins: 'Striped leg is negative',
    prompt: 'swap C1 with 22uF',
  },
  {
    name: 'Ceramic disc capacitor',
    kind: 'ceramic',
    category: 'Passive',
    blurb: 'Small, non-polarised cap for decoupling and filtering. 104 means 100 nF.',
    specs: [['Range', '10 pF – 1 µF'], ['Voltage', '50 V'], ['Polarised', 'No']],
    pins: 'Non-polarised',
    prompt: 'remove C2',
  },
  {
    name: 'Tactile push button',
    kind: 'button',
    category: 'Electromechanical',
    blurb: 'Momentary switch that closes while pressed: good for reset and trigger inputs.',
    specs: [['Size', '6 × 6 mm'], ['Rating', '50 mA'], ['Travel', '0.25 mm']],
    pins: 'Two legs per side are joined',
    prompt: 'add a reset button',
  },
];
