import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCyberStore } from '../../store/useCyberStore';

const vertexShader = `
  uniform float uTime;
  uniform vec3 uStateColor;
  uniform float uStateSpeed;
  uniform float uDistortion;

  attribute float aPhase;

  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  // Simple 3D noise function snippet
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;  p1 *= norm.y;  p2 *= norm.z;  p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // instanceMatrix містить початкову позицію часточки
    vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 dir = normalize(instPos.xyz);
    
    // Дихання та дисторсія (гравітаційне збурення)
    float noise = snoise(dir * 2.0 + uTime * uStateSpeed) * uDistortion;
    float pulse = sin(uTime * uStateSpeed * 2.0 + aPhase) * (uDistortion * 0.5);
    
    vec3 newPos = instPos.xyz + dir * (noise + pulse);

    // Додаємо локальні вершини геометрії (ікосаедра)
    vec4 mvPosition = viewMatrix * vec4(newPos, 1.0);
    
    // Масштабуємо геометрію в залежності від відстані для ефекту перспективи
    // Але Three.js робить це автоматично через projectionMatrix.
    mvPosition.xyz += position; 

    gl_Position = projectionMatrix * mvPosition;

    vNormal = normalMatrix * normal;
    vColor = uStateColor;
    vWorldPosition = newPos;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    // Френелівське світіння (іонний ефект зі скла та неону)
    vec3 viewDir = normalize(-vWorldPosition);
    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0) * 0.3;
    
    // Підсилюємо краї для ефекту оболонки
    float edgeGlow = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0) * 0.5;
    
    vec3 finalColor = vColor * (intensity + edgeGlow);
    
    gl_FragColor = vec4(finalColor, 0.5);
  }
`;

export const QuantumMindGraph: React.FC = () => {
  const { cognitiveState } = useCyberStore();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const particleCount = 2000; // Optimal for smooth elegant look
  
  const [matrices, phases, linePositions] = useMemo(() => {
    const dummy = new THREE.Object3D();
    const ph = new Float32Array(particleCount);
    const mats = new Float32Array(particleCount * 16);
    const lPos = [];

    // Fibonacci Sphere Distribution
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    const radius = 40;

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; 
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      dummy.position.set(x * radius, y * radius, z * radius);
      
      // Додаємо випадкові відхилення для більш "органічного" вигляду
      dummy.position.x += (Math.random() - 0.5) * 0.5;
      dummy.position.y += (Math.random() - 0.5) * 0.5;
      dummy.position.z += (Math.random() - 0.5) * 0.5;

      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const scale = Math.random() * 0.5 + 0.5;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      dummy.matrix.toArray(mats, i * 16);

      ph[i] = Math.random() * Math.PI * 2;

      // Лінії (Мент-активність) - з'єднуємо випадкові точки до ядра
      if (i % 150 === 0) {
        lPos.push(dummy.position.x, dummy.position.y, dummy.position.z);
        lPos.push(0, 0, 0); // до ядра
      }
    }

    return [mats, ph, new Float32Array(lPos)];
  }, [particleCount]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStateColor: { value: new THREE.Color("#2563eb") }, // Default Deep Blue
    uStateSpeed: { value: 0.5 },
    uDistortion: { value: 0.2 },
  }), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Обертання графа
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05;
      groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.05;
    }

    // Анімація зв'язків
    if (linesRef.current) {
      linesRef.current.rotation.y = time * 0.05;
      (linesRef.current.material as any).opacity = 0.05 + Math.sin(time * 2.0) * 0.05;
    }

    // Зміна параметрів в залежності від стану
    let targetColor = new THREE.Color();
    let targetSpeed = 0.5;
    let targetDistortion = 0.2;

    switch(cognitiveState) {
      case 'LEARNING':
        targetColor.set("#7000ff"); // Фіолетові пульсації
        targetSpeed = 0.3; // повільно дихає
        targetDistortion = 0.4;
        break;
      case 'INFERENCE':
        targetColor.set("#00f0ff"); // Електричний синій / бірюзовий
        targetSpeed = 1.5; // швидкісні світлові промені
        targetDistortion = 0.1; // чітко структурована
        break;
      case 'RISK':
        targetColor.set("#ff003c"); // Неоново-червоний / бурштиновий
        targetSpeed = 2.0; // пульсують
        targetDistortion = 1.5; // гравітаційне збурення
        break;
      default: // IDLE
        targetColor.set("#1d4ed8"); // Базовий синій
        targetSpeed = 0.2;
        targetDistortion = 0.1;
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      
      // Плавна інтерполяція кольорів і параметрів
      materialRef.current.uniforms.uStateColor.value.lerp(targetColor, 0.05);
      materialRef.current.uniforms.uStateSpeed.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uStateSpeed.value, targetSpeed, 0.05);
      materialRef.current.uniforms.uDistortion.value = THREE.MathUtils.lerp(materialRef.current.uniforms.uDistortion.value, targetDistortion, 0.05);
    }

    // Сингулярність в центрі
    if (coreRef.current) {
      const coreScale = 1.0 + Math.sin(time * targetSpeed * 2.0) * 0.1;
      coreRef.current.scale.set(coreScale, coreScale, coreScale);
      (coreRef.current.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0, -35]}>
        {/* Ядро (Сингулярність) */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[2.0, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
          {/* Glow */}
          <mesh>
            <sphereGeometry args={[4.0, 32, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
          </mesh>
        </mesh>

      {/* Нейронні зв'язки (Середній шар) */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.5} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Зовнішня сфера (Шар даних - Іони) */}
      {/* Використовуємо instancedMesh для рендерингу тисяч елементів одним викликом draw */}
      <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, particleCount]}>
        <icosahedronGeometry args={[0.04, 0]}>
          <instancedBufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </icosahedronGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      </group>
    </group>
  );
};
