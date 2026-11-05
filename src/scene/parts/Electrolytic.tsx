import { useMemo } from 'react';
import type { Part } from '../../circuit/types';
import { formatFarads } from '../../circuit/values';
import { FONT, canvasTexture } from '../labelTexture';
import { Leg, SINK, TwoPin } from './common';

const R = 0.29;
const H = 0.78;
const LIFT = 0.14;

/** Radial electrolytic capacitor. The light stripe marks the − leg. */
export function Electrolytic({ part }: { part: Part }) {
  const label = formatFarads(part.value ?? 10e-6).replace(' ', '');
  const sleeve = useMemo(
    () =>
      canvasTexture(1024, 512, (ctx, w, h) => {
        ctx.fillStyle = '#26306e';
        ctx.fillRect(0, 0, w, h);
        // − stripe, centred at u=0.75 which faces local +X (the − leg) on a three.js cylinder
        ctx.fillStyle = '#c9cde0';
        ctx.fillRect(w * 0.68, 0, w * 0.14, h);
        ctx.fillStyle = '#26306e';
        ctx.font = `700 70px ${FONT}`;
        ctx.textAlign = 'center';
        for (let y = 80; y < h; y += 110) ctx.fillText('—', w * 0.75, y);
        ctx.fillStyle = '#e8e6f2';
        ctx.font = `700 92px ${FONT}`;
        ctx.save();
        ctx.translate(w * 0.25, h * 0.48);
        ctx.fillText('EF', 0, -40);
        ctx.font = `700 120px ${FONT}`;
        ctx.fillText(label, 0, 80);
        ctx.font = `600 54px ${FONT}`;
        ctx.fillText('25V  105°C', 0, 160);
        ctx.restore();
      }),
    [label],
  );
  const top = useMemo(
    () =>
      canvasTexture(256, 256, (ctx, w) => {
        ctx.fillStyle = '#b9bcc4';
        ctx.beginPath();
        ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8d9099';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, w * 0.2);
        ctx.lineTo(w * 0.5, w * 0.8);
        ctx.moveTo(w * 0.2, w * 0.5);
        ctx.lineTo(w * 0.8, w * 0.5);
        ctx.stroke();
      }),
    [],
  );

  // Reversed parts are drawn turned round so the stripe faces the other leg.
  const [a, b] = part.reversed ? [part.pins[1], part.pins[0]] : [part.pins[0], part.pins[1]];

  return (
    <TwoPin a={a} b={b}>
      {(span) => (
        <group>
          <Leg points={[[-0.08, LIFT, 0], [-span / 2, LIFT * 0.4, 0], [-span / 2, SINK, 0]]} radius={0.02} />
          <Leg points={[[0.08, LIFT, 0], [span / 2, LIFT * 0.4, 0], [span / 2, SINK, 0]]} radius={0.02} />
          <mesh position={[0, LIFT + H / 2, 0]} castShadow>
            <cylinderGeometry args={[R, R, H, 48, 1, true]} />
            <meshStandardMaterial map={sleeve} roughness={0.35} metalness={0.1} />
          </mesh>
          <mesh position={[0, LIFT + H + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[R * 0.98, 48]} />
            <meshStandardMaterial map={top} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, LIFT + H, 0]}>
            <torusGeometry args={[R * 0.97, 0.018, 8, 48]} />
            <meshStandardMaterial color="#26306e" roughness={0.4} />
          </mesh>
          <mesh position={[0, LIFT + 0.01, 0]}>
            <cylinderGeometry args={[R * 0.98, R * 0.98, 0.02, 48]} />
            <meshStandardMaterial color="#14162e" />
          </mesh>
        </group>
      )}
    </TwoPin>
  );
}
