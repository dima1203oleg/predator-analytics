import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursorStore } from '@/store/cursorStore';
import * as THREE from 'three';

interface QuantumCursorProps {
  position: [number, number, number];
}

export const QuantumCursor: React.FC<QuantumCursorProps> = ({ position }) => {
  const cursorRef = useRef<THREE.Group>(null);
  const trailParticlesRef = useRef<THREE.Points>(null);
  const { position: cursorPos, isHovering, hoveredNode, updateTrail, updatePosition } = useCursorStore();

  // Initialize trail system
  useEffect(() => {
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(50 * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMaterial = new THREE.PointsMaterial({
      color: 0x00F5FF,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    trailParticlesRef.current = new THREE.Points(trailGeometry, trailMaterial);
    trailParticlesRef.current.userData = { positions: [] as [number, number, number][] };
  }, []);

  // Update cursor position
  useFrame((state) => {
    if (cursorRef.current) {
      // Smooth interpolation
      cursorRef.current.position.lerp(
        new THREE.Vector3(...cursorPos),
        0.1
      );

      // Rotate cursor ring
      cursorRef.current.rotation.x += 0.02;
      cursorRef.current.rotation.y += 0.02;
    }

    // Update trail
    if (trailParticlesRef.current) {
      const trailPositions = trailParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const userData = trailParticlesRef.current.userData as any;

      // Shift positions
      for (let i = trailPositions.length - 3; i >= 3; i -= 3) {
        trailPositions[i] = trailPositions[i - 3];
        trailPositions[i + 1] = trailPositions[i - 2];
        trailPositions[i + 2] = trailPositions[i - 1];
      }

      // Add new position
      trailPositions[0] = cursorRef.current?.position.x || 0;
      trailPositions[1] = cursorRef.current?.position.y || 0;
      trailPositions[2] = cursorRef.current?.position.z || 0;

      trailParticlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Update user data for animation
      if (!userData.positions) userData.positions = [];
      userData.positions.push([cursorRef.current?.position.x || 0, cursorRef.current?.position.y || 0, cursorRef.current?.position.z || 0]);

      if (userData.positions.length > 50) {
        userData.positions.shift();
      }
    }

    // Hover effects
    if (isHovering && cursorRef.current) {
      cursorRef.current.scale.setScalar(1.5);
    } else if (!isHovering && cursorRef.current) {
      cursorRef.current.scale.setScalar(1);
    }
  });

  return (
    <group ref={cursorRef} position={position}>
      {/* Main cursor sphere */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={isHovering ? '#00FF9D' : '#00F5FF'}
          emissive={isHovering ? '#00FF9D' : '#00F5FF'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.02, 8, 32]} />
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.6} />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.01, 8, 32]} />
        <meshBasicMaterial color="#00F5FF" transparent opacity={0.4} />
      </mesh>

      {/* Trail particles */}
      <points ref={trailParticlesRef} />
    </group>
  );
};
