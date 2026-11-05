import { useMemo } from 'react';
import type { Part } from '../../circuit/types';
import { FONT, canvasTexture } from '../labelTexture';
import { Leg, SINK, TwoPin } from './common';

/** EIA code, e.g. 100 nF -> "104". */
function ceramicCode(f: number) {
  const pf = Math.round(f * 1e12);
  const exp = Math.max(0, Math.floor(Math.log10(pf)) - 1);
  return `${Math.round(pf / 10 ** exp)}${exp}`;
}

const Y = 0.5;

export function Ceramic({ part }: { part: Part }) {
  const code = ceramicCode(part.value ?? 100e-9);
  const label = useMemo(
    () =>
      canvasTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#f6efe3';
        ctx.font = `700 92px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(code, w / 2, h / 2);
      }),
    [code],
  );
  return (
    <TwoPin a={part.pins[0]} b={part.pins[1]}>
      {(span) => (
        <group>
          <Leg points={[[-0.06, Y - 0.1, 0], [-span / 2, 0.12, 0], [-span / 2, SINK, 0]]} radius={0.015} />
          <Leg points={[[0.06, Y - 0.1, 0], [span / 2, 0.12, 0], [span / 2, SINK, 0]]} radius={0.015} />
          <group position={[0, Y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh scale={[1, 1, 0.42]} castShadow>
              <sphereGeometry args={[0.22, 32, 20]} />
              <meshStandardMaterial color="#c9472f" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0, 0.094]}>
              <planeGeometry args={[0.3, 0.3]} />
              <meshBasicMaterial map={label} transparent depthWrite={false} />
            </mesh>
          </group>
        </group>
      )}
    </TwoPin>
  );
}
