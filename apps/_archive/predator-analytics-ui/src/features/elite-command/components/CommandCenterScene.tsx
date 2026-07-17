'use client';

import { Button } from '@/components/ui/button';
import { Suspense, useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Stars, Text, Float, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, ToneMapping, SMAA } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

import { VoidSkybox } from './models/VoidSkybox';
import { ControlRoomCross } from './models/ControlRoomCross';
import { PredatorAvatar } from './models/PredatorAvatar';
import { TeleportNode } from './models/TeleportNode';

// ─── КОСМІЧНИЙ ПЕЙЗАЖ ───────────────────────────────────────────
// Використовуємо VoidSkybox, що налаштовано для deep_space_landscape

// ─── КРИШТАЛЕВА ПЛАНЕТА У ПРОСТОРІ ──────────────────────────────
function CrystalPlanet() {
  const { scene } = useGLTF('/models/planet.glb');
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.1;
  });
  return (
    // Ставимо далеко на фоні як велику планету
    <group ref={ref} position={[-200, 80, -300]} scale={20}>
      <primitive object={scene} />
      <pointLight color="#aaffff" intensity={5} distance={1000} />
    </group>
  );
}
useGLTF.preload('/models/planet.glb');

// ─── БОЙОВІ КОРАБЛІ НА ОРБІТІ ───────────────────────────────────
function FlyingShips() {
  const { scene } = useGLTF('/models/light_fighter_spaceship_-_free_-.glb');
  const shipsRef = useRef<THREE.Group>(null);
  const SHIPS = useMemo(() => [
    { radius: 80, speed: 0.25, offset: 0, height: 18, scale: 0.25 },
    { radius: 100, speed: 0.18, offset: Math.PI * 0.66, height: 12, scale: 0.2 },
    { radius: 120, speed: 0.32, offset: Math.PI * 1.33, height: 22, scale: 0.3 },
    { radius: 90, speed: 0.4,  offset: Math.PI * 0.3,  height: 8,  scale: 0.15 },
  ], []);

  useFrame((state) => {
    if (!shipsRef.current) return;
    const t = state.clock.elapsedTime;
    shipsRef.current.children.forEach((child, i) => {
      const s = SHIPS[i];
      const angle = t * s.speed + s.offset;
      const nx = Math.cos(angle + 0.05) * s.radius;
      const nz = Math.sin(angle + 0.05) * s.radius;
      child.position.x = Math.cos(angle) * s.radius;
      child.position.y = s.height + Math.sin(t * 1.5 + i) * 1.5;
      child.position.z = Math.sin(angle) * s.radius;
      child.lookAt(nx, child.position.y, nz);
    });
  });

  return (
    <group ref={shipsRef}>
      {SHIPS.map((s, i) => (
        <group key={i} scale={s.scale}>
          <primitive object={scene.clone()} />
          <pointLight color="#00aaff" intensity={1.5} distance={15} />
        </group>
      ))}
    </group>
  );
}
useGLTF.preload('/models/light_fighter_spaceship_-_free_-.glb');

// ─── ГОЛОГРАМА НА СТОЛІ ──────────────────────────────────────────
function TableHologram() {
  const { scene } = useGLTF('/models/animated_globe.glb');
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={ref} position={[0, 1.2, 0]} scale={0.25}>
      <primitive object={scene} />
      <pointLight color="#00ffff" intensity={2} distance={5} />
    </group>
  );
}
useGLTF.preload('/models/animated_globe.glb');

