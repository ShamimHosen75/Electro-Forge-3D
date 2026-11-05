import { useMemo } from 'react';
import type { Part } from '../../circuit/types';
import { holePos } from '../../circuit/board';
import { FONT, canvasTexture } from '../labelTexture';
import { darkPlastic } from '../materials';
import { Leg, SINK } from './common';

const BODY_Y = 0.12;
const BODY_H = 0.26;

/** DIP-8 timer. pins[0..3] are 1-4, pins[4..7] are 5-8. */
export function Chip555({ part }: { part: Part }) {
  const pts = part.pins.map(holePos);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cz = pts.reduce((s, p) => s + p[2], 0) / pts.length;
  const xs = pts.map((p) => p[0]);
  const w = Math.max(...xs) - Math.min(...xs) + 0.24;
  const depth = 0.62;

  const top = useMemo(
    () =>
      canvasTexture(512, 256, (ctx, cw, ch) => {
        ctx.fillStyle = '#1f1f22';
        ctx.fillRect(0, 0, cw, ch);
        // pin-1 notch and dot
        ctx.fillStyle = '#111113';
        ctx.beginPath();
        ctx.arc(0, ch / 2, 34, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(46, ch - 46, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e9e6df';
        ctx.font = `700 96px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NE555', cw / 2 + 12, ch / 2 - 8);
        ctx.fillStyle = '#8b8a87';
        ctx.font = `600 36px ${FONT}`;
        ctx.fillText('CF  2326', cw / 2 + 12, ch / 2 + 62);
      }),
    [],
  );

  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, BODY_Y + BODY_H / 2, 0]} material={darkPlastic} castShadow>
        <boxGeometry args={[w, BODY_H, depth]} />
      </mesh>
      <mesh position={[0, BODY_Y + BODY_H + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.98, depth * 0.98]} />
        <meshStandardMaterial map={top} roughness={0.6} />
      </mesh>
      {pts.map(([x, , z], i) => {
        const lx = x - cx;
        const side = Math.sign(z - cz) || 1;
        const edge = (depth / 2) * side;
        const lz = z - cz;
        return (
          <group key={i}>
            <mesh position={[lx, BODY_Y + 0.07, edge + side * 0.04]} castShadow>
              <boxGeometry args={[0.07, 0.025, 0.09]} />
              <meshStandardMaterial color="#c9ccd1" metalness={0.85} roughness={0.3} />
            </mesh>
            <Leg points={[[lx, BODY_Y + 0.07, edge + side * 0.08], [lx, 0.04, lz], [lx, SINK, lz]]} radius={0.016} />
          </group>
        );
      })}
    </group>
  );
}
