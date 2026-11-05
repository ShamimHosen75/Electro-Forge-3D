import { Bell, CornerDownLeft, History, Search, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PAGES, useForge } from '../store/useForge';
import { formatValue } from '../circuit/values';
import { PartIcon } from './PartIcon';
import { SUGGESTIONS } from './PromptBar';
import { relativeTime } from './useRelativeTime';

const NAV = ['Dashboard', 'Lessons', 'Lab', 'Components'];

const NOTIFICATIONS = [
  { title: 'New lesson: 555 timer basics', body: 'Learn how R1, R2 and C1 set the blink rate.', when: '1 h ago' },
  { title: 'Forge AI tip', body: 'Try "move R3 to a20" or click a part in the Circuit tab to find it.', when: 'Yesterday' },
];

function useClickAway(onAway: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onAway]);
  return ref;
}

function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const circuit = useForge((s) => s.circuit);
  const history = useForge((s) => s.history);
  const highlight = useForge((s) => s.highlight);
  const setTab = useForge((s) => s.setTab);
  const runOnBoard = useForge((s) => s.runOnBoard);
  const goto = useForge((s) => s.goto);
  const ref = useClickAway(() => setOpen(false));

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    const has = (s: string) => s.toLowerCase().includes(t);
    return {
      parts: circuit.parts.filter((p) => has(p.id) || has(p.kind) || has(formatValue(p))).slice(0, 5),
      changes: history.filter((h) => has(h.title) || has(h.description)).slice(0, 4),
      ideas: SUGGESTIONS.filter(has),
    };
  }, [q, circuit, history]);

  const empty = results && !results.parts.length && !results.changes.length && !results.ideas.length;
  const close = () => {
    setOpen(false);
    setQ('');
  };

  return (
    <div ref={ref} className="relative ml-20 max-w-[705px] flex-1">
      <label className="flex h-[54px] items-center gap-3 rounded-xl border border-line bg-[#f3eee4] px-5 text-muted transition focus-within:border-forge/50 focus-within:bg-white/60">
        <Search className="h-[18px] w-[18px]" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && close()}
          className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted/90 focus:outline-none"
          placeholder="Search circuits, components, lessons..."
        />
      </label>
      {open && results && (
        <div className="panel absolute left-0 right-0 top-[62px] z-40 max-h-[420px] animate-cardIn overflow-y-auto p-2">
          {empty && <p className="px-3 py-3 text-[15px] text-muted">No parts or changes match “{q}”.</p>}
          {!!results.parts.length && <Group label="On the board" />}
          {results.parts.map((p) => (
            <Row
              key={p.id}
              onClick={() => {
                goto('dashboard');
                setTab('circuit');
                setTimeout(() => highlight(p.id), 300);
                close();
              }}
              icon={<PartIcon icon={p.kind} />}
              title={`${p.id} · ${formatValue(p)}`}
              meta="Show"
            />
          ))}
          {!!results.changes.length && <Group label="History" />}
          {results.changes.map((h) => (
            <Row
              key={h.id}
              onClick={() => {
                goto('dashboard');
                setTab('history');
                close();
              }}
              icon={<History className="h-3.5 w-3.5" />}
              title={h.title}
              meta={relativeTime(h.at)}
            />
          ))}
          {!!results.ideas.length && <Group label="Ask Forge AI" />}
          {results.ideas.map((s) => (
            <Row
              key={s}
              onClick={() => {
                runOnBoard([s]);
                close();
              }}
              icon={<CornerDownLeft className="h-3.5 w-3.5" />}
              title={s}
              meta="Run"
            />
          ))}
        </div>
      )}
    </div>
  );
}

const Group = ({ label }: { label: string }) => (
  <div className="px-3 pb-1 pt-2.5 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
);

function Row({ icon, title, meta, onClick }: { icon: React.ReactNode; title: string; meta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-black/[0.04]">
      <span className="grid h-7 w-7 place-items-center rounded-md border border-line bg-card text-ink/70">{icon}</span>
      <span className="flex-1 text-[15px] text-ink">{title}</span>
      <span className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{meta}</span>
    </button>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  const ref = useClickAway(() => setOpen(false));
  return (
    <div ref={ref} className="relative ml-2">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setUnread(0);
        }}
        className="relative rounded-lg p-2 text-ink/70 transition hover:bg-black/5"
        aria-label="Notifications"
      >
        <Bell className="h-[22px] w-[22px]" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-forge font-display text-[11px] font-bold text-white ring-2 ring-paper">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="panel absolute right-0 top-[52px] z-40 w-[340px] animate-cardIn p-2">
          <div className="px-3 pb-1 pt-2 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
            Notifications
          </div>
          {NOTIFICATIONS.map((n) => (
            <div key={n.title} className="rounded-lg px-3 py-2.5 hover:bg-black/[0.03]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[16px] font-bold">{n.title}</span>
                <span className="shrink-0 font-display text-[12px] text-muted">{n.when}</span>
              </div>
              <p className="mt-0.5 text-[14px] leading-snug text-ink/70">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const page = useForge((s) => s.page);
  return (
    <header className="panel absolute left-5 right-5 top-5 z-20 flex h-[86px] items-center gap-8 px-7">
      <a href="#/dashboard" className="flex shrink-0 items-center gap-4">
        <span className="grid h-[52px] w-[52px] place-items-center rounded-xl border border-line bg-card shadow-[inset_0_1px_0_#fff]">
          <Zap className="h-6 w-6 text-forge" strokeWidth={1.8} />
        </span>
        <span className="leading-none">
          <span className="block font-display text-[30px] font-bold tracking-[0.02em]">
            <span className="text-forge">CIRCUIT</span>FORGE
            <span className="ml-1.5 inline-block -translate-y-[3px] rounded-md bg-forge px-1.5 py-0.5 align-middle text-[14px] leading-none tracking-[0.08em] text-white">AI</span>
          </span>
          <span className="mt-1 flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
            <span className="hazard w-[30px] text-forge" />
            Build • Learn • Innovate
            <span className="hazard w-[30px] text-forge" />
          </span>
        </span>
      </a>

      <SearchBox />

      <nav className="ml-auto flex items-center gap-7">
        {NAV.map((n, i) => (
          <a
            key={n}
            href={`#/${PAGES[i]}`}
            aria-current={page === PAGES[i] ? 'page' : undefined}
            className={`relative py-2 font-display text-[17px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              page === PAGES[i] ? 'text-forge' : 'text-ink/75 hover:text-ink'
            }`}
          >
            {n}
            <span
              className={`absolute -bottom-1 left-0 right-0 h-[3px] origin-left rounded-full bg-forge transition-transform duration-300 ${
                page === PAGES[i] ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </a>
        ))}
        <Notifications />
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#e9dfcf] to-[#d8cbb5] font-display text-[15px] font-bold text-ink/70 ring-1 ring-line">
          MD
        </span>
      </nav>
    </header>
  );
}
