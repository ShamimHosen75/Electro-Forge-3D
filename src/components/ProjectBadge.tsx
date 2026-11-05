import { useForge } from '../store/useForge';

export function ProjectBadge() {
  const c = useForge((s) => s.circuit);
  return (
    <div className="panel absolute left-[35px] top-[142px] z-10 flex h-[48px] items-center gap-3 px-4">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/50" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
      </span>
      <span className="font-display text-[18px] font-bold uppercase tracking-[0.04em]">{c.name}</span>
      <span className="font-mono text-[14px] text-muted">{c.version}</span>
      <span className="h-5 w-px bg-line" />
      <span className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/70">{c.mode}</span>
    </div>
  );
}
