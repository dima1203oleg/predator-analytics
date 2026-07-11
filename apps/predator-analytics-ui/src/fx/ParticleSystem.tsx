import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAvatarStore } from '../stores/avatarStore';
import { useSceneStore } from '../stores/sceneStore';

export const ParticleSystem: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { currentState } = useAvatarStore();
  const { isIdle } = useSceneStore();

  const particleCount = isIdle ? 500 : 2000;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      color.setHSL(0.5 + Math.random() * 0.1, 0.8, 0.5);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, col];
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    // Base rotation
    let rotationSpeed = 0.001;
    
    // Adjust based on FSM state
    if (currentState === 'analyzing') {
      rotationSpeed = 0.005;
    } else if (currentState === 'alert') {
      rotationSpeed = 0.008;
    }
    
    // Adjust based on Idle mode
    if (isIdle) {
      rotationSpeed *= 0.1; // Slow down to 10%
    }

    pointsRef.current.rotation.y += rotationSpeed;
    pointsRef.current.rotation.x += rotationSpeed * 0.5;

    // React to risk level for material color modulation
    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (currentState === 'alert') {
      material.color.lerp(new THREE.Color('#ff1a1a'), 0.05);
    } else if (currentState === 'analyzing') {
      material.color.lerp(new THREE.Color('#ffb800'), 0.05);
    } else {
      material.color.lerp(new THREE.Color('#00f0ff'), 0.05);
    }
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
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors={true}
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
