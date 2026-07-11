import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useCameraDirectorStore } from '@/store/cameraDirectorStore';
import { CameraMode } from '@/types';

interface CameraDirectorProps {
  targetPosition?: [number, number, number];
  lookAt?: [number, number, number];
}

const CameraDirector = () => {
  const { camera } = useThree();
  const {
    mode,
    targetPosition,
    lookAt,
    transitionProgress,
    isTransitioning,
    updateTransitionProgress,
    completeTransition,
    setMode
  } = useCameraDirectorStore();

  const targetCameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    targetCameraRef.current = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    targetCameraRef.current.position.set(...targetPosition);
    targetCameraRef.current.lookAt(...lookAt);
  }, []);

  // Easing function (smoothstep)
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  // Update camera position based on mode and transition progress
  useFrame((state, delta) => {
    if (!targetCameraRef.current) return;

    // Get base positions based on mode
    const modePositions: Record<CameraMode, [number, number, number]> = {
      [CameraMode.INTIMATE]: [0, 0, 5],
      [CameraMode.ANALYTICAL]: [0, 0, 15],
      [CameraMode.OVERVIEW]: [0, 20, 20],
      [CameraMode.DEEP_DIVE]: [0, 2, 3]
    };

    const modeLookAt: Record<CameraMode, [number, number, number]> = {
      [CameraMode.INTIMATE]: [0, 0, 0],
      [CameraMode.ANALYTICAL]: [0, 0, 0],
      [CameraMode.OVERVIEW]: [0, 0, 0],
      [CameraMode.DEEP_DIVE]: [0, 0, 0]
    };

    const basePosition = modePositions[mode];
    const baseLookAt = modeLookAt[mode];

    // Smoothly interpolate position
    const interpolation = smoothstep(transitionProgress);
    const currentX = basePosition[0] * (1 - interpolation) + targetPosition[0] * interpolation;
    const currentY = basePosition[1] * (1 - interpolation) + targetPosition[1] * interpolation;
    const currentZ = basePosition[2] * (1 - interpolation) + targetPosition[2] * interpolation;

    // Smoothly interpolate lookAt
    const currentLookX = baseLookAt[0] * (1 - interpolation) + lookAt[0] * interpolation;
    const currentLookY = baseLookAt[1] * (1 - interpolation) + lookAt[1] * interpolation;
    const currentLookZ = baseLookAt[2] * (1 - interpolation) + lookAt[2] * interpolation;

    // Update camera position
    camera.position.set(currentX, currentY, currentZ);
    camera.lookAt(currentLookX, currentLookY, currentLookZ);

    // Handle transition completion
    if (isTransitioning && transitionProgress >= 1) {
      completeTransition();
    }

    // Increment transition progress
    if (isTransitioning) {
      updateTransitionProgress(Math.min(transitionProgress + delta * 0.8, 1));
    }
  });

  return null;
};

export const CameraDirector: React.FC<CameraDirectorProps> = ({ targetPosition, lookAt }) => {
  const { mode, triggerTransition } = useCameraDirectorStore();

  // Camera mode buttons
  const handleModeChange = (newMode: CameraMode) => {
    if (newMode !== mode) {
      triggerTransition(newMode);
    }
  };

  return (
    <>
      <CameraDirector />

      {/* Camera mode controls UI */}
      <group position={[0, 8, 0]}>
        {[CameraMode.INTIMATE, CameraMode.ANALYTICAL, CameraMode.OVERVIEW, CameraMode.DEEP_DIVE].map((cameraMode) => (
          <mesh
            key={cameraMode}
            position={[0, 0, 0]}
            onClick={() => handleModeChange(cameraMode)}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color={mode === cameraMode ? '#00F5FF' : '#555555'}
              emissive={mode === cameraMode ? '#00F5FF' : '#000000'}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};
