import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { holePos } from '../../circuit/board';
import type { HoleId } from '../../circuit/types';
import { legMaterial } from '../materials';

/** How deep legs go into a hole. */
export const SINK = -0.06;

/** Centre, heading and span of a part that sits between two holes. */
export function twoPinFrame(a: HoleId, b: HoleId) {
  const pa = holePos(a);
  const pb = holePos(b);
  const dx = pb[0] - pa[0];
  const dz = pb[2] - pa[2];
  return {
    center: [(pa[0] + pb[0]) / 2, 0, (pa[2] + pb[2]) / 2] as [number, number, number],
    yaw: -Math.atan2(dz, dx),
    span: Math.hypot(dx, dz),
  };
}

/** Group placed between two holes so its local +X runs from the first hole to the second. */
export function TwoPin({ a, b, children }: { a: HoleId; b: HoleId; children: (span: number) => ReactNode }) {
  const f = twoPinFrame(a, b);
  return (
    <group position={f.center} rotation={[0, f.yaw, 0]}>
      {children(f.span)}
    </group>
  );
}

/** A bent metal leg through a list of points, with rounded corners. */
export function Leg({ points, radius = 0.018 }: { points: [number, number, number][]; radius?: number }) {
  const geom = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    const v = points.map((p) => new THREE.Vector3(...p));
    for (let i = 0; i < v.length - 1; i++) path.add(new THREE.LineCurve3(v[i], v[i + 1]));
    return new THREE.TubeGeometry(path, Math.max(8, v.length * 10), radius, 6, false);
  }, [points, radius]);
  return <mesh geometry={geom} material={legMaterial} castShadow />;
}

/** Leg from a part body down into a hole, with a small rounded bend. */
export function bentLeg(from: [number, number, number], holeX: number, bend = 0.05): [number, number, number][] {
  const [x, y, z] = from;
  const dir = Math.sign(holeX - x) || 1;
  return [
    [x, y, z],
    [holeX - dir * bend, y, z],
    [holeX - dir * bend * 0.3, y - bend * 0.3, z],
    [holeX, y - bend, z],
    [holeX, SINK, z],
  ];
}
