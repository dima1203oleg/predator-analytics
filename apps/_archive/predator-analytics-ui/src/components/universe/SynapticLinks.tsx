/**
 * SynapticLinks — Живі динамічні зв'язки між частинками
 * 
 * Світлові лінії, що:
 * - Пульсують при активності
 * - Змінюють товщину (= сила зв'язку)
 * - Змінюють колір (= тип зв'язку)
 * - Будуються в реальному часі (AI "думає")
 * - GPU Lines через BufferGeometry + AdditiveBlending
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUniverseStore, AI_MODE_CONFIGS } from '../../store/useUniverseStore';

// Типи зв'язків та їх кольори
const LINK_COLORS = {
  financial: new THREE.Color('#00f0ff'),   // Бірюзовий — фінансовий
  legal: new THREE.Color('#a855f7'),       // Фіолетовий — юридичний
  logistics: new THREE.Color('#f59e0b'),   // Золотий — логістичний
  ownership: new THREE.Color('#ef4444'),   // Червоний — власність
  neutral: new THREE.Color('#3b82f6'),     // Синій — нейтральний
};

const MAX_LINKS = 200;

export const SynapticLinks: React.FC = () => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { particles, aiMode } = useUniverseStore();
  const config = AI_MODE_CONFIGS[aiMode];

  // ─── Генерація зв'язків ────────────────────────────────────────────
  const [positions, colors] = useMemo(() => {
    if (particles.length === 0) {
      return [new Float32Array(MAX_LINKS * 6), new Float32Array(MAX_LINKS * 6)];
    }

    const posArr = new Float32Array(MAX_LINKS * 6); // 2 точки × 3 координати
    const colArr = new Float32Array(MAX_LINKS * 6); // 2 точки × 3 RGB

    let linkIndex = 0;

    // Зв'язки від ядра (0,0,0) до важливих частинок
    const important = particles
      .filter((p) => p.riskScore > 60 || p.importance > 0.6)
      .slice(0, MAX_LINKS / 2);

    for (const p of important) {
      if (linkIndex >= MAX_LINKS) break;
      const offset = linkIndex * 6;

      // Від ядра до частинки
      posArr[offset + 0] = 0;
      posArr[offset + 1] = 0;
      posArr[offset + 2] = 0;
      posArr[offset + 3] = p.position[0];
      posArr[offset + 4] = p.position[1];
      posArr[offset + 5] = p.position[2];

      // Колір за ризиком
      const color =
        p.riskScore > 80
          ? LINK_COLORS.ownership
          : p.riskScore > 60
          ? LINK_COLORS.financial
          : LINK_COLORS.neutral;

      colArr[offset + 0] = color.r;
      colArr[offset + 1] = color.g;
      colArr[offset + 2] = color.b;
      colArr[offset + 3] = color.r * 0.3;
      colArr[offset + 4] = color.g * 0.3;
      colArr[offset + 5] = color.b * 0.3;

      linkIndex++;
    }

    // Зв'язки між близькими частинками (proximity-based)
    const highRisk = particles.filter((p) => p.riskScore > 50).slice(0, 100);
    for (let i = 0; i < highRisk.length && linkIndex < MAX_LINKS; i++) {
      for (let j = i + 1; j < highRisk.length && linkIndex < MAX_LINKS; j++) {
        const a = highRisk[i];
        const b = highRisk[j];
        const dist = Math.sqrt(
          (a.position[0] - b.position[0]) ** 2 +
          (a.position[1] - b.position[1]) ** 2 +
          (a.position[2] - b.position[2]) ** 2
        );
        // Лише близькі частинки (< 4 одиниць)
        if (dist < 4) {
          const offset = linkIndex * 6;
          posArr[offset + 0] = a.position[0];
          posArr[offset + 1] = a.position[1];
          posArr[offset + 2] = a.position[2];
          posArr[offset + 3] = b.position[0];
          posArr[offset + 4] = b.position[1];
          posArr[offset + 5] = b.position[2];

          const color = LINK_COLORS.logistics;
          const alpha = 1 - dist / 4;
          colArr[offset + 0] = color.r * alpha;
          colArr[offset + 1] = color.g * alpha;
          colArr[offset + 2] = color.b * alpha;
          colArr[offset + 3] = color.r * alpha * 0.3;
          colArr[offset + 4] = color.g * alpha * 0.3;
          colArr[offset + 5] = color.b * alpha * 0.3;

          linkIndex++;
        }
      }
    }

    return [posArr, colArr];
  }, [particles]);

  // ─── Шейдери для пульсації ─────────────────────────────────────────
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: 0.5 },
      uOpacity: { value: 0.4 },
    }),
    []
  );

  const vertexShader = `
    uniform float uTime;
    uniform float uSpeed;
    
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vDist;
    
    void main() {
      vColor = aColor;
      
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vDist = length(position);
      
      // Мікро-вібрація ліній
      float vibration = sin(uTime * uSpeed * 3.0 + position.x * 2.0) * 0.02;
      mvPos.y += vibration;
      
      gl_Position = projectionMatrix * mvPos;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uOpacity;
    
    varying vec3 vColor;
    varying float vDist;
    
    void main() {
      // Пульсація яскравості
      float pulse = 0.5 + 0.5 * sin(uTime * uSpeed * 2.0 + vDist * 0.5);
      
      // Зменшення яскравості з відстанню від ядра
      float distFade = 1.0 - clamp(vDist / 15.0, 0.0, 0.8);
      
      vec3 finalColor = vColor * (0.5 + pulse * 0.5);
      float alpha = uOpacity * distFade * pulse;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // ─── Анімаційний цикл ─────────────────────────────────────────────
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!materialRef.current) return;

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uSpeed.value,
      config.speed,
      0.03
    );

    // Більша прозорість у спокійних режимах
    const targetOpacity = aiMode === 'idle' ? 0.15 : aiMode === 'risk' ? 0.6 : 0.3;
    materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uOpacity.value,
      targetOpacity,
      0.03
    );

    // Обертання разом з частинками
    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.02;
      linesRef.current.rotation.x = Math.sin(time * 0.05) * 0.03;
    }
  });

  return (
    <lineSegments ref={linesRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};
