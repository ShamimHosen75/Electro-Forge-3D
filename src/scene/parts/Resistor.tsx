import { useMemo } from 'react';
import type { Part } from '../../circuit/types';
import { resistorBands } from '../../circuit/values';
import { Leg, TwoPin, bentLeg } from './common';

const BODY_Y = 0.3;
const R = 0.115;

export function Resistor({ part }: { part: Part }) {
  const bands = useMemo(() => resistorBands(part.value ?? 1000), [part.value]);
  return (
    <TwoPin a={part.pins[0]} b={part.pins[1]}>
      {(span) => {
        const len = Math.min(0.95, span - 0.16);
        const half = len / 2;
        const bandXs = [-half * 0.62, -half * 0.36, -half * 0.1, half * 0.55];
        return (
          <group>
            <Leg points={bentLeg([-half, BODY_Y, 0], -span / 2)} />
            <Leg points={bentLeg([half, BODY_Y, 0], span / 2)} />
            <group position={[0, BODY_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
              {/* body: slightly fat ends like a real carbon-film resistor */}
              <mesh castShadow>
                <capsuleGeometry args={[R * 0.92, len - R * 2, 8, 20]} />
                <meshStandardMaterial color="#e7d3a8" roughness={0.55} />
              </mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[0, s * (half - R * 1.1), 0]} castShadow>
                  <sphereGeometry args={[R * 1.08, 20, 14]} />
                  <meshStandardMaterial color="#e7d3a8" roughness={0.55} />
                </mesh>
              ))}
              {bands.map((c, i) => (
                <mesh key={i} position={[0, bandXs[i], 0]}>
                  <cylinderGeometry args={[R * (i === 0 ? 1.1 : 0.95), R * (i === 0 ? 1.1 : 0.95), 0.06, 24]} />
                  <meshStandardMaterial
                    color={c}
                    roughness={i === 3 ? 0.3 : 0.5}
                    metalness={i === 3 ? 0.6 : 0}
                  />
                </mesh>
              ))}
            </group>
          </group>
        );
      }}
    </TwoPin>
  );
}
