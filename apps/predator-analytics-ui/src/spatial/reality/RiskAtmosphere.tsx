/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Атмосфера Ризику
 *
 * Фоновий шейдер, який реагує на рівень загрози: колір, світло,
 * спотворення, сітка. Створює відчуття "живого простору".
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCommandStore } from '../store/useCommandStore';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders/spatialShaders';

// ─── Фоновий шейдерний екран ─────────────────────────────────────────────────

function RiskAtmosphereInner() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime:        { value: 0 },
    uThreatLevel: { value: 0 },
    uDarkMatter:  { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (!matRef.current) return;

    const { threatLevel, isDarkMatter } = useCommandStore.getState();

    matRef.current.uniforms['uTime'].value = state.clock.elapsedTime;

    // Плавна зміна рівня загрози
    matRef.current.uniforms['uThreatLevel'].value = THREE.MathUtils.lerp(
      matRef.current.uniforms['uThreatLevel'].value as number,
      threatLevel,
      delta * 2
    );

    // Dark Matter перехід
    matRef.current.uniforms['uDarkMatter'].value = THREE.MathUtils.lerp(
      matRef.current.uniforms['uDarkMatter'].value as number,
      isDarkMatter ? 1 : 0,
      delta * 1.5
    );
  });

  return (
    <mesh renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        transparent={false}
      />
    </mesh>
  );
}

// ─── Ambient Lighting що реагує на загрозу ───────────────────────────────────

function ThreatLightingInner() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const pointRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const { threatLevel, isDarkMatter } = useCommandStore.getState();
    const time = state.clock.elapsedTime;

    // Ambient інтенсивність
    if (ambientRef.current) {
      const targetIntensity = isDarkMatter ? 0.02 : 0.08 + threatLevel * 0.03;
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        targetIntensity,
        delta * 3
      );
    }

    // Point light — пульсація при високій загрозі
    if (pointRef.current) {
      const pulse = threatLevel >= 3
        ? Math.sin(time * 2) * 0.3 + 0.7
        : 1;

      pointRef.current.intensity = (0.5 + threatLevel * 0.2) * pulse;

      // Колір від загрози
      const color = new THREE.Color();
      color.lerpColors(
        new THREE.Color(0x001133), // безпечно — темно-синій
        new THREE.Color(0x440000), // небезпечно — темно-червоний
        threatLevel / 5
      );
      pointRef.current.color.copy(color);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.08} />
      <pointLight
        ref={pointRef}
        position={[0, 15, 0]}
        intensity={0.5}
        distance={50}
        decay={2}
      />
    </>
  );
}

export const RiskAtmosphere = memo(RiskAtmosphereInner);
export const ThreatLighting = memo(ThreatLightingInner);
