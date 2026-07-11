import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePredatorStore } from '../stores/usePredatorStore';
import { useMoodStore } from '../stores/useMoodStore';

const DRONE_ROLES = [
  { name: 'OSINT', color: '#4A90D9' },
  { name: 'FINANCE', color: '#D69E2E' },
  { name: 'IMPORT', color: '#3A7D44' },
  { name: 'EXPORT', color: '#2D5F8A' },
  { name: 'AML', color: '#7B4FBF' },
  { name: 'TENDER', color: '#E2E8F0' },
  { name: 'TAX', color: '#9B2C2C' },
  { name: 'GRAPH', color: '#94A3B8' },
  { name: 'LLM', color: '#F472B6' }
];

const Drone = ({ role, color, nodes }: { role: string; color: string; nodes: any[] }) => {
  const meshRef = useRef<THREE.Group>(null);
  const weather = useMoodStore(state => state.weather);
  const systemLoad = usePredatorStore(state => state.systemLoad);
  
  // Цільова точка для патрулювання
  const targetPos = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  ));

  // Шлейф
  const [trail, setTrail] = useState<THREE.Vector3[]>([]);

  const pickNewTarget = () => {
    if (nodes && nodes.length > 0) {
      // Вибираємо випадковий вузол
      let attempts = 0;
      while (attempts < 5) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        // Якщо overload, шукаємо ризикові вузли (або аномалії)
        if (weather === 'overload' && randomNode.riskScore < 0.7 && attempts < 4) {
          attempts++;
          continue; // Спробуємо ще раз знайти ризиковий
        }
        
        if (randomNode.x !== undefined && randomNode.y !== undefined && randomNode.z !== undefined) {
          // Додаємо невеликий offset, щоб дрон не врізався прямо в центр вузла
          targetPos.current.set(
            randomNode.x + (Math.random() - 0.5) * 2,
            randomNode.y + (Math.random() - 0.5) * 2,
            randomNode.z + (Math.random() - 0.5) * 2
          );
          return;
        }
        break;
      }
    }
    
    // Fallback
    targetPos.current.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
  };

  useEffect(() => {
    // Первинний вибір цілі
    pickNewTarget();
    
    // Інтервал зміни цілі (3-7 секунд)
    const interval = setInterval(() => {
      pickNewTarget();
    }, 3000 + Math.random() * 4000);
    
    return () => clearInterval(interval);
  }, [nodes.length, weather]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Базова швидкість залежить від погоди
    let speed = 1.5;
    if (weather === 'storm') speed = 3.0;
    if (weather === 'overload') speed = 4.5;
    if (weather === 'insight') speed = 0.5; // Завмирання

    meshRef.current.position.lerp(targetPos.current, delta * speed);
    
    // Оновлення шлейфу (кожні ~100ms)
    if (state.clock.elapsedTime % 0.1 < delta) {
      setTrail(prev => {
        const newTrail = [...prev, meshRef.current!.position.clone()];
        if (newTrail.length > 5) newTrail.shift();
        return newTrail;
      });
    }
  });

  const intensity = (weather === 'overload' || weather === 'insight') ? 3 : 1 + systemLoad;

  return (
    <group>
      <group ref={meshRef}>
        <mesh>
          <icosahedronGeometry args={[0.15, 2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} />
        </mesh>
      </group>
      
      {/* Світловий шлейф */}
      {trail.map((pos, idx) => {
        const scale = 0.1 * (idx / trail.length);
        const opacity = 0.5 * (idx / trail.length);
        return (
          <mesh key={idx} position={pos} scale={[scale, scale, scale]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
};

export const AIDrones: React.FC = () => {
  const nodes = usePredatorStore(state => state.nodes);
  
  return (
    <group>
      {DRONE_ROLES.map((roleInfo, i) => (
        <Drone key={i} role={roleInfo.name} color={roleInfo.color} nodes={nodes} />
      ))}
    </group>
  );
};
