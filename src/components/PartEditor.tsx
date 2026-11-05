import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, FlipHorizontal2, MousePointer2, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { holeLabel } from '../circuit/board';
import type { HoleId, LedColor, Part } from '../circuit/types';
import { LED_COLORS, formatFarads, formatOhms, formatValue } from '../circuit/values';
import { useForge } from '../store/useForge';
import { PartIcon } from './PartIcon';
import { ledPowered } from '../circuit/netlist';

const ROWS = 'abcdefghij';

/** The hole one step away from `h`, or null off the edge. Rails only move sideways. */
export function nudgeHole(h: HoleId, dCol: number, dRow: number): HoleId | null {
  const m = /^([a-j])(\d{1,2})$/.exec(h);
  if (m) {
    const r = ROWS.indexOf(m[1]) + dRow;
    const c = Number(m[2]) + dCol;
    return r >= 0 && r < 10 && c >= 1 && c <= 30 ? `${ROWS[r]}${c}` : null;
  }
  const rail = /^(FP|FN|BP|BN)(\d{1,2})$/.exec(h);
  if (rail && !dRow) {
    let c = Number(rail[2]) + dCol;
    if (c % 6 === 0) c += dCol; // skip the gap between rail groups
    return c >= 1 && c <= 29 ? `${rail[1]}${c}` : null;
  }
  return null;
}

const NAMES: Record<Part['kind'], string> = {
  ic555: 'NE555 timer',
  resistor: 'Resistor',
  led: 'LED',
  electrolytic: 'Electrolytic capacitor',
  ceramic: 'Ceramic capacitor',
  button: 'Push button',
};

const OHM_UNITS = [
  { label: 'Ω', k: 1 },
  { label: 'kΩ', k: 1e3 },
  { label: 'MΩ', k: 1e6 },
];
const FARAD_UNITS = [
  { label: 'pF', k: 1e-12 },
  { label: 'nF', k: 1e-9 },
  { label: 'µF', k: 1e-6 },
];
const QUICK_OHMS = [220, 1e3, 4.7e3, 10e3, 47e3, 100e3];
const QUICK_ELECTRO = [1e-6, 4.7e-6, 10e-6, 22e-6, 100e-6];
const QUICK_CERAMIC = [10e-9, 22e-9, 47e-9, 100e-9];

/** "4.7k", "22uF" etc. for the command parser. */
const ohmToken = (v: number) => (v >= 1e6 ? `${+(v / 1e6).toPrecision(3)}M` : v >= 1e3 ? `${+(v / 1e3).toPrecision(3)}k` : `${+v.toPrecision(3)}`);
const faradToken = (v: number) =>
  v >= 1e-6 ? `${+(v * 1e6).toPrecision(3)}uF` : v >= 1e-9 ? `${+(v * 1e9).toPrecision(3)}nF` : `${+(v * 1e12).toPrecision(3)}pF`;

function splitValue(v: number, units: { label: string; k: number }[]) {
  const u = [...units].reverse().find((x) => v >= x.k) ?? units[0];
  return { n: +(v / u.k).toPrecision(4), unit: u.label };
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{children}</div>
);

