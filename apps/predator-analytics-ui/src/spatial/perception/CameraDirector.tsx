/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Кінематичний Режисер Камери
 *
 * Замість традиційної навігації — камера рухається між точками інтересу
 * з кінематичними переходами. Підтримує 4 режими зйомки.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCommandStore, type CameraMode } from '../store/useCommandStore';

// ─── Конфігурація режимів камери ─────────────────────────────────────────────

interface CameraModeConfig {
  distance: number;      // відстань від цілі
  fov: number;           // поле зору
  height: number;        // висота над ціллю
  orbitSpeed: number;    // швидкість обертання
  transitionSpeed: number;
  shake: number;         // амплітуда тремтіння
}

const MODE_CONFIGS: Record<CameraMode, CameraModeConfig> = {
  CLOSE_FACE: {
    distance: 1.2,
    fov: 35,
    height: -0.2, // close to face
    orbitSpeed: 0.01,
    transitionSpeed: 2.5,
    shake: 0.001,
  },
  HALF_BODY: {
    distance: 2.5,
    fov: 40,
    height: -0.5,
    orbitSpeed: 0.02,
    transitionSpeed: 2.0,
    shake: 0.001,
  },
  FULL_BODY: {
    distance: 4.5,
    fov: 45,
    height: -1.0,
    orbitSpeed: 0.03,
    transitionSpeed: 1.8,
    shake: 0.0015,
  },
  PRESENTATION: {
    distance: 8,
    fov: 42,
    height: 1.5,
    orbitSpeed: 0.05,
    transitionSpeed: 1.5,
    shake: 0.002,
  },
  OVERVIEW: {
    distance: 20,
    fov: 55,
    height: 8,
    orbitSpeed: 0.03,
    transitionSpeed: 1.0,
    shake: 0.003,
  },
  DEEP_DIVE: {
    distance: 1.5,
    fov: 28,
    height: 0,
    orbitSpeed: 0,
    transitionSpeed: 3.0,
    shake: 0,
  },
};

// ─── Компонент Camera Director ──────────────────────────────────────────────

function CameraDirectorInner() {
  const { camera } = useThree();
  const currentPosRef = useRef(new THREE.Vector3(0, 5, 20));
  const currentTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentFovRef = useRef(55);
  const orbitAngleRef = useRef(0);

  useFrame((state, delta) => {
    const {
      cameraMode,
      cameraTarget,
      isDarkMatter,
    } = useCommandStore.getState();

    const config = MODE_CONFIGS[cameraMode];
    const time = state.clock.elapsedTime;

    // Ціль камери
    const target = new THREE.Vector3(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
    currentTargetRef.current.lerp(target, delta * config.transitionSpeed);

    // Орбітальний кут
    orbitAngleRef.current += delta * config.orbitSpeed;

    // Бажана позиція камери
    const desiredPos = new THREE.Vector3(
      currentTargetRef.current.x + Math.cos(orbitAngleRef.current) * config.distance,
      currentTargetRef.current.y + config.height,
      currentTargetRef.current.z + Math.sin(orbitAngleRef.current) * config.distance,
    );

    // Тремтіння камери (cinematic shake)
    if (config.shake > 0) {
      desiredPos.x += Math.sin(time * 7.3) * config.shake;
      desiredPos.y += Math.cos(time * 5.7) * config.shake;
    }

    // Dark Matter mode — камера відлітає далеко
    if (isDarkMatter) {
      desiredPos.multiplyScalar(2.5);
    }

    // Плавний перехід камери
    currentPosRef.current.lerp(desiredPos, delta * config.transitionSpeed);

    // Застосування
    camera.position.copy(currentPosRef.current);
    camera.lookAt(currentTargetRef.current);

    // Плавна зміна FOV
    const targetFov = isDarkMatter ? 70 : config.fov;
    currentFovRef.current = THREE.MathUtils.lerp(currentFovRef.current, targetFov, delta * 2);
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      (camera as THREE.PerspectiveCamera).fov = currentFovRef.current;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  });

  return null; // Камера — невидимий компонент
}

export const CameraDirector = memo(CameraDirectorInner);
