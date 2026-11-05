import { ArrowUp, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForge } from '../store/useForge';

export const SUGGESTIONS = ['Add a power LED', 'Double the blink rate', 'Add a reset button', 'Make it a monostable'];

export function PromptBar() {
  const [text, setText] = useState('');
  const showToast = useForge((s) => s.showToast);
  const ready = text.trim().length > 0;

  const submit = (value: string) => {
    if (!value.trim()) return;
    showToast(`Forge AI is warming up — commands arrive in the next build.`);
    setText('');
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-4 px-10">
      <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="flex h-10 items-center gap-2 rounded-full border border-line/80 bg-paper px-5 font-display text-[15px] font-semibold text-ink/85 shadow-soft transition hover:-translate-y-0.5 hover:border-forge/40 hover:text-forge active:translate-y-0"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="panel pointer-events-auto flex h-[76px] w-full max-w-[855px] items-center gap-3 px-3.5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-card text-forge">
          <Sparkles className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1 text-[21px] text-ink placeholder:text-muted/80 focus:outline-none"
          placeholder="Ask AI to modify your circuit — e.g. “make it blink twice as fast”"
        />
        <button
          type="button"
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-card px-3.5 font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-ink/75"
        >
          Forge AI <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="submit"
          aria-label="Send"
          disabled={!ready}
          className={`grid h-[50px] w-[50px] shrink-0 place-items-center rounded-xl bg-forge text-white transition ${
            ready ? 'opacity-100 shadow-[0_6px_16px_-6px_rgba(200,55,45,.7)] hover:brightness-110' : 'opacity-55'
          }`}
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
