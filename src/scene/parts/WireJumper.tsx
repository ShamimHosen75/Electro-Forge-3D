import { useMemo } from 'react';
import * as THREE from 'three';
import { holePos } from '../../circuit/board';
import type { Wire } from '../../circuit/types';
import { darkPlastic } from '../materials';

const HOUSING_H = 0.46;

/** Dupont-style jumper: a black housing in each hole and an arched wire between them. */
export function WireJumper({ wire }: { wire: Wire }) {
  const a = holePos(wire.from);
  const b = holePos(wire.to);
  const geom = useMemo(() => {
    const A = new THREE.Vector3(a[0], HOUSING_H, a[2]);
    const B = new THREE.Vector3(b[0], HOUSING_H, b[2]);
    const d = A.distanceTo(B);
    const h = 0.12 + Math.min(1.1, d * 0.28);
    const curve = new THREE.CubicBezierCurve3(
      A,
      A.clone().add(new THREE.Vector3(0, h, 0)),
      B.clone().add(new THREE.Vector3(0, h, 0)),
      B,
    );
    return new THREE.TubeGeometry(curve, 48, 0.045, 10, false);
  }, [a[0], a[2], b[0], b[2]]);

  return (
    <group>
      {[a, b].map((p, i) => (
        <mesh key={i} position={[p[0], HOUSING_H / 2 - 0.03, p[2]]} material={darkPlastic} castShadow>
          <boxGeometry args={[0.11, HOUSING_H, 0.11]} />
        </mesh>
      ))}
      <mesh geometry={geom} castShadow>
        <meshStandardMaterial color={wire.color} roughness={0.42} />
      </mesh>
    </group>
  );
}
