import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { GridHelper, Color } from 'three';
import { useSpring, animated } from '@react-spring/three';

interface CinematicGridProps {
  threatLevel?: 'NORMAL' | 'HIGH';
}

export const CinematicGrid = ({ threatLevel = 'NORMAL' }: CinematicGridProps) => {
  const gridRef = useRef<GridHelper>(null);

  const colorStr = threatLevel === 'NORMAL' ? '#00FF9D' : '#FF0033';

  useFrame((state) => {
    if (gridRef.current) {
      // Simulate forward movement to create "floating" illusion
      const t = state.clock.getElapsedTime();
      gridRef.current.position.z = (t * 2) % 2; // Moving grid
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Primary Grid */}
      <gridHelper
        ref={gridRef as any}
        args={[100, 50, colorStr, colorStr]}
        position={[0, 0, 0]}
      />
      {/* Fading overlay to obscure grid far away */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#020817" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};
