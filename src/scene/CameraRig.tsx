import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useForge } from '../store/useForge';

export const HOME_POS = new THREE.Vector3(-1.0, 8.6, 12.6);
export const HOME_TARGET = new THREE.Vector3(0.15, -0.9, 0.35);
const TOP_POS = new THREE.Vector3(0, 12.5, 0.01);

/** Orbit controls plus smooth fly-to moves driven by the view toolbar. */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const view = useForge((s) => s.view);
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (!view || !controls.current) return;
    const c = controls.current;
    const offset = camera.position.clone().sub(c.target);
    switch (view.cmd) {
      case 'zoomIn':
        goal.current = { pos: c.target.clone().add(offset.multiplyScalar(0.78)), target: c.target.clone() };
        break;
      case 'zoomOut':
        goal.current = { pos: c.target.clone().add(offset.multiplyScalar(1.28)), target: c.target.clone() };
        break;
      case 'top':
        goal.current = { pos: TOP_POS.clone(), target: new THREE.Vector3(0, 0, 0) };
        break;
      case 'fit':
      case 'iso':
      case 'reset':
        goal.current = { pos: HOME_POS.clone(), target: HOME_TARGET.clone() };
        break;
    }
  }, [view, camera]);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!goal.current || !c) return;
    const k = 1 - Math.exp(-dt * 6);
    camera.position.lerp(goal.current.pos, k);
    c.target.lerp(goal.current.target, k);
    c.update();
    if (camera.position.distanceTo(goal.current.pos) < 0.01) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={HOME_TARGET}
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={22}
      maxPolarAngle={Math.PI * 0.46}
      onStart={() => (goal.current = null)}
    />
  );
}
