import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { Part } from '../../circuit/types';
import { useForge } from '../../store/useForge';
import { Leg, SINK, TwoPin } from './common';

/** 6 mm tactile push button. Click and hold it in the 3D view. */
export function Button({ part }: { part: Part }) {
  const press = useForge((s) => s.press);
  const cap = useRef<THREE.Mesh>(null);
  const down = () => press(part.id, true);
  const up = () => {
    if (useForge.getState().pressed[part.id]) press(part.id, false);
    document.body.style.cursor = '';
  };

  useFrame(() => {
    if (!cap.current) return;
    const target = useForge.getState().pressed[part.id] ? 0.17 : 0.22;
    cap.current.position.y += (target - cap.current.position.y) * 0.4;
  });

  return (
    <TwoPin a={part.pins[0]} b={part.pins[1]}>
      {(span) => (
        <group
          onPointerDown={(e) => {
            e.stopPropagation();
            down();
          }}
          onPointerUp={up}
          onPointerOut={up}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
        >
          {[-1, 1].map((s) => (
            <Leg key={s} points={[[s * 0.15, 0.08, 0], [(s * span) / 2, 0.04, 0], [(s * span) / 2, SINK, 0]]} />
          ))}
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.44, 0.14, 0.44]} />
            <meshStandardMaterial color="#2a2a2d" roughness={0.5} />
          </mesh>
          <mesh ref={cap} position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.12, 24]} />
            <meshStandardMaterial color={part.id === 'SW2' ? '#e3b52a' : '#d6453a'} roughness={0.4} />
          </mesh>
        </group>
      )}
    </TwoPin>
  );
}
