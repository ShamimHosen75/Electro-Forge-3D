import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { CATALOG } from '../content/catalog';
import { PartIcon } from '../components/PartIcon';
import { useForge } from '../store/useForge';
import { PageShell } from './PageShell';

export function ComponentsPage() {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const runOnBoard = useForge((s) => s.runOnBoard);
  const onBoard = useForge((s) => s.circuit.parts);
  const cats = ['All', ...new Set(CATALOG.map((c) => c.category))];
  const shown = CATALOG.filter(
    (c) => (cat === 'All' || c.category === cat) && (c.name + c.blurb).toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <PageShell
      eyebrow="Components"
      title="Parts library"
      intro="Every part Forge AI can place on the board: what it does, its key specs and how its pins work."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-1.5 font-display text-[15px] font-semibold transition ${
              cat === c ? 'border-forge bg-forge text-white' : 'border-line bg-paper text-ink/75 hover:text-ink'
            }`}
          >
            {c}
          </button>
        ))}
        <label className="ml-auto flex h-10 w-[280px] items-center gap-2 rounded-xl border border-line bg-paper px-3 text-muted">
          <Search className="h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter parts…"
            className="w-full bg-transparent text-[15px] text-ink focus:outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((c, i) => {
          const count = onBoard.filter((p) => p.kind === c.kind).length;
          return (
            <article key={c.name} style={{ animationDelay: `${i * 50}ms` }} className="panel flex animate-cardIn flex-col p-6">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-card text-forge [&_svg]:h-6 [&_svg]:w-6">
                  <PartIcon icon={c.kind} />
                </span>
                <div className="flex-1">
                  <div className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{c.category}</div>
                  <h3 className="font-display text-[22px] font-bold leading-tight">{c.name}</h3>
                </div>
                {count > 0 && (
                  <span className="rounded-full bg-ok-soft px-2.5 py-0.5 font-display text-[13px] font-semibold text-ok">{count} on board</span>
                )}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-ink/70">{c.blurb}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2">
                {c.specs.map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line/70 bg-card px-3 py-2">
                    <dt className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{k}</dt>
                    <dd className="mt-0.5 font-mono text-[13px] text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex-1 font-mono text-[12px] leading-5 text-ink/60">{c.pins}</p>
              <button
                onClick={() => runOnBoard([c.prompt])}
                className="mt-4 flex items-center gap-2 self-start rounded-lg border border-line bg-card px-3 py-2 font-display text-[14px] font-semibold text-ink/80 transition hover:border-forge/40 hover:text-forge"
              >
                Try “{c.prompt}” <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          );
        })}
        {!shown.length && <p className="text-[16px] text-muted">No parts match “{q}”.</p>}
      </div>
    </PageShell>
  );
}
