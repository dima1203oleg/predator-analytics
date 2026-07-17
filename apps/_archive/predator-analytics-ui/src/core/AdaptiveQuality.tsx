import React, { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '../stores/sceneStore';

export const AdaptiveQuality: React.FC = () => {
  const { setCurrentFPS, setIsIdle } = useSceneStore();
  
  let frameCount = 0;
  let lastTime = performance.now();
  
  useFrame(() => {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastTime;
    
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount * 1000) / elapsed);
      setCurrentFPS(fps);
      
      // Auto-Idle mode for thermal management
      if (fps < 20) {
        setIsIdle(true);
      }
      
      frameCount = 0;
      lastTime = now;
    }
  });

  // Additional Dark Matter logic could listen to idle state here
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsIdle(true), 60000); // 60s idle
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    
    resetIdle();
    
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      clearTimeout(timeout);
    };
  }, [setIsIdle]);

  return null;
};
