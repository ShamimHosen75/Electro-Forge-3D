import { Activity, Gauge, Timer } from 'lucide-react';
import { useForge } from '../store/useForge';
import { blinkStats, formatHz, formatValue } from '../circuit/values';
import { holeLabel } from '../circuit/board';
import { PartIcon } from './PartIcon';

export function CircuitTab() {
  const circuit = useForge((s) => s.circuit);
  const { freq, duty } = blinkStats(circuit);
  const stats = [
    { icon: Activity, label: 'Blink rate', value: circuit.mode === 'astable' ? formatHz(freq) : 'one-shot' },
    { icon: Timer, label: 'Period', value: circuit.mode === 'astable' ? `${(1 / freq).toFixed(2)} s` : '—' },
    { icon: Gauge, label: 'Duty cycle', value: `${Math.round(duty * 100)} %` },
  ];
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5">
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-line/80 bg-card px-3 py-3">
            <div className="flex items-center gap-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="mt-1.5 font-mono text-[16px] text-ink">{value}</div>
          </div>
        ))}
      </div>

      <h4 className="label-caps mb-2.5 mt-6 text-[13px] text-ink/75">Parts · {circuit.parts.length}</h4>
      <ul className="overflow-hidden rounded-xl border border-line/80 bg-card">
        {circuit.parts.map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 last:border-0">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white/60 text-ink/70">
              <PartIcon icon={p.kind} />
            </span>
            <span className="w-9 font-display text-[16px] font-bold">{p.id}</span>
            <span className="flex-1 text-[15px] text-ink/80">
              {formatValue(p)}
              {p.reversed && <span className="ml-2 rounded bg-forge-soft px-1.5 font-mono text-[11px] text-forge">reversed</span>}
            </span>
            <span className="font-mono text-[12px] text-muted">
              {p.kind === 'ic555' ? `${holeLabel(p.pins[0])}…` : p.pins.map(holeLabel).join(' · ')}
            </span>
          </li>
        ))}
      </ul>

      <h4 className="label-caps mb-2.5 mt-6 text-[13px] text-ink/75">Jumpers · {circuit.wires.length}</h4>
      <ul className="grid grid-cols-2 gap-2">
        {circuit.wires.map((w) => (
          <li key={w.id} className="flex items-center gap-2 rounded-lg border border-line/70 bg-card px-3 py-2 font-mono text-[12px] text-ink/75">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }} />
            {holeLabel(w.from)} → {holeLabel(w.to)}
          </li>
        ))}
      </ul>
    </div>
  );
}
