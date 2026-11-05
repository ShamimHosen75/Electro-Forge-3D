import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { COLS, ROWS, holePos, isValidHole } from '../circuit/board';
import { runCommand } from '../circuit/commands';
import type { HoleId, Part } from '../circuit/types';
import { useForge } from '../store/useForge';
import { partCenter } from './Animated';
import { canvasTexture } from './labelTexture';

const ringTex = (() => {
  let t: THREE.Texture | null = null;
  return () =>
    (t ??= canvasTexture(256, 256, (ctx, w) => {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 10;
      ctx.setLineDash([22, 14]);
      ctx.beginPath();
      ctx.arc(w / 2, w / 2, w / 2 - 12, 0, Math.PI * 2);
      ctx.stroke();
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.25)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    }));
})();

/** Size of the footprint, so the selection ring fits round the part. */
function partRadius(p: Part) {
  const pts = p.pins.map(holePos);
  const c = partCenter(p);
  return Math.max(0.35, ...pts.map(([x, , z]) => Math.hypot(x - c[0], z - c[2]))) + 0.3;
}

/** Dashed ring that marks the selected part. */
export function SelectionRing() {
  const selected = useForge((s) => s.selected);
  const part = useForge((s) => s.circuit.parts.find((p) => p.id === s.selected));
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(ringTex, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.elapsedTime * 0.6;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(clock.elapsedTime * 4) * 0.2;
  });
  if (!selected || !part) return null;
  const [x, , z] = partCenter(part);
  const r = partRadius(part) * 2;
  return (
    <mesh ref={ref} position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[r, r, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} color="#e0453a" transparent depthWrite={false} />
    </mesh>
  );
}

/** Nearest main-area hole to a point on the board, or null if too far from any. */
function holeAt(x: number, z: number): HoleId | null {
  let best: { id: HoleId; d: number } | null = null;
  for (let c = 1; c <= COLS; c++)
    for (const r of ROWS) {
      const id = `${r}${c}`;
      const [hx, , hz] = holePos(id);
      const d = Math.hypot(hx - x, hz - z);
      if (!best || d < best.d) best = { id, d };
    }
  return best && best.d < 0.3 ? best.id : null;
}

/** Latest landing spot while dragging, read every frame by the dragged part. */
const dragPreview: { id: string | null; pins: HoleId[] | null } = { id: null, pins: null };

/** Wraps a part so it can be clicked to select and dragged to new holes. */
export function Pickable({ part, children }: { part: Part; children: React.ReactNode }) {
  const select = useForge((s) => s.select);
  const setDragging = useForge((s) => s.setDragging);
  const follow = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = follow.current;
    if (!g) return;
    let tx = 0, ty = 0, tz = 0;
    if (useForge.getState().dragging === part.id) {
      ty = 0.55; // lifted while carried
      if (dragPreview.id === part.id && dragPreview.pins) {
        const from = partCenter(part);
        const to = partCenter({ ...part, pins: dragPreview.pins });
        tx = to[0] - from[0];
        tz = to[2] - from[2];
      }
    }
    g.position.x += (tx - g.position.x) * 0.3;
    g.position.y += (ty - g.position.y) * 0.3;
    g.position.z += (tz - g.position.z) * 0.3;
  });
  return (
    <group
      ref={follow}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        select(part.id);
        if (part.kind === 'ic555') return;
        const [px, , pz] = holePos(part.pins[0]);
        grab.offset = [e.point.x - px, e.point.z - pz];
        setDragging(part.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = part.kind === 'ic555' ? 'pointer' : 'grab';
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </group>
  );
}

/** Where on the part the pointer grabbed it, relative to its first leg. */
const grab = { offset: [0, 0] as [number, number] };

/** While dragging: follows the pointer, previews the landing holes and drops on release. */
export function DragLayer() {
  const dragging = useForge((s) => s.dragging);
  const circuit = useForge((s) => s.circuit);
  const exec = useForge((s) => s.exec);
  const setDragging = useForge((s) => s.setDragging);
  const [target, setTarget] = useState<HoleId | null>(null);

  const preview = useMemo(() => {
    if (!dragging || !target) return null;
    const part = circuit.parts.find((p) => p.id === dragging);
    if (!part || part.pins[0] === target) return null;
    const r = runCommand(`move ${dragging} to ${target}`, circuit);
    return r.ok
      ? { ok: true as const, pins: r.circuit.parts.find((p) => p.id === dragging)!.pins }
      : { ok: false as const, pins: [target], message: r.message };
  }, [dragging, target, circuit]);
  dragPreview.id = dragging;
  dragPreview.pins = preview?.ok ? preview.pins : null;

  useEffect(() => {
    if (!dragging) return;
    document.body.style.cursor = 'grabbing';
    const up = () => {
      const s = useForge.getState();
      if (s.dragging && target && preview) {
        if (preview.ok) exec(`move ${s.dragging} to ${target}`);
        else s.showToast(preview.message, 'error');
      }
      setDragging(null);
      setTarget(null);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, [dragging, target, preview, exec, setDragging]);

  if (!dragging) return null;
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerMove={(e) => {
          const h = holeAt(e.point.x - grab.offset[0], e.point.z - grab.offset[1]);
          if (h !== target && (h === null || isValidHole(h))) setTarget(h);
        }}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {preview?.pins.map((h) => {
        const [x, , z] = holePos(h);
        return (
          <mesh key={h} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.13, 24]} />
            <meshBasicMaterial color={preview.ok ? '#3ddc84' : '#ff5a4e'} transparent opacity={0.95} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}
