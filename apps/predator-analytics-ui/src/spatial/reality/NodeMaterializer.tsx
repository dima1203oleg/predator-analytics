/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Node Materializer
 *
 * Анімація появи (матеріалізації) вузлів та ефекти нестабільності
 * (partial, unknown). Використовує react-spring для плавності.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

interface NodeMaterializerProps {
  children: React.ReactNode;
  delay?: number;
  status?: 'confirmed' | 'partial' | 'unknown';
}

function NodeMaterializerInner({ children, delay = 0, status = 'confirmed' }: NodeMaterializerProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Пружинна анімація матеріалізації (scale від 0 до 1)
  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    delay,
    config: { mass: 1, tension: 170, friction: 14 }
  });

  // Додаткові процедурні анімації залежно від статусу
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    if (status === 'partial') {
      // Мерехтіння та легка вібрація
      const flicker = Math.sin(time * 20) * 0.1 + 0.9;
      groupRef.current.scale.setScalar(flicker);
    } else if (status === 'unknown') {
      // Шумова поведінка (cloud effect simulation)
      groupRef.current.position.y = Math.sin(time * 5) * 0.05;
      groupRef.current.rotation.z = Math.sin(time * 2) * 0.1;
    }
  });

  return (
    <animated.group ref={groupRef} scale={scale as any}>
      {children}
    </animated.group>
  );
}

export const NodeMaterializer = memo(NodeMaterializerInner);
