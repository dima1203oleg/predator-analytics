import React from 'react';
import { useThree } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import { useCyberStore } from '../../store/useCyberStore';
import { QuantumBrain } from '../VoidForge/QuantumBrain';

export const CyberAvatar = () => {
  const { avatarMode } = useCyberStore();
  const { viewport } = useThree();

  const baseScale = 0.5;
  const { position, scale } = useSpring({
    position: 
      avatarMode === 'COMMUNICATION' ? [0, -1, 1] :
      avatarMode === 'SEARCH' ? [-viewport.width / 2 + 3, -viewport.height / 2 + 2, 0] :
      avatarMode === 'OSINT' ? [viewport.width / 2 - 3, -1, 1] :
      avatarMode === 'ANALYTICS' ? [-2, -1, 1] : 
      [0, -10, 0], // HIDDEN
    scale:
      avatarMode === 'COMMUNICATION' ? [baseScale * 1.5, baseScale * 1.5, baseScale * 1.5] :
      avatarMode === 'SEARCH' ? [baseScale * 0.8, baseScale * 0.8, baseScale * 0.8] :
      [baseScale, baseScale, baseScale],
    config: { mass: 1, tension: 170, friction: 26 }
  });

  return (
    <a.group position={position as any} scale={scale as any}>
      <QuantumBrain />
    </a.group>
  );
};

