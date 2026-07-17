'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Color, Mesh, AdditiveBlending, MeshStandardMaterial } from 'three';
import { EmotionState } from './PredatorModel';

interface HologramGlobeProps {
  emotion?: EmotionState;
  position?: [number, number, number];
  scale?: number | [number, number, number];
}

const EMOTION_COLORS: Record<EmotionState, { color: string; emissive: string }> = {
  NEUTRAL: { color: '#0066ff', emissive: '#0022aa' },
  ANALYTIC: { color: '#00ccff', emissive: '#0044bb' },
  WARNING: { color: '#ff7700', emissive: '#aa3300' },
  POSITIVE: { color: '#00ff55', emissive: '#00aa33' },
  AGGRESSIVE: { color: '#ff003c', emissive: '#aa0011' },
};

export function HologramGlobe({ emotion = 'NEUTRAL', ...props }: HologramGlobeProps) {
  const groupRef = useRef<any>(null);
  
  // Завантажуємо 3D-модель голографічного глобуса
  const { scene, animations } = useGLTF('/models/planet.glb');
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    // Відтворюємо всі наявні анімації в циклі
    if (actions) {
      Object.keys(actions).forEach((key) => {
        const action = actions[key];
        if (action) {
          action.play();
        }
      });
    }
    return () => {
      if (actions) {
        Object.keys(actions).forEach((key) => {
          actions[key]?.stop();
        });
      }
    };
  }, [actions]);

  useFrame((state, delta) => {
    // Повільне додаткове обертання для динаміки
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }

    // Плавно змінюємо колір матеріалів моделі під поточний емоційний стан
    const targetColors = EMOTION_COLORS[emotion];
    const targetColor = new Color(targetColors.color);
    const targetEmissive = new Color(targetColors.emissive);

    scene.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.material) {
          // Якщо це масив матеріалів, проходимо по кожному
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((mat) => {
            if (mat instanceof MeshStandardMaterial || 'color' in mat) {
              mat.color.lerp(targetColor, delta * 3);
            }
            if ('emissive' in mat) {
              mat.emissive.lerp(targetEmissive, delta * 3);
              // Додаємо інтенсивність світіння, щоб глобус яскраво світився
              (mat as any).emissiveIntensity = 3.0;
            }
            // Робимо матеріали напівпрозорими для голографічного ефекту
            mat.transparent = true;
            mat.opacity = 0.9;
            mat.blending = AdditiveBlending;
            mat.depthWrite = false;
          });
        }
      }
    });
  });

  return (
    <group ref={groupRef} {...props}>
      <primitive object={scene} />
      {/* Підсвічування глобуса зсередини */}
      <pointLight color={EMOTION_COLORS[emotion].color} intensity={2.0} distance={8} decay={2} />
    </group>
  );
}

// Попереднє завантаження моделі
useGLTF.preload('/models/planet.glb');

