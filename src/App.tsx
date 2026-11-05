import { Header } from './components/Header';
import { ProjectBadge } from './components/ProjectBadge';
import { ViewToolbar } from './components/ViewToolbar';
import { PromptBar } from './components/PromptBar';
import { SidePanel } from './components/SidePanel';
import { Toast } from './components/Toast';
import { PartEditor, nudgeHole } from './components/PartEditor';
import { Scene } from './scene/Scene';
import { useEffect } from 'react';
import { PAGES, useForge, type Page } from './store/useForge';
import { LessonsPage } from './pages/Lessons';
import { LabPage } from './pages/Lab';
import { ComponentsPage } from './pages/Components';

export default function App() {
  const undo = useForge((s) => s.undo);
  const page = useForge((s) => s.page);
  const goto = useForge((s) => s.goto);
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace(/^#\/?/, '') as Page;
      goto(PAGES.includes(h) ? h : 'dashboard');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [goto]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      const s = useForge.getState();
      const part = s.circuit.parts.find((p) => p.id === s.selected);
      if (part && !typing && s.page === 'dashboard') {
        if (e.key === 'Escape') return s.select(null);
        if ((e.key === 'Delete' || e.key === 'Backspace') && part.kind !== 'ic555') {
          e.preventDefault();
          return void s.exec(`remove ${part.id}`);
        }
        const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
        if (step[e.key] && part.kind !== 'ic555') {
          e.preventDefault();
          const h = nudgeHole(part.pins[0], ...step[e.key]);
          if (h) s.exec(`move ${part.id} to ${h}`);
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing && useForge.getState().page === 'dashboard') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Header />
      {page === 'dashboard' && (
        <>
          {/* The stage fills everything left of the side panel. */}
          <main className="absolute bottom-0 left-0 right-[490px] top-[106px]">
            <div className="absolute inset-0">
              <Scene />
            </div>
            <ViewToolbar />
            <PartEditor />
            <PromptBar />
          </main>
          <ProjectBadge />
          <SidePanel />
        </>
      )}
      {page === 'lessons' && <LessonsPage />}
      {page === 'lab' && <LabPage />}
      {page === 'components' && <ComponentsPage />}
      <Toast />
    </div>
  );
}
