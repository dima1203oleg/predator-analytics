import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedRigidBodies, RigidBody, CuboidCollider } from '@react-three/rapier';
import { usePredatorStore } from '../stores/usePredatorStore';
import * as THREE from 'three';
import { eventBus } from '../core/EventBus';

const MAX_PARTICLES = 500;

export const VoidForge: React.FC = () => {
  const hammerRef = useRef<any>(null);
  const systemLoad = usePredatorStore((state) => state.systemLoad);
  const [particles, setParticles] = useState<any[]>([]);

  // Kinematic hammer movement
  useFrame((state, delta) => {
    if (hammerRef.current) {
      const time = state.clock.getElapsedTime();
      // Speed depends on system load
      const speed = 2.0 + systemLoad * 5.0; 
      
      // Hammer goes up and down
      const y = Math.sin(time * speed) * 2;
      hammerRef.current.setNextKinematicTranslation({ x: 0, y, z: 0 });

      // If hammer hits bottom, generate sparks
      if (y < -1.5) {
        if (Math.random() > 0.8 - (systemLoad * 0.5)) {
          generateSparks();
        }
      }
    }
  });

  const generateSparks = () => {
    setParticles((prev) => {
      const newCount = Math.floor(Math.random() * 10) + 5;
      const newParticles = Array.from({ length: newCount }).map(() => ({
        id: Math.random().toString(),
        position: [(Math.random() - 0.5) * 2, -1.5, (Math.random() - 0.5) * 2],
        velocity: [(Math.random() - 0.5) * 5, Math.random() * 5 + 2, (Math.random() - 0.5) * 5],
        createdAt: Date.now()
      }));
      
      const combined = [...prev, ...newParticles];
      return combined.slice(-MAX_PARTICLES); // Keep max 500
    });
  };

  // Spark cleanup loop
  useFrame(() => {
    const now = Date.now();
    setParticles((prev) => prev.filter(p => now - p.createdAt < 3000));
  });

  return (
    <group>
      {/* Kinematic Hammer */}
      <RigidBody ref={hammerRef} type="kinematicPosition" colliders="cuboid" position={[0, 2, 0]}>
        <mesh>
          <cylinderGeometry args={[1, 1, 0.5, 32]} />
          <meshStandardMaterial color="#2D5F8A" metalness={0.8} roughness={0.2} />
        </mesh>
      </RigidBody>

      {/* Anvil / Base collider */}
      <CuboidCollider position={[0, -2, 0]} args={[5, 0.5, 5]} />

      {/* Sparks */}
      {particles.map(p => (
        <RigidBody key={p.id} position={p.position} linearVelocity={p.velocity} type="dynamic" colliders="ball">
          <mesh>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#D69E2E" />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
};
