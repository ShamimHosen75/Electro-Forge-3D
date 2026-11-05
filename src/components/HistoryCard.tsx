import { ArrowLeftRight, ArrowRight, Link2, Minus, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { ChangeType, HistoryEntry } from '../circuit/types';
import { PartIcon } from './PartIcon';
import { useRelativeTime } from './useRelativeTime';

export const TYPE_STYLE: Record<ChangeType, { label: string; text: string; ring: string; chip: string; icon: typeof Plus }> = {
  generated: { label: 'Generated', text: 'text-ok', ring: 'border-ok/70 text-ok', chip: 'border-line bg-white/70 text-ink', icon: Sparkles },
  added: { label: 'Added', text: 'text-ok', ring: 'border-ok/70 text-ok', chip: 'border-ok/40 bg-ok-soft text-ok', icon: Plus },
  modified: { label: 'Modified', text: 'text-warn', ring: 'border-warn/70 text-warn', chip: 'border-warn/40 bg-warn-soft text-warn', icon: SlidersHorizontal },
  rewired: { label: 'Rewired', text: 'text-wire', ring: 'border-wire/70 text-wire', chip: 'border-wire/40 bg-wire-soft text-wire', icon: Link2 },
  swapped: { label: 'Swapped', text: 'text-swap', ring: 'border-swap/70 text-swap', chip: 'border-line bg-white/70 text-ink', icon: ArrowLeftRight },
  removed: { label: 'Removed', text: 'text-forge', ring: 'border-forge/70 text-forge', chip: 'border-forge/40 bg-forge-soft text-forge', icon: Minus },
};

export function HistoryCard({ entry, fresh }: { entry: HistoryEntry; fresh?: boolean }) {
  const s = TYPE_STYLE[entry.type];
  const Icon = s.icon;
  const when = useRelativeTime(entry.at);
  return (
    <li className={`relative flex gap-4 ${fresh ? 'animate-cardIn' : ''}`}>
      <span
        className={`relative z-10 mt-0 grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-[1.5px] bg-paper ${s.ring}`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <article
        className={`min-w-0 flex-1 rounded-xl border border-line/80 bg-card px-[18px] pb-4 pt-3.5 shadow-[0_1px_0_#fff_inset,0_2px_6px_-4px_rgba(60,45,25,.25)] ${
          fresh ? 'animate-flash' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-display text-[13px] font-bold uppercase tracking-[0.08em] ${s.text}`}>{s.label}</span>
          <span className="font-display text-[13px] font-medium text-muted">{when}</span>
        </div>
        <h3 className="mt-1.5 font-display text-[20px] font-bold leading-tight text-ink">{entry.title}</h3>

        {entry.diff && (
          <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[15px]">
            <span className="rounded-md bg-[#ebe4d8] px-2.5 py-1 text-muted line-through decoration-muted/70">
              {entry.diff.from}
            </span>
            <ArrowRight className="h-4 w-4 text-warn" />
            <span className="rounded-md border border-warn/40 bg-warn-soft px-2.5 py-1 text-warn">{entry.diff.to}</span>
          </div>
        )}

        {entry.chips && (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.chips.map((c) => (
              <span
                key={c.text}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-display text-[14px] font-semibold ${s.chip}`}
              >
                <PartIcon icon={c.icon} />
                {c.text}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-[15px] leading-snug text-ink/75">{entry.description}</p>
      </article>
    </li>
  );
}
