import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { useForge } from '../store/useForge';
import { blinkStats } from '../circuit/values';
import type { Part } from '../circuit/types';
import { ledPowered } from '../circuit/netlist';
import { Breadboard } from './Breadboard';
import { CameraRig, HOME_POS } from './CameraRig';
import { Resistor } from './parts/Resistor';
import { Led } from './parts/Led';
import { Electrolytic } from './parts/Electrolytic';
import { Ceramic } from './parts/Ceramic';
import { Chip555 } from './parts/Chip555';
import { WireJumper } from './parts/WireJumper';
import { Animated } from './Animated';
import { Button } from './parts/Button';
import { DragLayer, Pickable, SelectionRing } from './Interaction';

type Blink = { freq: number; duty: number; brightness: number; reversedCap: boolean };

/** The 555 output (pin 3) as seen by the blink LED. */
const outputSignal = (blink: Blink) => (t: number) => {
  const s = useForge.getState();
  if (s.circuit.parts.some((p) => p.role === 'reset' && s.pressed[p.id])) return 0; // reset held
  if (s.circuit.mode === 'monostable') return performance.now() / 1000 < s.pulseUntil ? 1 : 0;
  if (blink.freq <= 0) return 1;
  return (t * blink.freq) % 1 < blink.duty ? 1 : 0;
};

const steadySignal = (id: string) => () => (ledPowered(useForge.getState().circuit, id) ? 1 : 0);

function PartView({ part, blink }: { part: Part; blink: Blink }) {
  switch (part.kind) {
    case 'resistor':
      return <Resistor part={part} />;
    case 'led':
      // Only the timer output LED blinks; any other LED is steady.
      // The timer's LED blinks; any other LED lights only when it's wired across the supply.
      return (
        <Led
          part={part}
          signal={part.id === 'D1' ? outputSignal(blink) : steadySignal(part.id)}
          brightness={part.id === 'D1' ? blink.brightness : 1}
        />
      );
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
  const anims = useForge((s) => s.anims);
  const { freq, duty } = blinkStats(circuit);
  // A bigger LED resistor means less current and a dimmer LED.
  const r3 = circuit.parts.find((p) => p.id === 'R3')?.value ?? 220;
  const brightness = Math.min(1.3, Math.max(0.3, Math.sqrt(220 / r3)));
  const reversedCap = !!circuit.parts.find((p) => p.id === 'C1')?.reversed;
  const blink = { freq: circuit.mode === 'astable' ? freq : 0, duty, brightness, reversedCap };
  const render = (p: Part) => <PartView part={p} blink={blink} />;
  const removed = anims.filter((a) => a.kind === 'remove' && a.ghost && !circuit.parts.some((p) => p.id === a.partId));
  return (
    <group>
      <group
        onClick={(e) => {
          // A plain click on the board (not the end of an orbit drag) clears the selection.
          if (e.delta < 4) useForge.getState().select(null);
        }}
      >
        <Breadboard />
      </group>
      {circuit.parts.map((p) => (
        <Pickable key={p.id} part={p}>
          <Animated part={p} anim={anims.find((a) => a.partId === p.id)} render={render} />
        </Pickable>
      ))}
      <SelectionRing />
      <DragLayer />
      {removed.map((a) => (
        <Animated key={`gone-${a.partId}-${a.start}`} part={a.ghost!} anim={a} render={render} />
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
