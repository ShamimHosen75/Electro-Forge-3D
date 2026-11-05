export interface Lesson {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  minutes: number;
  summary: string;
  steps: string[];
  /** Prompts to run on the board when the learner clicks "Try it on the board". */
  tryIt: string[];
  topic: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'ohms-law',
    title: "Ohm's law on a breadboard",
    level: 'Beginner',
    minutes: 8,
    topic: 'Fundamentals',
    summary: 'Voltage, current and resistance, and why every LED needs a resistor in series.',
    steps: [
      'V = I × R: the voltage across a resistor equals the current through it times its resistance.',
      'An LED drops about 2 V, so with a 9 V supply the resistor takes the remaining 7 V.',
      'For 20 mA: R = 7 V / 0.02 A = 350 Ω. A 330 Ω or 390 Ω part is close enough.',
      'A bigger resistor means less current, so the LED glows dimmer.',
    ],
    tryIt: ['swap R3 with 1k'],
  },
  {
    id: 'reading-a-breadboard',
    title: 'Reading a breadboard',
    level: 'Beginner',
    minutes: 6,
    topic: 'Fundamentals',
    summary: 'Which holes are connected: the 5-hole strips, the centre channel and the power rails.',
    steps: [
      'Each numbered column is split into two strips of five holes, a–e and f–j.',
      'The centre channel separates those strips, which is why DIP chips straddle it.',
      'The long red (+) and blue (−) rails run along the edges and carry power.',
      'Open the Circuit tab on the dashboard to see the nets these strips form.',
    ],
    tryIt: ['move R3 to a20'],
  },
  {
    id: '555-astable',
    title: 'The 555 timer as a blinker',
    level: 'Beginner',
    minutes: 12,
    topic: '555 timer',
    summary: 'How R1, R2 and C1 set the blink rate of an astable 555.',
    steps: [
      'C1 charges through R1 + R2 and discharges through R2 alone.',
      'The output is high while C1 charges and low while it discharges.',
      'Frequency: f = 1.44 / ((R1 + 2·R2) · C1).',
      'Halve R2 (roughly) and the LED blinks about twice as fast.',
    ],
    tryIt: ['make it blink twice as fast'],
  },
  {
    id: 'capacitors',
    title: 'Capacitors and polarity',
    level: 'Intermediate',
    minutes: 9,
    topic: 'Components',
    summary: 'Electrolytic and ceramic capacitors, and why the stripe matters.',
    steps: [
      'Electrolytic caps are polarised: the striped leg is negative.',
      'Fitting one backwards can leak, heat up or fail.',
      'Ceramic caps such as the 104 (100 nF) are not polarised and are used for decoupling.',
      'A decoupling cap close to pin 8 smooths out supply spikes.',
    ],
    tryIt: ['flip the capacitor', 'flip the capacitor'],
  },
  {
    id: 'monostable',
    title: 'One-shot timers',
    level: 'Intermediate',
    minutes: 10,
    topic: '555 timer',
    summary: 'Turn the blinker into a monostable that fires a single pulse when triggered.',
    steps: [
      'In monostable mode the 555 waits for TRIG (pin 2) to be pulled low.',
      'The output then stays high for t = 1.1 · R · C before it times out.',
      'A pull-up resistor keeps TRIG high until the button is pressed.',
      'Click the yellow trigger button on the board to fire a pulse.',
    ],
    tryIt: ['make it a monostable'],
  },
  {
    id: 'reset-pin',
    title: 'Using the RESET pin',
    level: 'Advanced',
    minutes: 7,
    topic: '555 timer',
    summary: 'Pull pin 4 low to stop the timer instantly, with a button and a pull-up.',
    steps: [
      'RESET (pin 4) is active-low: tie it high for normal operation.',
      'A hard wire to + works, but a 10 kΩ pull-up lets a button override it.',
      'While the button is held, the output is forced low and the LED goes dark.',
    ],
    tryIt: ['add a reset button'],
  },
];
