import type { ReactNode } from 'react';

export function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="thin-scroll absolute inset-x-0 bottom-0 top-[106px] overflow-y-auto">
      <div className="mx-auto max-w-[1400px] px-10 pb-16 pt-10">
        <div className="flex items-center gap-3 font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-forge">
          <span className="hazard w-[34px]" /> {eyebrow}
        </div>
        <h1 className="mt-2 font-display text-[44px] font-bold leading-none tracking-[0.01em] text-ink">{title}</h1>
        <p className="mt-3 max-w-[720px] text-[17px] text-ink/70">{intro}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
