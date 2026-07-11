import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { AvatarBehavior as AvatarState } from '@/types';
import { useAvatarBehaviorStore } from '@/store/avatarBehaviorStore';

interface AvatarBehaviorProps {
  position?: [number, number, number];
  scale?: number;
}

const AnimatedAvatar: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  const { state } = useAvatarBehaviorStore();

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    switch (state) {
      case AvatarState.IDLE:
        // Breathing animation
        meshRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.005);
        meshRef.current.position.y = Math.sin(time * 1) * 0.1;

        // Subtle micro-movements
        meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
        meshRef.current.rotation.x = Math.sin(time * 0.7 + 0.5) * 0.03;
        break;

      case AvatarState.ANALYZING:
        // Focus gaze and subtle tension
        meshRef.current.scale.setScalar(1);
        meshRef.current.position.y = Math.sin(time * 1.5) * 0.2;
        meshRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
        break;

      case AvatarState.WARNING:
        // Tense posture with sharp gestures
        meshRef.current.position.y = Math.sin(time * 2) * 0.3;
        meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.2;
        meshRef.current.scale.setScalar(1 + Math.sin(time * 10) * 0.02);
        break;

      case AvatarState.PRESENTING:
        // Explaining with hand gestures
        meshRef.current.position.y = Math.sin(time * 0.8) * 0.15;
        meshRef.current.rotation.y = Math.sin(time * 0.25) * 0.08;
        break;

      case AvatarState.FOCUS_LOCK:
        // Focused gaze on specific data
        meshRef.current.scale.setScalar(1);
        meshRef.current.rotation.y = 0;
        break;
    }
  });

  return <group ref={meshRef} />;
};

const AvatarHead: React.FC = () => {
  const { expression } = useAvatarBehaviorStore();
  const headRef = useRef<THREE.Group>(null);
  const eyeLidRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!headRef.current) return;

    // Update eye lid position based on blink state
    if (eyeLidRef.current) {
      const openAmount = expression.eyes.blinkState === 'closed' ? 0 : 1;
      eyeLidRef.current.position.y = openAmount * 0.05;
    }

    // Update mouth shape
    if (mouthRef.current) {
      const mouthY = expression.mouth.openness * 0.02;
      mouthRef.current.position.y = mouthY;
    }
  });

  return (
    <group ref={headRef}>
      {/* Avatar head (placeholder for GLTF model) */}
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.2} />
      </mesh>

      {/* Eyes */}
      <group position={[0.12, 0.9, 0.25]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#00F5FF" />
      </group>
      <group position={[-0.12, 0.9, 0.25]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#00F5FF" />
      </group>

      {/* Mouth */}
      <group position={[0, 0.85, 0.25]}>
        <boxGeometry args={[0.08, 0.015, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" />
      </group>

      {/* Eye lids */}
      <mesh ref={eyeLidRef} position={[0.12, 0.92, 0.2]}>
        <planeGeometry args={[0.08, 0.04]} />
        <meshStandardMaterial color="#001F1F" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={eyeLidRef} position={[-0.12, 0.92, 0.2]}>
        <planeGeometry args={[0.08, 0.04]} />
        <meshStandardMaterial color="#001F1F" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const AvatarBody: React.FC = () => {
  const { gestures } = useAvatarBehaviorStore();
  const bodyRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!bodyRef.current || !armRef.current) return;

    // Update body posture
    bodyRef.current.rotation.x = gestures.posture.rotation[0] * 0.5;
    bodyRef.current.rotation.z = gestures.posture.rotation[2] * 0.5;

    // Update arm position based on gesture
    armRef.current.position.set(
      gestures.hand.position[0],
      gestures.hand.position[1],
      gestures.hand.position[2]
    );
  });

  return (
    <group ref={bodyRef}>
      {/* Body */}
      <mesh position={[0, -0.3, 0]}>
        <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
        <meshStandardMaterial color="#001F1F" />
      </mesh>

      {/* Arms */}
      <group ref={armRef}>
        <mesh position={[0, 0.3, 0]}>
          <capsuleGeometry args={[0.05, 0.6, 4, 8]} />
          <meshStandardMaterial color="#001F1F" />
        </mesh>
      </group>

      {/* Legs */}
      <mesh position={[-0.1, -1, 0]}>
        <capsuleGeometry args={[0.06, 0.8, 4, 8]} />
        <meshStandardMaterial color="#001F1F" />
      </mesh>
      <mesh position={[0.1, -1, 0]}>
        <capsuleGeometry args={[0.06, 0.8, 4, 8]} />
        <meshStandardMaterial color="#001F1F" />
      </mesh>
    </group>
  );
};

export const AvatarBehavior: React.FC<AvatarBehaviorProps> = ({ position = [0, 0, 0], scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      <AnimatedAvatar />
      <AvatarHead />
      <AvatarBody />
    </group>
  );
};
