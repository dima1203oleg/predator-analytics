/**
 * 🧠 Holographic Avatar Component
 * 
 * Процедурно згенерована 3D голограма голови з кіберпанк естетикою
 * Використовує React Three Fiber та постprocessing для голограмних ефектів
 */

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { useCyberDashboardStore } from '../../store/cyber-dashboard-store';
import * as THREE from 'three';

// Процедурна геометрія голови
function HeadGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { headTargetRotation, headCurrentRotation, updateHeadRotation } = useCyberDashboardStore();
  
  // Процедурно створюємо форму голови з геометрії
  const headGeometry = useMemo(() => {
    // Основна сфера для черепа
    const skullRadius = 1.2;
    const skullGeometry = new THREE.SphereGeometry(skullRadius, 32, 32);
    
    // Шия з циліндра
    const neckHeight = 0.8;
    const neckRadius = 0.4;
    const neckGeometry = new THREE.CylinderGeometry(neckRadius, neckRadius * 0.6, neckHeight, 32);
    
    // Об'єднуємо геометрії (простий підхід - створюємо сферу, яка імітує голову)
    const headGeometry = new THREE.SphereGeometry(1.3, 32, 32);
    
    return headGeometry;
  }, []);
  
  // Анімація обертання
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Idle обертання
    meshRef.current.rotation.y += 0.002;
    
    // Mouse tracking з плавною інтерполяцією
    const lerp = (start: number, end: number, factor: number) => 
      start + (end - start) * factor;
    
    meshRef.current.rotation.x = lerp(
      meshRef.current.rotation.x,
      headTargetRotation.x,
      0.05
    );
    
    // Додаємо невеликий вертикальний нахил для більш реалістичного руху
    meshRef.current.rotation.y += lerp(
      meshRef.current.rotation.y,
      headTargetRotation.y,
      0.03
    ) * 0.002;
    
    // Пульсація масштабу для ефекту "дихання"
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    meshRef.current.scale.set(pulse, pulse, pulse);
  });
  
  return (
    <mesh ref={meshRef} geometry={headGeometry}>
      <WireframeMaterial color="#00F0FF" />
    </mesh>
  );
}

// Голограмний матеріал для wireframe ефекту
function WireframeMaterial({ color }: { color: string }) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  useFrame((state) => {
    if (!materialRef.current) return;
    
    // Динамічна зміна прозорості для ефекту мерехтіння
    const opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    materialRef.current.opacity = opacity;
  });
  
  return (
    <meshBasicMaterial
      ref={materialRef}
      color={color}
      wireframe={true}
      transparent={true}
      opacity={0.7}
      side={THREE.DoubleSide}
    />
  );
}

// Додатковий контурний шар для подвійного wireframe ефекту
function InnerWireframe() {
  const innerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!innerRef.current) return;
    
    // Швидша пульсація для внутрішнього шару
    const pulse = 0.95 + Math.sin(state.clock.elapsedTime * 4) * 0.03;
    innerRef.current.scale.set(pulse, pulse, pulse);
    
    // Протилежне обертання
    innerRef.current.rotation.y -= 0.003;
  });
  
  return (
    <mesh ref={innerRef} scale={[0.95, 0.95, 0.95]}>
      <icosahedronGeometry args={[1.25, 2]} />
      <meshBasicMaterial
        color="#00FF41"
        wireframe={true}
        transparent={true}
        opacity={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Точки для точкового хмарного ефекту
function PointCloud() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 1.8 + Math.random() * 0.5;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    return positions;
  }, []);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Повільне обертання точок
    pointsRef.current.rotation.y += 0.001;
    
    // Пульсація розміру
    const scale = 1 + Math.sin(state.clock.elapsedTime) * 0.05;
    pointsRef.current.scale.set(scale, scale, scale);
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00F0FF"
        size={0.02}
        transparent={true}
        opacity={0.6}
        sizeAttenuation={true}
      />
    </points>
  );
}

// Головний компонент сцени
function Scene() {
  return (
    <>
      {/* Освітлення */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00F0FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00FF41" />
      
      {/* 3D об'єкти */}
      <Float rotationIntensity={0.5} floatIntensity={0.5}>
        <HeadGeometry />
        <InnerWireframe />
        <PointCloud />
      </Float>
      
      {/* Середовище для відображень */}
      <Environment preset="night" />
      
      {/* Елементи управління */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
        autoRotate={false}
      />
    </>
  );
}

// Компонент для постобробки
function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        intensity={1.5}
        radius={0.8}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.001, 0.0005)}
        modulationOffset={0}
        radialModulation={true}
      />
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.6}
      />
    </EffectComposer>
  );
}

// Головний експорт
export default function HolographicAvatar() {
  const { threatLevel } = useCyberDashboardStore();
  
  // Динамічний колір залежно від рівня загрози
  const threatColor = useMemo(() => {
    switch (threatLevel) {
      case 1: return '#00FF41'; // green
      case 2: return '#00F0FF'; // cyan
      case 3: return '#FFB800'; // gold
      case 4: return '#FF8800'; // orange
      case 5: return '#FF3333'; // red
      default: return '#00F0FF';
    }
  }, [threatLevel]);
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Optimise for performance
      >
        <Scene />
        <PostProcessing />
      </Canvas>
      
      {/* Технічний overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border border-cyber-neon/30 rounded-full animate-spin-slow opacity-20" />
        <div className="absolute w-48 h-48 border border-cyber-green/30 rounded-full animate-spin-reverse opacity-15" />
      </div>
      
      {/* Рівень загрози indicator */}
      <div className="absolute top-4 right-4 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < threatLevel ? 'bg-cyber-neon animate-pulse' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
