/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Двигун Думок (Thought Engine)
 *
 * Візуалізація потоку свідомості AI через частинки, кільця, семантичні
 * кластери. Думки народжуються, живуть, з'єднуються та зникають.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCommandStore } from '../store/useCommandStore';

// ─── Конфігурація ────────────────────────────────────────────────────────────

const MAX_PARTICLES = 200;
const ORBIT_RADIUS = 2.5;

// ─── Когнітивний стан → поведінка частинок ──────────────────────────────────

const PARTICLE_BEHAVIOR = {
  DORMANT:    { speed: 0.1, spread: 3.0, opacity: 0.1 },
  LISTENING:  { speed: 0.5, spread: 2.0, opacity: 0.4 },
  THINKING:   { speed: 2.0, spread: 1.5, opacity: 0.8 },
  SPEAKING:   { speed: 1.0, spread: 2.5, opacity: 0.6 },
  PROCESSING: { speed: 3.0, spread: 1.0, opacity: 0.9 },
};

// ─── Шейдер частинок думок ──────────────────────────────────────────────────

const THOUGHT_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3  aOrbitCenter;

  uniform float uTime;
  uniform float uSpread;
  uniform float uGlobalSpeed;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    float t = uTime * aSpeed * uGlobalSpeed + aPhase;

    // Орбітальний рух навколо центру
    vec3 pos = aOrbitCenter;
    float r = uSpread * (0.5 + aSize * 0.5);
    pos.x += cos(t) * r;
    pos.y += sin(t * 0.7) * r * 0.6;
    pos.z += sin(t * 1.3) * r * 0.3;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Розмір залежить від відстані
    gl_PointSize = aSize * 60.0 * (300.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 40.0);

    gl_Position = projectionMatrix * mvPosition;

    // Альфа зменшується з відстанню та розміром
    vAlpha = aSize * 0.8;
    vPhase = aPhase;
  }
`;

const THOUGHT_FRAG = /* glsl */ `
  uniform float uOpacity;
  uniform vec3  uColor;
  uniform float uTime;

  varying float vAlpha;
  varying float vPhase;

  void main() {
    // Круглі м'які точки
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    float softEdge = smoothstep(0.5, 0.15, dist);

    // Пульсація
    float pulse = sin(uTime * 3.0 + vPhase * 6.28) * 0.2 + 0.8;

    vec3 color = uColor * (1.0 + softEdge * 0.5);
    float alpha = softEdge * vAlpha * uOpacity * pulse;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ─── Кільця орбіт ───────────────────────────────────────────────────────────

function ThoughtRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const cognitiveRef = useRef('DORMANT');

  useFrame((state, delta) => {
    const cognitive = useCommandStore.getState().cognitiveState;
    cognitiveRef.current = cognitive;

    if (!ringsRef.current) return;

    const speed = cognitive === 'THINKING' ? 0.5 :
                  cognitive === 'PROCESSING' ? 0.8 :
                  cognitive === 'SPEAKING' ? 0.3 : 0.1;

    ringsRef.current.rotation.y += delta * speed;
    ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;

    // Масштаб кілець залежить від стану
    const targetScale = cognitive === 'DORMANT' ? 0.3 : 1.0;
    ringsRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 2
    );
  });

  const ringGeometries = useMemo(() => {
    return [
      { radius: ORBIT_RADIUS, opacity: 0.15 },
      { radius: ORBIT_RADIUS * 1.5, opacity: 0.08 },
      { radius: ORBIT_RADIUS * 2.0, opacity: 0.04 },
    ];
  }, []);

  return (
    <group ref={ringsRef} position={[0, 0.5, 0]}>
      {ringGeometries.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.15, 0, i * 0.5]}>
          <ringGeometry args={[ring.radius - 0.01, ring.radius + 0.01, 128]} />
          <meshBasicMaterial
            color={0x00f0ff}
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Головний компонент ─────────────────────────────────────────────────────

function ThoughtEngineInner() {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Генеруємо атрибути частинок один раз
  const { positions, sizes, phases, speeds, centers } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const phases = new Float32Array(MAX_PARTICLES);
    const speeds = new Float32Array(MAX_PARTICLES);
    const centers = new Float32Array(MAX_PARTICLES * 3);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Початкова позиція
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

      sizes[i] = Math.random() * 0.8 + 0.2;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = Math.random() * 1.5 + 0.5;

      // Центр орбіти (навколо аватара)
      centers[i * 3] = (Math.random() - 0.5) * 1.5;
      centers[i * 3 + 1] = Math.random() * 1.5 + 0.2;
      centers[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    return { positions, sizes, phases, speeds, centers };
  }, []);

  // Оновлення у кожному кадрі
  useFrame((state) => {
    if (!matRef.current) return;

    const cognitive = useCommandStore.getState().cognitiveState;
    const emotion = 'idle';
    const behavior = PARTICLE_BEHAVIOR[cognitive] ?? PARTICLE_BEHAVIOR.DORMANT;

    matRef.current.uniforms['uTime'].value = state.clock.elapsedTime;
    matRef.current.uniforms['uOpacity'].value = behavior.opacity;
    matRef.current.uniforms['uSpread'].value = behavior.spread;
    matRef.current.uniforms['uGlobalSpeed'].value = behavior.speed;

    // Колір частинок слідує емоції
    const emotionColors: Record<string, THREE.Color> = {
      NEUTRAL: new THREE.Color(0x00f0ff),
      ANALYZE: new THREE.Color(0x00ff88),
      WARNING: new THREE.Color(0xff3300),
      FOCUS:   new THREE.Color(0xffaa00),
      IDLE:    new THREE.Color(0x003388),
    };
    const targetColor = emotionColors[emotion] ?? emotionColors['NEUTRAL'];
    (matRef.current.uniforms['uColor'].value as THREE.Color).lerp(targetColor, 0.05);
  });

  return (
    <group>
      {/* Кільця орбіт */}
      <ThoughtRings />

      {/* Частинки думок */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[phases, 1]}
          />
          <bufferAttribute
            attach="attributes-aSpeed"
            args={[speeds, 1]}
          />
          <bufferAttribute
            attach="attributes-aOrbitCenter"
            args={[centers, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={THOUGHT_VERT}
          fragmentShader={THOUGHT_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime:        { value: 0 },
            uOpacity:     { value: 0.5 },
            uColor:       { value: new THREE.Color(0x00f0ff) },
            uSpread:      { value: 2.0 },
            uGlobalSpeed: { value: 1.0 },
          }}
        />
      </points>
    </group>
  );
}

export const ThoughtEngine = memo(ThoughtEngineInner);
