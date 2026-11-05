import { Check, ChevronDown, Cpu, Loader2, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { listModels } from '../ai/ollama';
import { useForge, type Engine } from '../store/useForge';

type Status = { kind: 'idle' } | { kind: 'checking' } | { kind: 'ok'; models: string[] } | { kind: 'error'; message: string };

export function ModelPicker() {
  const engine = useForge((s) => s.engine);
  const ollama = useForge((s) => s.ollama);
  const setAi = useForge((s) => s.setAi);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(ollama.url);
  const [model, setModel] = useState(ollama.model);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const choose = (e: Engine) => setAi(e, { url, model });

  const test = async () => {
    setStatus({ kind: 'checking' });
    try {
      const models = await listModels(url);
      setStatus({ kind: 'ok', models });
      if (models.length && !models.some((m) => m.split(':')[0] === model.split(':')[0])) setModel(models[0]);
    } catch (e) {
      setStatus({ kind: 'error', message: (e as Error).message });
    }
  };

  const label = engine === 'builtin' ? 'Forge AI' : `Local · ${ollama.model.split(':')[0]}`;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 max-w-[190px] items-center gap-2 rounded-xl border border-line bg-card px-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-ink/75 transition hover:text-ink"
      >
        <span className="truncate">{label}</span> <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="panel absolute bottom-[56px] right-0 z-40 w-[380px] animate-cardIn p-2" role="menu">
          <Option
            active={engine === 'builtin'}
            icon={<Zap className="h-4 w-4" />}
            title="Forge AI · built-in"
            body="Instant and offline. Understands set phrases like “move R3 to a20”."
            onClick={() => choose('builtin')}
          />
          <Option
            active={engine === 'ollama'}
            icon={<Cpu className="h-4 w-4" />}
            title="Local model · Ollama"
            body="Free-form requests, run by a model on your own machine."
            onClick={() => choose('ollama')}
          />

          <div className="mx-2 mb-1 mt-2 rounded-xl border border-line/80 bg-card p-3">
            <label className="block font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Ollama URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setAi(engine, { url, model })}
              className="mt-1 w-full rounded-lg border border-line bg-white/70 px-2.5 py-1.5 font-mono text-[13px] focus:border-forge/50 focus:outline-none"
            />
            <label className="mt-2.5 block font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Model</label>
            <div className="mt-1 flex gap-2">
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                onBlur={() => setAi(engine, { url, model })}
                className="min-w-0 flex-1 rounded-lg border border-line bg-white/70 px-2.5 py-1.5 font-mono text-[13px] focus:border-forge/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={test}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-ink/80 hover:text-forge"
              >
                {status.kind === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Test
              </button>
            </div>
            {status.kind === 'ok' && (
              <div className="mt-2.5">
                <p className="text-[13px] text-ok">Connected · {status.models.length} model{status.models.length === 1 ? '' : 's'} installed</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {status.models.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setModel(m);
                        setAi(engine, { url, model: m });
                      }}
                      className={`rounded-md border px-2 py-0.5 font-mono text-[12px] ${
                        m === model ? 'border-forge/50 bg-forge-soft text-forge' : 'border-line bg-white/70 text-ink/70'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {status.kind === 'error' && (
              <p className="mt-2.5 text-[13px] leading-snug text-forge">
                Can't reach Ollama ({status.message}). Start it with <code className="font-mono">ollama serve</code> and pull a model,
                e.g. <code className="font-mono">ollama pull llama3.2</code>.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Option({ active, icon, title, body, onClick }: { active: boolean; icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? 'bg-forge-soft/60' : 'hover:bg-black/[0.04]'}`}
    >
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${active ? 'border-forge/40 text-forge' : 'border-line text-ink/60'} bg-card`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-display text-[16px] font-bold text-ink">{title}</span>
        <span className="block text-[13px] leading-snug text-ink/65">{body}</span>
      </span>
      {active && <Check className="mt-1 h-4 w-4 text-forge" />}
    </button>
  );
}
