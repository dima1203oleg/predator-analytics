/**
 * DataParticles — Живі частинки-сутності Всесвіту PREDATOR
 * 
 * Кожна частинка = реальний об'єкт (компанія, декларація, людина...).
 * InstancedMesh з 5000 частинок для максимальної продуктивності.
 * GPU-driven анімація через instanced attributes.
 */
import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore, AI_MODE_CONFIGS } from '../../store/useUniverseStore';
import type { ParticleEntityType, UniverseParticle } from '../../store/useUniverseStore';

// ─── Генерація mock-даних Всесвіту ──────────────────────────────────────
const ENTITY_TYPES: ParticleEntityType[] = [
  'company', 'declaration', 'person', 'product', 'port',
  'bank', 'country', 'vehicle', 'container', 'vessel',
  'aircraft', 'transaction', 'tender', 'invoice', 'document',
  'risk', 'event',
];

const ENTITY_LABELS: Record<ParticleEntityType, string[]> = {
  company: ['АТ "Укрпром"', 'ТОВ "Карго Транс"', 'ПП "Імпортер"', 'ТОВ "Логістик"', 'АТ "МеталГруп"'],
  declaration: ['МД-2024-001', 'МД-2024-002', 'МД-2024-003', 'ЕК-2024-156', 'ІМ-2024-789'],
  person: ['Іваненко О.П.', 'Петренко В.М.', 'Сидоренко А.С.', 'Коваленко І.В.', 'Бондаренко Д.О.'],
  product: ['Електроніка', 'Метали', 'Хімікати', 'Текстиль', 'Продовольство'],
  port: ['Одеса', 'Чорноморськ', 'Рені', 'Ізмаїл', 'Херсон'],
  bank: ['ПриватБанк', 'Ощадбанк', 'Укргазбанк', 'Райффайзен', 'ПУМБ'],
  country: ['Китай', 'Туреччина', 'Польща', 'Німеччина', 'Італія'],
  vehicle: ['AA1234BB', 'AX5678CC', 'BH9012DD', 'CA3456EE', 'CE7890FF'],
  container: ['MSKU-001234', 'TEMU-005678', 'CMAU-009012', 'HLXU-003456', 'FCIU-007890'],
  vessel: ['MSC ELENA', 'MAERSK BOSTON', 'COSCO STAR', 'CMA CGM LOIRE', 'EVERGREEN ACE'],
  aircraft: ['PS-501', 'UR-PSA', 'B-2088', 'D-AIRY', 'TC-LJA'],
  transaction: ['TX-2024-001', 'TX-2024-002', 'TX-2024-003', 'TX-2024-004', 'TX-2024-005'],
  tender: ['UA-2024-01', 'UA-2024-02', 'UA-2024-03', 'UA-2024-04', 'UA-2024-05'],
  invoice: ['ПН-00001', 'ПН-00002', 'ПН-00003', 'ПН-00004', 'ПН-00005'],
  document: ['Контракт №1', 'Сертифікат', 'Ліцензія', 'Довідка', 'Акт'],
  risk: ['Занижена вартість', 'Фіктивний контрагент', 'Схема ухилення', 'Карусель ПДВ', 'Контрабанда'],
  event: ['Перевірка', 'Арешт вантажу', 'Аудит', 'Зупинка митниці', 'Рішення суду'],
};

const PARTICLE_COUNT = 3000;

/** Fibonacci sphere для рівномірного розподілу точок */
function fibonacciSphere(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    // Додаємо варіації для органічного розподілу
    const r = radius * (0.6 + Math.random() * 0.8);
    points.push([x * r, y * r, z * r]);
  }
  return points;
}

/** Генерація mock-частинок */
function generateMockParticles(): UniverseParticle[] {
  const positions = fibonacciSphere(PARTICLE_COUNT, 12);
  return positions.map((pos, i) => {
    const typeIndex = Math.floor(Math.random() * ENTITY_TYPES.length);
    const type = ENTITY_TYPES[typeIndex];
    const labels = ENTITY_LABELS[type];
    const label = labels[Math.floor(Math.random() * labels.length)];
    return {
      id: `particle-${i}`,
      type,
      label: `${label}-${i}`,
      riskScore: Math.random() * 100,
      importance: Math.pow(Math.random(), 2), // Power distribution — менше великих
      position: pos,
      connections: [],
    };
  });
}

