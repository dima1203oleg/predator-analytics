import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { usePredatorStore } from '../../store/usePredatorStore'
import { Shockwave } from './Shockwave'
import { GPU_CONFIG } from '../../core/gpuConfig'

interface Spark {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  createdAt: number;
}

/**
 * VoidForge — «Кузня» з фізикою Rapier (WebAssembly).
 * Оптимізовано для RTX 3050:
 *   - Пул іскор обмежений GPU_CONFIG.MAX_SPARKS (200)
 *   - Адаптивна кількість іскор за удар (15/8)
 *   - Auto-cleanup по часу життя
 */
export const VoidForge: React.FC = () => {
  const { gl } = useThree();
  const { width, height, dpr } = useResizeObserver();
  
  // Load Models
  const tableModel = useGLTF('/models/sci-fi_hologram_table.glb');
  const maskModel = useGLTF('/models/predator_bio-mask.glb');

  // showSparks керується через HTML-оверлей у VoidForgeScene (через store)
  const showSparks = usePredatorStore((state) => state.showSparks);

  // Adjust renderer pixel ratio based on resize observer
  useEffect(() => {
    gl.setPixelRatio(Math.min(dpr, GPU_CONFIG.DPR_RANGE[1]));
    gl.setSize(width, height);
  }, [gl, width, height, dpr]);
  const hammerRef = useRef<RapierRigidBody>(null);
  const isHammerStriking = usePredatorStore((state) => state.isHammerStriking);
  const impactTrigger = usePredatorStore((state) => state.forgeImpactTrigger);
  
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkIdCounter = useRef(0);
  
  // Спільна геометрія для всіх іскор — мінімальна кількість полігонів
  const sparkGeometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);

  // Адаптивна кількість іскор залежно від поточного навантаження
  const getSparkCount = useCallback(() => {
    return sparks.length > GPU_CONFIG.SPARK_LOW_THRESHOLD
      ? GPU_CONFIG.SPARKS_PER_STRIKE_LOW
      : GPU_CONFIG.SPARKS_PER_STRIKE;
  }, [sparks.length]);

  useFrame((state) => {
    if (!hammerRef.current) return;
    const time = state.clock.getElapsedTime();
    
    if (isHammerStriking) {
      const strikeProgress = (time * 15.0) % 1.0;
      const targetY = THREE.MathUtils.lerp(4.5, -1.8, Math.pow(strikeProgress, 2));
      hammerRef.current.setNextKinematicTranslation({ x: 0, y: targetY, z: 0 });
    } else {
      const hoverY = 4.5 + Math.sin(time * 2.0) * 0.15;
      hammerRef.current.setNextKinematicTranslation({ x: 0, y: hoverY, z: 0 });
    }
  });

  // Auto-cleanup старих іскор по часу життя
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSparks((prev) => prev.filter(
        spark => (now - spark.createdAt) < GPU_CONFIG.SPARK_LIFETIME_MS
      ));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Генерація іскор при ударі молота
  useEffect(() => {
    if (impactTrigger === 0) return;

    // Збільшуємо кількість іскор для ефекту "мокапу"
    const count = getSparkCount() * 3; // Втричі більше іскор
    const now = Date.now();

    const generatedSparks: Spark[] = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const horizontalSpeed = Math.random() * 15.0 + 5.0; // Швидше розлітаються
      return {
        id: sparkIdCounter.current++,
        position: [(Math.random() - 0.5) * 0.4, -1.6, (Math.random() - 0.5) * 0.4],
        velocity: [Math.cos(angle) * horizontalSpeed, Math.random() * 12.0 + 8.0, Math.sin(angle) * horizontalSpeed],
        color: Math.random() > 0.4 ? '#00f0ff' : '#ff5500', // Більш вогняні/неонові кольори
        createdAt: now,
      };
    });

    setSparks((prev) => {
      const combined = [...prev, ...generatedSparks];
      // Трохи збільшимо жорстке обмеження для кращої картинки
      const maxSparks = GPU_CONFIG.MAX_SPARKS * 2;
      if (combined.length > maxSparks) {
        return combined.slice(combined.length - maxSparks);
      }
      return combined;
    });
  }, [impactTrigger, getSparkCount]);

  useEffect(() => {
    return () => { sparkGeometry.dispose(); };
  }, [sparkGeometry]);

  return (
    <>
      {impactTrigger > 0 && <Shockwave position={[0, -1.8, 0]} triggerId={impactTrigger} />}
      <Physics gravity={[0, -15.0, 0]}> {/* Трохи сильніша гравітація для іскор */}
        <RigidBody ref={hammerRef} type="kinematicPosition" colliders="cuboid">
          <group>
            {/* Hammer Head Main Block */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.8, 0.9, 1.2]} />
              <meshStandardMaterial color="#0e0e12" roughness={0.2} metalness={0.9} />
            </mesh>
            
            {/* Cyan Glowing Strips (Vertical/Horizontal cross) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.85, 0.95, 0.2]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={isHammerStriking ? 5.0 : 2.0} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.2, 0.95, 1.25]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={isHammerStriking ? 5.0 : 2.0} toneMapped={false} />
            </mesh>
            
            {/* Handle */}
            <mesh position={[0, 1.8, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 3.0, 16]} />
              <meshStandardMaterial color="#222" roughness={0.8} metalness={0.5} />
            </mesh>
            
            {/* Handle Glow Ring */}
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={isHammerStriking ? 4.0 : 1.5} toneMapped={false} />
            </mesh>
          </group>
        </RigidBody>

        <RigidBody type="fixed" colliders="cuboid" position={[0, -2.1, 0]}>
          <primitive object={tableModel.scene.clone()} scale={1.5} position={[0, -0.5, 0]} />
        </RigidBody>
        
        {/* Predator Bio-Mask hovering above/behind */}
        <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <primitive object={maskModel.scene.clone()} scale={1.0} position={[-2, 1.5, -1]} rotation={[0.2, 0.5, 0]} />
          <pointLight position={[-2, 1.5, -0.5]} intensity={2.0} color="#ff0000" distance={5} />
        </Float>

        {showSparks && sparks.map((spark) => (
          <RigidBody
            key={spark.id}
            position={spark.position}
            linearVelocity={spark.velocity}
            type="dynamic"
            colliders="ball"
            restitution={0.6}
            friction={0.2}
          >
            <mesh geometry={sparkGeometry} scale={0.08}>
              <meshBasicMaterial color={spark.color} toneMapped={false} />
            </mesh>
          </RigidBody>
        ))}
        <CuboidCollider args={[15, 0.1, 15]} position={[0, -6, 0]} sensor />
      </Physics>
    </>
  );
}

useGLTF.preload('/models/sci-fi_hologram_table.glb');
useGLTF.preload('/models/predator_bio-mask.glb');

