import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PartKind } from '../circuit/types';
import { useForge } from '../store/useForge';
import { PartIcon } from './PartIcon';

const ITEMS: { kind: PartKind; label: string; cmd: string; note: string }[] = [
  { kind: 'resistor', label: 'Resistor', cmd: 'add a 1k resistor', note: '1 kΩ' },
  { kind: 'led', label: 'LED', cmd: 'add a red led', note: 'red' },
  { kind: 'electrolytic', label: 'Electrolytic cap', cmd: 'add a 10uF capacitor', note: '10 µF' },
  { kind: 'ceramic', label: 'Ceramic cap', cmd: 'add a 100nF ceramic capacitor', note: '100 nF' },
  { kind: 'button', label: 'Push button', cmd: 'add a button', note: 'momentary' },
];

/** "+" button on the view toolbar: drops a new part on a free spot and selects it. */
export function AddPartMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const exec = useForge((s) => s.exec);
  const select = useForge((s) => s.select);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const add = (cmd: string) => {
    const before = new Set(useForge.getState().circuit.parts.map((p) => p.id));
    if (exec(cmd)) {
      const added = useForge.getState().circuit.parts.find((p) => !before.has(p.id));
      if (added) select(added.id);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        title="Add a part"
        aria-label="Add a part"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`grid h-10 w-10 place-items-center rounded-lg transition active:scale-95 ${
          open ? 'bg-forge text-white' : 'bg-forge-soft text-forge hover:bg-forge hover:text-white'
        }`}
      >
        <Plus className="h-5 w-5" strokeWidth={2.2} />
      </button>
      {open && (
        <div className="panel absolute left-[52px] top-0 z-30 w-[240px] animate-cardIn p-1.5" role="menu">
          <div className="px-2.5 pb-1 pt-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Add a part</div>
          {ITEMS.map((it) => (
            <button
              key={it.kind}
              role="menuitem"
              onClick={() => add(it.cmd)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-black/[0.04]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-card text-ink/70">
                <PartIcon icon={it.kind} />
              </span>
              <span className="flex-1 font-display text-[16px] font-semibold">{it.label}</span>
              <span className="font-mono text-[12px] text-muted">{it.note}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
