import { useEffect, useState } from 'react';
import { useForge } from '../store/useForge';

export function Toast() {
  const toast = useForge((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), toast.tone === 'error' ? 4200 : 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || !visible) return null;
  return (
    <div
      key={toast.nonce}
      role="status"
      className={`panel absolute bottom-[200px] left-1/2 z-30 max-w-[620px] animate-toastIn px-5 py-3 text-center text-[15px] font-medium ${
        toast.tone === 'error' ? 'border-forge/40 text-forge' : 'text-ink/85'
      }`}
    >
      {toast.text}
    </div>
  );
}
