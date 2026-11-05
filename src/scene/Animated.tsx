import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { holePos } from '../circuit/board';
import type { Part } from '../circuit/types';
import { useForge, type ActiveAnim } from '../store/useForge';
import { canvasTexture } from './labelTexture';

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** Drops in and settles with one small bounce. */
const settle = (t: number) => {
  if (t < 0.72) return easeInOut(t / 0.72);
  const u = (t - 0.72) / 0.28;
  return 1 + Math.sin(u * Math.PI) * 0.06;
};

const HALO: Record<ActiveAnim['kind'], string> = {
  move: '#5b8cff',
  flip: '#ffb347',
  swap: '#c08bff',
  pulse: '#ffb347',
  add: '#5fe39a',
  remove: '#ff6b5b',
};

const ringTexture = (() => {
  let tex: THREE.Texture | null = null;
  return () =>
    (tex ??= canvasTexture(256, 256, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, w * 0.18, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    }));
})();

export function partCenter(p: Part): [number, number, number] {
  const pts = p.pins.map(holePos);
  return [0, 1, 2].map((i) => pts.reduce((s, q) => s + q[i], 0) / pts.length) as [number, number, number];
}

/**
 * Wraps a part and plays its pick-and-place animation:
 * lift, travel/turn, then drop back into the holes.
 */
export function Animated({
  part,
  anim,
  render,
}: {
  part: Part;
  anim?: ActiveAnim;
  render: (p: Part) => ReactNode;
}) {
  const outer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const realRef = useRef<THREE.Group>(null);
  const ghostRef = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const done = useRef<number | null>(null);
  const endAnim = useForge((s) => s.endAnim);
  const ring = useMemo(ringTexture, []);
  const c = partCenter(part);
  const neg: [number, number, number] = [-c[0], -c[1], -c[2]];

  useFrame(() => {
    const o = outer.current;
    const s = spin.current;
    if (!o || !s) return;
    const real = realRef.current;
    const ghost = ghostRef.current;
    if (!anim) {
      o.position.set(0, 0, 0);
      s.rotation.set(0, 0, 0);
      s.scale.setScalar(1);
      if (real) real.visible = true;
      if (halo.current) halo.current.visible = false;
      return;
    }
    const t = Math.min(1, (performance.now() / 1000 - anim.start) / anim.duration);
    let x = 0, y = 0, z = 0, ry = 0, rz = 0, sc = 1;
    let showGhost = false;

    switch (anim.kind) {
      case 'move': {
        const [fx, , fz] = anim.from ?? [0, 0, 0];
        const e = easeInOut(Math.min(1, Math.max(0, (t - 0.12) / 0.7)));
        x = fx * (1 - e);
        z = fz * (1 - e);
        const lift = t < 0.15 ? easeOut(t / 0.15) : t > 0.82 ? 1 - settle((t - 0.82) / 0.18) : 1;
        y = 1.0 * lift;
        rz = Math.sin(t * Math.PI) * 0.12;
        break;
      }
      case 'flip': {
        const lift = t < 0.2 ? easeOut(t / 0.2) : t > 0.8 ? 1 - settle((t - 0.8) / 0.2) : 1;
        y = 0.9 * lift;
        ry = Math.PI * (1 - easeInOut(Math.min(1, Math.max(0, (t - 0.15) / 0.65))));
        break;
      }
      case 'swap': {
        if (t < 0.5) {
          showGhost = true;
          const u = easeOut(t / 0.5);
          y = 1.3 * u;
          sc = 1 - 0.55 * u;
          ry = u * 1.2;
        } else {
          const u = (t - 0.5) / 0.5;
          y = 1.3 * (1 - settle(u));
          sc = 0.6 + 0.4 * Math.min(1, u * 1.6);
          ry = -(1 - easeOut(u)) * 1.2;
        }
        break;
      }
      case 'add': {
        y = 1.6 * (1 - settle(t));
        sc = 0.5 + 0.5 * easeOut(Math.min(1, t * 1.5));
        break;
      }
      case 'remove': {
        showGhost = true;
        const u = easeOut(t);
        y = 1.4 * u;
        sc = Math.max(0.001, 1 - u);
        break;
      }
      case 'pulse': {
        sc = 1 + Math.sin(t * Math.PI) * 0.18;
        break;
      }
    }

    o.position.set(x, y, z);
    s.rotation.set(0, ry, rz);
    s.scale.setScalar(sc);
    if (real) real.visible = !showGhost;
    if (ghost) ghost.visible = showGhost;
    if (halo.current) {
      halo.current.visible = true;
      (halo.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.9;
      halo.current.position.set(c[0] + x * 0.0, 0.03, c[2]);
      const k = 1.4 + t * 0.6;
      halo.current.scale.set(k, k, 1);
    }

    if (t >= 1 && done.current !== anim.start) {
      done.current = anim.start;
      endAnim(part.id);
    }
  });

  return (
    <group>
      <group ref={outer}>
        <group position={c}>
          <group ref={spin}>
            <group position={neg}>
              {anim?.kind !== 'remove' && <group ref={realRef}>{render(part)}</group>}
              {anim?.ghost && (
                <group ref={ghostRef} visible={false}>
                  {render(anim.ghost)}
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={ring}
          color={anim ? HALO[anim.kind] : '#ffffff'}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
