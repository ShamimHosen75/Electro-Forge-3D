import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { BOARD_D, BOARD_H, BOARD_W, COLS, RAILS, ROWS, colX, railHasCol, rowZ } from '../circuit/board';
import { FONT, canvasTexture } from './labelTexture';

const TEAL = '#2b7d76';
const INSET = 0.16; // printed top sits inside the rounded edge
const TOP_W = BOARD_W - INSET * 2;
const TOP_D = BOARD_D - INSET * 2;
const PX = 220; // canvas pixels per scene unit

/** World (x, z) on the board top -> canvas pixels. */
const u = (x: number) => (x + TOP_W / 2) * PX;
const v = (z: number) => (z + TOP_D / 2) * PX;

function drawTop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = TEAL;
  ctx.fillRect(0, 0, w, h);

  // Subtle plastic noise so the surface doesn't look flat.
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }

  const hole = (x: number, z: number) => {
    const s = 0.12 * PX;
    const cx = u(x);
    const cy = v(z);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(cx - s / 2 - 2, cy - s / 2 + 2, s + 4, s + 2);
    ctx.fillStyle = '#123b37';
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
    ctx.fillStyle = '#0a2624';
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s * 0.35);
  };

  // Centre channel.
  ctx.fillStyle = '#1f615b';
  ctx.fillRect(u(colX(1) - 0.25), v(-0.14), (colX(COLS) - colX(1) + 0.5) * PX, 0.28 * PX);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(u(colX(1) - 0.25), v(-0.14), (colX(COLS) - colX(1) + 0.5) * PX, 0.06 * PX);

  // Gutters between the rails and the terminal strips.
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (const z of [1.98, -1.98]) {
    ctx.fillRect(u(colX(1) - 0.25), v(z - 0.05), (colX(COLS) - colX(1) + 0.5) * PX, 0.1 * PX);
  }

  // Terminal strip holes.
  for (let c = 1; c <= COLS; c++) for (const r of ROWS) hole(colX(c), rowZ(r));

  // Rails with their red (+) and blue (−) stripes.
  for (const [id, z] of Object.entries(RAILS)) {
    for (let c = 1; c <= COLS; c++) if (railHasCol(c)) hole(colX(c), z);
    const positive = id.endsWith('P');
    const outer = id === 'FP' || id === 'BP';
    const lineZ = z + (outer ? (z > 0 ? 0.17 : -0.17) : z > 0 ? -0.17 : 0.17);
    ctx.fillStyle = positive ? '#d6453a' : '#3a6fd1';
    ctx.fillRect(u(colX(1) - 0.1), v(lineZ) - 3, (colX(COLS) - colX(1) + 0.2) * PX, 6);
  }

  // Column numbers and row letters.
  ctx.fillStyle = 'rgba(230,245,240,0.75)';
  ctx.font = `600 ${0.15 * PX}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let c = 1; c <= COLS; c++) {
    ctx.fillText(String(c), u(colX(c)), v(1.93));
    ctx.fillText(String(c), u(colX(c)), v(-1.93));
  }
  for (const r of ROWS) {
    ctx.fillText(r, u(colX(1) - 0.32), v(rowZ(r)));
    ctx.fillText(r, u(colX(COLS) + 0.32), v(rowZ(r)));
  }
}

export function Breadboard() {
  const texture = useMemo(() => canvasTexture(Math.round(TOP_W * PX), Math.round(TOP_D * PX), drawTop), []);

  return (
    <group>
      <RoundedBox
        args={[BOARD_W, BOARD_H, BOARD_D]}
        radius={0.2}
        smoothness={6}
        position={[0, -BOARD_H / 2 - 0.04, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={TEAL} roughness={0.62} metalness={0.02} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[TOP_W, TOP_D]} />
        <meshStandardMaterial map={texture} roughness={0.6} />
      </mesh>
    </group>
  );
}