function ValueEditor({ part, exec }: { part: Part; exec: (t: string) => boolean }) {
  const isR = part.kind === 'resistor';
  const units = isR ? OHM_UNITS : FARAD_UNITS;
  const init = splitValue(part.value ?? 0, units);
  const [n, setN] = useState(init.n);
  const [unit, setUnit] = useState(init.unit);
  useEffect(() => {
    const v = splitValue(part.value ?? 0, units);
    setN(v.n);
    setUnit(v.unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part.id, part.value]);

  const apply = (v: number) => exec(`swap ${part.id} with ${isR ? ohmToken(v) : faradToken(v)}`);
  const typed = n * (units.find((u) => u.label === unit)?.k ?? 1);
  const quick = isR ? QUICK_OHMS : part.kind === 'electrolytic' ? QUICK_ELECTRO : QUICK_CERAMIC;
  const fmt = isR ? formatOhms : formatFarads;

  return (
    <div>
      <Label>Value</Label>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed > 0 && Math.abs(typed - (part.value ?? 0)) > typed * 1e-6) apply(typed);
        }}
      >
        <input
          type="number"
          min={0}
          step="any"
          value={n}
          aria-label="Value"
          onChange={(e) => setN(Number(e.target.value))}
          className="w-0 flex-1 rounded-lg border border-line bg-white/70 px-2.5 py-1.5 font-mono text-[14px] focus:border-forge/50 focus:outline-none"
        />
        <select
          value={unit}
          aria-label="Unit"
          onChange={(e) => setUnit(e.target.value)}
          className="rounded-lg border border-line bg-white/70 px-2 font-mono text-[13px] focus:outline-none"
        >
          {units.map((u) => (
            <option key={u.label}>{u.label}</option>
          ))}
        </select>
        <button className="rounded-lg bg-forge px-3 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-white hover:brightness-110">
          Set
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {quick.map((v) => (
          <button
            key={v}
            onClick={() => apply(v)}
            disabled={Math.abs(v - (part.value ?? 0)) < v * 1e-6}
            className="rounded-md border border-line bg-white/60 px-2 py-0.5 font-mono text-[12px] text-ink/75 transition hover:border-forge/40 hover:text-forge disabled:border-forge/40 disabled:bg-forge-soft disabled:text-forge"
          >
            {fmt(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PartEditor() {
  const selected = useForge((s) => s.selected);
  const part = useForge((s) => s.circuit.parts.find((p) => p.id === s.selected));
  const exec = useForge((s) => s.exec);
  const select = useForge((s) => s.select);
  const circuit = useForge((s) => s.circuit);
  const [moveTo, setMoveTo] = useState('');
  useEffect(() => setMoveTo(''), [selected]);

  if (!part) return null;
  const movable = part.kind !== 'ic555';
  const polar = part.kind === 'electrolytic' || part.kind === 'led';
  const nudge = (dc: number, dr: number) => {
    const h = nudgeHole(part.pins[0], dc, dr);
    if (h) exec(`move ${part.id} to ${h}`);
  };

  return (
    <div className="panel absolute right-5 top-5 z-20 w-[300px] animate-cardIn p-4" role="dialog" aria-label={`Edit ${part.id}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-forge/40 bg-forge-soft text-forge [&_svg]:h-5 [&_svg]:w-5">
          <PartIcon icon={part.kind} />
        </span>
        <div className="flex-1">
          <div className="font-display text-[20px] font-bold leading-tight">
            {part.id} <span className="font-medium text-ink/60">· {formatValue(part)}</span>
          </div>
          <div className="font-display text-[13px] uppercase tracking-[0.1em] text-muted">
            {NAMES[part.kind]}
            {part.role ? ` · ${part.role}` : ''}
          </div>
        </div>
        <button onClick={() => select(null)} aria-label="Close editor" className="rounded-lg p-1.5 text-ink/50 hover:bg-black/5">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {(part.kind === 'resistor' || part.kind === 'electrolytic' || part.kind === 'ceramic') && <ValueEditor part={part} exec={exec} />}

        {part.kind === 'led' && (
          <div>
            <Label>Colour</Label>
            <div className="flex gap-2">
              {(Object.keys(LED_COLORS) as LedColor[]).map((c) => (
                <button
                  key={c}
                  title={c}
                  aria-label={`Make it ${c}`}
                  onClick={() => part.color !== c && exec(`change ${part.id} color to ${c}`)}
                  className={`h-7 w-7 rounded-full ring-1 ring-black/15 transition hover:scale-110 ${
                    (part.color ?? 'red') === c ? 'ring-2 ring-forge ring-offset-2 ring-offset-paper' : ''
                  }`}
                  style={{ background: LED_COLORS[c].body }}
                />
              ))}
            </div>
            {part.id !== 'D1' && !ledPowered(circuit, part.id) && (
              <p className="mt-2 rounded-lg bg-warn-soft px-2.5 py-1.5 text-[12.5px] leading-snug text-warn">
                Dark: it isn't wired across the supply yet. Ask e.g. “wire {part.pins[0].replace(/^c/, 'b')} to FP{part.pins[0].replace(/\D/g, '')}” plus a resistor, and its other leg to FN.
              </p>
            )}
          </div>
        )}

        {movable && (
          <div>
            <Label>Position · {part.pins.map(holeLabel).join(' → ')}</Label>
            <div className="flex items-center gap-2">
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (moveTo.trim() && exec(`move ${part.id} to ${moveTo.trim()}`)) setMoveTo('');
                }}
              >
                <input
                  value={moveTo}
                  onChange={(e) => setMoveTo(e.target.value)}
                  placeholder="e.g. a20"
                  aria-label="Move to hole"
                  className="w-0 flex-1 rounded-lg border border-line bg-white/70 px-2.5 py-1.5 font-mono text-[14px] focus:border-forge/50 focus:outline-none"
                />
                <button className="rounded-lg border border-line bg-card px-3 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-ink/80 hover:text-forge">
                  Move
                </button>
              </form>
              <div className="grid grid-cols-3 gap-0.5">
                <span />
                <NudgeBtn icon={ArrowUp} label="Nudge back" onClick={() => nudge(0, 1)} />
                <span />
                <NudgeBtn icon={ArrowLeft} label="Nudge left" onClick={() => nudge(-1, 0)} />
                <span />
                <NudgeBtn icon={ArrowRight} label="Nudge right" onClick={() => nudge(1, 0)} />
                <span />
                <NudgeBtn icon={ArrowDown} label="Nudge forward" onClick={() => nudge(0, -1)} />
                <span />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {polar && (
            <button
              onClick={() => exec(`flip ${part.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-card py-2 font-display text-[14px] font-semibold uppercase tracking-[0.06em] text-ink/80 hover:text-forge"
            >
              <FlipHorizontal2 className="h-4 w-4" /> {part.reversed ? 'Unflip' : 'Flip'}
            </button>
          )}
          {movable && (
            <button
              onClick={() => exec(`remove ${part.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-forge/30 bg-forge-soft/60 py-2 font-display text-[14px] font-semibold uppercase tracking-[0.06em] text-forge hover:bg-forge-soft"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-line/70 pt-3 text-[12.5px] text-muted">
        <MousePointer2 className="h-3.5 w-3.5" />
        {movable ? 'Drag it on the board, or use arrow keys. Del removes it.' : 'The 555 stays put. Edit the parts around it.'}
      </p>
    </div>
  );
}

function NudgeBtn({ icon: Icon, label, onClick }: { icon: typeof ArrowUp; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="grid h-6 w-6 place-items-center rounded border border-line bg-card text-ink/60 hover:text-forge">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
