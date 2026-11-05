import { ArrowLeftRight, Cable, Cpu, FlipHorizontal2, Lightbulb, MousePointerClick, Move } from 'lucide-react';
import type { Chip } from '../circuit/types';

const svg = 'h-3.5 w-3.5 shrink-0';

function ResistorGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
      <path d="M2 12h4l2-5 3 10 3-10 3 10 1-5h4" />
    </svg>
  );
}

function CapGlyph({ polar }: { polar?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M2 12h7M15 12h7M9 5v14M15 5v14" />
      {polar && <path d="M18 3v4M16 5h4" strokeWidth={1.6} />}
    </svg>
  );
}

export function PartIcon({ icon }: { icon: Chip['icon'] }) {
  switch (icon) {
    case 'ic555':
      return <Cpu className={svg} strokeWidth={2} />;
    case 'resistor':
      return <ResistorGlyph />;
    case 'electrolytic':
      return <CapGlyph polar />;
    case 'ceramic':
      return <CapGlyph />;
    case 'led':
      return <Lightbulb className={svg} strokeWidth={2} />;
    case 'button':
      return <MousePointerClick className={svg} strokeWidth={2} />;
    case 'wire':
      return <Cable className={svg} strokeWidth={2} />;
    case 'flip':
      return <FlipHorizontal2 className={svg} strokeWidth={2} />;
    case 'move':
      return <Move className={svg} strokeWidth={2} />;
    default:
      return <ArrowLeftRight className={svg} strokeWidth={2} />;
  }
}
