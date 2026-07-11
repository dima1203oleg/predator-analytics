import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Float, ContactShadows } from '@react-three/drei';
import { useMainStore } from '@/store/mainStore';
import { useCursorStore } from '@/store/cursorStore';
import { useRiskAtmosphereStore } from '@/store/riskAtmosphereStore';
import { CameraDirector } from '@/components/camera/CameraDirector';
import { QuantumCursor } from '@/components/cursor/QuantumCursor';
import { SpatialDataEngine } from '@/components/data/SpatialDataEngine';
import { AvatarBehavior } from '@/components/avatar/AvatarBehavior';
import { ThoughtVisualization } from '@/components/thought/ThoughtVisualization';
import { RiskAtmosphere } from '@/components/environment/RiskAtmosphere';
import { DarkMatterOverlay } from '@/components/environment/DarkMatterOverlay';
import { SpatialLoader } from '@/components/ui/SpatialLoader';

interface SpatialSceneProps {
  children?: React.ReactNode;
}

const SceneContent = () => {
  const { cameraDirector } = useMainStore();
  const { position } = useCursorStore();
  const { level, atmosphere } = useRiskAtmosphereStore();

  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  useEffect(() => {
    // Set up camera controls
    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 15);
      groupRef.current.lookAt(0, 0, 0);
    }
  }, []);

  useFrame((state, delta) => {
    // Subtle idle animation
    if (groupRef.current && !state.clock.getElapsedTime()) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Background gradient */}
      <mesh position={[0, 0, -10]}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial
          color={level === 'critical' ? 0x330000 : 0x001F1F}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Environment */}
      <Environment preset="night" />

      {/* Contact shadows for depth */}
      <ContactShadows
        position={[0, -10, 0]}
        opacity={0.3}
        scale={30}
        blur={2}
        far={10}
      />

      {/* Main spatial content */}
      <SpatialDataEngine />
      <ThoughtVisualization />
      <AvatarBehavior />

      {/* Camera director */}
      <CameraDirector />

      {/* Cursor */}
      <QuantumCursor position={position} />

      {/* Atmosphere effects */}
      <RiskAtmosphere />
      <DarkMatterOverlay />
    </group>
  );
};

const CameraController = () => {
  const { camera } = useThree();
  const { cameraDirector } = useMainStore();

  useFrame((state, delta) => {
    // Smooth camera movement based on director state
    const targetPosition = cameraDirector.targetPosition;
    const lookAt = cameraDirector.lookAt;

    camera.position.lerp(
      new THREE.Vector3(...targetPosition),
      delta * cameraDirector.transitionSpeed
    );

    camera.lookAt(new THREE.Vector3(...lookAt));
  });

  return null;
};

export const SpatialScene: React.FC<SpatialSceneProps> = ({ children }) => {
  const { isDarkMatterActive } = useMainStore();

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false
        }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <SceneContent />
        <CameraController />
      </Canvas>

      {/* Dark Matter overlay when active */}
      {isDarkMatterActive && <DarkMatterOverlay />}

      {/* Loader */}
      <SpatialLoader />
    </>
  );
};