// ─── ПОРТАЛ НА КРАЮ ДОРІЖКИ ──────────────────────────────────────
const PORTALS = [
  { id: 'osint',       label: 'ОСІНТ',           pos: [0, 0, -24] as [number,number,number],  rot: [0, 0, 0] as [number,number,number],           color: '#00f3ff', model: '/models/portal_gateway.glb' },
  { id: 'risk',        label: 'АНАЛІЗ РИЗИКІВ',  pos: [0, 0, 24]  as [number,number,number],  rot: [0, Math.PI, 0] as [number,number,number],     color: '#ffaa00', model: '/models/portal_gate.glb'     },
  { id: 'command',     label: 'ЦЕНТР УПРАВЛІННЯ', pos: [24, 0, 0]  as [number,number,number],  rot: [0, -Math.PI/2, 0] as [number,number,number],  color: '#a855f7', model: '/models/portal_gate_3.glb'   },
  { id: 'intelligence',label: 'ЦИФРОВИЙ ДВІЙНИК', pos: [-24, 0, 0] as [number,number,number], rot: [0, Math.PI/2, 0] as [number,number,number],   color: '#00ff66', model: '/models/portal_gateway.glb' },
];

// ─── КОНТРОЛЕР КАМЕРИ ────────────────────────────────────────────
function CameraController({ targetNode }: { targetNode: string | null }) {
  useFrame((state) => {
    if (targetNode) {
      const p = PORTALS.find(p => p.id === targetNode);
      if (p) {
        const look = new THREE.Vector3(p.pos[0], 1.5, p.pos[2]);
        const cam = new THREE.Vector3(p.pos[0] * 0.6, 4, p.pos[2] * 0.6);
        state.camera.position.lerp(cam, 0.05);
        state.camera.lookAt(look);
      }
    } else {
      state.camera.position.lerp(new THREE.Vector3(0, 8, 16), 0.04);
      state.camera.lookAt(new THREE.Vector3(0, 1, 0));
    }
  });
  return null;
}

// ─── ГОЛОВНА СЦЕНА ──────────────────────────────────────────────
function LoadingScreen() {
  return <Text color="#ff0033" fontSize={0.6} position={[0, 1.5, 0]}>ІНІЦІАЛІЗАЦІЯ...</Text>;
}

export interface CommandCenterSceneProps {
  emotion?: any;
  speakActive?: boolean;
  lang?: string;
  onPortalSelect?: (id: string, label: string) => void;
}