export const DataParticles: React.FC = () => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const { aiMode, selectedParticleId, hoveredParticleId, setParticles, selectParticle, hoverParticle } = useUniverseStore();
  const { raycaster, camera, pointer } = useThree();
  
  const config = AI_MODE_CONFIGS[aiMode];

  // ─── Ініціалізація частинок ────────────────────────────────────────
  const particles = useMemo(() => generateMockParticles(), []);

  // Зберігаємо частинки в store при першому рендері
  useEffect(() => {
    setParticles(particles);
  }, [particles, setParticles]);

  // ─── Instanced attributes ─────────────────────────────────────────
  const [matrices, risks, importances, phases, types] = useMemo(() => {
    const dummy = new THREE.Object3D();
    const matArr = new Float32Array(PARTICLE_COUNT * 16);
    const riskArr = new Float32Array(PARTICLE_COUNT);
    const impArr = new Float32Array(PARTICLE_COUNT);
    const phaseArr = new Float32Array(PARTICLE_COUNT);
    const typeArr = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      dummy.position.set(...p.position);
      dummy.updateMatrix();
      dummy.matrix.toArray(matArr, i * 16);

      riskArr[i] = p.riskScore;
      impArr[i] = p.importance;
      phaseArr[i] = Math.random() * Math.PI * 2;
      typeArr[i] = ENTITY_TYPES.indexOf(p.type);
    }

    return [matArr, riskArr, impArr, phaseArr, typeArr];
  }, [particles]);

  // ─── Uniforms ──────────────────────────────────────────────────────
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.5 },
    }),
    []
  );

  // ─── Анімаційний цикл ─────────────────────────────────────────────
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const mesh = instancedRef.current;
    if (!mesh) return;

    // Оновлення uniforms
    uniforms.uTime.value = time;
    uniforms.uSpeed.value = THREE.MathUtils.lerp(
      uniforms.uSpeed.value,
      config.particleSpeed,
      0.03
    );

    // Глобальне повільне обертання (разом з ядром)
    mesh.rotation.y = time * 0.02;
    mesh.rotation.x = Math.sin(time * 0.05) * 0.03;
  });

  // ─── Клік по частинці ──────────────────────────────────────────────
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < particles.length) {
        const particle = particles[e.instanceId];
        selectParticle(particle.id);
      }
    },
    [particles, selectParticle]
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.instanceId !== undefined && e.instanceId < particles.length) {
        hoverParticle(particles[e.instanceId].id);
        document.body.style.cursor = 'pointer';
      }
    },
    [particles, hoverParticle]
  );

  const handlePointerOut = useCallback(() => {
    hoverParticle(null);
    document.body.style.cursor = 'default';
  }, [hoverParticle]);

  // ─── Vertex + Fragment shaders (inline для простоти instanced) ─────
  const vertexShader = `
    uniform float uTime;
    uniform float uSpeed;
    
    attribute float aRisk;
    attribute float aImportance;
    attribute float aPhase;
    attribute float aType;
    
    varying float vRisk;
    varying float vImportance;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vGlow;

    vec3 riskColor(float risk) {
      vec3 safe = vec3(0.0, 0.9, 0.5);       // кіберзелений
      vec3 warning = vec3(1.0, 0.75, 0.0);    // янтарний
      vec3 danger = vec3(1.0, 0.08, 0.25);    // кібер-червоний
      float r = risk / 100.0;
      if (r < 0.5) {
        return mix(safe, warning, r * 2.0);
      }
      return mix(warning, danger, (r - 0.5) * 2.0);
    }

    void main() {
      vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      
      float t = uTime * uSpeed + aPhase;
      
      // Пульсація — дихання частинки
      float breathe = sin(t * 1.8) * 0.04;
      // Орбітальний дрейф
      float orbit = sin(t * 0.35 + aPhase * 2.1) * 0.06;
      
      vec3 dir = normalize(instPos.xyz);
      vec3 displacement = dir * (breathe + orbit);
      vec3 finalPos = instPos.xyz + displacement;
      
      float scale = mix(0.12, 0.65, aImportance);
      
      // Посилена пульсація при критичному ризику
      if (aRisk > 70.0) {
        scale += sin(t * 5.0) * 0.07 * ((aRisk - 70.0) / 30.0);
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      mvPosition.xyz += position * scale;
      
      gl_Position = projectionMatrix * mvPosition;
      
      // Glow — чим важливіша частинка, тим яскравіша
      vGlow = aImportance * 0.8 + (aRisk / 100.0) * 0.4;
      
      vRisk = aRisk;
      vImportance = aImportance;
      vColor = riskColor(aRisk);
      vAlpha = mix(0.25, 1.0, aImportance);
    }
  `;

  const fragmentShader = `
    varying float vRisk;
    varying float vImportance;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vGlow;

    void main() {
      // Нормаль для базового шейдингу
      vec3 normal = normalize(cross(dFdx(gl_FragCoord.xyz), dFdy(gl_FragCoord.xyz)));
      
      // Fresnel glow — ребро частинки світиться
      float fresnel = pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), normal)), 2.5);
      
      // Базовий колір + ободок
      vec3 finalColor = vColor * (0.4 + fresnel * 1.2);
      
      // Додаткове свічення для важливих частинок
      finalColor += vColor * vGlow * fresnel;
      
      // Перевантаження для критичних ризиків — яскраве ядро
      if (vRisk > 80.0) {
        finalColor = mix(finalColor, vec3(1.0, 0.2, 0.3), 0.4);
        finalColor *= 1.8;
      }
      
      gl_FragColor = vec4(finalColor, vAlpha);
    }
  `;

  return (
    <instancedMesh
      ref={instancedRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[0.08, 1]}>
        <instancedBufferAttribute
          attach="attributes-aRisk"
          args={[risks, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aImportance"
          args={[importances, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aType"
          args={[types, 1]}
        />
      </icosahedronGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};
