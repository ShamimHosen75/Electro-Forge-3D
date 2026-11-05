import { Box, Maximize, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { useForge, type ViewCommand } from '../store/useForge';
import { AddPartMenu } from './AddPartMenu';

export function ViewToolbar() {
  const sendView = useForge((s) => s.sendView);
  const [top, setTop] = useState(false);
  const items: { icon: typeof ZoomIn; label: string; cmd: ViewCommand }[] = [
    { icon: ZoomIn, label: 'Zoom in', cmd: 'zoomIn' },
    { icon: ZoomOut, label: 'Zoom out', cmd: 'zoomOut' },
    { icon: Maximize, label: 'Fit board', cmd: 'fit' },
    { icon: Box, label: top ? '3D view' : 'Top view', cmd: top ? 'iso' : 'top' },
    { icon: RotateCcw, label: 'Reset view', cmd: 'reset' },
  ];
  return (
    <div className="panel absolute left-[35px] top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 p-1.5">
      <AddPartMenu />
      <span className="mx-1.5 my-0.5 h-px bg-line" />
      {items.map(({ icon: Icon, label, cmd }) => (
        <button
          key={label}
          title={label}
          aria-label={label}
          onClick={() => {
            if (cmd === 'top') setTop(true);
            if (cmd === 'iso' || cmd === 'reset' || cmd === 'fit') setTop(false);
            sendView(cmd);
          }}
          className="grid h-10 w-10 place-items-center rounded-lg text-ink/60 transition hover:bg-black/5 hover:text-forge active:scale-95"
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
