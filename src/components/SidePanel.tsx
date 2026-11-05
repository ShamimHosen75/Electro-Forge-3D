import { CircuitBoard, History } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForge } from '../store/useForge';
import { HistoryCard } from './HistoryCard';
import { CircuitTab } from './CircuitTab';

function Tabs() {
  const tab = useForge((s) => s.tab);
  const setTab = useForge((s) => s.setTab);
  const count = useForge((s) => s.history.length);
  const items = [
    { id: 'history' as const, label: 'History', icon: History, badge: count },
    { id: 'circuit' as const, label: 'Circuit', icon: CircuitBoard },
  ];
  return (
    <div className="relative flex h-[58px] border-b border-line/80 px-2.5">
      {items.map(({ id, label, icon: Icon, badge }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`relative flex flex-1 items-center justify-center gap-2.5 font-display text-[17px] font-semibold uppercase tracking-[0.08em] transition-colors ${
            tab === id ? 'text-forge' : 'text-ink/70 hover:text-ink'
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {label}
          {badge !== undefined && (
            <span
              key={badge}
              className="ml-1 animate-cardIn rounded-full bg-forge-soft px-2 py-px font-mono text-[12px] font-medium text-forge"
            >
              {badge}
            </span>
          )}
          <span
            className={`absolute -bottom-px left-0 right-0 h-[3px] rounded-full bg-forge transition-opacity ${
              tab === id ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function Timeline() {
  const history = useForge((s) => s.history);
  // Cards that exist on first render don't animate; anything added later does.
  const seen = useRef<Set<string> | null>(null);
  if (!seen.current) seen.current = new Set(history.map((h) => h.id));
  useEffect(() => {
    history.forEach((h) => seen.current!.add(h.id));
  });
  return (
    <>
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <span className="flex items-center gap-2.5 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/75">
          Change timeline <span className="hazard w-[44px] text-[#cfc5b4]" />
        </span>
        <span className="font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Newest first</span>
      </div>
      <div className="thin-scroll relative min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <ol className="relative flex flex-col gap-[22px]">
          <span className="absolute bottom-0 left-[18.5px] top-4 w-px bg-line" aria-hidden />
          {history.map((h) => (
            <HistoryCard key={h.id} entry={h} fresh={!seen.current!.has(h.id)} />
          ))}
        </ol>
      </div>
    </>
  );
}

export function SidePanel() {
  const tab = useForge((s) => s.tab);
  return (
    <aside className="panel absolute bottom-5 right-5 top-[126px] z-10 flex w-[465px] flex-col overflow-hidden">
      <Tabs />
      {tab === 'history' ? <Timeline /> : <CircuitTab />}
    </aside>
  );
}
