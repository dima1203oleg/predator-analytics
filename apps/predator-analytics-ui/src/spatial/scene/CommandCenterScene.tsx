import { Suspense, memo, useEffect, useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { CameraDirector } from '../perception/CameraDirector';
import { RiskAtmosphere, ThreatLighting } from '../reality/RiskAtmosphere';
import { SpatialGraph } from '../reality/SpatialGraph';
import { ThoughtEngine } from '../cognitive/ThoughtEngine';
import { CommandHUD } from '../hud/CommandHUD';
import { useCommandStore } from '../store/useCommandStore';
import { audioFeedback } from '../interaction/AudioFeedback';
import { voiceInputController } from '../interaction/VoiceInputController';
import { HolographicTable } from '../reality/HolographicTable';
import { ZAxisMemory } from '../reality/ZAxisMemory';
import { QuantumCursor } from '../perception/QuantumCursor';
import { LODController } from '../performance/LODController';
import { ErrorBoundary } from './ErrorBoundary';

// ─── Post-Processing Effects ────────────────────────────────────────────────

function SceneEffects() {
  const store = useCommandStore();

  return (
    <EffectComposer>
      <Bloom 
        intensity={store.threatLevel > 3 ? 2 : 1}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
      />
      {store.threatLevel === 5 ? (
        // @ts-ignore
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.005, 0.005)}
        />
      ) : <></>}
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}

// ─── Орбітальний Сканер ─────────────────────────────────────────────────────

function OrbitalScanner() {
  const ringsRef = useRef<THREE.Group>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  useFrame((state) => {
    if (ringsRef.current) {
      const time = state.clock.elapsedTime;
      const speedMultiplier = isScanning ? 4 : 1;
      ringsRef.current.rotation.x = Math.sin(time * 0.2 * speedMultiplier) * 0.5;
      ringsRef.current.rotation.y = time * 0.5 * speedMultiplier;
      ringsRef.current.rotation.z = Math.cos(time * 0.1 * speedMultiplier) * 0.2;
      
      if (isScanning) {
        const scale = 1 + Math.sin(time * 10) * 0.05;
        ringsRef.current.scale.set(scale, scale, scale);
      } else {
        ringsRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  const handleScanClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1500);
  }, []);

  const onPointerOver = useCallback(() => { document.body.style.cursor = 'pointer'; }, []);
  const onPointerOut = useCallback(() => { document.body.style.cursor = 'auto'; }, []);

  return (
    <group ref={ringsRef} position={[0, 0, 0]}>
      {/* Зовнішнє кільце */}
      <mesh onClick={handleScanClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <ringGeometry args={[12, 12.1, 64]} />
        <meshBasicMaterial color={isScanning ? "#ffffff" : "#00f0ff"} transparent opacity={isScanning ? 0.4 : 0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Внутрішнє кільце */}
      <mesh onClick={handleScanClick} rotation={[Math.PI / 2, 0, 0]} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <ringGeometry args={[8, 8.05, 64]} />
        <meshBasicMaterial color={isScanning ? "#ffffff" : "#00ff88"} transparent opacity={isScanning ? 0.5 : 0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Кільце даних */}
      <mesh onClick={handleScanClick} rotation={[0, Math.PI / 4, 0]} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <ringGeometry args={[15, 15.2, 64, 1, 0, Math.PI]} />
        <meshBasicMaterial color={isScanning ? "#ff0000" : "#ffaa00"} transparent opacity={isScanning ? 0.3 : 0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Головний Сцена (Command Center) ────────────────────────────────────────

function CommandCenterSceneInner() {
  const setDarkMatter = useCommandStore((s) => s.setDarkMatter);
  const IDLE_TIMEOUT = 180000; // 3 minutes

  useEffect(() => {
    audioFeedback.init();
    voiceInputController.init();
    return () => audioFeedback.dispose();
  }, []);

  // Idle detection for Dark Matter Mode
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const handleInactivity = () => {
      useCommandStore.getState().setDarkMatter(true);
    };

    const resetIdle = () => {
      useCommandStore.getState().setDarkMatter(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => handleInactivity(), IDLE_TIMEOUT);
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);
    
    resetIdle();

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <group>
        <Suspense fallback={null}>
          {/* Режисер та Атмосфера */}
          <CameraDirector />
          <QuantumCursor />
          <ThreatLighting />
          <RiskAtmosphere />
          <LODController />

          {/* Візуалізація Даних */}
          <ZAxisMemory />
          <SpatialGraph />
          <OrbitalScanner />
          <HolographicTable />

          {/* AI Агент */}
          <group position={[0, 0, 0]}>
            <ThoughtEngine />
          </group>

          {/* Ефекти */}
          <SceneEffects />
        </Suspense>
    </group>
  );
}

export const CommandCenterScene = memo(CommandCenterSceneInner);
export default CommandCenterScene;
