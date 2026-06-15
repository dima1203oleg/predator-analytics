import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { GridHelper, Color } from 'three';
import { useSpring, animated } from '@react-spring/three';

interface CinematicGridProps {
  threatLevel?: 'NORMAL' | 'HIGH';
}

export const CinematicGrid = ({ threatLevel = 'NORMAL' }: CinematicGridProps) => {
  const gridRef = useRef<GridHelper>(null);

  // Animated color transition between Emerald (#00FF9D) and Red (#FF0033)
  const { color } = useSpring({
    color: threatLevel === 'NORMAL' ? '#00FF9D' : '#FF0033',
    config: { tension: 50, friction: 20 },
  });

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
      <animated.gridHelper
        ref={gridRef}
        args={[100, 50, color as any, color as any]}
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
