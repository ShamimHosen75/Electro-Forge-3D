import { Header } from './components/Header';
import { ProjectBadge } from './components/ProjectBadge';
import { ViewToolbar } from './components/ViewToolbar';
import { PromptBar } from './components/PromptBar';
import { SidePanel } from './components/SidePanel';
import { Toast } from './components/Toast';
import { Scene } from './scene/Scene';

export default function App() {
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
