/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Z-Axis Memory
 *
 * Відображає попередні стани/шари даних позаду поточного графу на осі Z.
 * Створює ефект глибини часу.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MEMORY_LAYERS = 3;
const Z_SPACING = -20; // Відстань між шарами

function ZAxisMemoryInner() {
  const groupRef = useRef<THREE.Group>(null);

  // Створюємо декоративні "скелети" попередніх графів
  const layers = useMemo(() => {
    return Array.from({ length: MEMORY_LAYERS }).map((_, i) => {
      // Генерація статичних ліній для абстрактного графу
      const points = [];
      const numLines = 25;
      for (let j = 0; j < numLines; j++) {
        points.push(
          new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, 0),
          new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, 0)
        );
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return { id: i, geometry };
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    
    // Легке обертання всієї пам'яті
    groupRef.current.rotation.y = Math.sin(time * 0.05) * 0.05;
    groupRef.current.position.y = Math.sin(time * 0.1) * 0.5;
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, i) => {
        const depth = (i + 1);
        const zPos = depth * Z_SPACING;
        const opacity = Math.max(0.02, 0.15 - i * 0.05);
        
        return (
          <group key={layer.id} position={[0, 0, zPos]}>
            <lineSegments geometry={layer.geometry}>
              <lineBasicMaterial 
                color="#0066ff" 
                transparent 
                opacity={opacity} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </lineSegments>
            
            {/* Туман/glow для кожного шару */}
            <mesh position={[0, 0, -2]}>
              <planeGeometry args={[80, 50]} />
              <meshBasicMaterial 
                color="#001133" 
                transparent 
                opacity={0.05} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export const ZAxisMemory = memo(ZAxisMemoryInner);
