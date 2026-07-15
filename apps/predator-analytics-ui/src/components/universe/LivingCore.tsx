/**
 * LivingCore — Центральне AI ядро Всесвіту PREDATOR
 * 
 * SDF-based сфера з кастомними шейдерами:
 * - Дихає (синусоїдна деформація + simplex noise)
 * - Змінює колір та поведінку залежно від AIMode
 * - Реагує на курсор (raycasting)
 * - Реагує на звук (AudioContext analyser)
 * - Демонструє "мислення" (neural pathway анімації)
 */
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore, AI_MODE_CONFIGS } from '../../store/useUniverseStore';

// Імпортуємо шейдери через vite-plugin-glsl
import vertexShader from '../../shaders/livingCore.vert.glsl';
import fragmentShader from '../../shaders/livingCore.frag.glsl';

export const LivingCore: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { camera, pointer } = useThree();

  const {
    aiMode,
    previousMode,
    modeTransitionProgress,
    isListening,
  } = useUniverseStore();

  const currentConfig = AI_MODE_CONFIGS[aiMode];
  const prevConfig = AI_MODE_CONFIGS[previousMode];

  // ─── Uniforms ──────────────────────────────────────────────────────
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color().setRGB(...currentConfig.color) },
      uSecondaryColor: {
        value: new THREE.Color().setRGB(...currentConfig.secondaryColor),
      },
      uPrevColor: {
        value: new THREE.Color().setRGB(...prevConfig.color),
      },
      uSpeed: { value: currentConfig.speed },
      uDistortion: { value: currentConfig.distortion },
      uGlowIntensity: { value: currentConfig.glowIntensity },
      uTransition: { value: 1.0 },
      uMouseInfluence: { value: 0 },
      uMousePos: { value: new THREE.Vector3() },
      uAudioLevel: { value: 0 },
    }),
     
    []
  );

  // ─── Raycaster для реакції на курсор ──────────────────────────────
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseWorldPos = useMemo(() => new THREE.Vector3(), []);

  // ─── Анімаційний цикл ─────────────────────────────────────────────
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const mat = materialRef.current;
    if (!mat) return;

    // Час
    mat.uniforms.uTime.value = time;

    // Плавна інтерполяція параметрів режиму
    const targetColor = new THREE.Color().setRGB(...currentConfig.color);
    const targetSecColor = new THREE.Color().setRGB(
      ...currentConfig.secondaryColor
    );
    const prevColor = new THREE.Color().setRGB(...prevConfig.color);

    mat.uniforms.uColor.value.lerp(targetColor, 0.03);
    mat.uniforms.uSecondaryColor.value.lerp(targetSecColor, 0.03);
    mat.uniforms.uPrevColor.value.copy(prevColor);
    mat.uniforms.uSpeed.value = THREE.MathUtils.lerp(
      mat.uniforms.uSpeed.value,
      currentConfig.speed,
      0.03
    );
    mat.uniforms.uDistortion.value = THREE.MathUtils.lerp(
      mat.uniforms.uDistortion.value,
      currentConfig.distortion,
      0.03
    );
    mat.uniforms.uGlowIntensity.value = THREE.MathUtils.lerp(
      mat.uniforms.uGlowIntensity.value,
      currentConfig.glowIntensity,
      0.03
    );
    mat.uniforms.uTransition.value = modeTransitionProgress;

    // ─── Реакція на курсор ────────────────────────────────────────
    raycaster.setFromCamera(pointer, camera);
    // Проектуємо на площину Z=0 для отримання world position
    raycaster.ray.at(5, mouseWorldPos);
    mat.uniforms.uMousePos.value.copy(mouseWorldPos);

    // Сила впливу курсора (зменшується з відстанню)
    const distToMouse = mouseWorldPos.length();
    const mouseInfluence = Math.max(0, 1 - distToMouse / 5);
    mat.uniforms.uMouseInfluence.value = THREE.MathUtils.lerp(
      mat.uniforms.uMouseInfluence.value,
      mouseInfluence,
      0.1
    );

    // ─── Реакція на мікрофон ──────────────────────────────────────
    const targetAudio = isListening ? 0.5 : 0;
    mat.uniforms.uAudioLevel.value = THREE.MathUtils.lerp(
      mat.uniforms.uAudioLevel.value,
      targetAudio,
      0.1
    );

    // ─── Обертання ядра ───────────────────────────────────────────
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.05;
    }

    // ─── Зовнішній glow ───────────────────────────────────────────
    if (glowRef.current) {
      const glowScale = 1.0 + Math.sin(time * currentConfig.speed * 0.8) * 0.08;
      glowRef.current.scale.setScalar(glowScale);
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.color.lerp(targetColor, 0.03);
      glowMat.opacity = THREE.MathUtils.lerp(
        glowMat.opacity,
        0.08 + currentConfig.glowIntensity * 0.05,
        0.03
      );
    }
  });

  return (
    <group>
      {/* Основне ядро з кастомними шейдерами */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.8, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Зовнішній glow (атмосфера) */}
      <mesh ref={glowRef} scale={2.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#1d4ed8"
          transparent
          opacity={0.06}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Внутрішнє яскраве ядро (точка сингулярності) */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Point light з ядра — освітлює частинки навколо */}
      <pointLight
        color={new THREE.Color().setRGB(...currentConfig.color)}
        intensity={2}
        distance={30}
        decay={2}
      />
    </group>
  );
};
