import React, { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useAppStore } from "../../../store/useAppStore";

// Типізація GLTF структури нашої нейро-маски
type GLTFResult = GLTF & {
  nodes: {
    Mesh_Head_Placeholder: THREE.Mesh;
    // Fallback names in case the model is different
    [key: string]: THREE.Object3D;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

interface HoloFaceModelProps {
  audioAnalyser: AnalyserNode | null;
  systemStatus: "HEALTHY" | "RISK";
}

const VISEME_MAP: Record<string, number> = {
  A: 0.8, О: 0.7, У: 0.4, Е: 0.5, Є: 0.5, И: 0.3, І: 0.3, Ї: 0.3, Я: 0.8, Ю: 0.4,
  Б: 0.0, П: 0.0, М: 0.0,
  Ф: 0.15, В: 0.15,
  С: 0.1, З: 0.1, Ц: 0.1, Ш: 0.1, Ж: 0.1, Ч: 0.1, Щ: 0.1,
  Л: 0.2, Р: 0.2,
  Г: 0.25, К: 0.25, Х: 0.25
};

export const HoloFaceModel: React.FC<HoloFaceModelProps> = ({
  audioAnalyser,
  systemStatus,
}) => {
  // Завантаження placeholder геометрії голови з локального репозиторію
  const { nodes } = useGLTF("/models/head.glb") as unknown as GLTFResult;

  const groupRef = useRef<THREE.Group>(null);
  const gearTopRef = useRef<THREE.Mesh>(null);
  const gearBottomRef = useRef<THREE.Mesh>(null);
  const mouthTopRef = useRef<THREE.Mesh>(null);
  const mouthBottomRef = useRef<THREE.Mesh>(null);
  const voiceEqualizerRefs = useRef<(THREE.Mesh | null)[]>([]);

  const { size, mouse } = useThree();
  const dataArray = useRef(new Uint8Array(0));

  const activeColor = systemStatus === "RISK" ? "#bd00ff" : "#00f5ff";

  // Реалістичний фізичний матеріал (метал + скло)
  const realisticMaterial = useRef(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#111827"), // Темна основа
      emissive: new THREE.Color(activeColor),
      emissiveIntensity: 0.2, // Легке внутрішнє світіння
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.95,
      transmission: 0.4, // Ефект напівпрозорого скла
      thickness: 0.5,
    }),
  );

  // Голографічний дротяний контур для кібер-ефекту
  const wireframeMaterial = useRef(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(activeColor),
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    }),
  );

  // Оновлення кольору матеріалів при зміні статусу системи
  useEffect(() => {
    realisticMaterial.current.emissive.set(activeColor);
    wireframeMaterial.current.color.set(activeColor);
  }, [activeColor]);

  useEffect(() => {
    if (audioAnalyser) {
      dataArray.current = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
  }, [audioAnalyser]);

  // Віземи для нативного TTS
  const lipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetMouthOpen = useRef(0);
  const currentMouthOpen = useRef(0);
  const isSpeaking = useAppStore((state) => state.aiState.isSpeaking);
  const response = useAppStore((state) => state.aiState.response);

  useEffect(() => {
    if (isSpeaking) {
      if (lipTimerRef.current) clearInterval(lipTimerRef.current);
      
      const text = (response || "Ініціалізація зв'язку...").toUpperCase();
      let charIndex = 0;
      let pauseFrames = 0;

      lipTimerRef.current = setInterval(() => {
        if (pauseFrames > 0) {
          pauseFrames--;
          targetMouthOpen.current *= 0.4;
          return;
        }
        if (charIndex >= text.length) {
          charIndex = 0; // Зациклюємо, поки isSpeaking=true
          pauseFrames = 10;
          return;
        }
        const char = text[charIndex];
        if (char === ' ' || char === '.' || char === ',' || char === '!' || char === '?') {
          pauseFrames = char === ' ' ? 2 : 5;
          targetMouthOpen.current *= 0.3;
        } else {
          const val = VISEME_MAP[char] !== undefined ? VISEME_MAP[char] : 0.15;
          targetMouthOpen.current = targetMouthOpen.current * 0.3 + val * 0.7;
        }
        charIndex++;
      }, 70);
    } else {
      if (lipTimerRef.current) clearInterval(lipTimerRef.current);
      targetMouthOpen.current = 0;
    }

    return () => {
      if (lipTimerRef.current) clearInterval(lipTimerRef.current);
    };
  }, [isSpeaking, response]);

  // Знайти головний меш
  const headMesh =
    nodes.Mesh_Head_Placeholder ||
    (Object.values(nodes).find(
      (n) => n.type === "Mesh" || n.type === "SkinnedMesh",
    ) as THREE.Mesh);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // 1. Idle-Анімація: Легка левітація (плавання у просторі)
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;

      // 2. Ефект Perspective Parallax: Обличчя плавно повертається за курсором миші
      const targetX = ((mouse.x * size.width) / size.width) * 0.3;
      const targetY = ((mouse.y * size.height) / size.height) * 0.2;

      groupRef.current.rotation.y +=
        (targetX - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.x +=
        (-targetY - groupRef.current.rotation.x) * 0.1;
    }

    // 3. Обертання технологічних 3D-шестерень
    if (gearTopRef.current) gearTopRef.current.rotation.y = t * 0.5;
    if (gearBottomRef.current) gearBottomRef.current.rotation.y = -t * 0.8;

    // 4. Плавна інтерполяція рота
    currentMouthOpen.current += (targetMouthOpen.current - currentMouthOpen.current) * 0.3;

    // Анімація декоративного кібер-рота
    if (mouthBottomRef.current) {
      // Опускаємо нижню губу
      mouthBottomRef.current.position.y = -0.45 - currentMouthOpen.current * 0.15;
    }
    
    // Анімація еквалайзера
    voiceEqualizerRefs.current.forEach((mesh, i) => {
      if (mesh) {
        // Рандомізоване тремтіння базоване на відкритті рота
        const jitter = currentMouthOpen.current > 0.1 ? Math.sin(t * (20 + i)) * 0.5 + 0.5 : 0;
        // Make equalizer much more exaggerated
        mesh.scale.y = 1 + currentMouthOpen.current * 8 + jitter * currentMouthOpen.current * 4;
      }
    });

    if (headMesh) {
      // Завжди використовуємо TTS Lip Sync для аватара
      if (headMesh.morphTargetInfluences) {
        headMesh.morphTargetInfluences[0] = currentMouthOpen.current * 1.5;
      } else {
        // Якщо немає morph targets, робимо імітацію набагато помітнішою
        headMesh.scale.y = 1 - currentMouthOpen.current * 0.15; // Сильніше стискання голови
        headMesh.position.y = -currentMouthOpen.current * 0.1;
      }
      
      // Додамо легке пульсування від мікрофона ТІЛЬКИ до декоративних шестерень, щоб показати, що аватар "слухає"
      if (audioAnalyser && dataArray.current.length > 0) {
        audioAnalyser.getByteFrequencyData(dataArray.current);
        let sum = 0;
        for (let i = 0; i < dataArray.current.length; i++) sum += dataArray.current[i];
        const normalizedVolume = (sum / dataArray.current.length) / 128.0;
        
        if (gearTopRef.current) gearTopRef.current.scale.setScalar(1 + normalizedVolume * 0.2);
        if (gearBottomRef.current) gearBottomRef.current.scale.setScalar(1 + normalizedVolume * 0.2);
      } else {
        if (gearTopRef.current) gearTopRef.current.scale.setScalar(1);
        if (gearBottomRef.current) gearBottomRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Декоративні голографічні шестерні когнітивного процесу */}
      <mesh ref={gearTopRef} position={[0, 1.3, 0]}>
        <torusGeometry args={[0.3, 0.01, 16, 32]} />
        <primitive object={wireframeMaterial.current} attach="material" />
      </mesh>
      <mesh
        ref={gearBottomRef}
        position={[0, 1.4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.15, 0.25, 12]} />
        <primitive object={wireframeMaterial.current} attach="material" />
      </mesh>

      {/* Голографічна кібер-міміка (видима завжди, навіть якщо модель не підтримує morph targets) */}
      <group position={[0, 0, 0.55]}>
        {/* Верхня "губа" */}
        <mesh ref={mouthTopRef} position={[0, -0.38, 0]}>
          <boxGeometry args={[0.15, 0.01, 0.02]} />
          <meshBasicMaterial color={activeColor} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Нижня "губа" */}
        <mesh ref={mouthBottomRef} position={[0, -0.45, 0]}>
          <boxGeometry args={[0.12, 0.01, 0.02]} />
          <meshBasicMaterial color={activeColor} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Еквалайзер міміки між губами */}
        <group position={[0, -0.415, 0]}>
          {[-2, -1, 0, 1, 2].map((xOffset, i) => (
            <mesh 
              key={i} 
              position={[xOffset * 0.025, 0, 0]} 
              ref={(el) => (voiceEqualizerRefs.current[i] = el)}
            >
              <boxGeometry args={[0.01, 0.02, 0.01]} />
              <meshBasicMaterial color={activeColor} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Головний меш кібер-обличчя */}
      {headMesh && (
        <group>
          {/* Базовий реалістичний шар */}
          <mesh
            geometry={headMesh.geometry}
            material={realisticMaterial.current}
            castShadow
            receiveShadow
          />
          {/* Голографічна сітка поверх обличчя */}
          <mesh
            geometry={headMesh.geometry}
            material={wireframeMaterial.current}
            scale={1.001} // Трохи більше, щоб не перетиналося з основою
          />
        </group>
      )}
    </group>
  );
};

useGLTF.preload("/models/head.glb");
