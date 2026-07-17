import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCyberStore } from '../../store/useCyberStore';

export const HolographicBackground = () => {
  const { aiState, avatarMode } = useCyberStore();
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Створюємо мережу вузлів (зв'язків)
  const { positions, linePositions } = useMemo(() => {
    const particleCount = 100;
    const pos = new Float32Array(particleCount * 3);
    const lPos = [];

    for (let i = 0; i < particleCount; i++) {
      // Сферичний розподіл
      const r = 5 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 5; // відсуваємо назад

      // З'єднуємо сусідні вузли
      if (i > 0 && Math.random() > 0.7) {
        const prev = Math.floor(Math.random() * i);
        lPos.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        lPos.push(pos[prev * 3], pos[prev * 3 + 1], pos[prev * 3 + 2]);
      }
    }
    return { positions: pos, linePositions: new Float32Array(lPos) };
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Анімація обертання графу
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.05;
      pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.05;
      linesRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }

    // Якщо ШІ "думає", граф рухається швидше
    if (aiState === 'THINKING') {
      if (pointsRef.current) pointsRef.current.rotation.y += 0.02;
      if (linesRef.current) linesRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group>
      {/* Точки вузлів */}
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
          size={0.05} 
          color={aiState === 'THINKING' ? "#f59e0b" : "#0ea5e9"} // Жовтий коли думає, блакитний коли чекає
          transparent 
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Зв'язки між вузлами */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={aiState === 'THINKING' ? "#fbbf24" : "#38bdf8"} 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};
