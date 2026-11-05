import { Header } from './components/Header';
import { ProjectBadge } from './components/ProjectBadge';
import { ViewToolbar } from './components/ViewToolbar';
import { PromptBar } from './components/PromptBar';
import { SidePanel } from './components/SidePanel';
import { Toast } from './components/Toast';
import { Scene } from './scene/Scene';
import { useEffect } from 'react';
import { useForge } from './store/useForge';

export default function App() {
  const undo = useForge((s) => s.undo);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) {
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
      {/* The stage fills everything left of the side panel. */}
      <main className="absolute bottom-0 left-0 right-[490px] top-[106px]">
        <div className="absolute inset-0">
          <Scene />
        </div>
        <ViewToolbar />
        <PromptBar />
        <Toast />
      </main>
      <ProjectBadge />
      <SidePanel />
    </div>
  );
}
