import { ArrowRight, Calculator, Lightbulb, Palette } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { BAND_COLORS, GOLD, LED_COLORS, blinkStats, formatFarads, formatHz, formatOhms } from '../circuit/values';
import type { LedColor } from '../circuit/types';
import { useForge } from '../store/useForge';
import { PageShell } from './PageShell';

const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
function nearestE12(v: number) {
  const exp = Math.floor(Math.log10(v));
  const base = v / 10 ** exp;
  const pick = [...E12, 10].reduce((a, b) => (Math.abs(b - base) < Math.abs(a - base) ? b : a));
  return pick * 10 ** exp;
}

/** Plain number for the prompt parser, e.g. 4700 -> "4.7k". */
const ohmToken = (v: number) => (v >= 1e3 ? `${Number((v / 1e3).toPrecision(3))}k` : `${Number(v.toPrecision(3))}`);

function Tool({ icon, title, intro, children }: { icon: ReactNode; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="panel flex animate-cardIn flex-col p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-card text-forge">{icon}</span>
        <h2 className="font-display text-[24px] font-bold">{title}</h2>
      </div>
      <p className="mt-2 text-[15px] text-ink/65">{intro}</p>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function Field({ label, unit, value, onChange, step = 'any' }: { label: string; unit: string; value: number; onChange: (n: number) => void; step?: string }) {
  return (
    <label className="block">
      <span className="font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      <span className="mt-1 flex items-center rounded-lg border border-line bg-white/70 pr-3 focus-within:border-forge/50">
        <input
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent px-3 py-2 font-mono text-[15px] focus:outline-none"
        />
        <span className="font-mono text-[13px] text-muted">{unit}</span>
      </span>
    </label>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-line/80 bg-card px-3 py-2.5">
    <div className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</div>
    <div className="mt-0.5 font-mono text-[17px] text-ink">{value}</div>
  </div>
);

function ApplyButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-forge py-3 font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_6px_16px_-6px_rgba(200,55,45,.7)] transition hover:brightness-110 disabled:opacity-50"
    >
      {label} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function AstableDesigner() {
  const circuit = useForge((s) => s.circuit);
  const runOnBoard = useForge((s) => s.runOnBoard);
  const cur = blinkStats(circuit);
  const [r1, setR1] = useState(cur.r1 / 1e3);
  const [r2, setR2] = useState(cur.r2 / 1e3);
  const [c, setC] = useState(cur.cap * 1e6);
  const ok = r1 > 0 && r2 > 0 && c > 0;
  const f = ok ? 1.44 / ((r1 * 1e3 + 2 * r2 * 1e3) * c * 1e-6) : 0;
  const duty = ok ? (r1 + r2) / (r1 + 2 * r2) : 0;

  const wave = useMemo(() => {
    if (!ok) return '';
    const W = 400, H = 60, periods = 4;
    const pw = W / periods;
    let d = `M0 ${H}`;
    for (let i = 0; i < periods; i++) {
      const x = i * pw;
      d += ` L${x} 6 L${x + pw * duty} 6 L${x + pw * duty} ${H} L${x + pw} ${H}`;
    }
    return d;
  }, [ok, duty]);

  const changes = [
    Math.abs(r1 * 1e3 - cur.r1) > 1 && `swap R1 with ${ohmToken(r1 * 1e3)}`,
    Math.abs(r2 * 1e3 - cur.r2) > 1 && `swap R2 with ${ohmToken(r2 * 1e3)}`,
    Math.abs(c * 1e-6 - cur.cap) > 1e-9 && `swap C1 with ${Number(c.toPrecision(3))}uF`,
  ].filter(Boolean) as string[];

  return (
    <Tool icon={<Calculator className="h-5 w-5" />} title="555 blink designer" intro="Pick R1, R2 and C1 and see the blink rate. Then send the values to the board.">
      <div className="grid grid-cols-3 gap-3">
        <Field label="R1" unit="kΩ" value={r1} onChange={setR1} />
        <Field label="R2" unit="kΩ" value={r2} onChange={setR2} />
        <Field label="C1" unit="µF" value={c} onChange={setC} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Frequency" value={ok ? formatHz(f) : '—'} />
        <Stat label="Period" value={ok ? `${(1 / f).toFixed(2)} s` : '—'} />
        <Stat label="Duty" value={ok ? `${Math.round(duty * 100)} %` : '—'} />
      </div>
      <svg viewBox="0 0 400 66" className="mt-4 w-full rounded-lg border border-line/70 bg-card" aria-label="Output waveform">
        <path d={wave} fill="none" stroke="#c8372d" strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      <p className="mt-2 font-mono text-[12px] text-muted">On the board now: {formatHz(cur.freq)} · R2 {formatOhms(cur.r2)} · C1 {formatFarads(cur.cap)}</p>
      <ApplyButton label={changes.length ? 'Apply to board' : 'Board already matches'} disabled={!ok || !changes.length} onClick={() => runOnBoard(changes)} />
    </Tool>
  );
}

const VF: Record<LedColor, number> = { red: 2.0, orange: 2.1, yellow: 2.1, green: 2.2, blue: 3.1, white: 3.2 };

function LedCalculator() {
  const runOnBoard = useForge((s) => s.runOnBoard);
  const [vs, setVs] = useState(9);
  const [color, setColor] = useState<LedColor>('red');
  const [ma, setMa] = useState(20);
  const vf = VF[color];
  const exact = vs > vf && ma > 0 ? (vs - vf) / (ma / 1000) : 0;
  const pick = exact ? nearestE12(exact) : 0;
  const power = pick ? ((vs - vf) ** 2 / pick) * 1000 : 0;

  return (
    <Tool icon={<Lightbulb className="h-5 w-5" />} title="LED resistor" intro="How big should the LED's series resistor be? Pick the supply, colour and current.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Supply" unit="V" value={vs} onChange={setVs} />
        <Field label="Current" unit="mA" value={ma} onChange={setMa} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(VF) as LedColor[]).map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 font-display text-[14px] font-semibold capitalize ${
              color === c ? 'border-ink/40 bg-white text-ink' : 'border-line bg-card text-ink/70'
            }`}
          >
            <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: LED_COLORS[c].body }} />
            {c}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Exact" value={exact ? formatOhms(exact) : '—'} />
        <Stat label="Use (E12)" value={pick ? formatOhms(pick) : '—'} />
        <Stat label="Power" value={pick ? `${power.toFixed(0)} mW` : '—'} />
      </div>
      <p className="mt-3 text-[14px] text-ink/60">
        R = (V<sub>supply</sub> − V<sub>LED</sub>) / I = ({vs} − {vf}) V / {ma} mA
        {vs <= vf && <span className="text-forge">. The supply must be higher than the LED's {vf} V.</span>}
      </p>
      <div className="flex-1" />
      <ApplyButton label={`Use ${pick ? formatOhms(pick) : ''} for R3`} disabled={!pick} onClick={() => runOnBoard([`swap R3 with ${ohmToken(pick)}`])} />
    </Tool>
  );
}

const BAND_NAMES = ['Black', 'Brown', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Violet', 'Grey', 'White'];

function ColorCode() {
  const [d1, setD1] = useState(4);
  const [d2, setD2] = useState(7);
  const [m, setM] = useState(2);
  const value = (d1 * 10 + d2) * 10 ** m;
  const bands = [BAND_COLORS[d1], BAND_COLORS[d2], BAND_COLORS[m], GOLD];

  const Picker = ({ label, v, set, max = 9 }: { label: string; v: number; set: (n: number) => void; max?: number }) => (
    <div>
      <div className="font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {BAND_COLORS.slice(0, max + 1).map((c, i) => (
          <button
            key={i}
            title={BAND_NAMES[i]}
            aria-label={`${label}: ${BAND_NAMES[i]}`}
            onClick={() => set(i)}
            className={`h-7 w-7 rounded-md ring-1 ring-black/10 transition ${v === i ? 'scale-110 ring-2 ring-forge ring-offset-2 ring-offset-paper' : ''}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Tool icon={<Palette className="h-5 w-5" />} title="Colour code reader" intro="Click the bands to decode a 4-band resistor.">
      <svg viewBox="0 0 400 90" className="w-full" aria-label={`Resistor ${formatOhms(value)}`}>
        <line x1="0" y1="45" x2="400" y2="45" stroke="#b9bcc4" strokeWidth="5" />
        <rect x="90" y="18" width="220" height="54" rx="26" fill="#e7d3a8" stroke="#cdb787" />
        {bands.map((c, i) => (
          <rect key={i} x={[128, 160, 192, 262][i]} y="18" width="16" height="54" fill={c} />
        ))}
      </svg>
      <div className="mt-2 text-center font-mono text-[28px] text-ink">{formatOhms(value)} <span className="text-[16px] text-muted">±5 %</span></div>
      <div className="mt-4 space-y-3">
        <Picker label="1st digit" v={d1} set={setD1} />
        <Picker label="2nd digit" v={d2} set={setD2} />
        <Picker label="Multiplier" v={m} set={setM} max={6} />
      </div>
    </Tool>
  );
}

export function LabPage() {
  return (
    <PageShell
      eyebrow="Lab"
      title="Workbench tools"
      intro="Calculators that work out part values for you. The results can be sent straight to the 3D board."
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <AstableDesigner />
        <LedCalculator />
        <ColorCode />
      </div>
    </PageShell>
  );
}
