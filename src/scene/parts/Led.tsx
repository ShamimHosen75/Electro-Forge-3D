import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Part } from '../../circuit/types';
import { LED_COLORS } from '../../circuit/values';
import { canvasTexture } from '../labelTexture';
import { Leg, SINK, TwoPin } from './common';

const glowTexture = (() => {
  let tex: THREE.Texture | null = null;
  return () =>
    (tex ??= canvasTexture(128, 128, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    }));
})();

const BASE_Y = 0.4;
const LR = 0.15; // lens radius

/**
 * 5 mm LED. `blink` gives the on/off pattern; when it's off the LED stays lit.
 */
export function Led({ part, blink, brightness = 1 }: { part: Part; blink?: { freq: number; duty: number }; brightness?: number }) {
  const colors = LED_COLORS[part.color ?? 'red'];
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const domeMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glow = useRef<THREE.Sprite>(null);
  const pool = useRef<THREE.Sprite>(null);
  const light = useRef<THREE.PointLight>(null);
  const level = useRef(1);
  const tex = useMemo(glowTexture, []);
  const glowColor = useMemo(() => new THREE.Color(colors.glow), [colors.glow]);
  const bodyColor = useMemo(() => new THREE.Color(colors.body), [colors.body]);

  useFrame(({ clock }, dt) => {
    let on = 1;
    if (blink && blink.freq > 0 && !part.reversed) {
      const phase = (clock.elapsedTime * blink.freq) % 1;
      on = phase < blink.duty ? 1 : 0;
    }
    if (part.reversed) on = 0;
    // Ease towards the target so the LED fades a little like a real one.
    level.current += (on - level.current) * Math.min(1, dt * 22);
    const l = level.current * brightness;
    for (const m of [bodyMat.current, domeMat.current]) {
      if (!m) continue;
      m.emissive.copy(glowColor);
      m.emissiveIntensity = 0.05 + l * 1.6;
      m.color.copy(bodyColor).lerp(glowColor, l * 0.35);
    }
    if (glow.current) (glow.current.material as THREE.SpriteMaterial).opacity = l * 0.85;
    if (pool.current) (pool.current.material as THREE.SpriteMaterial).opacity = l * 0.35;
    if (light.current) light.current.intensity = l * 2.2;
  });

  return (
    <TwoPin a={part.pins[0]} b={part.pins[1]}>
      {(span) => (
        <group>
          {/* anode leg is a touch longer and kinked, like the real thing */}
          <Leg points={[[-0.05, BASE_Y, 0], [-0.05, 0.2, 0], [-span / 2, 0.12, 0], [-span / 2, SINK, 0]]} />
          <Leg points={[[0.05, BASE_Y, 0], [0.05, 0.2, 0], [span / 2, 0.12, 0], [span / 2, SINK, 0]]} />
          <mesh position={[0, BASE_Y + 0.015, 0]} castShadow>
            <cylinderGeometry args={[LR * 1.18, LR * 1.18, 0.05, 32]} />
            <meshPhysicalMaterial ref={bodyMat} color={colors.body} roughness={0.2} transmission={0.2} thickness={0.3} />
          </mesh>
          <mesh position={[0, BASE_Y + 0.17, 0]} castShadow>
            <cylinderGeometry args={[LR, LR, 0.28, 32]} />
            <meshPhysicalMaterial ref={domeMat} color={colors.body} roughness={0.15} clearcoat={1} />
          </mesh>
          <mesh position={[0, BASE_Y + 0.31, 0]} castShadow>
            <sphereGeometry args={[LR, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color={colors.body} roughness={0.15} clearcoat={1} emissive={colors.glow} emissiveIntensity={0.9} />
          </mesh>
          <sprite ref={glow} position={[0, BASE_Y + 0.24, 0]} scale={[1.3, 1.3, 1]}>
            <spriteMaterial map={tex} color={colors.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <sprite ref={pool} position={[0, 0.03, 0]} scale={[1.6, 1.6, 1]}>
            <spriteMaterial map={tex} color={colors.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <pointLight ref={light} position={[0, BASE_Y + 0.25, 0]} color={colors.glow} distance={2.2} decay={2} />
        </group>
      )}
    </TwoPin>
  );
}
