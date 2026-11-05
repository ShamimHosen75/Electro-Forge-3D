import { ArrowRight, BookOpen, Check, Clock, PlayCircle, X } from 'lucide-react';
import { useState } from 'react';
import { LESSONS, type Lesson } from '../content/lessons';
import { useForge } from '../store/useForge';
import { PageShell } from './PageShell';

const LEVEL_STYLE = {
  Beginner: 'border-ok/40 bg-ok-soft text-ok',
  Intermediate: 'border-warn/40 bg-warn-soft text-warn',
  Advanced: 'border-forge/40 bg-forge-soft text-forge',
};

const KEY = 'ef.lessons.done';
function loadDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function LessonsPage() {
  const [open, setOpen] = useState<Lesson | null>(null);
  const [done, setDone] = useState<string[]>(loadDone);
  const [topic, setTopic] = useState('All');
  const topics = ['All', ...new Set(LESSONS.map((l) => l.topic))];
  const shown = LESSONS.filter((l) => topic === 'All' || l.topic === topic);

  const toggleDone = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <PageShell
      eyebrow="Lessons"
      title="Learn by changing a real circuit"
      intro="Short lessons that each end on the 3D board. Read the idea, then let Forge AI make the change so you can watch what happens."
    >
      <div className="panel mb-8 flex items-center gap-6 px-6 py-5">
        <div className="flex-1">
          <div className="font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Your progress</div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e6dece]">
            <div className="h-full rounded-full bg-forge transition-all duration-500" style={{ width: `${(done.length / LESSONS.length) * 100}%` }} />
          </div>
        </div>
        <div className="font-mono text-[18px] text-ink">
          {done.length}/{LESSONS.length}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`rounded-full border px-4 py-1.5 font-display text-[15px] font-semibold transition ${
              topic === t ? 'border-forge bg-forge text-white' : 'border-line bg-paper text-ink/75 hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((l, i) => (
          <article
            key={l.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className="panel group flex animate-cardIn flex-col p-6 transition hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-md border px-2 py-0.5 font-display text-[13px] font-bold uppercase tracking-[0.08em] ${LEVEL_STYLE[l.level]}`}>
                {l.level}
              </span>
              <span className="flex items-center gap-1.5 font-display text-[14px] text-muted">
                <Clock className="h-3.5 w-3.5" /> {l.minutes} min
              </span>
            </div>
            <h3 className="mt-4 font-display text-[24px] font-bold leading-tight">{l.title}</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink/70">{l.summary}</p>
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setOpen(l)}
                className="flex items-center gap-2 font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-forge"
              >
                <BookOpen className="h-4 w-4" /> Open lesson <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              {done.includes(l.id) && (
                <span className="flex items-center gap-1 font-display text-[13px] font-semibold uppercase text-ok">
                  <Check className="h-4 w-4" /> Done
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {open && <LessonDrawer lesson={open} done={done.includes(open.id)} onDone={() => toggleDone(open.id)} onClose={() => setOpen(null)} />}
    </PageShell>
  );
}

function LessonDrawer({ lesson, done, onDone, onClose }: { lesson: Lesson; done: boolean; onDone: () => void; onClose: () => void }) {
  const runOnBoard = useForge((s) => s.runOnBoard);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/20 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="panel m-5 flex w-[520px] animate-cardIn flex-col overflow-hidden"
        role="dialog"
        aria-label={lesson.title}
      >
        <div className="flex items-start justify-between border-b border-line/80 p-6">
          <div>
            <div className="font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-forge">{lesson.topic}</div>
            <h2 className="mt-1 font-display text-[30px] font-bold leading-tight">{lesson.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-ink/60 hover:bg-black/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="thin-scroll flex-1 space-y-4 overflow-y-auto p-6">
          {lesson.steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-forge/60 font-display text-[15px] font-bold text-forge">
                {i + 1}
              </span>
              <p className="pt-1 text-[16px] leading-relaxed text-ink/80">{s}</p>
            </li>
          ))}
        </ol>
        <div className="flex gap-3 border-t border-line/80 p-6">
          <button
            onClick={() => runOnBoard(lesson.tryIt)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forge py-3 font-display text-[16px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_6px_16px_-6px_rgba(200,55,45,.7)] hover:brightness-110"
          >
            <PlayCircle className="h-5 w-5" /> Try it on the board
          </button>
          <button
            onClick={onDone}
            className={`rounded-xl border px-4 font-display text-[15px] font-semibold uppercase tracking-[0.08em] ${
              done ? 'border-ok/40 bg-ok-soft text-ok' : 'border-line bg-card text-ink/75'
            }`}
          >
            {done ? 'Completed' : 'Mark done'}
          </button>
        </div>
      </aside>
    </div>
  );
}
