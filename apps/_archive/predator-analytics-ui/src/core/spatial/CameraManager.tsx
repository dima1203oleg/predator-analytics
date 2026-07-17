import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpatialStore } from '../state/spatial.store';

/**
 * CameraManager controls the 3D scene camera, applying smooth transitions (lerping)
 * when a new target is selected (e.g. focusing on a node in the graph).
 */
export const CameraManager: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  const targetPosition = useSpatialStore((state) => state.targetPosition);
  const isTransitioning = useSpatialStore((state) => state.isTransitioning);
  const setTransitioning = useSpatialStore((state) => state.setTransitioning);

  useFrame((state, delta) => {
    if (isTransitioning && targetPosition && controlsRef.current) {
      // Smoothly interpolate orbit controls target to the new entity position
      controlsRef.current.target.lerp(targetPosition, 0.05);
      
      // Also interpolate camera position slightly offset from the target
      const offset = new THREE.Vector3(0, 0, 150);
      const desiredCameraPos = targetPosition.clone().add(offset);
      camera.position.lerp(desiredCameraPos, 0.05);

      // Stop transitioning if close enough
      if (controlsRef.current.target.distanceTo(targetPosition) < 1) {
        setTransitioning(false);
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={2000}
      makeDefault
    />
  );
};
