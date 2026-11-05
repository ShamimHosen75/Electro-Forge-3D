import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useForge } from '../store/useForge';
import { blinkStats } from '../circuit/values';
import type { Part } from '../circuit/types';
import { Breadboard } from './Breadboard';
import { CameraRig, HOME_POS } from './CameraRig';
import { Resistor } from './parts/Resistor';
import { Led } from './parts/Led';
import { Electrolytic } from './parts/Electrolytic';
import { Ceramic } from './parts/Ceramic';
import { Chip555 } from './parts/Chip555';
import { WireJumper } from './parts/WireJumper';
import { Button } from './parts/Button';

function PartView({ part, blink }: { part: Part; blink: { freq: number; duty: number } }) {
  switch (part.kind) {
    case 'resistor':
      return <Resistor part={part} />;
    case 'led':
      // Only the timer output LED blinks; any other LED is steady.
      return <Led part={part} blink={part.id === 'D1' ? blink : undefined} />;
    case 'electrolytic':
      return <Electrolytic part={part} />;
    case 'ceramic':
      return <Ceramic part={part} />;
    case 'ic555':
      return <Chip555 part={part} />;
    case 'button':
      return <Button part={part} />;
  }
}

function Circuit3D() {
  const circuit = useForge((s) => s.circuit);
  const { freq, duty } = blinkStats(circuit);
  const blink = { freq: circuit.mode === 'astable' ? freq : 0, duty };
  return (
    <group>
      <Breadboard />
      {circuit.parts.map((p) => (
        <PartView key={p.id} part={p} blink={blink} />
      ))}
      {circuit.wires.map((w) => (
        <WireJumper key={w.id} wire={w} />
      ))}
    </group>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: HOME_POS.toArray(), fov: 34, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#fff6e6', '#2b5c57', 0.55]} />
      <directionalLight
        position={[4, 10, 6]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.4} position={[0, 6, 4]} scale={[10, 4, 1]} color="#fff4e2" />
        <Lightformer intensity={0.8} position={[-6, 3, -2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#ffffff" />
        <Lightformer intensity={0.6} position={[6, 3, -2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#e9f0ff" />
      </Environment>
      <Circuit3D />
      <ContactShadows position={[0, -0.56, 0]} opacity={0.45} scale={18} blur={2.6} far={3} color="#3d2f1c" />
      <CameraRig />
    </Canvas>
  );
}
