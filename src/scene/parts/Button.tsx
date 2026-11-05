import type { Part } from '../../circuit/types';
import { Leg, SINK, TwoPin } from './common';

/** 6 mm tactile push button. */
export function Button({ part }: { part: Part }) {
  return (
    <TwoPin a={part.pins[0]} b={part.pins[1]}>
      {(span) => (
        <group>
          {[-1, 1].map((s) => (
            <Leg key={s} points={[[s * 0.15, 0.08, 0], [s * span / 2, 0.04, 0], [s * span / 2, SINK, 0]]} />
          ))}
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.42, 0.14, 0.42]} />
            <meshStandardMaterial color="#2a2a2d" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.1, 24]} />
            <meshStandardMaterial color="#d6453a" roughness={0.4} />
          </mesh>
        </group>
      )}
    </TwoPin>
  );
}