export function CommandCenterScene({ emotion, speakActive, lang, onPortalSelect }: CommandCenterSceneProps) {
  const [cameraFocus, setCameraFocus] = useState<string | null>(null);

  return (
    <div className="w-full h-screen bg-black relative">
      {cameraFocus && (
        <Button variant="cyber"
          onClick={() => setCameraFocus(null)}
          className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-2 bg-black/70 border border-red-500/50 text-red-400 text-xs tracking-[0.3em] uppercase hover:bg-red-950/40 transition-all backdrop-blur-md"
        >
          ← ПОВЕРНУТИСЯ ДО ТРОНУ
        </Button>
      )}

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 8, 16]} fov={55} near={0.1} far={50000} />

        <OrbitControls
          enabled={!cameraFocus}
          maxPolarAngle={Math.PI * 0.65}
          minDistance={4}
          maxDistance={50}
          target={[0, 1, 0]}
        />

        <CameraController targetNode={cameraFocus} />

        <color attach="background" args={['#020208']} />
        <fog attach="fog" args={['#020210', 60, 400]} />

        {/* Зірки на далекому тлі */}
        <Stars radius={200} depth={80} count={8000} factor={5} fade speed={0.8} />

        <Suspense fallback={<LoadingScreen />}>

          {/* ─── ОСВІТЛЕННЯ: 3-ТОЧКОВА КІНЕМАТОГРАФІЧНА СХЕМА ─── */}

          {/* Ключове світло (Key Light) — холодний блакитний зверху-праворуч */}
          <directionalLight
            position={[12, 25, 10]}
            intensity={1.5}
            color="#4488ff"
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-near={0.5}
            shadow-camera-far={100}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0002}
            shadow-normalBias={0.02}
          />

          {/* Заповнюючє світло (Fill Light) — тепліше, м'якше, зліва */}
          <directionalLight
            position={[-10, 15, -5]}
            intensity={0.4}
            color="#ff6633"
          />

          {/* Контрове світло (Rim/Back Light) — підкреслює контури */}
          <directionalLight
            position={[0, 5, -20]}
            intensity={0.6}
            color="#6644ff"
          />

          {/* Загальне навколишнє світло — дуже слабке */}
          <ambientLight intensity={0.08} color="#0a0a20" />

          {/* Центральне акцентне світло над столом — голографічне сяйво */}
          <spotLight
            position={[0, 12, 0]}
            angle={0.5}
            penumbra={0.8}
            intensity={3}
            color="#0066ff"
            distance={30}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />

          {/* Точкові кольорові акценти від порталів */}
          <pointLight position={[0, 3, -24]} intensity={3} color="#00f3ff" distance={20} decay={2} />
          <pointLight position={[0, 3, 24]}  intensity={3} color="#ffaa00" distance={20} decay={2} />
          <pointLight position={[24, 3, 0]}  intensity={3} color="#a855f7" distance={20} decay={2} />
          <pointLight position={[-24, 3, 0]} intensity={3} color="#00ff66" distance={20} decay={2} />

          {/* Тепле підсвічування хижака знизу — драматичний ефект */}
          <pointLight position={[1.5, 0.5, 1.5]} intensity={1.5} color="#ff2200" distance={8} decay={2} />

          {/* Реалістичні відбиття — мінімальна інтенсивність, лише для відблисків металу */}
          <Environment preset="night" background={false} environmentIntensity={0.04} />

          {/* ─── ФОН ─── */}
          <VoidSkybox />

          {/* ─── КІМНАТА ─── */}
          <ControlRoomCross />

          {/* ─── ГОЛОГРАМА НА СТОЛІ ─── */}
          <TableHologram />

          {/* ─── ХИЖАК ─── */}
          <PredatorAvatar />

          {/* ─── ТІНІ НА ПІДЛОЗІ ─── */}
          <ContactShadows
            position={[0, 0.05, 0]}
            opacity={0.8}
            scale={60}
            blur={3}
            far={12}
            color="#000020"
            resolution={1024}
          />

          {/* ─── ПОРТАЛИ НА КІНЦЯХ ДОРІЖОК ─── */}
          {PORTALS.map((p) => (
            <TeleportNode
              key={p.id}
              id={p.id}
              label={p.label}
              position={p.pos}
              rotation={p.rot}
              color={p.color}
              scale={0.7}
              modelPath={p.model}
              onClick={setCameraFocus}
            />
          ))}

          {/* ─── ПЛАНЕТА У ПРОСТОРІ ─── */}
          <CrystalPlanet />

          {/* ─── КОРАБЛІ НА ОРБІТІ ─── */}
          <FlyingShips />

          {/* ─── POST-PROCESSING ЕФЕКТИ ─── */}
          <EffectComposer multisampling={0}>
            {/* SMAA антиаліасинг */}
            <SMAA />
            {/* Тоне-маппінг ACES Filmic — кінематографічна кольорова гамма */}
            <ToneMapping mode={ToneMappingMode.AGX} />
            {/* Bloom — тільки для дуже яскравих об'єктів (портали, лазери, голограма) */}
            <Bloom
              luminanceThreshold={0.8}
              luminanceSmoothing={0.75}
              intensity={0.8}
              mipmapBlur
              radius={0.8}
            />
            {/* Хроматична аберація — ледь помітний ефект лінзи */}
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.0005, 0.0005)}
              radialModulation={false}
              modulationOffset={0}
            />
            {/* Плівковий шум — мінімальний для текстури */}
            <Noise opacity={0.04} blendFunction={BlendFunction.OVERLAY} />
            {/* Він'єтка — фокус на центрі */}
            <Vignette eskil={false} offset={0.25} darkness={1.1} />
          </EffectComposer>

        </Suspense>
      </Canvas>
    </div>
  );
}
