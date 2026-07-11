'use client';

import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Group, Object3D, Mesh, MeshStandardMaterial, Color, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';

export type EmotionState = 'NEUTRAL' | 'ANALYTIC' | 'WARNING' | 'POSITIVE' | 'AGGRESSIVE';

interface PredatorModelProps {
  emotion?: EmotionState;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  speakActive?: boolean;
}

const EMOTION_COLORS: Record<EmotionState, string> = {
  NEUTRAL: '#00f3ff',   // Світло-блакитне / Неон
  ANALYTIC: '#0044ff',  // Синє
  WARNING: '#ffaa00',   // Помаранчеве
  POSITIVE: '#00ff66',  // Зелене
  AGGRESSIVE: '#ff003c', // Яскраво-червоне
};

export function PredatorModel({ 
  emotion = 'NEUTRAL', 
  speakActive = false,
  ...props 
}: PredatorModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/jungle_hunter_predator_draco.glb');
  const { actions } = useAnimations(animations, group);
  
  const headBoneRef = useRef<Object3D | null>(null);
  const glowMaterialsRef = useRef<MeshStandardMaterial[]>([]);

  // Ініціалізація: шукаємо кістку голови та емісійні матеріали
  useEffect(() => {
    if (!scene) return;

    // 1. Масштаб і позиція
    // Calculate bounding box using SkinnedMesh only to ignore any huge helper planes or skyboxes
    let targetObj: Object3D = scene;
    scene.traverse(obj => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
        targetObj = obj;
      }
    });

    const box = new THREE.Box3().setFromObject(targetObj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Scale him to be exactly 2.0 units tall
    const scale = 2.0 / (maxDim || 1);
    scene.scale.setScalar(scale);

    // Center his feet to the group's origin
    const center = box.getCenter(new THREE.Vector3());
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    const materials: MeshStandardMaterial[] = [];
    scene.traverse((child) => {
      // Пошук кістки голови для процедурного стеження
      if (child.type === 'Bone' && (
        child.name.toLowerCase().includes('head') || 
        child.name.toLowerCase().includes('neck') || 
        child.name.toLowerCase().includes('skull')
      )) {
        if (!headBoneRef.current || child.name.toLowerCase().includes('head')) {
          headBoneRef.current = child;
        }
      }

      // Збір матеріалів з можливістю підсвічування (очі, елементи броні)
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const mat = mesh.material as MeshStandardMaterial;
        if (mat && mat.emissive) {
          materials.push(mat);
        }
      }
    });
    glowMaterialsRef.current = materials;
  }, [scene]);

  // Програвання idle анімації Хижака
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      // Шукаємо анімацію дихання (idle) чи першу доступну
      const idleAction = actions['idle'] || actions['Idle'] || actions[Object.keys(actions)[0]];
      if (idleAction) {
        idleAction.reset().fadeIn(0.5).play();
      }
    }
  }, [actions]);

  // Плавне оновлення кольорів емісії під емоційний стан
  useFrame((state, delta) => {
    const targetColor = new Color(EMOTION_COLORS[emotion]);
    
    // Оновлюємо емісійні матеріали моделі (ТІЛЬКИ легке підсвічування очей/елементів)
    glowMaterialsRef.current.forEach((mat) => {
      if (mat.emissive) {
        // Дуже слабке підсвічування, щоб він не світився як лампочка
        mat.emissive.lerp(targetColor, delta * 2);
        mat.emissiveIntensity = MathUtils.lerp(mat.emissiveIntensity || 0, speakActive ? 0.8 : 0.2, delta * 4);
      }
    });

    // Процедурне стеження голови за курсором
    if (headBoneRef.current) {
      const targetY = state.mouse.x * 0.4; // обмеження повороту голови
      const targetX = -state.mouse.y * 0.3;
      
      headBoneRef.current.rotation.y = MathUtils.lerp(headBoneRef.current.rotation.y, targetY, delta * 3);
      headBoneRef.current.rotation.x = MathUtils.lerp(headBoneRef.current.rotation.x, targetX, delta * 3);
    } else if (group.current) {
      // Якщо кістка не знайдена, повертаємо всю модель плавно
      const targetY = state.mouse.x * 0.15;
      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, targetY, delta * 2);
    }

    // Легке дихання (погойдування) при розмові
    if (group.current && speakActive) {
      const breathing = Math.sin(state.clock.getElapsedTime() * 12) * 0.015;
      group.current.position.y = breathing;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
      
      {/* Точкові джерела світла біля очей/маски для ефекту світіння (дуже слабке) */}
      <pointLight 
        position={[0, 1.8, 0.4]} 
        color={EMOTION_COLORS[emotion]} 
        intensity={speakActive ? 0.8 : 0.3} 
        distance={1.5} 
        decay={2}
      />
    </group>
  );
}

useGLTF.preload('/models/jungle_hunter_predator_draco.glb');
