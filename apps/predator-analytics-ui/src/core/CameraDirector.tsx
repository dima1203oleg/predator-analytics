import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useUIStore, CameraMode } from '../stores/useUIStore';
import { eventBus } from './EventBus';

// Режими камери з їх цільовими позиціями та точками фокусування
const CAMERA_PRESETS: Record<CameraMode, { pos: Vector3; lookAt: Vector3 }> = {
  observer: { pos: new Vector3(0, 3, 12), lookAt: new Vector3(0, 0, 0) },
  analyst: { pos: new Vector3(5, 2, 8), lookAt: new Vector3(2, 0, 1) },
  investigation: { pos: new Vector3(0, 0, 3), lookAt: new Vector3(0, 0, 0) }, // Динамічно змінюється
  free: { pos: new Vector3(0, 5, 10), lookAt: new Vector3(0, 0, 0) },
};

export const CameraDirector: React.FC = () => {
  const { camera } = useThree();
  const cameraMode = useUIStore((state) => state.cameraMode);
  
  const targetPos = useRef(new Vector3().copy(CAMERA_PRESETS.observer.pos));
  const targetLookAt = useRef(new Vector3().copy(CAMERA_PRESETS.observer.lookAt));
  const currentLookAt = useRef(new Vector3().copy(CAMERA_PRESETS.observer.lookAt));

  useEffect(() => {
    // Коли змінюється режим камери, оновлюємо цільові координати
    const preset = CAMERA_PRESETS[cameraMode];
    if (preset) {
      targetPos.current.copy(preset.pos);
      targetLookAt.current.copy(preset.lookAt);
    }
  }, [cameraMode]);

  useEffect(() => {
    const handleFlyTo = ({ x, y, z, targetX = 0, targetY = 0, targetZ = 0 }: any) => {
      targetPos.current.set(x, y, z);
      targetLookAt.current.set(targetX, targetY, targetZ);
    };

    eventBus.on('camera:flyTo', handleFlyTo);
    return () => {
      eventBus.off('camera:flyTo', handleFlyTo);
    };
  }, []);

  useFrame((state, delta) => {
    // Плавна інтерполяція позиції камери (ease-out)
    const lerpFactor = MathUtils.clamp(delta * 2.5, 0, 1);
    
    camera.position.lerp(targetPos.current, lerpFactor);
    
    // Плавна інтерполяція точки фокусування (lookAt)
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
