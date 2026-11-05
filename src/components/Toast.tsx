import { useEffect, useState } from 'react';
import { useForge } from '../store/useForge';

export function Toast() {
  const toast = useForge((s) => s.toast);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || !visible) return null;
  return (
    <div
      key={toast.nonce}
      className="panel absolute left-1/2 top-[150px] z-30 animate-toastIn px-5 py-3 font-display text-[15px] font-semibold text-ink/85"
    >
      {toast.text}
    </div>
  );
}
