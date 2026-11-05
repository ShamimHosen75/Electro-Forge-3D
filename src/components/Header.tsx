import { Bell, Search, Zap } from 'lucide-react';

const NAV = ['Dashboard', 'Lessons', 'Lab', 'Components'];

export function Header() {
  return (
    <header className="panel absolute left-5 right-5 top-5 z-20 flex h-[86px] items-center gap-8 px-7">
      <a href="#" className="flex shrink-0 items-center gap-4">
        <span className="grid h-[52px] w-[52px] place-items-center rounded-xl border border-line bg-card shadow-[inset_0_1px_0_#fff]">
          <Zap className="h-6 w-6 text-forge" strokeWidth={1.8} />
        </span>
        <span className="leading-none">
          <span className="block font-display text-[30px] font-bold tracking-[0.02em]">
            <span className="text-forge">ELECTRO</span> FORGE
          </span>
          <span className="mt-1 flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
            <span className="hazard w-[30px] text-forge" />
            Build • Learn • Innovate
            <span className="hazard w-[30px] text-forge" />
          </span>
        </span>
      </a>

      <label className="ml-20 flex h-[54px] max-w-[705px] flex-1 items-center gap-3 rounded-xl border border-line bg-[#f3eee4] px-5 text-muted transition focus-within:border-forge/50 focus-within:bg-white/60">
        <Search className="h-[18px] w-[18px]" />
        <input
          className="w-full bg-transparent text-[16px] text-ink placeholder:text-muted/90 focus:outline-none"
          placeholder="Search circuits, components, lessons..."
        />
      </label>

      <nav className="ml-auto flex items-center gap-7">
        {NAV.map((n, i) => (
          <a
            key={n}
            href="#"
            className={`relative py-2 font-display text-[17px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              i === 0 ? 'text-forge' : 'text-ink/75 hover:text-ink'
            }`}
          >
            {n}
            {i === 0 && <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-forge" />}
          </a>
        ))}
        <button className="relative ml-2 rounded-lg p-2 text-ink/70 transition hover:bg-black/5" aria-label="Notifications">
          <Bell className="h-[22px] w-[22px]" strokeWidth={1.8} />
          <span className="absolute right-0.5 top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full bg-forge font-display text-[11px] font-bold text-white ring-2 ring-paper">
            2
          </span>
        </button>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#e9dfcf] to-[#d8cbb5] font-display text-[15px] font-bold text-ink/70 ring-1 ring-line">
          MD
        </span>
      </nav>
    </header>
  );
}
