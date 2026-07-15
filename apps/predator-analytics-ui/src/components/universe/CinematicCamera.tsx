/**
 * CinematicCamera — Автономна кінематографічна камера
 * 
 * - Плавно літає навколо Ядра в idle-режимі
 * - Фокусується на активному об'єкті при натисканні
 * - Zoom-in при AI-аналізі
 * - Spring-based transitions (react-spring/three)
 * - Повільне обертання для ефекту присутності
 */
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore, AI_MODE_CONFIGS } from '../../store/useUniverseStore';

export const CinematicCamera: React.FC = () => {
  const { camera } = useThree();
  const { cameraTarget, cameraAutoRotate, cameraZoom, aiMode, selectedParticleId } =
    useUniverseStore();
  const config = AI_MODE_CONFIGS[aiMode];

  // Плавна інтерполяція позиції камери
  const currentPos = useRef(new THREE.Vector3(0, 2, 12));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // ─── Цільова позиція камери ──────────────────────────────────
    let targetPos: THREE.Vector3;

    if (selectedParticleId) {
      // Фокус на обраній частинці — наближення
      const target = new THREE.Vector3(...cameraTarget);
      const dir = target.clone().normalize();
      targetPos = target.clone().add(dir.multiplyScalar(3));
      targetPos.y += 1;
      targetLookAt.current.set(...cameraTarget);
    } else if (cameraAutoRotate) {
      // Автономне обертання навколо ядра
      const baseRadius = 14 / cameraZoom;
      const orbitSpeed = 0.08 * config.speed;
      const verticalOsc = Math.sin(time * 0.05) * 2;

      targetPos = new THREE.Vector3(
        Math.cos(time * orbitSpeed) * baseRadius,
        verticalOsc + 2,
        Math.sin(time * orbitSpeed) * baseRadius
      );
      targetLookAt.current.set(0, 0, 0);
    } else {
      // Статична позиція
      targetPos = new THREE.Vector3(0, 2, 12 / cameraZoom);
      targetLookAt.current.set(...cameraTarget);
    }

    // ─── Плавна інтерполяція (spring-like) ───────────────────────
    const lerpFactor = selectedParticleId ? 0.02 : 0.01;
    currentPos.current.lerp(targetPos, lerpFactor);
    currentLookAt.current.lerp(
      new THREE.Vector3(...cameraTarget),
      lerpFactor
    );

    // Застосування позиції
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    // ─── Мікро-рух (breathing camera) ────────────────────────────
    // Додає живий відчуття, ніби камера "дихає"
    if (!selectedParticleId) {
      camera.position.y +=
        Math.sin(time * 0.3) * 0.02;
      camera.position.x +=
        Math.cos(time * 0.2) * 0.01;
    }
  });

  // Компонент не рендерить видимих елементів — лише керує камерою
  return null;
};
